import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { PdfModule } from '../pdf/pdf.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, EmailModule, PdfModule, NotificationsModule],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService], // Export OffersService
})
export class OffersModule { }
