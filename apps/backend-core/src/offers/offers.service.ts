import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { EmailService } from '../email/email.service';
import { OfferStatus, AppStatus } from '@prisma/client';
import * as handlebars from 'handlebars';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [offers, total] = await this.prisma.$transaction([
      this.prisma.offer.findMany({
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
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.offer.count(),
    ]);

    return {
      data: offers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateOfferDto, userId: string) {
    const [app, template] = await Promise.all([
      this.prisma.application.findUnique({
        where: { id: dto.applicationId },
        include: {
          candidate: true,
          job: true,
          offer: true,
        },
      }),
      this.prisma.documentTemplate.findUnique({
        where: { id: dto.templateId },
      }),
    ]);

    if (!app) throw new NotFoundException('Application not found');
    if (app.offer)
      throw new ConflictException('Offer already exists for this application');
    if (!template) throw new NotFoundException('Document template not found');

    const context = {
      candidate: app.candidate,
      job: app.job,
      offer: {
        salary: dto.salary,
        salaryFormatted: dto.salary.toLocaleString(),
        currency: dto.currency || 'USD',
        equity: dto.equity || 'N/A',
        startDate: new Date(dto.startDate).toDateString(),
      },
      ...(dto.templateData || {}),
    };

    const compiledTemplate = handlebars.compile(template.content);
    const jsonContent = compiledTemplate(context);
    let docDefinition;
    try {
      docDefinition = JSON.parse(jsonContent);
    } catch (e) {
      throw new ConflictException('Invalid JSON template content');
    }

    const offer = await this.prisma.offer.create({
      data: {
        applicationId: dto.applicationId,
        createdById: userId,
        salary: dto.salary,
        currency: dto.currency || 'USD',
        equity: dto.equity,
        startDate: new Date(dto.startDate),
        offerLetter: jsonContent, // Storing JSON for now
        status: OfferStatus.DRAFT,
        templateId: dto.templateId,
      },
    });

    await this.pdfQueue.add('generate-pdf', {
      offerId: offer.id,
      docDefinition,
    });

    await this.prisma.application.update({
      where: { id: app.id },
      data: { status: AppStatus.OFFER },
    });

    return offer;
  }

  async sendOffer(offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        application: {
          include: { candidate: true, job: true },
        },
      },
    });

    if (!offer) throw new NotFoundException('Offer not found');
    if (!offer.generatedOfferUrl) {
      throw new NotFoundException(
        'Offer PDF has not been generated for this offer.',
      );
    }

    const fullPdfPath = path.join(
      process.cwd(),
      'uploads',
      offer.generatedOfferUrl,
    );

    const pdfBuffer = await fs.readFile(fullPdfPath);

    await this.emailService.sendOfferEmail(
      offer.application.candidate.email,
      `Offer of Employment: ${offer.application.job.title}`,
      '<p>Please find your offer of employment attached.</p>',
      pdfBuffer,
    );

    return this.prisma.offer.update({
      where: { id: offerId },
      data: { status: OfferStatus.SENT },
    });
  }

  async updateStatus(offerId: string, status: OfferStatus) {
    const offer = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status },
      include: { application: true },
    });

    if (status === OfferStatus.ACCEPTED) {
      await this.prisma.application.update({
        where: { id: offer.applicationId },
        data: { status: AppStatus.HIRED },
      });
    }

    return offer;
  }

  async findByApp(applicationId: string) {
    return this.prisma.offer.findUnique({
      where: { applicationId },
    });
  }
}
