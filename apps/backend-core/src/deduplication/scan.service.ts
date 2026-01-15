import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeduplicationService } from './deduplication.service';
import { DuplicateStatus } from '@prisma/client';

@Injectable()
export class ScanService {
    private readonly logger = new Logger(ScanService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly deduplicationService: DeduplicationService,
    ) { }

    /**
     * Triggers a full database scan to identify duplicate groups.
     * This is a heavy operation and should be run in the background.
     */
    async scanDatabase() {
        this.logger.log('Starting retroactive duplicate scan...');

        let cursor: string | undefined;
        let hasMore = true;
        const BATCH_SIZE = 100;
        let processedCount = 0;
        let newGroupsCount = 0;

        while (hasMore) {
            // 1. Fetch candidates in batches
            const candidates = await this.prisma.candidate.findMany({
                select: { id: true, firstName: true, lastName: true, phone: true, email: true, linkedinUrl: true },
                take: BATCH_SIZE,
                skip: cursor ? 1 : 0,
                cursor: cursor ? { id: cursor } : undefined,
                orderBy: { id: 'asc' },
            });

            if (candidates.length === 0) {
                hasMore = false;
                break;
            }

            // Update cursor for next iteration
            cursor = candidates[candidates.length - 1].id;
            processedCount += candidates.length;

            const visitedInBatch = new Set<string>();

            for (const candidate of candidates) {
                if (visitedInBatch.has(candidate.id)) continue;

                // Find matches against THE BATCH + Database via logic if needed
                // Ideally, we compare this candidate against ALL others.
                // Comparing only within batch is insufficient.
                // Comparing against DB for every candidate is expensive (O(N*M)).
                // Optimization: We rely on `findMatchesForCandidate` which likely queries DB efficiently.

                const potentialMatches = await this.findMatchesForCandidate(candidate);

                if (potentialMatches.length > 0) {
                    // Check if already in an OPEN group
                    const existingGroup = await this.findExistingOpenGroup([candidate, ...potentialMatches]);

                    if (existingGroup) {
                        // Add missing members to existing group
                        await this.addToGroup(existingGroup.id, [candidate, ...potentialMatches]);
                    } else {
                        // Create new group
                        const groupMembers = [candidate, ...potentialMatches];
                        await this.createDuplicateGroup(groupMembers);
                        newGroupsCount++;
                    }

                    // Mark as visited to avoid re-processing in this loop if they are in the same batch
                    potentialMatches.forEach(m => {
                        if (candidates.some(c => c.id === m.id)) visitedInBatch.add(m.id);
                    });
                }
            }

            this.logger.log(`Processed ${processedCount} candidates...`);
        }

        this.logger.log(`Scan complete. Created ${newGroupsCount} new duplicate groups.`);
    }

    private async findMatchesForCandidate(source: any) {
        // We need to find potential matches in the ENTIRE DB, not just the batch.
        // We use targeted queries based on our Matching Strategies.

        const matches: any[] = [];

        // 1. Strict Email Match (Sanity check, usually unique)
        if (source.email) {
            const emailMatches = await this.prisma.candidate.findMany({
                where: {
                    email: { equals: source.email, mode: 'insensitive' },
                    id: { not: source.id }
                },
                select: { id: true, firstName: true, lastName: true, phone: true, email: true, linkedinUrl: true }
            });
            matches.push(...emailMatches.map(c => ({ candidate: c, reason: { strategy: 'EMAIL', confidence: 'EXACT' } })));
        }

        // 2. LinkedIn Match
        if (source.linkedinUrl) {
            const linkedinMatches = await this.prisma.candidate.findMany({
                where: {
                    linkedinUrl: { equals: source.linkedinUrl, mode: 'insensitive' },
                    id: { not: source.id } // Exclude self
                },
                select: { id: true, firstName: true, lastName: true, phone: true, email: true, linkedinUrl: true }
            });
            // Avoid duplicates if caught by email
            for (const m of linkedinMatches) {
                if (!matches.some(existing => existing.candidate.id === m.id)) {
                    matches.push({ candidate: m, reason: { strategy: 'LINKEDIN', confidence: 'HIGH' } });
                }
            }
        }

        // 3. Fuzzy Match (Name + Phone)
        // We query by LastName first (indexed usually) to limit set
        if (source.lastName && source.lastName.length > 2 && source.phone) {
            const nameMatches = await this.prisma.candidate.findMany({
                where: {
                    lastName: { equals: source.lastName, mode: 'insensitive' },
                    id: { not: source.id }
                },
                select: { id: true, firstName: true, lastName: true, phone: true, email: true, linkedinUrl: true }
            });

            for (const target of nameMatches) {
                if (matches.some(m => m.candidate.id === target.id)) continue;

                const isFuzzy = this.deduplicationService.checkFuzzyMatchOffline(
                    {
                        firstName: source.firstName || undefined,
                        lastName: source.lastName || undefined,
                        phone: source.phone || undefined
                    },
                    {
                        firstName: target.firstName || undefined,
                        lastName: target.lastName || undefined,
                        phone: target.phone || undefined
                    }
                );
                if (isFuzzy) {
                    matches.push({ candidate: target, reason: { strategy: 'PHONE_NAME', confidence: 'HIGH' } });
                }
            }
        }

        // Filter out exclusions
        if (matches.length > 0) {
            const targetIds = matches.map(m => m.candidate.id);
            const exclusions = await this.prisma.duplicateExclusion.findMany({
                where: {
                    OR: [
                        { candidateAId: source.id, candidateBId: { in: targetIds } },
                        { candidateAId: { in: targetIds }, candidateBId: source.id }
                    ]
                }
            });

            const excludedIds = new Set(
                exclusions.flatMap(e => [e.candidateAId, e.candidateBId])
            );

            return matches.filter(m => !excludedIds.has(m.candidate.id)).map(m => m.candidate);
        }

        return matches.map(m => m.candidate);
    }

    private async findExistingOpenGroup(candidates: any[]) {
        const candidateIds = candidates.map(c => c.id);
        // Find any group that contains ANY of these candidates and is OPEN
        const existingMember = await this.prisma.duplicateGroupMember.findFirst({
            where: {
                candidateId: { in: candidateIds },
                group: { status: DuplicateStatus.OPEN }
            },
            include: { group: true }
        });

        return existingMember?.group || null;
    }

    private async addToGroup(groupId: string, candidates: any[]) {
        for (const c of candidates) {
            const exists = await this.prisma.duplicateGroupMember.findUnique({
                where: { groupId_candidateId: { groupId, candidateId: c.id } }
            });

            if (!exists) {
                await this.prisma.duplicateGroupMember.create({
                    data: {
                        groupId,
                        candidateId: c.id,
                        confidence: 'HIGH',
                        matchReason: { note: 'Retroactive Scan (Batch)' }
                    }
                });
            }
        }
    }

    private async createDuplicateGroup(candidates: any[]) {
        const group = await this.prisma.duplicateGroup.create({
            data: { status: DuplicateStatus.OPEN }
        });

        await this.addToGroup(group.id, candidates);
    }
}
