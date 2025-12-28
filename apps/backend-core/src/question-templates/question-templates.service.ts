import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QuestionTemplatesService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async create(data: {
    title: string;
    questions: any[];
    isGlobal?: boolean;
    createdById: string;
  }) {
    return this.prisma.questionTemplate.create({
      data: {
        title: data.title,
        questions: data.questions,
        isGlobal: data.isGlobal || false,
        createdById: data.createdById,
      },
    });
  }

  async findAll(query: string = '') {
    return this.prisma.questionTemplate.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { fullName: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.questionTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(
    id: string,
    data: { title?: string; questions?: any[]; isGlobal?: boolean },
  ) {
    return this.prisma.questionTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.questionTemplate.delete({
      where: { id },
    });
  }

  async generateQuestions(role: string) {
    try {
      // Reusing the existing Python service endpoint
      // We send generic context since we don't have a specific candidate/job
      const { data } = await firstValueFrom(
        this.httpService.post(
          'http://localhost:8000/generate-interview-questions',
          {
            job_title: role,
            job_description: `Standard requirements for ${role}`,
            skills: [],
            candidate_name: 'Generic Candidate',
          },
        ),
      );

      // Transform the response to match our question structure
      const questions: any[] = [];
      const generateId = () =>
        Date.now().toString(36) + Math.random().toString(36).substr(2);

      if (data.role_specific) {
        data.role_specific.forEach((q: string) =>
          questions.push({
            id: generateId(),
            text: q,
            category: 'Role Specific',
          }),
        );
      }
      if (data.behavioral) {
        data.behavioral.forEach((q: string) =>
          questions.push({ id: generateId(), text: q, category: 'Behavioral' }),
        );
      }
      if (data.red_flags) {
        data.red_flags.forEach((q: string) =>
          questions.push({ id: generateId(), text: q, category: 'Red Flags' }),
        );
      }

      return questions;
    } catch (e: any) {
      console.error('AI Template Generation Failed', e.message);
      throw new BadRequestException('Failed to generate questions');
    }
  }
}
