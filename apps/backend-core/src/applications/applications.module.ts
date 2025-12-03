// --- Content from: apps/backend-core/src/applications/applications.module.ts ---

import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { EmailModule } from '../email/email.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { BullModule } from '@nestjs/bullmq';
import { ApplicationsProcessor } from './applications.processor';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    InterviewsModule,
    BullModule.registerQueue({
      name: 'applications',
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    SearchModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsProcessor],
})
export class ApplicationsModule {}
