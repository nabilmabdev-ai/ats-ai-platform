import { Test, TestingModule } from '@nestjs/testing';
import { CsvImportService } from './csv-import.service';
import { PrismaService } from '../prisma/prisma.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { HttpService } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bullmq';
import * as fs from 'fs';

// Mock dependencies
const mockPrismaService = {
    importBatch: {
        create: jest.fn().mockResolvedValue({ id: 'batch-1' }),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ status: 'PROCESSING' }),
    },
    job: {
        findFirst: jest.fn().mockResolvedValue({ id: 'job-1' }),
    },
    candidate: {
        create: jest.fn().mockResolvedValue({ id: 'candidate-1' }),
        update: jest.fn().mockResolvedValue({ id: 'candidate-1' }),
    },
    application: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'app-1' }),
        update: jest.fn().mockResolvedValue({}),
    },
};

const mockQueue = {
    add: jest.fn(),
};

const mockHttpService = {
    head: jest.fn(),
};

const mockDeduplicationService = {
    findMatch: jest.fn().mockResolvedValue({ matchFound: false }),
};

describe('CsvImportService Limit Repro', () => {
    let service: CsvImportService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CsvImportService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: DeduplicationService, useValue: mockDeduplicationService },
                { provide: HttpService, useValue: mockHttpService },
                { provide: getQueueToken('applications'), useValue: mockQueue },
            ],
        }).compile();

        service = module.get<CsvImportService>(CsvImportService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (fs.existsSync('test-limit.csv')) fs.unlinkSync('test-limit.csv');
    });

    it('should stop processing after 10 valid candidates', async () => {
        // Generate a CSV with 20 valid candidates
        const headers = 'email,firstname,lastname,countrycity,phone,jobtitle';
        const rows = [];
        for (let i = 1; i <= 20; i++) {
            rows.push(`test${i}@example.com,John${i},Doe${i},Morocco,2126000000${i < 10 ? '0' + i : i},Developer`);
        }
        const csvContent = headers + '\n' + rows.join('\n');
        fs.writeFileSync('test-limit.csv', csvContent);

        // Call the private method wrapper or invoke directly if possible.
        // Since importCsv is async "fire and forget" for processing, we need to inspect it.
        // We'll mock processBatch to be awaited or we just call the public method and await a potentially exposed promise?
        // The service implementation calls: this.processBatch(...).catch(...)
        // Typical issue in testing fire-and-forget.
        // I made a small change to the service to just call processBatch directly for this test?
        // No, I can cast it to any and call the private method.

        // We need to setup the batch first via importCsv to get ID, but processBatch is called inside.
        // Use jest.spyOn to 'capture' the promise returned by processBatch if we want to await it?
        // Or just call processBatch directly since it's the logic we want to test.

        await (service as any).processBatch('batch-1', 'test-limit.csv');

        // Expect processedCount to be 10 (tracked via Prismas update calls logs or similar)
        // The 'update' is called periodically and at the end.
        // Let's check the FINAL update call to Prisma.importBatch.update

        // Filter calls to 'update' where data.status = 'COMPLETED'
        const finalUpdateCalls = mockPrismaService.importBatch.update.mock.calls.filter(args => args[0].data?.status === 'COMPLETED');
        expect(finalUpdateCalls.length).toBeGreaterThan(0);
        const finalCallData = finalUpdateCalls[0][0].data;

        console.log('Final Batch Status:', finalCallData);

        // It should have processed exactly 10
        expect(finalCallData.processed).toBe(10);

        // And logically, it should NOT have processed 20
        // We can also count calls to candidate.create
        expect(mockPrismaService.candidate.create).toHaveBeenCalledTimes(10);
    });
});
