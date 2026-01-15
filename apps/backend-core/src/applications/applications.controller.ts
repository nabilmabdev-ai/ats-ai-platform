import {
  Controller,
  Get,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  UploadedFiles,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import {
  BulkAssignDto,
  BulkRejectDto,
  BulkStatusDto,
  BulkTagDto,
} from './dto/bulk-action.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) { }

  // [NEW] Check for failures (for the frontend badge)
  @Get('health/parsing-failures')
  getFailureCount() {
    return this.applicationsService.getFailureCount();
  }

  // [NEW] Trigger the healing process
  @Post('maintenance/recover')
  @HttpCode(HttpStatus.OK)
  recoverData() {
    return this.applicationsService.retryFailedParsings();
  }

  @Post('bulk/status')
  @HttpCode(HttpStatus.OK)
  bulkUpdateStatus(@Body() bulkStatusDto: BulkStatusDto) {
    return this.applicationsService.bulkUpdateStatus(bulkStatusDto);
  }

  @Post('bulk/reject')
  @HttpCode(HttpStatus.OK)
  bulkReject(@Body() bulkRejectDto: BulkRejectDto) {
    return this.applicationsService.bulkReject(bulkRejectDto);
  }

  @Post('bulk/assign')
  @HttpCode(HttpStatus.OK)
  bulkAssign(@Body() bulkAssignDto: BulkAssignDto) {
    return this.applicationsService.bulkAssign(bulkAssignDto);
  }

  @Post('bulk/tag')
  @HttpCode(HttpStatus.OK)
  bulkTag(@Body() bulkTagDto: BulkTagDto) {
    return this.applicationsService.bulkTag(bulkTagDto);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'resume', maxCount: 1 },
        { name: 'coverLetter', maxCount: 1 },
      ],
      {
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
      },
    ),
  )
  create(
    @UploadedFiles()
    files: {
      resume?: any[];
      coverLetter?: any[];
    },
    @Body()
    body: {
      jobId: string;
      email: string;
      name: string;
      phone?: string;
      knockoutAnswers?: string;
      source?: string; // [NEW] Capture source
    },
  ) {
    if (!files || !files.resume || files.resume.length === 0) {
      throw new BadRequestException('Resume file is required');
    }

    const resumeFile = files.resume[0];
    const coverLetterFile = files.coverLetter ? files.coverLetter[0] : null;

    // Parse Knockout Answers (FormData sends them as string)
    let answers = {};
    if (body.knockoutAnswers) {
      try {
        answers = JSON.parse(body.knockoutAnswers);
      } catch (e) {
        console.error('Failed to parse knockout answers', e);
      }
    }

    return this.applicationsService.create(
      {
        jobId: body.jobId,
        email: body.email,
        name: body.name,
        phone: body.phone,
        knockoutAnswers: answers,
        source: body.source,
      },
      {
        resume: resumeFile.path,
        coverLetter: coverLetterFile ? coverLetterFile.path : undefined,
      },
    );
  }

  @Get()
  findAll(
    @Query('jobId') jobId?: string,
    @Query('period') period?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('includeClosed') includeClosed?: string,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string, // [NEW]
  ) {
    const showClosed = includeClosed === 'true';
    return this.applicationsService.findAll(
      jobId,
      period,
      page,
      limit,
      showClosed,
      search,
      ownerId,
    );
  }

  // [NEW] Batch fetch for polling
  @Get('batch')
  async findBatch(@Query('ids') ids: string) {
    if (!ids) return [];
    const idArray = ids.split(',').filter((id) => id.trim().length > 0);
    if (idArray.length === 0) return [];
    return this.applicationsService.findByIds(idArray);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationStatusDto,
    @Request() req,
  ) {
    return this.applicationsService.updateStatus(
      id,
      updateDto.status,
      updateDto.reason,
      updateDto.notes,
      req.user?.role,
      req.user?.id,
    );
  }

  @Post(':id/generate-rejection')
  generateRejection(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.applicationsService.generateRejectionDraft(id, body.reason);
  }

  @Post(':id/reject')
  rejectApplication(
    @Param('id') id: string,
    @Body() body: { subject: string; body: string },
  ) {
    if (!body.subject || !body.body) {
      throw new BadRequestException('Subject and body are required');
    }
    return this.applicationsService.rejectWithEmail(
      id,
      body.subject,
      body.body,
    );
  }

  // [NEW] Endpoint to force re-process a specific application
  @Patch(':id/reprocess')
  @HttpCode(HttpStatus.OK)
  reprocess(@Param('id') id: string) {
    return this.applicationsService.reprocessApplication(id);
  }

  @Patch(':id/owner')
  @UseGuards(JwtAuthGuard)
  assignOwner(
    @Param('id') id: string,
    @Body('ownerId') ownerId: string,
    @Request() req,
  ) {
    if (!ownerId) throw new BadRequestException('ownerId is required');
    return this.applicationsService.assignOwner(id, ownerId, req.user.id);
  }
}
