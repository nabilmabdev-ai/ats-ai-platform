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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  create(
    @UploadedFile() file: any,
    @Body()
    body: {
      jobId: string;
      email: string;
      name: string;
      knockoutAnswers?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

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
        knockoutAnswers: answers,
      },
      file.path,
    );
  }

  @Get()
  findAll(
    @Query('jobId') jobId?: string,
    @Query('period') period?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('includeClosed') includeClosed?: string,
  ) {
    const showClosed = includeClosed === 'true';
    return this.applicationsService.findAll(jobId, period, page, limit, showClosed);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(id, updateDto.status);
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
}
