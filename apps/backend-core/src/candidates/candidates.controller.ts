// --- Content from: apps/backend-core/src/candidates/candidates.controller.ts ---

import {
  Controller,
  Get,
  Query,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) { }

  @Get('search')
  async search(
    @Query('q') q?: string,
    @Query('location') location?: string,
    @Query('minExp') minExp?: string,
    @Query('keywords') keywords?: string,
    @Query('jobId') jobId?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('tags') tags?: string, // Comma-separated
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    // Pass all filters to the service
    return this.candidatesService.search({
      q,
      location,
      minExp: minExp ? parseInt(minExp) : undefined,
      keywords,
      jobId,
      status,
      fromDate,
      toDate,
      tags: tags ? tags.split(',') : undefined,
      page,
      limit,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.candidatesService.update(id, body);
  }

  @Post('merge')
  async merge(@Body() body: { primaryId: string; secondaryId: string }) {
    return this.candidatesService.mergeCandidates(
      body.primaryId,
      body.secondaryId,
    );
  }

  @Post('reindex')
  async reindex() {
    return this.candidatesService.triggerFullReindex();
  }
}
