// --- Content from: apps/backend-core/src/interviews/interviews.service.ts ---

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EmailService } from '../email/email.service';
import { SaveHumanScorecardDto } from './dto/save-human-scorecard.dto';
import { SaveAiScorecardDto } from './dto/save-ai-scorecard.dto';
import { CalendarService } from './calendar.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InterviewsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
    private emailService: EmailService,
    private calendarService: CalendarService,
    private notificationsService: NotificationsService,
  ) { }

  // --- NEW: Find All (For Dashboard) ---
  // --- NEW: Find All (For Dashboard) ---
  async findAll(page: number = 1, limit: number = 10, startDate?: Date, search?: string) {
    const skip = (page - 1) * limit;

    // Allow fetching PENDING (null date) or Future events
    const dateCondition = {
      OR: [
        { scheduledAt: { gte: startDate || new Date() } },
        { scheduledAt: null }
      ]
    };

    const where: any = {
      AND: [dateCondition]
    };

    if (search) {
      where.AND.push({
        OR: [
          { application: { candidate: { firstName: { contains: search, mode: 'insensitive' } } } },
          { application: { candidate: { lastName: { contains: search, mode: 'insensitive' } } } },
          { application: { job: { title: { contains: search, mode: 'insensitive' } } } },
        ]
      });
    }

    const [interviews, total] = await Promise.all([
      this.prisma.interview.findMany({
        where,
        skip,
        take: limit,
        include: {
          application: {
            include: {
              candidate: {
                select: { firstName: true, lastName: true, email: true },
              },
              job: { select: { title: true } },
            },
          },
          interviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.interview.count({ where }),
    ]);

    return {
      data: interviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async saveDraftNotes(interviewId: string, notes: string) {
    return this.prisma.interview.update({
      where: { id: interviewId },
      data: { humanNotes: notes },
    });
  }

  async saveHumanScorecard(dto: SaveHumanScorecardDto) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id: dto.interviewId },
      data: {
        humanNotes: dto.notes,
        humanScorecard: dto.scorecard || {},
        scorecardType: 'HUMAN',
      },
    });
  }

  async saveAiScorecard(dto: SaveAiScorecardDto) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: dto.interviewId },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id: dto.interviewId },
      data: {
        scorecard: dto.scorecard || {},
        scorecardType: 'AI',
        status: 'COMPLETED',
      },
    });
  }

  async analyzeAndSave(dto: CreateInterviewDto) {
    const app = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: { job: true, candidate: true },
    });

    if (!app) throw new NotFoundException('Application not found');

    const requirements = (app.job.requirements as string[]) || [];

    let scorecard = {};
    try {
      const aiServiceUrl =
        this.configService.get('AI_SERVICE_URL') ?? 'http://localhost:8000';
      const { data } = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/analyze-interview`, {
          job_title: app.job.title,
          job_description: app.job.descriptionText || '',
          requirements: requirements,
          candidate_name: `${app.candidate.firstName} ${app.candidate.lastName}`,
          interview_notes: dto.notes,
        }),
      );
      scorecard = data;
    } catch (e: any) {
      console.error('AI Analysis Failed', e.message);
      scorecard = { summary: 'AI Analysis Unavailable', rating: 0 };
    }

    return {
      status: 'success',
      aiScorecard: scorecard,
    };
  }

  findByApp(appId: string) {
    return this.prisma.interview.findMany({
      where: { applicationId: appId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async createInvite(applicationId: string) {
    // Check if invite already exists
    const existing = await this.prisma.interview.findFirst({
      where: { applicationId, status: 'PENDING' },
    });
    if (existing) return existing;

    // Fetch application with ownership details
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        owner: true,
        job: {
          include: { hiringManager: true },
        },
      },
    });

    if (!application) throw new NotFoundException('Application not found');

    // Determine interviewer: Owner -> Hiring Manager -> First Recruiter
    let interviewerId = application.ownerId;

    if (!interviewerId && application.job.hiringManagerId) {
      interviewerId = application.job.hiringManagerId;
    }

    if (!interviewerId) {
      const fallbackRecruiter = await this.prisma.user.findFirst({
        where: { role: 'RECRUITER' },
      });
      if (fallbackRecruiter) {
        interviewerId = fallbackRecruiter.id;
      }
    }

    if (!interviewerId) {
      throw new NotFoundException('No interviewer configured in system');
    }

    return this.prisma.interview.create({
      data: {
        applicationId,
        interviewerId,
        status: 'PENDING',
      },
    });
  }

  async triggerInvite(applicationId: string, userId?: string, customMessage?: string) {
    try {
      // Resolve Sender Email for "Reply-To"
      let senderEmail: string | undefined;

      if (userId) {
        const sender = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (sender) senderEmail = sender.email;
      }

      // If no current user, try application owner
      if (!senderEmail) {
        const appWithOwner = await this.prisma.application.findUnique({
          where: { id: applicationId },
          include: { owner: true }
        });
        if (appWithOwner?.owner?.email) senderEmail = appWithOwner.owner.email;
      }

      const invite = await this.createInvite(applicationId);
      const bookingLink = `http://localhost:3000/book/${invite.bookingToken}`;

      // Re-fetch to get candidate details
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: { candidate: true, job: true },
      });

      if (!application) return;

      const company = await this.prisma.company.findFirst();

      await this.emailService.sendInterviewInvite(
        application.candidate.email,
        application.candidate.firstName || 'Candidate',
        application.job.title,
        bookingLink,
        customMessage,
        senderEmail,
        company?.showEmailHeader ? (company?.headerImageUrl || undefined) : undefined,
        company?.showEmailFooter ? (company?.footerImageUrl || undefined) : undefined,
        company?.showCompanyAddress ? (company?.address || undefined) : undefined
      );

      // Log Activity
      if (userId) {
        await this.prisma.comment.create({
          data: {
            content: `System: Sent interview invite via Smart Schedule.${customMessage ? ` Note: "${customMessage}"` : ''}`,
            applicationId: applicationId,
            authorId: userId,
          }
        });
      }

      return invite;

    } catch (error) {
      console.error(
        `Failed to trigger interview invite for app ${applicationId}:`,
        error.message,
      );
      throw error;
    }
  }


  async getSmartScheduleCandidates() {
    return this.prisma.application.findMany({
      where: {
        status: 'INTERVIEW',
        interviews: {
          none: {}, // No interviews associated
        },
      },
      select: {
        id: true,
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  async runSmartSchedule(applicationIds?: string[], userId?: string, customMessage?: string) {
    // 1. Find all applications in INTERVIEW status that do NOT have an interview record
    // If applicationIds is provided, filter by those IDs as well
    const whereClause: any = {
      status: 'INTERVIEW',
      interviews: {
        none: {}, // No interviews associated
      },
    };

    if (applicationIds && applicationIds.length > 0) {
      whereClause.id = { in: applicationIds };
    }

    const appsNeedingInvite = await this.prisma.application.findMany({
      where: whereClause,
      select: { id: true },
    });

    console.log(
      `Smart Schedule: Found ${appsNeedingInvite.length} candidates needing invites.`,
      `User: ${userId}`
    );

    let sentCount = 0;
    const errors: any[] = [];

    for (const app of appsNeedingInvite) {
      try {
        await this.triggerInvite(app.id, userId, customMessage);
        sentCount++;
      } catch (e: any) {
        errors.push({ applicationId: app.id, error: e.message });
      }
    }

    return {
      totalFound: appsNeedingInvite.length,
      sentCount,
      errors,
    };
  }


  async getAvailableSlots(token: string, candidateTimeZone?: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { bookingToken: token },
      include: { interviewer: true },
    });

    if (!interview || interview.status !== 'PENDING') {
      throw new BadRequestException('This booking link is invalid or expired.');
    }

    const { interviewer } = interview;

    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    return this.calendarService.getFreeSlots(
      now,
      nextWeek,
      interviewer.id,
      candidateTimeZone,
    );
  }

  async confirmBooking(token: string, slotTime: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { bookingToken: token },
      include: { application: { include: { candidate: true, job: true } } },
    });

    if (!interview || interview.status !== 'PENDING') {
      throw new BadRequestException('Invalid booking link');
    }

    const confirmedDate = new Date(slotTime);

    // --- RACE CONDITION FIX: Use Serializable transaction ---
    // --- RACE CONDITION FIX: Database Unique Constraint ---
    try {
      const updated = await this.prisma.interview.update({
        where: { id: interview.id },
        data: {
          status: 'CONFIRMED',
          scheduledAt: confirmedDate,
          confirmedSlot: confirmedDate, // Enforce uniqueness
          bookingToken: null,
        },
      });

      // Send email after successful update
      const candidateName =
        interview.application.candidate.firstName || 'Candidate';
      const candidateEmail = interview.application.candidate.email;

      const company = await this.prisma.company.findFirst();

      await this.emailService.sendConfirmation(
        candidateEmail,
        candidateName,
        confirmedDate,
        'Google Meet',
        company?.showEmailHeader ? (company?.headerImageUrl || undefined) : undefined,
        company?.showEmailFooter ? (company?.footerImageUrl || undefined) : undefined,
        company?.showCompanyAddress ? (company?.address || undefined) : undefined
      );

      // --- Trigger 2-Way Sync ---
      try {
        await this.calendarService.syncEventToExternal(updated.id);
      } catch (syncError) {
        console.error(`Failed to sync interview ${updated.id} to external calendar`, syncError);
        // Don't fail the request, just log it.
      }

      // --- NEW: NOTIFY INTERVIEWER ---
      if (interview.interviewerId) {
        await this.notificationsService.create(
          interview.interviewerId,
          'INTERVIEW_BOOKED',
          `New Interview Confirmed: ${candidateName} for ${interview.application.job.title}`,
          `/interviews?date=${confirmedDate.toISOString().split('T')[0]}`
        );
      }

      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException(
          'This time slot has already been booked by another candidate. Please select a different time.',
        );
      }
      throw error;
    }

    // Email sent inside try block on success
  }

  async generateQuestions(dto: any) {
    try {
      const aiServiceUrl =
        this.configService.get('AI_SERVICE_URL') ?? 'http://localhost:8000';
      const { data } = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/generate-interview-questions`, {
          job_title: dto.jobTitle,
          job_description: dto.jobDescription || '',
          skills: dto.skills || [],
          candidate_name: dto.candidateName || 'Candidate',
        }),
      );
      return data;
    } catch (e: any) {
      console.error('AI Question Generation Failed', e.message);
      throw new BadRequestException('Failed to generate questions');
    }
  }

  async saveQuestions(interviewId: string, questions: any[]) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        questions: questions,
      },
    });
  }

  async processDecision(interviewId: string, decision: 'ADVANCE' | 'REJECT') {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: { application: true }
    });

    if (!interview) throw new NotFoundException('Interview not found');

    // 1. Update Application Status
    const newStatus = decision === 'ADVANCE' ? 'OFFER' : 'REJECTED';

    await this.prisma.application.update({
      where: { id: interview.applicationId },
      data: { status: newStatus }
    });

    // 2. Mark Interview as COMPLETED if not already
    if (interview.status !== 'COMPLETED') {
      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' }
      });
    }

    // 3. (Optional) If Advance, Create Draft Offer could go here
    // For now, just moving status is sufficient as per plan.

    return { success: true, newStatus };
  }

  getAvailability(interviewerId: string, start: Date, end: Date) {
    return this.calendarService.getAvailability(interviewerId, start, end);
  }

  async updateStatus(id: string, status: 'CONFIRMED' | 'CANCELLED') {
    const interview = await this.prisma.interview.findUnique({ where: { id } });
    if (!interview) throw new NotFoundException('Interview not found');

    const updated = await this.prisma.interview.update({
      where: { id },
      data: { status, confirmedSlot: status === 'CONFIRMED' ? interview.scheduledAt : null },
    });

    // Attempt sync if confirmed
    if (status === 'CONFIRMED' && interview.scheduledAt) {
      try {
        await this.calendarService.syncEventToExternal(updated.id);
      } catch (e) { console.error('Sync failed', e); }
    }

    return updated;
  }

  async assignInterviewer(interviewId: string, interviewerId: string, actorId?: string) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: { candidate: true }
        }
      }
    });

    if (!interview) throw new NotFoundException('Interview not found');

    const interviewer = await this.prisma.user.findUnique({
      where: { id: interviewerId },
    });

    if (!interviewer) throw new NotFoundException('Interviewer not found');

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: { interviewerId },
      include: { interviewer: true }
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'ASSIGN_INTERVIEWER',
        target: `Interview:${interviewId}`,
        details: {
          previousInterviewerId: interview.interviewerId,
          newInterviewerId: interviewerId,
          newInterviewerName: interviewer.fullName
        }
      }
    });

    // --- NEW: NOTIFY NEW INTERVIEWER ---
    if (interviewerId !== interview.interviewerId) {
      const candidateName = interview.application?.candidate?.firstName || 'Candidate';
      await this.notificationsService.create(
        interviewerId,
        'ASSIGNMENT',
        `You have been assigned to interview ${candidateName}`,
        `/interviews`
      );
    }

    return updated;
  }
}

