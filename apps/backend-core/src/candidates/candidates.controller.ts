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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CandidatesService, MergeStrategy } from './candidates.service';
import { Delete } from '@nestjs/common';

export class CreateCandidateDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  location?: string;
  jobId?: string;
  resumeS3Key?: string;
  resumeText?: string;
}

export class MergeCandidateDto {
  primaryId: string;
  secondaryId: string;
  strategy?: MergeStrategy;
}

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
    const result = await this.candidatesService.search({
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

    return {
      data: result.data,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      }
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, any>) {
    try {
      // TODO: Pass userId from request when Auth guard is fully integrated/typed here
      // const userId = req.user?.id; 
      return await this.candidatesService.update(id, body);
    } catch (error: any) {
      if (error.code === 'DUPLICATE_EMAIL') {
        throw new BadRequestException({
          message: 'Duplicate email found',
          code: 'DUPLICATE_EMAIL',
          conflictCandidateId: error.conflictCandidateId
        });
        // Alternatively, use ConflictException
        // throw new ConflictException(...)
      }
      throw error;
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }

  @Post('check-duplicity')
  async checkDuplicity(@Body() body: { name?: string; email?: string; phone?: string }) {
    return this.candidatesService.checkDuplicity(body);
  }

  @Post('merge')
  async merge(
    @Body() body: MergeCandidateDto,
  ) {
    return this.candidatesService.mergeCandidates(
      body.primaryId,
      body.secondaryId,
      body.strategy,
    );
  }

  @Post('reindex')
  async reindex() {
    return this.candidatesService.triggerFullReindex();
  }
  @Post()
  async create(@Body() body: CreateCandidateDto) {
    return this.candidatesService.createCandidate(body);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('resume', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return cb(
            new BadRequestException('Only PDF/Word files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: any, @Body() body: CreateCandidateDto) {
    if (!file) throw new BadRequestException('File is required');
    return this.candidatesService.createCandidate({
      ...body,
      resumeS3Key: file.path,
    });
  }
}
