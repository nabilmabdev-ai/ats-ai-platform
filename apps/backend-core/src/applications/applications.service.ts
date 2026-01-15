import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';
import { AppStatus } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { InterviewsService } from '../interviews/interviews.service';
import { OffersService } from '../offers/offers.service';
import { Role, User, OfferStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  BulkAssignDto,
  BulkRejectDto,
  BulkStatusDto,
  BulkTagDto,
} from './dto/bulk-action.dto';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private interviewsService: InterviewsService,
    private deduplicationService: DeduplicationService,
    private offersService: OffersService,
    private notificationsService: NotificationsService,
    @InjectQueue('applications') private applicationsQueue: Queue,
  ) { }

  private readonly logger = new Logger(ApplicationsService.name);

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
      data: {
        status: 'REJECTED',
        rejectionReason: reason // [NEW] Save rejection reason
      },
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
          this.logger.error(
            `Failed to send rejection email to ${app.candidate.email} for application ${app.id}:`,
            error,
          );
        }
      }),
    );

    // 5. Log History for Rejected Apps
    const historyEntries = applicationsToNotify
      .filter((app) => app.status !== 'REJECTED')
      .map((app) => ({
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: AppStatus.REJECTED,
        reason: reason,
      }));

    if (historyEntries.length > 0) {
      await this.prisma.applicationHistory.createMany({
        data: historyEntries,
      });
    }

    return { count: updatedCount.count };
  }

  async bulkUpdateStatus(bulkStatusDto: BulkStatusDto) {
    const { applicationIds, status } = bulkStatusDto;

    // 1. Fetch current apps to determine history
    const apps = await this.prisma.application.findMany({
      where: { id: { in: applicationIds } },
      select: { id: true, status: true },
    });

    // 2. Perform Bulk Update
    const result = await this.prisma.application.updateMany({
      where: { id: { in: applicationIds } },
      data: { status },
    });

    // 3. Log History
    const historyEntries = apps
      .filter((app) => app.status !== status)
      .map((app) => ({
        applicationId: app.id,
        fromStatus: app.status,
        toStatus: status,
      }));

    if (historyEntries.length > 0) {
      await this.prisma.applicationHistory.createMany({
        data: historyEntries,
      });
    }

    if (status === AppStatus.INTERVIEW) {
      for (const id of applicationIds) {
        try {
          await this.interviewsService.triggerInvite(id);
        } catch (error) {
          this.logger.error(
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
      source?: string; // [NEW] Capture source
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
            this.logger.log(
              `🚫 Auto-rejecting ${data.email} due to failed KO question: ${q.text}`,
            );
            break;
          }
        }
      }
    }

    // 2. Check for Existing Candidate (Exact & Fuzzy via DeduplicationService)
    let candidateId: string | null = null;

    const dedupResult = await this.deduplicationService.findMatch({
      email: data.email,
      phone: data.phone,
      name: data.name,
    });

    if (dedupResult.matchFound) {
      candidateId = dedupResult.candidateId || null;
      if (dedupResult.strategyUsed !== 'EMAIL') {
        this.logger.log(
          `🔗 Fuzzy Match Found: ${data.email} linked to candidate ${candidateId} (Strategy: ${dedupResult.strategyUsed})`,
        );
      }
    }

    // --- TRANSACTION START ---
    const newApplication = await this.prisma.$transaction(async (tx) => {
      // 3. Create or Update Candidate
      let candidate;
      if (candidateId) {
        candidate = await tx.candidate.update({
          where: { id: candidateId },
          data: {
            firstName: data.name.split(' ')[0],
            lastName: data.name.split(' ')[1] || '',
            resumeS3Key: files.resume,
            lastActiveAt: new Date(),
          },
        });
      } else {
        candidate = await tx.candidate.create({
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

      // 4. Check Duplicate Application (Scoped to Transaction to prevent race conditions ideally, but reads are fine here)
      const existing = await tx.application.findUnique({
        where: {
          jobId_candidateId: { jobId: data.jobId, candidateId: candidate.id },
        },
      });
      if (existing)
        throw new ConflictException('You have already applied for this job.');

      // 5. Create Application
      const app = await tx.application.create({
        data: {
          jobId: data.jobId,
          candidateId: candidate.id,
          status: initialStatus,
          knockoutAnswers: data.knockoutAnswers || {},
          isAutoRejected: isAutoRejected,
          coverLetterS3Key: files.coverLetter,
          source: data.source,
        },
      });

      return app;
    });
    // --- TRANSACTION END ---

    // 6. Add to Queue for AI Processing (Only if transaction succeeded)
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
    ownerId?: string, // [NEW] filter
  ) {
    const whereClause: any = {};
    if (jobId) whereClause.jobId = jobId;

    // [NEW] Owner Filter
    if (ownerId !== undefined) {
      if (ownerId === 'null') {
        whereClause.ownerId = null;
      } else {
        whereClause.ownerId = ownerId;
      }
    }

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
            // [NEW] Fetch related profiles (Ignored Duplicates)
            exclusionsA: {
              include: {
                candidateB: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
            },
            exclusionsB: {
              include: {
                candidateA: { select: { id: true, firstName: true, lastName: true, email: true } }
              }
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

  async updateStatus(
    id: string,
    status: AppStatus,
    reason?: string,
    notes?: string,
    userRole?: Role,
    userId?: string
  ) {
    const currentApp = await this.prisma.application.findUnique({
      where: { id },
      select: { status: true, jobId: true, candidateId: true },
    });

    if (!currentApp) throw new NotFoundException('Application not found');

    // 1. Validate Transition
    this.validateTransition(currentApp.status, status, userRole);

    // 2. Handle Side Effects (Backward Moves)
    await this.handleStatusSideEffects(id, currentApp.status, status);

    // 3. Update Status
    const application = await this.prisma.application.update({
      where: { id },
      data: { status },
      include: { candidate: true, job: true },
    });

    // 4. Log History
    if (currentApp.status !== status) {
      await this.prisma.applicationHistory.create({
        data: {
          applicationId: id,
          fromStatus: currentApp.status,
          toStatus: status,
          reason: reason || (notes ? 'See notes' : undefined),
          changedById: userId,
        },
      });
    }

    // 5. Add Note (Comment) if provided
    if (notes && userId) {
      await this.prisma.comment.create({
        data: {
          content: `[Status Change Note]: ${notes}`,
          applicationId: id,
          authorId: userId,
        },
      });
    }

    // 6. Forward Move Automation (Smart Schedule)
    if (status === AppStatus.INTERVIEW && currentApp.status !== AppStatus.INTERVIEW) {
      this.logger.log(
        `🚀 Status changed to INTERVIEW. Triggering SmartScheduler...`,
      );
      try {
        await this.interviewsService.triggerInvite(application.id);
      } catch (error) {
        this.logger.error('❌ Failed to process interview invite:', error);
      }
    }

    return application;
  }

  private validateTransition(current: AppStatus, next: AppStatus, role?: Role) {
    const weights: Record<AppStatus, number> = {
      SOURCED: 0,
      APPLIED: 10,
      SCREENING: 20,
      INTERVIEW: 30,
      OFFER: 40,
      HIRED: 50,
      REJECTED: -1,
    };

    const currentWeight = weights[current];
    const nextWeight = weights[next];

    // Statuses that don't fit linear progression (REJECTED) need special handling or just allow if role permits
    if (current === 'REJECTED' || next === 'REJECTED') return;

    // Detect Backward Move
    if (nextWeight < currentWeight) {
      // Rule 1: Backward Move requires permission (Recruiter ok, Interviewer NO)
      if (role === 'INTERVIEWER') {
        throw new ConflictException('Interviewers cannot move candidates backward.');
      }

      // Rule 2: Moving from HIRED is restricted
      if (current === 'HIRED') {
        if (role !== 'ADMIN') {
          throw new ConflictException('Only Admins can reverse a HIRED decision.');
        }
      }

      // Rule 3: Moving from OFFER to INTERVIEW is valid but requires reason (Controller checks reason presence, we check logic)
      // Logic is fine, side effects handled elsewhere.
    }
  }

  private async handleStatusSideEffects(appId: string, current: AppStatus, next: AppStatus) {
    const weights: Record<AppStatus, number> = {
      SOURCED: 0, APPLIED: 10, SCREENING: 20, INTERVIEW: 30, OFFER: 40, HIRED: 50, REJECTED: -1
    };

    if (current === 'REJECTED' || next === 'REJECTED') return;
    if (weights[next] >= weights[current]) return; // Forward or same

    // --- Backward Move Detected ---

    // 1. Cancel Interviews if moving back from INTERVIEW/OFFER/HIRED to SCREENING/APPLIED/SOURCED
    // Logic: If we were at or past INTERVIEW, and go below INTERVIEW
    if (weights[current] >= weights['INTERVIEW'] && weights[next] < weights['INTERVIEW']) {
      const interviews = await this.interviewsService.findByApp(appId);
      for (const interview of interviews) {
        if (interview.status === 'PENDING' || interview.status === 'CONFIRMED') {
          await this.interviewsService.updateStatus(interview.id, 'CANCELLED');
          // Ideally log or notify
        }
      }
    }

    // 2. Void Offer if moving back from OFFER/HIRED to anything below OFFER
    if (weights[current] >= weights['OFFER'] && weights[next] < weights['OFFER']) {
      const offer = await this.offersService.findByApp(appId);
      if (offer && (offer.status === 'DRAFT' || offer.status === 'SENT')) {
        await this.offersService.updateStatus(offer.id, 'FAILED'); // Or DECLINED/FAILED
      }
    }

    // 3. Reset Evaluations if moving to APPLIED (from anywhere higher)
    if (weights[next] === weights['APPLIED']) {
      // Reset AI Score so it can be re-evaluated if needed, or just clear it.
      // Prompt says "Reset evaluations".
      await this.prisma.application.update({
        where: { id: appId },
        data: { aiScore: null, aiSummary: null }
      });
    }
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
      this.logger.error('AI Rejection Gen Failed:', e.message);
      return {
        subject: `Application for ${app.job.title}`,
        body: `Dear ${app.candidate.firstName},\n\nThank you for your interest. Unfortunately, we have decided to proceed with other candidates.\n\nBest regards,\nThe Recruiting Team`,
      };
    }
  }

  async rejectWithEmail(id: string, subject: string, body: string) {
    const currentApp = await this.prisma.application.findUnique({
      where: { id },
      select: { status: true },
    });

    const app = await this.prisma.application.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { candidate: true },
    });

    if (currentApp && currentApp.status !== 'REJECTED') {
      await this.prisma.applicationHistory.create({
        data: {
          applicationId: id,
          fromStatus: currentApp.status,
          toStatus: 'REJECTED',
          reason: 'Manual Email Rejection',
        },
      });
    }

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

  async assignOwner(id: string, ownerId: string, actorId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      select: { id: true, ownerId: true, candidate: { select: { firstName: true, lastName: true } } },
    });

    if (!app) throw new NotFoundException('Application not found');

    const updatedApp = await this.prisma.application.update({
      where: { id },
      data: { ownerId },
      include: { owner: true },
    });

    if (app.ownerId !== ownerId) {
      await this.prisma.auditLog.create({
        data: {
          action: 'ASSIGN_OWNER',
          target: `Application:${id}`,
          actorId,
          details: {
            oldOwnerId: app.ownerId,
            newOwnerId: ownerId,
          },
        },
      });
    }

    // --- NOTIFICATION ---
    if (app.ownerId !== ownerId) {
      await this.notificationsService.create(
        ownerId,
        'ASSIGNMENT',
        `You have been assigned to application for ${app.candidate?.firstName} ${app.candidate?.lastName}`,
        `/applications/${id}`
      );
    }

    return updatedApp;
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
