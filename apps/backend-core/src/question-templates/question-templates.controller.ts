import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { QuestionTemplatesService } from './question-templates.service';

@Controller('templates/questions')
export class QuestionTemplatesController {
  constructor(private readonly templatesService: QuestionTemplatesService) {}

  @Post()
  create(
    @Body()
    body: {
      title: string;
      questions: any[];
      isGlobal?: boolean;
      createdById: string;
    },
  ) {
    // TODO: In a real app, get createdById from the logged-in user context
    // For now, we expect it in the body or default to a system user if needed
    return this.templatesService.create(body);
  }

  @Get()
  findAll(@Query('q') query: string) {
    return this.templatesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.templatesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post('generate')
  generate(@Body() body: { role: string }) {
    return this.templatesService.generateQuestions(body.role);
  }
}
