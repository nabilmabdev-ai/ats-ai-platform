import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import { AppStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { SearchService } from '../search/search.service';

@Processor('applications')
export class ApplicationsProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'reindex-candidate') {
      await this.handleReindex(job.data);
      return;
    }

    if (job.name === 'delete-index-candidate') {
      await this.handleDeleteIndex(job.data);
      return;
    }

    if (job.name === 'process-candidate-resume') {
      await this.handleProcessCandidateResume(job.data);
      return;
    }

    const { applicationId, filePath, jobId } = job.data;
    console.log(`Processing application ${applicationId} for job ${jobId}`);

    try {
      // 1. Fetch Application
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { include: { screeningTemplate: true } },
          candidate: true,
        },
      });

      if (!application)
        throw new Error(`Application ${applicationId} not found`);

      // 2. Parse CV (Refactored) or Use Existing Text
      let aiData: any = {};
      try {
        if (filePath) {
          aiData = await this.downloadAndParseResume(filePath);
        } else if (application.candidate.resumeText) {
          // Fallback: Use existing text from DB (e.g. from CSV import)
          console.log(`ℹ️ No file path provided. Using existing resumeText for candidate ${application.candidateId}`);
          aiData = {
            raw_text: application.candidate.resumeText,
            skills: [], // We rely on the text content
            summary: 'Imported from CSV Data',
            experience_years: application.candidate.experience || 0,
            location: application.candidate.location,
            education_level: application.candidate.education
          };
        } else {
          console.warn(`⚠️ No file path and no resume text for application ${applicationId}. Skipping analysis.`);
          return;
        }

      } catch (error: any) {
        console.error('❌ AI Parsing Failed:', error.message);

        // --- FIX: Notify candidate and delete application to allow retry ---
        try {
          // 1. Send Email
          await this.emailService.sendParsingErrorEmail(
            application.candidate.email,
            application.candidate.firstName || 'Candidate',
            application.job.title,
          );

          // 2. Delete Application (so they can re-apply)
          await this.prisma.application.delete({
            where: { id: applicationId },
          });

          console.log(
            `⚠️ Application ${applicationId} deleted due to parsing failure. User notified.`,
          );
        } catch (cleanupError) {
          console.error(
            '❌ Failed to clean up failed application:',
            cleanupError,
          );
          // Fallback: mark as error if we couldn't delete
          await this.prisma.application.update({
            where: { id: applicationId },
            data: { aiParsingError: true },
          });
        }
        return;
      }

      // 3. Advanced Screening
      let screeningResult: any = null;
      const jobData = application.job;
      const isAutoRejected = application.isAutoRejected;
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';

      if (!isAutoRejected && jobData.screeningTemplate && aiData.raw_text) {
        console.log(
          `🧠 Performing Screening: ${jobData.screeningTemplate.name}`,
        );
        try {
          const screenRes = await axios.post(
            `${aiServiceUrl}/screen-candidate`,
            {
              resume_text: aiData.raw_text,
              job_description: jobData.descriptionText || '',
              criteria: {
                requiredSkills: jobData.screeningTemplate.requiredSkills || [],
                niceToHaves: jobData.screeningTemplate.niceToHaves || [],
                scoringWeights: jobData.screeningTemplate.scoringWeights || {},
              },
            },
          );
          screeningResult = screenRes.data;
        } catch (e: any) {
          console.error('⚠️ Screening Failed:', e.message);
        }
      }

      // 4. Update Candidate
      await this.prisma.candidate.update({
        where: { id: application.candidateId },
        data: {
          location: aiData.location || null,
          education: aiData.education_level || null,
          experience:
            typeof aiData.experience_years === 'number'
              ? aiData.experience_years
              : 0,
          resumeText: aiData.raw_text || '',
        },
      });

      // 5. Update Application
      const distScore = screeningResult
        ? screeningResult.match_score / 100
        : null;

      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          aiParsingData: screeningResult
            ? { ...aiData, screening: screeningResult }
            : aiData,
          aiScore: distScore,
          aiSummary: screeningResult?.summary || aiData['summary'] || '',
          aiParsingError: false,
        },
      });

      const semanticText = `Candidate: ${application.candidate.firstName} ${application.candidate.lastName} Skills: ${aiData.skills?.join(', ')}`;

      // Allow error to propagate so BullMQ retries
      await axios.post(`${aiServiceUrl}/vectorize-candidate`, {
        candidate_id: application.candidateId,
        text: semanticText,
        location: aiData.location || 'Unknown',
        experience: aiData.experience_years || 0,
      });

      const candidateForMeili = await this.prisma.candidate.findUnique({
        where: { id: application.candidateId },
      });
      if (candidateForMeili)
        await this.searchService.indexCandidate(candidateForMeili);

      console.log(`✅ Finished processing application ${applicationId}`);
    } catch (error) {
      console.error(
        `❌ Failed to process application ${applicationId}:`,
        error,
      );
      throw error;
    }
  }

  // --- Helper: Download & Parse Resume ---
  private async downloadAndParseResume(filePath: string): Promise<any> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const formData = new FormData();

    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log(`📥 Downloading resume (Stream) from URL: ${filePath}`);
      const response = await axios.get(filePath, {
        responseType: 'stream',
      });

      formData.append('file', response.data, {
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      });
    } else {
      formData.append('file', fs.createReadStream(filePath));
    }

    console.log('📤 Sending to AI Service for parsing...');
    const aiResponse = await axios.post(`${aiServiceUrl}/parse-cv`, formData, {
      headers: { ...formData.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    const aiData = aiResponse.data;

    const textLen = aiData.raw_text ? aiData.raw_text.length : 0;
    console.log(
      `✅ AI Parsing Successful. Skills: ${aiData.skills?.length || 0}. Text Length: ${textLen}`,
    );

    if (textLen === 0) {
      console.warn(`⚠️ WARNING: Parsed text is empty. PDF might be an image.`);
    }
    return aiData;
  }

  // --- Handler: Process Candidate Resume (Manual Upload) ---
  private async handleProcessCandidateResume(data: any) {
    const { candidateId, filePath } = data;
    console.log(
      `Processing resume parsing for Manual Candidate ${candidateId}`,
    );

    try {
      // 1. Fetch Candidate
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });
      if (!candidate) throw new Error(`Candidate ${candidateId} not found`);

      // 2. Parse Resume
      const aiData = await this.downloadAndParseResume(filePath);

      // 3. Update Candidate Profile
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          location: aiData.location || candidate.location, // Keep existing if parse fails or is null
          education: aiData.education_level || candidate.education,
          experience:
            typeof aiData.experience_years === 'number'
              ? Math.max(aiData.experience_years, candidate.experience || 0)
              : candidate.experience,
          resumeText: aiData.raw_text || '',
        },
      });

      // 4. Vectorize & Index
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const semanticText = `Candidate: ${candidate.firstName} ${candidate.lastName} Skills: ${aiData.skills?.join(', ')}\n${aiData.raw_text || ''}`;

      await axios.post(`${aiServiceUrl}/vectorize-candidate`, {
        candidate_id: candidate.id,
        text: semanticText,
        location: aiData.location || candidate.location || 'Unknown',
        experience: aiData.experience_years || candidate.experience || 0,
      });

      // Re-fetch to get latest data for MeiliSearch
      const updatedCandidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });
      if (updatedCandidate)
        await this.searchService.indexCandidate(updatedCandidate);

      console.log(`✅ Finished processing manual candidate ${candidateId}`);
    } catch (error: any) {
      console.error(
        `❌ Failed to process candidate resume ${candidateId}:`,
        error.message,
      );
      // We don't delete the candidate here as it was manually added, just log error.
      // Maybe set a flag? For now, we rely on logs.
      throw error;
    }
  }

  private async handleReindex(data: any) {
    const { candidateId } = data;
    console.log(`Processing re-index for candidate ${candidateId}`);
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) return;

    const semanticText = `Candidate: ${candidate.firstName} ${candidate.lastName}\n${candidate.resumeText || ''}`;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      await axios.post(`${aiServiceUrl}/vectorize-candidate`, {
        candidate_id: candidate.id,
        text: semanticText,
        location: candidate.location || 'Unknown',
        experience: candidate.experience || 0,
      });

      await this.searchService.indexCandidate(candidate);
      console.log(`✅ Re-indexed candidate ${candidateId}`);
    } catch (e: any) {
      console.error(
        `❌ Failed to re-index candidate ${candidateId}`,
        e.message,
      );
      throw e; // Retry
    }
  }
  async handleDeleteIndex(data: any) {
    const { candidateId } = data;
    console.log(`Processing delete-index for candidate ${candidateId}`);

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    // We do NOT wrap in try/catch here.
    // If this fails, we want BullMQ to mark it as failed and RETRY it later.
    // This ensures eventual consistency - we don't end up with "Ghost Candidates".

    // 1. Delete from MeiliSearch
    await this.searchService.deleteCandidate(candidateId);
    console.log(`✅ Deleted candidate ${candidateId} from MeiliSearch`);

    // 2. Delete from Milvus (AI Service)
    await axios.post(`${aiServiceUrl}/delete-candidate`, {
      candidate_id: candidateId,
    });
    console.log(`✅ Deleted candidate ${candidateId} from Milvus`);
  }
}
