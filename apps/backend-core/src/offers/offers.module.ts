import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PrismaModule, EmailModule, PdfModule],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
