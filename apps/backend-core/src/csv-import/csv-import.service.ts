import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import csv from 'csv-parser';
import * as fs from 'fs';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class CsvImportService {
  private readonly logger = new Logger(CsvImportService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('applications') private applicationsQueue: Queue,
    private httpService: HttpService,
  ) { }

  private async detectSeparator(filePath: string): Promise<string> {
    const stream = fs.createReadStream(filePath, { start: 0, end: 1000 });
    return new Promise((resolve) => {
      stream.on('data', (chunk) => {
        const text = chunk.toString();
        const commaCount = (text.match(/,/g) || []).length;
        const semiCount = (text.match(/;/g) || []).length;
        stream.destroy();
        resolve(semiCount > commaCount ? ';' : ',');
      });
    });
  }

  private normalizeKey(key: string): string {
    return key
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  async importCsv(filePath: string, originalFilename: string): Promise<string> {
    // 1. Create Batch Record
    const batch = await this.prisma.importBatch.create({
      data: {
        filename: originalFilename,
        status: 'PENDING',
      },
    });

    // 2. Start Processing in Background (Async)
    this.processBatch(batch.id, filePath).catch((err) => {
      this.logger.error(`Batch ${batch.id} failed fatally: ${err.message}`, err.stack);
      this.prisma.importBatch.update({
        where: { id: batch.id },
        data: { status: 'FAILED' }
      }).catch(e => this.logger.error('Failed to update batch status to FAILED'));
    });

    return batch.id;
  }

  // --- Async Background Processor ---
  private async processBatch(batchId: string, filePath: string) {
    const separator = await this.detectSeparator(filePath);
    await this.prisma.importBatch.update({ where: { id: batchId }, data: { status: 'PROCESSING' } });

    const results: any[] = [];

    // 1. Read all rows first to get count (memory efficient enough for typical CSVs, 
    // for massive files we'd stream count first, but this is simpler for now)
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator, mapHeaders: ({ header }) => this.normalizeKey(header.trim().replace(/^\ufeff/, '')) }))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve())
        .on('error', reject);
    });

    const total = results.length;
    await this.prisma.importBatch.update({ where: { id: batchId }, data: { total } });

    let processedCount = 0;
    let errorCount = 0;
    const errorLog: any[] = [];

    // 2. Iterate and Process
    for (const row of results) {
      // Check for cancellation every row (granular control)
      const currentBatch = await this.prisma.importBatch.findUnique({ where: { id: batchId } });
      if (currentBatch?.status === 'CANCELLED') {
        this.logger.log(`Batch ${batchId} was cancelled. Stopping processing.`);
        break;
      }

      try {
        const result = await this.processRow(row, batchId);
        if (!result.skipped) processedCount++;
      } catch (error: any) {
        errorCount++;
        errorLog.push({ row: processedCount + errorCount, message: error.message });
      }

      // Update progress every 10 rows or at end
      if ((processedCount + errorCount) % 10 === 0 || (processedCount + errorCount) === total) {
        await this.prisma.importBatch.update({
          where: { id: batchId },
          data: { processed: processedCount + errorCount, errors: errorCount }
        });
      }
    }

    // 3. Finalize Status
    const finalBatch = await this.prisma.importBatch.findUnique({ where: { id: batchId } });
    if (finalBatch?.status !== 'CANCELLED') {
      await this.prisma.importBatch.update({
        where: { id: batchId },
        data: {
          status: 'COMPLETED',
          processed: processedCount + errorCount,
          errors: errorCount,
          errorLog: errorLog as any
        }
      });
    }

    // Cleanup file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
      this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
    }
  }

  private async processRow(
    row: any,
    batchId: string
  ): Promise<{ skipped: boolean; updated: boolean }> {
    if (!this.isMoroccoCandidate(row)) return { skipped: true, updated: false };

    const email = row['email']?.trim();
    if (!email) return { skipped: true, updated: false };

    const firstName = row['firstnamefirst']?.trim() || 'Unknown';
    const lastName = row['lastnamelast']?.trim() || 'Candidate';
    const phoneRaw =
      row['numerodetelephoneinternational'] || row['telephone'] || '';
    const phone = phoneRaw.replace(/[^0-9+]/g, '');
    const jobTitle = this.extractJobTitle(row);

    let job = await this.prisma.job.findFirst({
      where: { title: { equals: jobTitle, mode: 'insensitive' } },
    });

    if (!job) {
      job = await this.prisma.job.findFirst({
        where: { title: 'General Import' },
      });
      if (!job) {
        job = await this.prisma.job.create({
          data: {
            title: 'General Import',
            descriptionText: 'Bucket for candidates imported from CSV.',
            status: 'DRAFT',
            priority: 'MEDIUM',
            remoteType: 'REMOTE',
            location: 'Morocco',
          },
        });
      }
    }

    const resumeUrl = row['resumecv'];
    const coverLetterUrl = row['addacoverletterorotherrelevantdocument'];

    let resumePath = '';
    if (
      resumeUrl &&
      (resumeUrl.startsWith('http') || resumeUrl.startsWith('https'))
    ) {
      if (await this.ensureUrlReachable(resumeUrl)) {
        resumePath = resumeUrl;
      } else {
        this.logger.warn(
          `Resume URL unreachable for ${email}, skipping resume: ${resumeUrl}`,
        );
      }
    }

    let coverLetterPath: string | null = null;
    if (
      coverLetterUrl &&
      (coverLetterUrl.startsWith('http') || coverLetterUrl.startsWith('https'))
    ) {
      if (await this.ensureUrlReachable(coverLetterUrl)) {
        coverLetterPath = coverLetterUrl;
      } else {
        this.logger.warn(
          `Cover letter URL unreachable for ${email}, skipping cover letter: ${coverLetterUrl}`,
        );
      }
    }

    const metadata = this.mapMetadata(row);
    const location =
      row['countrycity'] || row['dansquelpaysetesvoussitue'] || 'Morocco';

    const candidate = await this.prisma.candidate.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        phone,
        ...(resumePath ? { resumeS3Key: resumePath } : {}),
        location,
        updatedAt: new Date(),
        importBatchId: batchId // Link cand update to this batch (optional but useful)
      },
      create: {
        email,
        firstName,
        lastName,
        phone,
        resumeS3Key: resumePath,
        location,
        importBatchId: batchId // Link cand creation to this batch
      },
    });

    const existingApp = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId: job.id, candidateId: candidate.id },
      },
    });

    // Define the job data to queue
    const queueJobData = {
      applicationId: existingApp ? existingApp.id : '', // will be set below
      filePath: resumePath,
      jobId: job.id,
    };

    if (existingApp) {
      queueJobData.applicationId = existingApp.id;
      await this.prisma.application.update({
        where: { id: existingApp.id },
        data: {
          coverLetterS3Key: coverLetterPath || existingApp.coverLetterS3Key,
          metadata: metadata,
          aiParsingError: false, // Reset error to allow retrying
          importBatchId: batchId // Link to current batch
        },
      });

      // [FIX] ALWAYS trigger AI processing on re-import if resume exists
      if (resumePath) {
        await this.applicationsQueue.add('process-application', queueJobData);
      }

      return { skipped: false, updated: true };
    } else {
      const newApp = await this.prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          status: 'APPLIED',
          coverLetterS3Key: coverLetterPath,
          metadata: metadata,
          tags: ['imported'],
          importBatchId: batchId // Link to current batch
        },
      });
      queueJobData.applicationId = newApp.id;

      if (resumePath) {
        await this.applicationsQueue.add('process-application', queueJobData);
      }
      return { skipped: false, updated: false };
    }
  }

  private isMoroccoCandidate(row: any): boolean {
    const col1 = row['dansquelpaysetesvoussitue'] || '';
    const col2 = row['countrycity'] || '';
    const col3 = row['location'] || '';
    const locationText = `${col1} ${col2} ${col3}`.toLowerCase();
    const keywords = [
      'morocco',
      'maroc',
      'casablanca',
      'rabat',
      'tangier',
      'marrakech',
      'agadir',
      'fes',
      'meknes',
      'sale',
    ];
    if (keywords.some((k) => locationText.includes(k))) return true;

    const phoneRaw =
      row['numerodetelephoneinternational'] || row['telephone'] || '';
    const cleanPhone = phoneRaw.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('212') || cleanPhone.startsWith('00212'))
      return true;
    return false;
  }

  private extractJobTitle(row: any): string {
    let title = row['poste'];
    if (!title || title === '00' || /^\d+$/.test(title)) {
      const url = row['url'];
      if (url) {
        try {
          const parts = url.split('/careers/');
          if (parts.length > 1) {
            const slug = parts[1].split('/')[0].split('?')[0];
            title = slug
              .split('-')
              .map(
                (word: string) => word.charAt(0).toUpperCase() + word.slice(1),
              )
              .join(' ');
          }
        } catch (e) { }
      }
    }
    return title && title !== '00' ? title : 'General Import';
  }

  private mapMetadata(row: any): any {
    const metadata: any = {
      languages: [],
      preferences: {},
      demographics: {},
      sourcing: {},
    };
    const langColumns = [
      'french',
      'english',
      'cantonese',
      'mandarin',
      'spanish',
      'arabic',
      'portuguese',
      'italian',
      'russian',
      'greek',
      'hindi',
      'bengali',
    ];

    langColumns.forEach((lang) => {
      if (row[lang] && row[lang].trim().length > 0)
        metadata.languages.push(lang);
    });

    metadata.preferences = {
      type: row['areyoulookingforfulltimeorparttime'],
      location_pref:
        row[
        'whatisyourpreferredworklocationpleaseselectoneofthefollowingoptions'
        ],
      comm_lang: row['whatisyourpreferredlanguageofcommunication'],
    };

    metadata.demographics = {
      country_province: row['countryprovince'],
      work_eligibility:
        row['ifyouareincanadaidentifyyourworkeligibilitystatus'],
    };

    const sourcing: any = { channel: 'Other', detail: 'Unspecified' };
    const has = (col: string) => row[col] && row[col].trim().length > 0;

    if (has('fromiosemployee') || has('referredbyifapplicable')) {
      sourcing.channel = 'Referral';
      sourcing.detail = row['referredbyifapplicable'] || 'Internal';
    } else if (has('newspapers') || has('journalmetro') || has('journal24h')) {
      sourcing.channel = 'Newspaper';
      sourcing.detail =
        row['specifynewspaper'] ||
        (has('journalmetro') ? 'Journal Metro' : 'Journal 24h');
    } else if (has('jobfairs')) {
      sourcing.channel = 'Job Fair';
    } else if (
      has('fromjobwebsites') ||
      has('indeed') ||
      has('jobillico') ||
      has('ziprecruiter') ||
      has('kijiji') ||
      has('craigslist')
    ) {
      sourcing.channel = 'Job Website';
      const sites = [
        'indeed',
        'jobillico',
        'ziprecruiter',
        'kijiji',
        'craigslist',
        'ioswebsite',
      ];
      const foundSite = sites.find((s) => has(s));
      sourcing.detail = row['specifywebsite'] || foundSite || 'Unknown Site';
    } else if (
      has('fromsocialmedia') ||
      has('facebook') ||
      has('instagram') ||
      has('linkedin')
    ) {
      sourcing.channel = 'Social Media';
      const socials = ['facebook', 'instagram', 'linkedin'];
      const foundSocial = socials.find((s) => has(s));
      sourcing.detail =
        row['specifywebsite_1'] || foundSocial || 'Unknown Social';
    }
    metadata.sourcing = sourcing;
    return metadata;
  }

  private async ensureUrlReachable(url: string): Promise<boolean> {
    try {
      await firstValueFrom(this.httpService.head(url, { timeout: 5000 }));
      return true;
    } catch (error: any) {
      // 405 Method Not Allowed might mean HEAD is blocked but GET works,
      // but usually for static assets HEAD is supported.
      // If 403/404/500, we consider it unreachable for our robot.
      const status = error.response?.status;
      if (status === 405) {
        // Fallback to minimal GET (range request or just check if it doesn't throw immediate connection error)
        // For now, let's treat 405 as "maybe okay" or try a quick GET with range 0-0 if needed?
        // Simpler: treat 405 as failure for now unless proven otherwise for resumes.
        // Actually, some servers block HEAD. Let's try a very short timeout GET if HEAD fails with 405.
        // But for safety and speed, let's stick to HEAD check failures = unreachable for now.
        this.logger.warn(`URL returned ${status} (Method Not Allowed): ${url}`);
        return false;
      }
      this.logger.warn(`URL validation failed for ${url}: ${error.message}`);
      return false;
    }
  }

  // Required for the Analyze button in frontend
  async analyzeCsv(
    filePath: string,
  ): Promise<{ totalCandidates: number; missingJobs: string[] }> {
    const separator = await this.detectSeparator(filePath);
    const results: any[] = [];
    const uniqueTitles = new Set<string>();
    let totalCandidates = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator: separator,
            mapHeaders: ({ header }) =>
              this.normalizeKey(header.trim().replace(/^\ufeff/, '')),
          }),
        )
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const row of results) {
            if (this.isMoroccoCandidate(row)) {
              totalCandidates++;
              const jobTitle = this.extractJobTitle(row);
              if (jobTitle && jobTitle !== 'General Import') {
                uniqueTitles.add(jobTitle);
              }
            }
          }

          const missingJobs: string[] = [];
          for (const title of uniqueTitles) {
            const job = await this.prisma.job.findFirst({
              where: { title: { equals: title, mode: 'insensitive' } },
            });
            if (!job) missingJobs.push(title);
          }

          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) { }
          resolve({ totalCandidates, missingJobs: Array.from(missingJobs) });
        })
        .on('error', (err) => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) { }
          reject(err);
        });
    });
  }

  async cancelBatch(batchId: string) {
    return this.prisma.importBatch.update({
      where: { id: batchId },
      data: { status: 'CANCELLED' }
    });
  }

  async getBatch(batchId: string) {
    return this.prisma.importBatch.findUnique({ where: { id: batchId } });
  }

  async getBatches() {
    return this.prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }

  async deleteBatch(batchId: string) {
    // 1. Find all applications created by this batch
    const applications = await this.prisma.application.findMany({
      where: { importBatchId: batchId },
      select: { id: true, candidateId: true }
    });

    // 2. Delete applications
    await this.prisma.application.deleteMany({
      where: { importBatchId: batchId }
    });

    this.logger.log(`Deleted applications for batch ${batchId}`);

    return this.prisma.importBatch.delete({
      where: { id: batchId }
    });
  }
}
