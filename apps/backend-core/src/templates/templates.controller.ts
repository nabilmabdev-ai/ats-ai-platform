import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // --- Job Templates ---
  @Get('job')
  getJobTemplates() {
    return this.templatesService.getJobTemplates();
  }

  // [NEW] Get Single Job Template
  @Get('job/:id')
  getJobTemplate(@Param('id') id: string) {
    return this.templatesService.getJobTemplate(id);
  }

  @Post('job')
  createJobTemplate(@Body() body: any) {
    return this.templatesService.createJobTemplate(body);
  }

  @Patch('job/:id')
  updateJobTemplate(@Param('id') id: string, @Body() body: any) {
    return this.templatesService.updateJobTemplate(id, body);
  }

  @Delete('job/:id')
  deleteJobTemplate(@Param('id') id: string) {
    return this.templatesService.deleteJobTemplate(id);
  }

  // --- Screening Templates ---
  @Get('screening')
  getScreeningTemplates() {
    return this.templatesService.getScreeningTemplates();
  }

  // [NEW] Get Single Screening Template
  @Get('screening/:id')
  getScreeningTemplate(@Param('id') id: string) {
    return this.templatesService.getScreeningTemplate(id);
  }

  @Post('screening')
  createScreeningTemplate(@Body() body: any) {
    return this.templatesService.createScreeningTemplate(body);
  }

  @Patch('screening/:id')
  updateScreeningTemplate(@Param('id') id: string, @Body() body: any) {
    return this.templatesService.updateScreeningTemplate(id, body);
  }

  @Delete('screening/:id')
  deleteScreeningTemplate(@Param('id') id: string) {
    return this.templatesService.deleteScreeningTemplate(id);
  }

  // --- Legal Templates ---
  @Get('legal')
  getLegalTemplates() {
    return this.templatesService.getLegalTemplates();
  }
}
