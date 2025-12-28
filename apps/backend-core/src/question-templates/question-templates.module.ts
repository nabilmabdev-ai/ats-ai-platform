import { Module } from '@nestjs/common';
import { QuestionTemplatesService } from './question-templates.service';
import { QuestionTemplatesController } from './question-templates.controller';
import { PrismaService } from '../prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [QuestionTemplatesController],
  providers: [QuestionTemplatesService, PrismaService],
})
export class QuestionTemplatesModule {}
