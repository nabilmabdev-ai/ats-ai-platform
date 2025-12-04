import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; // <--- Import
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { CandidatesModule } from './candidates/candidates.module';
import { InterviewsModule } from './interviews/interviews.module';
import { EmailModule } from './email/email.module';
import { CommentsModule } from './comments/comments.module';
import { OffersModule } from './offers/offers.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { DocumentTemplatesModule } from './document-templates/document-templates.module';
import { PdfModule } from './pdf/pdf.module';
import { UploadsModule } from './uploads/uploads.module';
import { CompanyModule } from './company/company.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule, // <--- Add here
    JobsModule,
    ApplicationsModule,
    CandidatesModule,
    InterviewsModule,
    EmailModule,
    CommentsModule,
    OffersModule,
    UsersModule,
    TemplatesModule,
    DocumentTemplatesModule,
    PdfModule,
    UploadsModule,
    CompanyModule,
    SearchModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
