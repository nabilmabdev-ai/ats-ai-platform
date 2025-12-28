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

@Injectable()
export class InterviewsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private configService: ConfigService,
    private emailService: EmailService,
    private calendarService: CalendarService,
  ) {}

  // --- NEW: Find All (For Dashboard) ---
  async findAll(page: number = 1, limit: number = 10, startDate?: Date) {
    const skip = (page - 1) * limit;
    const where: any = {
      scheduledAt: {
        gte: startDate || new Date(),
      },
    };

    return this.prisma.interview.findMany({
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
        interviewer: { select: { fullName: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
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

  async triggerInvite(applicationId: string) {
    try {
      const invite = await this.createInvite(applicationId);
      const bookingLink = `http://localhost:3000/book/${invite.bookingToken}`;

      // Re-fetch to get candidate details if createInvite didn't return them (it returns the created object)
      // Actually createInvite returns the interview object. We need candidate details.
      const application = await this.prisma.application.findUnique({
        where: { id: applicationId },
        include: { candidate: true, job: true },
      });

      if (!application) return;

      await this.emailService.sendInterviewInvite(
        application.candidate.email,
        application.candidate.firstName || 'Candidate',
        application.job.title,
        bookingLink,
      );
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

  async runSmartSchedule(applicationIds?: string[]) {
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
    );

    let sentCount = 0;
    const errors: any[] = [];

    for (const app of appsNeedingInvite) {
      try {
        await this.triggerInvite(app.id);
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
      include: { application: { include: { candidate: true } } },
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

      await this.emailService.sendConfirmation(
        candidateEmail,
        candidateName,
        confirmedDate,
      );

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
}
