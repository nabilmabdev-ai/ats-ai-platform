import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InterviewsModule } from '../interviews/interviews.module'; // Import module exporting CalendarServices or import services directly if exported
import { GoogleCalendarService } from '../interviews/google-calendar.service';
import { OutlookCalendarService } from '../interviews/outlook-calendar.service';
import { TasksController } from './tasks.controller';
import { UserTasksService } from './user-tasks.service';


import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [PrismaModule, InterviewsModule, HttpModule],
    controllers: [TasksController],
    providers: [SyncService, UserTasksService, GoogleCalendarService, OutlookCalendarService],
    exports: [SyncService, UserTasksService],
})
export class TasksModule { }
