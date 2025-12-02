// --- Content from: apps/backend-core/src/candidates/candidates.service.ts ---

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';

interface SearchParams {
  q?: string;
  location?: string;
  minExp?: number;
  keywords?: string;
  page?: number;
  limit?: number;
}

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CandidatesService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
    @InjectQueue('applications') private applicationsQueue: Queue,
  ) { }



  // ...

  async search(params: SearchParams) {
    const { q, location, minExp, keywords, page = 1, limit = 10 } = params;
    console.log(`🔍 Processing Hybrid Search:`, params);

    const offset = (page - 1) * limit;
    let candidateIdsFromVector: string[] | null = null;
    const aiScores: Record<string, number> = {};

    // 1. Semantic Search (Vector DB)
    if (q) {
      try {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const { data } = await firstValueFrom(
          this.httpService.post(`${aiServiceUrl}/search-candidates`, {
            query: q,
            limit,
            offset,
            location: location,
            min_experience: minExp,
          }),
        );

        candidateIdsFromVector = data.matches.map((m: any) => {
          // Convert Distance to Similarity (Simple approach: 1 / (1 + distance))
          // This ensures the result is always between 0 and 1, and higher is better.
          aiScores[m.candidate_id] = 1 / (1 + m.score);
          return m.candidate_id;
        });

        if (!candidateIdsFromVector || candidateIdsFromVector.length === 0) return [];
      } catch (error: any) {
        console.error('❌ Vector Search Service Failed:', error.message);
      }
    }

    // 2. Construct Relational Query (Prisma)
    const whereClause: any = { AND: [] };

    if (candidateIdsFromVector) {
      whereClause.AND.push({ id: { in: candidateIdsFromVector } });
    } else if (q) {
      // If vector search was supposed to run but failed, return empty
      return [];
    }

    if (location && !q) { // Only apply if not already done by vector search
      whereClause.AND.push({ location: { contains: location, mode: 'insensitive' } });
    }
    if (minExp && !q) { // Only apply if not already done by vector search
      whereClause.AND.push({ experience: { gte: minExp } });
    }
    if (keywords) {
      whereClause.AND.push({ resumeText: { contains: keywords, mode: 'insensitive' } });
    }

    // If no vector search and no other filters, we should probably not return the whole DB
    if (!q && !location && !minExp && !keywords) {
      // Find all with pagination
      const profiles = await this.prisma.candidate.findMany({
        skip: offset,
        take: limit,
        include: {
          applications: { include: { job: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return profiles;
    }


    // 3. Fetch Results from Postgres
    const profiles = await this.prisma.candidate.findMany({
      where: whereClause,
      include: {
        applications: { include: { job: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Merge & Sort (If Vector Scores exist)
    if (candidateIdsFromVector) {
      return profiles
        .map((p) => ({
          ...p,
          aiScore: aiScores[p.id] || 2.0,
        }))
        .sort((a, b) => a.aiScore - b.aiScore);
    }

    // For non-vector searches, we should paginate the result
    // This part is tricky as we have already fetched all profiles
    // A better approach would be to apply pagination to the prisma query itself
    // But for "load more" this might be acceptable for now.
    // Let's adjust to paginate the non-vector search
    if (!q) {
      const paginatedProfiles = await this.prisma.candidate.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        include: {
          applications: { include: { job: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return paginatedProfiles;
    }


    return profiles;
  }

  async update(id: string, data: any) {
    const candidate = await this.prisma.candidate.update({
      where: { id },
      data,
    });

    // Trigger Re-index if critical fields changed
    if (data.resumeText || data.experience || data.location) {
      console.log(`🔄 Candidate ${id} updated. Triggering Re-indexing...`);
      await this.applicationsQueue.add('reindex-candidate', {
        candidateId: candidate.id,
      });
    }

    return candidate;
  }
}
