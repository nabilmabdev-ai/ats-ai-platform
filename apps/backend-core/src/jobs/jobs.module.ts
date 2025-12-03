import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module'; // <--- Import EmailModule

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 60000,
      maxRedirects: 5,
    }),
    EmailModule, // <--- Add to imports
  ],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
