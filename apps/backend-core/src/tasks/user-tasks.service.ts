import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class UserTasksService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService
    ) { }

    async create(userId: string, dto: any) {
        return this.prisma.userTask.create({
            data: {
                title: dto.title,
                description: dto.description,
                assignedToId: dto.assignedToId || userId,
                createdById: userId,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                priority: dto.priority || 'MEDIUM',
                relatedEntityId: dto.relatedEntityId,
                relatedEntityType: dto.relatedEntityType
            },
        });
    }

    async findAll(userId: string) {
        return this.prisma.userTask.findMany({
            where: { assignedToId: userId },
            orderBy: { dueDate: 'asc' },
            include: {
                createdBy: { select: { id: true, fullName: true } }
            }
        });
    }

    async update(id: string, dto: any) {
        return this.prisma.userTask.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string) {
        return this.prisma.userTask.delete({ where: { id } });
    }

    async getSuggestions(userId: string, context: string) {
        try {
            const { data } = await this.httpService.axiosRef.post('http://localhost:8001/tasks/suggest', {
                context,
                limit: 3
            });
            return data;
        } catch (error) {
            console.error('AI Task Suggestion Failed:', error);
            return [];
        }
    }
}
