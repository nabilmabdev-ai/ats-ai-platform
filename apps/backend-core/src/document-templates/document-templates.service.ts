import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, DocumentTemplate } from '@prisma/client';

@Injectable()
export class DocumentTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(
    data: Prisma.DocumentTemplateCreateInput,
  ): Promise<DocumentTemplate> {
    return this.prisma.documentTemplate.create({ data });
  }

  async findAll(type?: string): Promise<Omit<DocumentTemplate, 'content'>[]> {
    return this.prisma.documentTemplate.findMany({
      where: type ? { type } : {},
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<DocumentTemplate | null> {
    return this.prisma.documentTemplate.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.DocumentTemplateUpdateInput,
  ): Promise<DocumentTemplate> {
    return this.prisma.documentTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<DocumentTemplate> {
    return this.prisma.documentTemplate.delete({ where: { id } });
  }
}
