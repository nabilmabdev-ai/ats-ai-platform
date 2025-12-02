import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCommentDto) {
    // Verify application exists
    const app = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.authorId },
    });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        applicationId: dto.applicationId,
        authorId: dto.authorId,
      },
      include: {
        author: {
          select: { fullName: true, email: true, role: true },
        },
      },
    });
  }

  async findByApplication(applicationId: string) {
    return this.prisma.comment.findMany({
      where: { applicationId },
      include: {
        author: {
          select: { fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
