// --- Content from: apps/backend-core/src/candidates/candidates.controller.ts ---

import { Controller, Get, Query, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
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
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    // Pass all filters to the service
    return this.candidatesService.search({
      q,
      location,
      minExp: minExp ? parseInt(minExp) : undefined,
      keywords,
      page,
      limit,
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.candidatesService.update(id, body);
  }
}
