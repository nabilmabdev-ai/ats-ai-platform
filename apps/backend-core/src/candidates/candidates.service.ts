// --- Content from: apps/backend-core/src/candidates/candidates.service.ts ---

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, AppStatus } from '@prisma/client';
import { SearchService } from '../search/search.service';
import * as fs from 'fs/promises';
import * as path from 'path';

interface SearchParams {
  q?: string;
  location?: string;
  minExp?: number;
  keywords?: string;
  jobId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private searchService: SearchService,
    @InjectQueue('applications') private applicationsQueue: Queue,
  ) { }

  // ...

  async search(params: SearchParams) {
    const {
      q,
      location,
      minExp,
      keywords,
      jobId,
      status,
      fromDate,
      toDate,
      tags,
      page = 1,
      limit = 10,
    } = params;
    console.log(`🔍 Processing Hybrid Search:`, params);

    const offset = (page - 1) * limit;
    let sortedIds: string[] | null = null;

    // 1. Hybrid Search (Vector + Keyword)
    if (q) {
      try {
        sortedIds = await this.searchService.search(q);
      } catch (error: any) {
        console.error('❌ Hybrid Search Failed:', error?.message || String(error));
      }
    }

    // 2. Construct Relational Query (Prisma)
    const andConditions: Prisma.CandidateWhereInput[] = [];
    const whereClause: Prisma.CandidateWhereInput = { AND: andConditions };

    if (q) {
      const searchConditions: Prisma.CandidateWhereInput[] = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];

      if (sortedIds && sortedIds.length > 0) {
        searchConditions.push({ id: { in: sortedIds } });
      }

      andConditions.push({ OR: searchConditions });
    } else if (sortedIds) {
      // Should not happen if q is required for sortedIds, but for safety
      andConditions.push({ id: { in: sortedIds } });
    }

    if (location) {
      andConditions.push({
        location: { contains: location, mode: 'insensitive' },
      });
    }
    if (minExp) {
      andConditions.push({ experience: { gte: minExp } });
    }
    // keywords param seems redundant if we have q, but if provided separately:
    if (keywords && !q) {
      andConditions.push({
        resumeText: { contains: keywords, mode: 'insensitive' },
      });
    }

    // --- NEW: Database Filters ---
    if (jobId || status || (fromDate && toDate) || (tags && tags.length > 0)) {
      const appFilter: Prisma.ApplicationWhereInput = {};

      if (jobId) appFilter.jobId = jobId;
      if (status) appFilter.status = status as AppStatus;
      if (fromDate && toDate) {
        appFilter.createdAt = {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        };
      }
      if (tags && tags.length > 0) {
        appFilter.tags = { hasSome: tags };
      }

      andConditions.push({
        applications: {
          some: appFilter,
        },
      });
    }

    // 3. Fetch Results from Postgres
    const profiles = await this.prisma.candidate.findMany({
      where: whereClause,
      include: {
        applications: { include: { job: true } },
      },
      // If we have sortedIds, we can't rely on Prisma orderBy for relevance.
      // We will sort in memory.
      // If no sortedIds, we sort by createdAt.
      orderBy: sortedIds ? undefined : { createdAt: 'desc' },
      // Pagination:
      // If sortedIds, we probably want to fetch all matches (which are limited by search service)
      // and then paginate or just return them?
      // The search service limits to 20 or so.
      // If we have more results than limit, we might need to handle it.
      // But for now, let's just fetch all matching sortedIds (filtered by other criteria).
      skip: sortedIds ? undefined : offset,
      take: sortedIds ? undefined : limit,
    });

    // 4. Sort by Relevance (if Hybrid Search was used)
    if (sortedIds) {
      // Create a map for O(1) lookup of rank
      const idRank = new Map(sortedIds.map((id, index) => [id, index]));

      profiles.sort((a, b) => {
        const rankA = idRank.has(a.id) ? idRank.get(a.id)! : Infinity;
        const rankB = idRank.has(b.id) ? idRank.get(b.id)! : Infinity;

        if (rankA === rankB) {
          // If both are Infinity (not in AI results), sort by createdAt desc
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return rankA - rankB;
      });

      // Apply pagination in memory if needed
      // But since SearchService limits to small number, maybe not strictly needed?
      // But params has page/limit.
      // Let's apply it.
      return profiles.slice(offset, offset + limit);
    }

    return profiles;
  }

  async update(id: string, data: Prisma.CandidateUpdateInput) {
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data,
    });

    // Trigger Re-index if critical fields changed
    if (data.resumeText || data.experience || data.location) {
      console.log(`🔄 Candidate ${id} updated. Triggering Re-indexing...`);
      await this.applicationsQueue.add('reindex-candidate', {
        candidateId: candidate.id,
      });
    }

    return candidate;
  }

  async mergeCandidates(primaryId: string, secondaryId: string) {
    // 1. Fetch both candidates
    const primary = await this.prisma.candidate.findUnique({
      where: { id: primaryId },
    });
    const secondary = await this.prisma.candidate.findUnique({
      where: { id: secondaryId },
      include: { applications: true },
    });

    if (!primary || !secondary) {
      throw new Error('One or both candidates not found');
    }

    // 2. Determine File Cleanup
    let fileToDelete: string | null = null;
    if (
      primary.resumeS3Key &&
      secondary.resumeS3Key &&
      primary.resumeS3Key !== secondary.resumeS3Key
    ) {
      // If primary already has a resume, we will discard secondary's resume file
      fileToDelete = secondary.resumeS3Key;
    }

    // 3. Transactional Merge
    await this.prisma.$transaction(async (tx) => {
      // A. Coalesce Profile Data (Primary inherits missing fields)
      await tx.candidate.update({
        where: { id: primaryId },
        data: {
          phone: primary.phone || secondary.phone,
          location: primary.location || secondary.location,
          education: primary.education || secondary.education,
          experience: primary.experience || secondary.experience, // Or max? Let's stick to "if missing"
          linkedinUrl: primary.linkedinUrl || secondary.linkedinUrl,
          // If primary has no resume, take secondary's
          resumeS3Key: primary.resumeS3Key || secondary.resumeS3Key,
          resumeText: primary.resumeText || secondary.resumeText,
        },
      });

      // B. Merge Applications
      for (const app of secondary.applications) {
        // Check if primary already has an application for this job
        const conflict = await tx.application.findUnique({
          where: {
            jobId_candidateId: { jobId: app.jobId, candidateId: primaryId },
          },
        });

        if (conflict) {
          // CONFLICT: Primary already applied.
          // Move valuable child records (Interviews, Comments) to Primary's application
          await tx.interview.updateMany({
            where: { applicationId: app.id },
            data: { applicationId: conflict.id },
          });
          await tx.comment.updateMany({
            where: { applicationId: app.id },
            data: { applicationId: conflict.id },
          });

          // Delete the secondary application (it's now empty/redundant)
          await tx.application.delete({ where: { id: app.id } });
        } else {
          // NO CONFLICT: Just re-assign the application to Primary
          await tx.application.update({
            where: { id: app.id },
            data: { candidateId: primaryId },
          });
        }
      }

      // C. Delete Secondary Candidate
      await tx.candidate.delete({ where: { id: secondaryId } });
    });

    // 4. Post-Transaction File Cleanup
    if (fileToDelete) {
      try {
        // Assuming uploads are stored locally in 'uploads/' relative to root or similar.
        // The path in DB is usually relative or absolute?
        // In applications.controller.ts: file.path is stored. Multer stores in './uploads'.
        // So it's likely 'uploads/filename.pdf'.
        // We need to resolve it relative to CWD.
        const absolutePath = path.resolve(process.cwd(), fileToDelete);
        await fs.unlink(absolutePath);
        console.log(`🗑️ Deleted orphaned resume: ${absolutePath}`);
      } catch (e) {
        console.error(
          `⚠️ Failed to delete orphaned resume: ${fileToDelete}`,
          e,
        );
        // We don't throw here, as the merge was successful.
      }
    }

    return { success: true, mergedId: primaryId };
  }

  async triggerFullReindex() {
    console.log('🔄 Triggering full re-index of all candidates...');
    const candidates = await this.prisma.candidate.findMany({
      select: { id: true },
    });

    console.log(`📋 Found ${candidates.length} candidates to re-index.`);

    for (const candidate of candidates) {
      await this.applicationsQueue.add('reindex-candidate', {
        candidateId: candidate.id,
      });
    }

    return {
      success: true,
      message: `Triggered re-indexing for ${candidates.length} candidates.`,
    };
  }
}
