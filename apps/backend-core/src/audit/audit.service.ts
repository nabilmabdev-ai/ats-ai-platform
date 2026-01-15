import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(actorId: string | null, action: string, target: string, details?: any) {
        // Fire and forget - don't await to avoid slowing down main request
        this.prisma.auditLog.create({
            data: {
                actorId,
                action,
                target,
                details,
            },
        }).catch(err => console.error('Audit Log Error:', err));
    }
}
