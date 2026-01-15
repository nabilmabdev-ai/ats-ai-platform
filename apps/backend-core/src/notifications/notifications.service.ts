import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, type: string, message: string, link?: string, metadata?: any) {
        return this.prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link,
                metadata,
            },
        });
    }

    async findAll(userId: string, unreadOnly = false) {
        return this.prisma.notification.findMany({
            where: {
                userId,
                ...(unreadOnly ? { read: false } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markAsRead(id: string, userId: string) {
        // Verify ownership
        const note = await this.prisma.notification.findUnique({ where: { id } });
        if (!note || note.userId !== userId) {
            // Silent fail or throw?
            return null;
        }
        return this.prisma.notification.update({
            where: { id },
            data: { read: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    }
}
