import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { DocumentTemplatesService } from './document-templates.service';
import { CreateDocumentTemplateDto } from './dto/create-document-template.dto';
import { UpdateDocumentTemplateDto } from './dto/update-document-template.dto';

@Controller('document-templates')
export class DocumentTemplatesController {
  constructor(
    private readonly documentTemplatesService: DocumentTemplatesService,
  ) {}

  @Post()
  create(@Body() createDocumentTemplateDto: CreateDocumentTemplateDto) {
    return this.documentTemplatesService.create(createDocumentTemplateDto);
  }

  @Get()
  findAll(@Query('type') type?: string) {
    return this.documentTemplatesService.findAll(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.documentTemplatesService.findOne(id);
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }
    return template;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentTemplateDto: UpdateDocumentTemplateDto,
  ) {
    return this.documentTemplatesService.update(id, updateDocumentTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentTemplatesService.remove(id);
  }
}
