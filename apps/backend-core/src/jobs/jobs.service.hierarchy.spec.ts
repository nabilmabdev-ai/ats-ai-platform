import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EmailService } from '../email/email.service';
import { of } from 'rxjs';

describe('JobsService - AI Tone Hierarchy', () => {
    let service: JobsService;
    let prisma: PrismaService;
    let httpService: HttpService;

    const mockPrismaService = {
        jobTemplate: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        company: {
            findFirst: jest.fn(),
        },
        legalTemplate: {
            findFirst: jest.fn(),
        },
    };

    const mockHttpService = {
        post: jest.fn(),
    };

    const mockEmailService = {};

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JobsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: HttpService, useValue: mockHttpService },
                { provide: EmailService, useValue: mockEmailService },
            ],
        }).compile();

        service = module.get<JobsService>(JobsService);
        prisma = module.get<PrismaService>(PrismaService);
        httpService = module.get<HttpService>(HttpService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should use Template Override when present', async () => {
        // Setup
        mockPrismaService.jobTemplate.findUnique.mockResolvedValue({
            id: 'tmpl-1',
            structure: 'Markdown',
            aiTone: 'Casual', // Override
        });
        mockPrismaService.company.findFirst.mockResolvedValue({
            aiTone: 'Formal', // Global
        });
        mockHttpService.post.mockReturnValue(of({ data: { description: 'desc' } }));

        // Execute
        await service.generateAiDescription('Title', 'Notes', 'tmpl-1', 'FR');

        // Verify
        expect(mockHttpService.post).toHaveBeenCalledWith(
            expect.stringContaining('/generate-job-description'),
            expect.objectContaining({
                tone: 'Casual',
            }),
        );
    });

    it('should use Global Default when Template has no tone', async () => {
        // Setup
        mockPrismaService.jobTemplate.findUnique.mockResolvedValue({
            id: 'tmpl-1',
            structure: 'Markdown',
            aiTone: null, // No Override
        });
        mockPrismaService.company.findFirst.mockResolvedValue({
            aiTone: 'Energetic', // Global
        });
        mockHttpService.post.mockReturnValue(of({ data: { description: 'desc' } }));

        // Execute
        await service.generateAiDescription('Title', 'Notes', 'tmpl-1', 'FR');

        // Verify
        expect(mockHttpService.post).toHaveBeenCalledWith(
            expect.stringContaining('/generate-job-description'),
            expect.objectContaining({
                tone: 'Energetic',
            }),
        );
    });

    it('should use Fallback "Professional" when neither is set', async () => {
        // Setup
        mockPrismaService.jobTemplate.findUnique.mockResolvedValue({
            id: 'tmpl-1',
            structure: 'Markdown',
            aiTone: null,
        });
        mockPrismaService.company.findFirst.mockResolvedValue({
            aiTone: null,
        });
        mockHttpService.post.mockReturnValue(of({ data: { description: 'desc' } }));

        // Execute
        await service.generateAiDescription('Title', 'Notes', 'tmpl-1', 'FR');

        // Verify
        expect(mockHttpService.post).toHaveBeenCalledWith(
            expect.stringContaining('/generate-job-description'),
            expect.objectContaining({
                tone: 'Professional',
            }),
        );
    });

    it('should use Global Default when no template is provided', async () => {
        // Setup
        mockPrismaService.company.findFirst.mockResolvedValue({
            aiTone: 'Friendly',
        });
        mockHttpService.post.mockReturnValue(of({ data: { description: 'desc' } }));

        // Execute
        await service.generateAiDescription('Title', 'Notes', undefined, 'FR');

        // Verify
        expect(mockHttpService.post).toHaveBeenCalledWith(
            expect.stringContaining('/generate-job-description'),
            expect.objectContaining({
                tone: 'Friendly',
            }),
        );
    });
});
