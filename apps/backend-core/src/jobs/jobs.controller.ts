import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {
    // Force rebuild
  }

  // --- NEW: Get Templates ---
  @Get('templates')
  getTemplates() {
    return this.jobsService.getJobTemplates();
  }

  // --- UPDATED: AI Generation ---
  @Post('ai-generate')
  async generateDescription(
    @Body()
    body: {
      title: string;
      notes?: string;
      templateId?: string;
      region?: string;
      tone?: string;
    },
  ): Promise<any> {
    return this.jobsService.generateAiDescription(
      body.title,
      body.notes,
      body.templateId,
      body.region,
      body.tone,
    );
  }

  // --- NEW: Approval Endpoint ---
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: { userId: string }) {
    // In a real app, userId comes from @Request() req.user.id via AuthGuard
    return this.jobsService.approveJob(id, body.userId);
  }

  @Get(':id/matches')
  findMatches(
    @Param('id') id: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const offset = (page - 1) * limit;
    return this.jobsService.matchCandidates(id, limit, offset);
  }

  @Post(':id/invite')
  inviteCandidate(
    @Param('id') id: string,
    @Body() body: { candidateId: string },
  ) {
    return this.jobsService.inviteCandidate(id, body.candidateId);
  }

  @Post()
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.jobsService.findAll({ status, department }, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @Get(':id/candidates')
  findCandidates(@Param('id') id: string) {
    return this.jobsService.findCandidates(id);
  }
}
