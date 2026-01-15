// --- Content from: apps/backend-core/src/interviews/interviews.module.ts ---

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InterviewsService } from './interviews.service';
import { CalendarService } from './calendar.service';
import { InterviewsController } from './interviews.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { GoogleCalendarService } from './google-calendar.service';
import { OutlookCalendarService } from './outlook-calendar.service';

@Module({
  imports: [PrismaModule, HttpModule, EmailModule, NotificationsModule],
  controllers: [InterviewsController],
  providers: [InterviewsService, CalendarService, GoogleCalendarService, OutlookCalendarService],
  exports: [InterviewsService],
})
export class InterviewsModule { }
