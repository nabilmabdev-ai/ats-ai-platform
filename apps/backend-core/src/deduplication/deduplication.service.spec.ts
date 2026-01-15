import { Test, TestingModule } from '@nestjs/testing';
import { DeduplicationService } from './deduplication.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DeduplicationService', () => {
    let service: DeduplicationService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        candidate: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            findFirst: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeduplicationService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        service = module.get<DeduplicationService>(DeduplicationService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findMatch', () => {
        it('should find strict match by email', async () => {
            mockPrismaService.candidate.findUnique.mockResolvedValue({ id: 'c1', email: 'test@example.com' });

            const result = await service.findMatch({ email: 'test@example.com' });

            expect(result.matchFound).toBe(true);
            expect(result.confidence).toBe('EXACT');
            expect(result.strategyUsed).toBe('EMAIL');
            expect(result.candidateId).toBe('c1');
        });

        it('should find fuzzy match by name + phone', async () => {
            mockPrismaService.candidate.findUnique.mockResolvedValue(null);

            // Mock findMany result with RAW phone
            const dbCandidate = {
                id: 'c2',
                firstName: 'John',
                lastName: 'Doe',
                phone: '(123) 456-7890', // Raw format in DB
                linkedinUrl: null
            };

            mockPrismaService.candidate.findMany.mockResolvedValue([dbCandidate]);

            const result = await service.findMatch({
                name: 'John Doe',
                phone: '1234567890',  // Input already somewhat clean
            });

            expect(result.matchFound).toBe(true);
            expect(result.confidence).toBe('HIGH');
            expect(result.strategyUsed).toBe('PHONE_NAME');
            expect(result.candidateId).toBe('c2');
        });

        it('should find fuzzy match with different phone formats (E.164)', async () => {
            mockPrismaService.candidate.findUnique.mockResolvedValue(null);

            // DB has formatted E.164 or US format
            const dbCandidate = {
                id: 'c3',
                firstName: 'Alice',
                lastName: 'Smith',
                phone: '+14155552671', // E.164 in DB
                linkedinUrl: null
            };

            mockPrismaService.candidate.findMany.mockResolvedValue([dbCandidate]);

            // Input is local US format
            const result = await service.findMatch({
                name: 'Alice Smith',
                phone: '(415) 555-2671',
            });

            expect(result.matchFound).toBe(true);
            expect(result.candidateId).toBe('c3');
        });

        it('should find match by LinkedIn URL', async () => {
            // Mock strict match fail
            mockPrismaService.candidate.findUnique.mockResolvedValue(null);

            // Mock findFirst for LinkedIn
            mockPrismaService.candidate.findFirst.mockResolvedValue({
                id: 'c-linkedin',
                linkedinUrl: 'https://linkedin.com/in/johndoe'
            });

            const result = await service.findMatch({
                linkedinUrl: 'https://linkedin.com/in/johndoe',
                name: 'John Doe'
            });

            expect(result.matchFound).toBe(true);
            expect(result.strategyUsed).toBe('LINKEDIN');
            expect(result.candidateId).toBe('c-linkedin');
        });

        it('should return no match if strict and fuzzy fail', async () => {
            mockPrismaService.candidate.findUnique.mockResolvedValue(null);
            mockPrismaService.candidate.findMany.mockResolvedValue([]);

            const result = await service.findMatch({
                email: 'new@example.com',
                name: 'New User',
                phone: '0000000000',
            });

            expect(result.matchFound).toBe(false);
        });
    });
});
