// --- Content from: apps/backend-core/src/email/email.module.ts ---

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService], // Exporting it so ApplicationsModule can use it
})
export class EmailModule {}
