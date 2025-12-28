import { Module } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';
import { CsvImportController } from './csv-import.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
    BullModule.registerQueue({
      name: 'applications',
    }),
  ],
  controllers: [CsvImportController],
  providers: [CsvImportService],
})
export class CsvImportModule {}
