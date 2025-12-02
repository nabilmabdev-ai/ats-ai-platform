import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'applications',
    }),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
})
export class CandidatesModule { }
