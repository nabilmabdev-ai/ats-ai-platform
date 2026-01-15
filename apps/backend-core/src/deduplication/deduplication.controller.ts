import { Controller, Get, Post, Body, Param, NotFoundException, Inject, forwardRef, Request } from '@nestjs/common';
import { ScanService } from './scan.service'; // Or DeduplicationService? Groups logic is currently in ScanService/Schema.
import { DeduplicationService } from './deduplication.service';
import { CandidatesService } from '../candidates/candidates.service';
import { PrismaService } from '../prisma/prisma.service';
import { DuplicateStatus } from '@prisma/client';

@Controller('deduplication')
export class DeduplicationController {
    constructor(
        private readonly scanService: ScanService,
        @Inject(forwardRef(() => CandidatesService))
        private readonly candidatesService: CandidatesService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('scan')
    async triggerScan() {
        // In real app, this should trigger background job.
        // For MVP, we can await it or just fire and forget (if efficient enough)
        // With <10k rows, it's fine.
        this.scanService.scanDatabase();
        return { message: 'Scan started' };
    }

    @Get('groups')
    async getDuplicateGroups() {
        // Fetch OPEN groups
        const groups = await this.prisma.duplicateGroup.findMany({
            where: { status: 'OPEN' },
            include: {
                members: {
                    include: {
                        candidate: {
                            include: {
                                applications: { select: { id: true, status: true, jobId: true } }
                            }
                        }
                    },
                    orderBy: { confidence: 'desc' } // or createdAt
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Transform for UI? Or return raw?
        // UI expects Split View.
        return groups.map(g => ({
            id: g.id,
            createdAt: g.createdAt,
            members: g.members.map(m => ({
                candidate: m.candidate,
                matchReason: m.matchReason,
                confidence: m.confidence
            }))
        }));
    }

    @Post('groups/:id/resolve')
    async resolveGroup(
        @Param('id') groupId: string,
        @Body() body: { action: 'MERGE' | 'IGNORE'; primaryCandidateId?: string },
        @Request() req: any
    ) {
        const group = await this.prisma.duplicateGroup.findUnique({
            where: { id: groupId },
            include: { members: true }
        });

        if (!group) throw new NotFoundException('Group not found');

        if (body.action === 'IGNORE') {
            await this.prisma.duplicateGroup.update({
                where: { id: groupId },
                data: { status: 'IGNORED' }
            });

            // Create Exclusions Pairwise
            const memberIds = group.members.map(m => m.candidateId);
            for (let i = 0; i < memberIds.length; i++) {
                for (let j = i + 1; j < memberIds.length; j++) {
                    await this.prisma.duplicateExclusion.create({
                        data: {
                            candidateAId: memberIds[i],
                            candidateBId: memberIds[j]
                        }
                    }).catch(() => { }); // Ignore duplicates if they exist
                }
            }
            return { success: true };
        }

        if (body.action === 'MERGE') {
            if (!body.primaryCandidateId) throw new Error('Primary Candidate ID required for merge');

            // Merge all others into primary
            const others = group.members.filter(m => m.candidateId !== body.primaryCandidateId);

            for (const other of others) {
                await this.candidatesService.mergeCandidates(body.primaryCandidateId, other.candidateId, undefined, req.user?.id);
            }

            await this.prisma.duplicateGroup.update({
                where: { id: groupId },
                data: { status: 'RESOLVED' }
            });

            return { success: true };
        }
    }
}
