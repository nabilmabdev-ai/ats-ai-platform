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
import { DeduplicationModule } from '../deduplication/deduplication.module';
import { OffersModule } from '../offers/offers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    InterviewsModule,
    OffersModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'applications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs for debugging
        },
      },
    }),
    MulterModule.register({
      dest: './uploads',
    }),
    SearchModule,
    DeduplicationModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsProcessor],
})
export class ApplicationsModule { }
