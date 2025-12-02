import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InterviewsService } from '../interviews/interviews.service';

describe('ApplicationsService', () => {
    let service: ApplicationsService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        job: {
            findUnique: jest.fn(),
        },
        candidate: {
            upsert: jest.fn(),
        },
        application: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockEmailService = {
        sendRejectionEmail: jest.fn(),
    };

    const mockInterviewsService = {
        createInvite: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApplicationsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EmailService, useValue: mockEmailService },
                { provide: InterviewsService, useValue: mockInterviewsService },
            ],
        }).compile();

        service = module.get<ApplicationsService>(ApplicationsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should auto-reject if knockout answer is incorrect', async () => {
            const jobId = 'job-1';
            const email = 'test@example.com';
            const name = 'John Doe';
            const filePath = 'path/to/resume.pdf';

            const job = {
                id: jobId,
                knockoutQuestions: [
                    { id: 'q1', text: 'Are you authorized?', correctAnswer: 'Yes' },
                ],
                screeningTemplate: null,
            };

            mockPrismaService.job.findUnique.mockResolvedValue(job);
            mockPrismaService.candidate.upsert.mockResolvedValue({ id: 'candidate-1' });
            mockPrismaService.application.findUnique.mockResolvedValue(null);
            mockPrismaService.application.create.mockImplementation((args) => args.data);

            const result = await service.create(
                {
                    jobId,
                    email,
                    name,
                    knockoutAnswers: { q1: 'no' }, // Incorrect answer
                },
                filePath,
            );

            expect(result.isAutoRejected).toBe(true);
            expect(result.status).toBe('REJECTED');
        });

        it('should NOT auto-reject if knockout answer matches correct answer (normalized)', async () => {
            const jobId = 'job-1';
            const email = 'test@example.com';
            const name = 'John Doe';
            const filePath = 'path/to/resume.pdf';

            const job = {
                id: jobId,
                knockoutQuestions: [
                    { id: 'q1', text: 'Are you authorized?', correctAnswer: 'Yes' },
                ],
                screeningTemplate: null,
            };

            mockPrismaService.job.findUnique.mockResolvedValue(job);
            mockPrismaService.candidate.upsert.mockResolvedValue({ id: 'candidate-1' });
            mockPrismaService.application.findUnique.mockResolvedValue(null);
            mockPrismaService.application.create.mockImplementation((args) => args.data);

            const result = await service.create(
                {
                    jobId,
                    email,
                    name,
                    knockoutAnswers: { q1: '  yes  ' }, // Whitespace and lowercase
                },
                filePath,
            );

            expect(result.isAutoRejected).toBe(false);
            expect(result.status).not.toBe('REJECTED');
        });
    });
});
