import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) { }

  // --- JOB TEMPLATES ---
  async getJobTemplates() {
    return this.prisma.jobTemplate.findMany({
      orderBy: { name: 'asc' },
      include: { defaultScreeningTemplate: true }
    });
  }

  // [NEW] Get Single Template
  async getJobTemplate(id: string) {
    return this.prisma.jobTemplate.findUnique({
      where: { id },
      include: { defaultScreeningTemplate: true }
    });
  }

  async createJobTemplate(data: any) {
    const { defaultScreeningTemplateId, ...rest } = data;
    return this.prisma.jobTemplate.create({
      data: {
        ...rest,
        defaultScreeningTemplateId: defaultScreeningTemplateId || null
      }
    });
  }

  async updateJobTemplate(id: string, data: any) {
    const { defaultScreeningTemplateId, ...rest } = data;
    return this.prisma.jobTemplate.update({
      where: { id },
      data: {
        ...rest,
        defaultScreeningTemplateId: defaultScreeningTemplateId || null
      },
    });
  }

  async deleteJobTemplate(id: string) {
    return this.prisma.jobTemplate.delete({ where: { id } });
  }

  // --- SCREENING TEMPLATES ---
  async getScreeningTemplates() {
    return this.prisma.screeningTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  // [NEW] Get Single Scorecard (Optional, but good practice)
  async getScreeningTemplate(id: string) {
    return this.prisma.screeningTemplate.findUnique({ where: { id } });
  }

  async createScreeningTemplate(data: any) {
    return this.prisma.screeningTemplate.create({ data });
  }

  async updateScreeningTemplate(id: string, data: any) {
    return this.prisma.screeningTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteScreeningTemplate(id: string) {
    return this.prisma.screeningTemplate.delete({ where: { id } });
  }

  // --- LEGAL TEMPLATES ---
  async getLegalTemplates() {
    return this.prisma.legalTemplate.findMany({ orderBy: { region: 'asc' } });
  }
}