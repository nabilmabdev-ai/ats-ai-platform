import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SearchService implements OnModuleInit {
  private meiliClient: MeiliSearch;
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly httpService: HttpService) {
    this.meiliClient = new MeiliSearch({
      host: process.env.MEILI_HOST || 'http://localhost:7700',
      apiKey: process.env.MEILI_KEY,
    });
  }

  async onModuleInit() {
    // Ensure index exists
    // In a real app, you might want to configure settings here too
    try {
      await this.meiliClient.createIndex('candidates', { primaryKey: 'id' });
    } catch (e) {
      // Index might already exist
    }
  }

  // 1. SYNC DATA
  async indexCandidate(candidate: any) {
    const index = this.meiliClient.index('candidates');
    await index.addDocuments([
      {
        id: candidate.id,
        name: `${candidate.firstName} ${candidate.lastName}`,
        email: candidate.email,
        phone: candidate.phone,
        skills: candidate.skills, // Array of strings or string
        resumeText: candidate.resumeText
          ? candidate.resumeText.substring(0, 5000)
          : '', // Truncate to avoid payload limits
        location: candidate.location,
        experience: candidate.experience,
      },
    ]);
  }

  async deleteCandidate(id: string) {
    const index = this.meiliClient.index('candidates');
    await index.deleteDocument(id);
  }

  // 2. HYBRID SEARCH
  async search(query: string) {
    // Parallel Execution
    const [vectorResults, keywordResults] = await Promise.all([
      this.searchVectors(query),
      this.searchKeywords(query),
    ]);

    // Merge results using RRF
    return this.reciprocalRankFusion(vectorResults, keywordResults);
  }

  private async searchVectors(query: string) {
    try {
      const aiServiceUrl =
        process.env.AI_SERVICE_URL || 'http://localhost:8000';
      // Call your existing Python/Milvus service
      const { data } = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/search-candidates`, {
          query,
          limit: 20, // Get more than needed to allow for intersection
        }),
      );
      // Normalize to: { id: string, score: number }
      return data.matches.map((m: any) => ({
        id: m.candidate_id,
        score: m.score,
      }));
    } catch (error) {
      this.logger.error('Vector search failed', error);
      return [];
    }
  }

  private async searchKeywords(query: string) {
    try {
      const index = this.meiliClient.index('candidates');
      const result = await index.search(query, { limit: 20 });
      // MeiliSearch returns matches ordered by relevance
      return result.hits.map((h: any) => ({ id: h.id }));
    } catch (error) {
      this.logger.error('Keyword search failed', error);
      return [];
    }
  }

  /**
   * 3. THE ALGORITHM: Reciprocal Rank Fusion (RRF)
   * This merges two lists of ranked items without needing to normalize disparate scores.
   * Score = 1 / (k + rank)
   */
  private reciprocalRankFusion(vectorHits: any[], keywordHits: any[], k = 60) {
    const scores = new Map<string, number>();

    // Process Vector Hits
    vectorHits.forEach((hit, rank) => {
      const currentScore = scores.get(hit.id) || 0;
      // Rank is 0-based index. Lower rank (higher in list) = higher score.
      scores.set(hit.id, currentScore + 1 / (k + rank));
    });

    // Process Keyword Hits
    keywordHits.forEach((hit, rank) => {
      const currentScore = scores.get(hit.id) || 0;
      scores.set(hit.id, currentScore + 1 / (k + rank));
    });

    // Sort by final score descending
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    return sortedIds; // Returns ID list to fetch from Postgres
  }
}
