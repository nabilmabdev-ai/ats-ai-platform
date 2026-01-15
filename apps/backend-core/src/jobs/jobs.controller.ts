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
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  // --- NEW: Global Config ---
  @Get('config')
  getConfig() {
    return this.jobsService.getJobConfig();
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
  @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.jobsService.approveJob(id, req.user.id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.jobsService.duplicateJob(id, body.userId);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.jobsService.closeJob(id);
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

  @Post('bulk')
  bulkCreate(@Body() body: { titles: string[] }) {
    return this.jobsService.bulkCreate(body.titles);
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
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Request() req: any) {
    return this.jobsService.update(id, updateJobDto, req.user?.id);
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
