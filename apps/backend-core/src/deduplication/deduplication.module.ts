import { Module, forwardRef } from '@nestjs/common';
import { DeduplicationService } from './deduplication.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ScanService } from './scan.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { DeduplicationController } from './deduplication.controller';

@Module({
    imports: [PrismaModule, forwardRef(() => CandidatesModule)],
    providers: [DeduplicationService, ScanService],
    controllers: [DeduplicationController],
    exports: [DeduplicationService, ScanService],
})
export class DeduplicationModule { }
