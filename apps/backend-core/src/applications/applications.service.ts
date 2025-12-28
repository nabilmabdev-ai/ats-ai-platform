import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import { AppStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { InterviewsService } from '../interviews/interviews.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BulkAssignDto,
  BulkRejectDto,
  BulkStatusDto,
  BulkTagDto,
} from './dto/bulk-action.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private interviewsService: InterviewsService,
    @InjectQueue('applications') private applicationsQueue: Queue,
  ) { }

  async retryFailedParsings() {
    // 1. Find all applications marked with error
    const failedApps = await this.prisma.application.findMany({
      where: { aiParsingError: true },
      include: { candidate: true },
    });

    if (failedApps.length === 0) {
      return { count: 0, message: 'No failed applications found.' };
    }

    // 2. Re-add them to the processing queue
    // The processor logic remains the same: it takes a filePath and updates the app ID
    const jobs = failedApps.map((app) => ({
      name: 'process-application',
      data: {
        applicationId: app.id,
        jobId: app.jobId,
        // We stored the path in resumeS3Key in the create method previously
        filePath: app.candidate.resumeS3Key,
      },
    }));

    await this.applicationsQueue.addBulk(jobs);

    // 3. Optionally, reset the error flag immediately or let the processor do it on success.
    // Here we leave it true until the processor successfully overwrites it to false.

    return {
      count: failedApps.length,
      message: `Queued ${failedApps.length} applications for AI recovery.`,
    };
  }

  async getFailureCount() {
    const count = await this.prisma.application.count({
      where: { aiParsingError: true },
    });
    return { count };
  }

  async bulkAssign(bulkAssignDto: BulkAssignDto) {
    const { applicationIds, ownerId } = bulkAssignDto;

    const result = await this.prisma.application.updateMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      data: {
        ownerId: ownerId,
      },
    });

    return { count: result.count };
  }

  async bulkTag(bulkTagDto: BulkTagDto) {
    const { applicationIds, tag } = bulkTagDto;

    const result = await this.prisma.application.updateMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      data: {
        tags: {
          push: tag,
        },
      },
    });

    return { count: result.count };
  }

  async bulkReject(bulkRejectDto: BulkRejectDto) {
    const { applicationIds, reason, sendEmail } = bulkRejectDto;

    // 1. Update status for all applications
    const updatedCount = await this.prisma.application.updateMany({
      where: { id: { in: applicationIds } },
      data: { status: 'REJECTED' },
    });

    // 2. If sendEmail is false, we're done
    if (!sendEmail) {
      return { count: updatedCount.count };
    }

    // 3. If sendEmail is true, fetch the application details
    const applicationsToNotify = await this.prisma.application.findMany({
      where: { id: { in: applicationIds } },
      include: { candidate: true, job: true },
    });

    // 4. Send emails in parallel
    await Promise.all(
      applicationsToNotify.map(async (app) => {
        try {
          const { subject, body } = await this.generateRejectionDraft(
            app.id,
            reason,
          );
          await this.emailService.sendRejectionEmail(
            app.candidate.email,
            subject,
            body,
          );
        } catch (error) {
          console.error(
            `Failed to send rejection email to ${app.candidate.email} for application ${app.id}:`,
            error,
          );
        }
      }),
    );

    return { count: updatedCount.count };
  }

  async bulkUpdateStatus(bulkStatusDto: BulkStatusDto) {
    const { applicationIds, status } = bulkStatusDto;
    const result = await this.prisma.application.updateMany({
      where: { id: { in: applicationIds } },
      data: { status },
    });

    if (status === AppStatus.INTERVIEW) {
      for (const id of applicationIds) {
        try {
          await this.interviewsService.triggerInvite(id);
        } catch (error) {
          console.error(
            `Failed to trigger interview invite for app ${id}:`,
            error.message,
          );
        }
      }
    }

    return { count: result.count };
  }

  async create(
    data: {
      jobId: string;
      email: string;
      name: string;
      phone?: string;
      knockoutAnswers?: Record<string, any>; // <--- NEW INPUT
    },
    files: { resume: string; coverLetter?: string },
  ) {
    // 1. Fetch Job to check for Screening Template & Knock-out Questions
    const job = await this.prisma.job.findUnique({
      where: { id: data.jobId },
      include: { screeningTemplate: true },
    });

    if (!job) throw new NotFoundException('Job not found');

    // --- NEW: AUTO-REJECTION LOGIC ---
    let isAutoRejected = false;
    let initialStatus: AppStatus = 'APPLIED';

    if (
      job.knockoutQuestions &&
      Array.isArray(job.knockoutQuestions) &&
      data.knockoutAnswers
    ) {
      const questions = job.knockoutQuestions as any[];

      for (const q of questions) {
        // Only check if a correct answer is defined
        if (q.correctAnswer !== undefined && q.correctAnswer !== null) {
          const providedAnswer = data.knockoutAnswers[q.id];

          // Normalize strings if possible
          let answerToCheck = providedAnswer;
          let correctToCheck = q.correctAnswer;

          if (
            typeof answerToCheck === 'string' &&
            typeof correctToCheck === 'string'
          ) {
            // Normalize: trim, lowercase, and collapse multiple spaces
            answerToCheck = answerToCheck
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ' ');
            correctToCheck = correctToCheck
              .trim()
              .toLowerCase()
              .replace(/\s+/g, ' ');
          }

          if (answerToCheck !== correctToCheck) {
            isAutoRejected = true;
            initialStatus = 'REJECTED';
            console.log(
              `🚫 Auto-rejecting ${data.email} due to failed KO question: ${q.text}`,
            );
            break;
          }
        }
      }
    }

    // 2. Check for Existing Candidate (Exact & Fuzzy)
    let candidateId: string | null = null;

    // A. Exact Email Match
    const exactMatch = await this.prisma.candidate.findUnique({
      where: { email: data.email },
    });

    if (exactMatch) {
      candidateId = exactMatch.id;
    } else {
      // B. Fuzzy Match (if enabled)
      const company = await this.prisma.company.findFirst();
      if (company?.enableAutoMerge && data.name && data.phone) {
        // Normalize Phone: remove all non-digits
        const normalizedInputPhone = data.phone.replace(/\D/g, '');
        const lastName = data.name.split(' ')[1] || '';

        if (normalizedInputPhone.length > 6 && lastName.length > 2) {
          const candidates = await this.prisma.candidate.findMany({
            where: {
              lastName: { equals: lastName, mode: 'insensitive' },
            },
          });

          const match = candidates.find((c) => {
            if (!c.phone) return false;
            const p = c.phone.replace(/\D/g, '');
            return p === normalizedInputPhone;
          });

          if (match) {
            console.log(
              `🔗 Fuzzy Match Found: ${data.email} linked to ${match.email}`,
            );
            candidateId = match.id;
          }
        }
      }
    }

    // 3. Create or Update Candidate
    let candidate;
    if (candidateId) {
      candidate = await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ')[1] || '',
          resumeS3Key: files.resume,
          lastActiveAt: new Date(),
          // We do NOT update email if it was a fuzzy match, to preserve the original email.
          // But if it was an exact match, email is same anyway.
        },
      });
    } else {
      candidate = await this.prisma.candidate.create({
        data: {
          email: data.email,
          phone: data.phone,
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ')[1] || '',
          resumeS3Key: files.resume,
          lastActiveAt: new Date(),
        },
      });
    }

    // 4. Check Duplicate Application
    const existing = await this.prisma.application.findUnique({
      where: {
        jobId_candidateId: { jobId: data.jobId, candidateId: candidate.id },
      },
    });
    if (existing)
      throw new ConflictException('You have already applied for this job.');

    // 5. Create Application
    const newApplication = await this.prisma.application.create({
      data: {
        jobId: data.jobId,
        candidateId: candidate.id,
        status: initialStatus,
        knockoutAnswers: data.knockoutAnswers || {},
        isAutoRejected: isAutoRejected,
        coverLetterS3Key: files.coverLetter,
      },
    });

    // 5. Add to Queue for AI Processing
    await this.applicationsQueue.add('process-application', {
      applicationId: newApplication.id,
      filePath: files.resume,
      jobId: data.jobId,
    });

    return newApplication;
  }

  async findAll(
    jobId?: string,
    period?: string,
    page: number = 1,
    limit: number = 10,
    includeClosed: boolean = false,
    search?: string,
  ) {
    const whereClause: any = {};
    if (jobId) whereClause.jobId = jobId;

    if (search) {
      whereClause.candidate = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // --- NEW: Filter out closed jobs if not explicitly included ---
    // Only apply this filter if we are NOT filtering by a specific job (Global View)
    // OR if we want to be strict even when filtering by job (though usually if you pick a job you want to see it)
    // Let's apply it generally: if includeClosed is false, we exclude closed/archived jobs.
    if (!includeClosed && !jobId) {
      whereClause.job = {
        status: {
          notIn: ['CLOSED', 'ARCHIVED'],
        },
      };
    }

    if (period && period !== 'all') {
      const now = new Date();
      let pastDate = new Date();

      switch (period) {
        case '1d':
          pastDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          pastDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          pastDate.setDate(now.getDate() - 30);
          break;
        default:
          // Default to no filter if unknown
          pastDate = new Date(0);
          break;
      }

      if (period !== 'all') {
        whereClause.createdAt = {
          gte: pastDate,
        };
      }
    }
    const skip = (page - 1) * limit;

    const [applications, total] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        include: {
          job: true,
          candidate: {
            include: {
              _count: {
                select: { applications: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.application.count({ where: whereClause }),
    ]);

    return {
      data: applications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        candidate: {
          include: {
            applications: {
              include: {
                job: { select: { id: true, title: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        job: {
          include: {
            screeningTemplate: true,
          },
        },
        interviews: {
          include: {
            interviewer: true,
          },
          orderBy: {
            scheduledAt: 'asc',
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    return application;
  }

  async updateStatus(id: string, status: AppStatus) {
    const application = await this.prisma.application.update({
      where: { id },
      data: { status },
      include: { candidate: true, job: true },
    });

    if (status === AppStatus.INTERVIEW) {
      console.log(
        `🚀 Status changed to INTERVIEW. Triggering SmartScheduler...`,
      );
      try {
        await this.interviewsService.triggerInvite(application.id);
      } catch (error) {
        console.error('❌ Failed to process interview invite:', error);
      }
    }

    return application;
  }

  async generateRejectionDraft(id: string, reason: string = '') {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true, candidate: true },
    });
    if (!app) throw new NotFoundException('Application not found');

    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${aiServiceUrl}/generate-rejection-email`,
        {
          candidate_name: `${app.candidate.firstName} ${app.candidate.lastName}`,
          job_title: app.job.title,
          job_description: app.job.descriptionText || '',
          candidate_summary: app.aiSummary || 'Candidate summary unavailable.',
          recruiter_notes: reason,
        },
      );
      return response.data;
    } catch (e: any) {
      console.error('AI Rejection Gen Failed:', e.message);
      return {
        subject: `Application for ${app.job.title}`,
        body: `Dear ${app.candidate.firstName},\n\nThank you for your interest. Unfortunately, we have decided to proceed with other candidates.\n\nBest regards,\nThe Recruiting Team`,
      };
    }
  }

  async rejectWithEmail(id: string, subject: string, body: string) {
    const app = await this.prisma.application.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { candidate: true },
    });

    await this.emailService.sendRejectionEmail(
      app.candidate.email,
      subject,
      body,
    );

    return app;
  }

  async reprocessApplication(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { candidate: true },
    });

    if (!app) throw new NotFoundException('Application not found');

    // Ensure we have a resume path/url
    const filePath = app.candidate.resumeS3Key;
    if (!filePath)
      throw new BadRequestException('Candidate has no resume URL/Path');

    await this.applicationsQueue.add('process-application', {
      applicationId: app.id,
      filePath: filePath,
      jobId: app.jobId,
    });

    return {
      message: 'Re-processing queued successfully',
      candidate: app.candidate.email,
      file: filePath,
    };
  }

  async findByIds(ids: string[]) {
    return this.prisma.application.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
