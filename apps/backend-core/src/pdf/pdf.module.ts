import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';

import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfProcessor } from './pdf.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf',
    }),
    PrismaModule,
  ],
  providers: [PdfService, PdfProcessor],
  exports: [PdfService, BullModule],
})
export class PdfModule { }
