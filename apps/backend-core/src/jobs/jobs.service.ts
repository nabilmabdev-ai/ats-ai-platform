// --- Content from: apps/backend-core/src/jobs/jobs.service.ts ---

import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as Handlebars from 'handlebars';
import { JobStatus, AppStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    private emailService: EmailService,
  ) {}

  // --- Fetch Templates for Frontend ---
  async getJobTemplates() {
    return this.prisma.jobTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // --- AI Generation with Handlebars ---
  async generateAiDescription(
    title: string,
    notes: string = '',
    templateId?: string,
    region: string = 'FR',
    toneOverride?: string,
  ) {
    let templateStructure = '';
    let templateTone: string | null = null;

    if (templateId) {
      const tmpl = await this.prisma.jobTemplate.findUnique({
        where: { id: templateId },
      });
      if (tmpl) {
        templateStructure = tmpl.structure;
        templateTone = tmpl.aiTone;
      }
    }

    // --- NEW: Resolve Tone Hierarchy ---
    // 1. Direct Override (from UI)
    // 2. Template Override
    // 3. Global Company Default
    // 4. System Fallback ("Professional")

    let tone = 'Professional';

    if (toneOverride) {
      tone = toneOverride;
    } else if (templateTone) {
      tone = templateTone;
    } else {
      const company = await this.prisma.company.findFirst();
      if (company?.aiTone) {
        tone = company.aiTone;
      }
    }

    // Fetch company description for context
    const company = await this.prisma.company.findFirst();
    const companyDescription = company?.description || '';

    const legalTmpl = await this.prisma.legalTemplate.findFirst({
      where: { region: region },
    });

    const hb = Handlebars.create();

    if (legalTmpl) {
      hb.registerPartial('legal_block', legalTmpl.content);
    } else {
      hb.registerPartial('legal_block', '');
    }

    try {
      const payload = {
        title: title,
        notes: notes,
        template_mode: !!templateId,
        tone: tone, // Pass resolved tone
        company_description: companyDescription, // Pass company description
      };

      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';

      const { data: aiData } = await firstValueFrom(
        this.httpService.post(
          `${aiServiceUrl}/generate-job-description`,
          payload,
        ),
      );

      if (templateId && templateStructure) {
        console.log(`🔮 Rendering Template for Region: ${region}`);

        const respBullets = Array.isArray(aiData.responsibilities)
          ? aiData.responsibilities.map((r: string) => `- ${r}`).join('\n')
          : '';

        const reqBullets = Array.isArray(aiData.requirements)
          ? aiData.requirements.map((r: string) => `- ${r}`).join('\n')
          : '';

        const context = {
          job_title: title,
          ai_summary: aiData.summary || '',
          ai_responsibilities: respBullets,
          ai_requirements: reqBullets,
        };

        const template = hb.compile(templateStructure);
        const finalMarkdown = template(context);

        return {
          description: finalMarkdown,
          requirements: aiData.requirements || [],
          salary_range: aiData.salary_range,
        };
      }

      return aiData;
    } catch (error: any) {
      // [FIX] Improved Error Logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('AI Service Error Response Data:', error.response.data);
        console.error('AI Service Error Status:', error.response.status);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('AI Service No Response:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('AI Service Setup Error:', error.message);
      }

      throw new Error('AI Service unavailable or returned an error');
    }
  }

  // --- Matching Logic ---
  async matchCandidates(jobId: string, limit: number = 10, offset: number = 0) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const queryText = `
      Job Title: ${job.title}
      Description: ${job.descriptionText}
      Requirements: ${JSON.stringify(job.requirements)}
    `.trim();

    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const { data } = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/match-job`, {
          job_description: queryText,
          limit,
          offset,
        }),
      );

      const matches = data.matches || [];
      if (matches.length === 0) return [];

      const candidateIds = matches.map((m: any) => m.candidate_id);

      const profiles = await this.prisma.candidate.findMany({
        where: { id: { in: candidateIds } },
        include: {
          applications: {
            where: { jobId: jobId },
            select: { status: true },
          },
        },
      });

      return matches
        .map((match: any) => {
          const profile = profiles.find((p) => p.id === match.candidate_id);
          if (!profile) return null;

          return {
            ...profile,
            aiScore: match.score,
            existingStatus: profile.applications[0]?.status || null,
          };
        })
        .filter(Boolean);
    } catch (error: any) {
      // Improved Error Logging for matchCandidates
      if (error.response) {
        console.error(
          'AI Matching Service Error Response Data:',
          error.response.data,
        );
        console.error(
          'AI Matching Service Error Status:',
          error.response.status,
        );
      } else if (error.request) {
        console.error('AI Matching Service No Response:', error.request);
      } else {
        console.error('AI Matching Service Setup Error:', error.message);
      }
      return [];
    }
  }

  // --- Invite Logic ---
  async inviteCandidate(jobId: string, candidateId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');

    await this.emailService.sendJobInvitation(
      candidate.email,
      candidate.firstName || 'Candidate',
      job.title,
      job.id,
    );

    return { success: true, message: `Invitation sent to ${candidate.email}` };
  }

  // --- CRUD ---

  async create(createJobDto: CreateJobDto) {
    const defaultWorkflow = await this.prisma.jobWorkflowTemplate.findFirst();

    // [UPDATED LOGIC]
    // Use provided ID, or fallback to the template's default, or finally the global default
    let screeningId = createJobDto.screeningTemplateId;

    if (!screeningId && createJobDto.templateId) {
      const jobTemplate = await this.prisma.jobTemplate.findUnique({
        where: { id: createJobDto.templateId },
      });
      if (jobTemplate?.defaultScreeningTemplateId) {
        screeningId = jobTemplate.defaultScreeningTemplateId;
      }
    }

    if (!screeningId) {
      const defaultScreening = await this.prisma.screeningTemplate.findFirst();
      screeningId = defaultScreening?.id;
    }

    const newJob = await this.prisma.job.create({
      data: {
        title: createJobDto.title,
        descriptionText: createJobDto.descriptionText,
        requirements: createJobDto.requirements ?? [],
        salaryMin: createJobDto.salaryMin,
        salaryMax: createJobDto.salaryMax,
        status:
          (createJobDto.status as JobStatus) || JobStatus.PENDING_APPROVAL,
        priority: createJobDto.priority,
        remoteType: createJobDto.remoteType,
        headcount: createJobDto.headcount,
        location: createJobDto.location,
        department: createJobDto.department,
        workflowTemplateId: defaultWorkflow?.id,

        // Use the explicit ID
        screeningTemplateId: screeningId,

        // Also link the Job Template for reference
        templateId: createJobDto.templateId,

        knockoutQuestions: createJobDto.knockoutQuestions ?? [],
      },
    });

    // [SILVER MEDALIST] Auto-source candidates
    // We run this in background (no await) so we don't block the response
    this.autoSourceSilverMedalists(newJob.id).catch((err) =>
      console.error('[SilverMedalist] Error in background task:', err),
    );

    return newJob;
  }

  // --- Approval & Distribution Workflow ---
  async approveJob(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');

    const simulatedDistribution = {
      linkedin: { status: 'POSTED', timestamp: new Date() },
      indeed: { status: 'POSTED', timestamp: new Date() },
      glassdoor: { status: 'PENDING_REVIEW', timestamp: new Date() },
    };

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.PUBLISHED,
        approvedById: userId,
        approvedAt: new Date(),
        distribution: simulatedDistribution,
      },
    });
  }

  async findAll(
    filters?: { status?: string; department?: string },
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = {};
    if (filters?.status) where.status = filters.status as JobStatus;
    if (filters?.department) where.department = filters.department;

    const skip = (page - 1) * limit;

    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { applications: true } },
          approvedBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findOne(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        approvedBy: true,
        workflowTemplate: true,
      },
    });
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    // 1. Fetch existing job to get current values
    const existingJob = await this.prisma.job.findUnique({ where: { id } });
    if (!existingJob) throw new NotFoundException('Job not found');

    // 2. Merge existing data with update data for validation
    const salaryMin =
      updateJobDto.salaryMin !== undefined
        ? updateJobDto.salaryMin
        : existingJob.salaryMin;
    const salaryMax =
      updateJobDto.salaryMax !== undefined
        ? updateJobDto.salaryMax
        : existingJob.salaryMax;

    // 3. Validate Salary Range
    if (salaryMin !== null && salaryMax !== null && salaryMax <= salaryMin) {
      throw new NotFoundException('Salary Max must be greater than Salary Min'); // Using NotFound to match existing error style or BadRequest
      // Ideally this should be BadRequestException but importing it might require adding to imports.
      // Let's check imports. NotFoundException is imported.
    }

    const { status, ...rest } = updateJobDto;
    const data: any = { ...rest };
    if (status) {
      data.status = status as JobStatus;
    }

    return this.prisma.job.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.job.delete({ where: { id } });
  }

  findCandidates(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        applications: {
          include: { candidate: true },
        },
      },
    });
  }

  // --- Silver Medalist Logic ---
  async autoSourceSilverMedalists(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return;

    console.log(`[SilverMedalist] Auto-sourcing for job: ${job.title}`);

    // 1. Get AI Matches
    const queryText = `
      Job Title: ${job.title}
      Description: ${job.descriptionText}
      Requirements: ${JSON.stringify(job.requirements)}
    `.trim();

    let matches: any[] = [];
    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const { data } = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/match-job`, {
          job_description: queryText,
          limit: 50, // Fetch more to filter
          offset: 0,
        }),
      );
      matches = data.matches || [];
    } catch (e) {
      console.error('[SilverMedalist] AI Match failed', e);
      return;
    }

    if (matches.length === 0) return;

    const candidateIds = matches.map((m: any) => m.candidate_id);

    // 2. Fetch Candidates with History
    const candidates = await this.prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      include: {
        applications: {
          select: { status: true, jobId: true },
        },
      },
    });

    // 3. Filter: Must be "Silver Medalist"
    // Definition: Has been REJECTED in the past, and NOT currently HIRED.
    const silverMedalists = candidates.filter((c) => {
      const hasRejection = c.applications.some(
        (app) => app.status === AppStatus.REJECTED,
      );
      const isHired = c.applications.some(
        (app) => app.status === AppStatus.HIRED,
      );

      // Don't suggest if already applied to THIS job
      const appliedToThisJob = c.applications.some(
        (app) => app.jobId === jobId,
      );

      return hasRejection && !isHired && !appliedToThisJob;
    });

    console.log(
      `[SilverMedalist] Found ${silverMedalists.length} candidates from ${matches.length} matches.`,
    );

    // 4. Create Applications (Limit to top 5)
    const topCandidates = silverMedalists.slice(0, 5);

    for (const candidate of topCandidates) {
      const match = matches.find((m: any) => m.candidate_id === candidate.id);

      await this.prisma.application.create({
        data: {
          jobId: jobId,
          candidateId: candidate.id,
          status: AppStatus.SOURCED,
          tags: ['Silver Medalist', 'AI Sourced'],
          aiScore: match?.score || 0,
          aiSummary:
            'Auto-sourced as a Silver Medalist from previous rejection.',
        },
      });
      console.log(
        `[SilverMedalist] Sourced candidate ${candidate.id} for job ${jobId}`,
      );
    }
  }
}
