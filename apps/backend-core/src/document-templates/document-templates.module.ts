import { Module } from '@nestjs/common';
import { DocumentTemplatesService } from './document-templates.service';
import { DocumentTemplatesController } from './document-templates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}
