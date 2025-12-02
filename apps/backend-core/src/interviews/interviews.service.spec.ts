import { Test, TestingModule } from '@nestjs/testing';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { EmailService } from '../email/email.service';
import { CalendarService } from './calendar.service';
import { BadRequestException } from '@nestjs/common';

describe('InterviewsService', () => {
    let service: InterviewsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        $transaction: jest.fn((callback) => callback(mockPrismaService)),
        interview: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findMany: jest.fn(),
        },
        user: {
            findFirst: jest.fn(),
        },
        application: {
            findUnique: jest.fn(),
        },
    };

    const mockHttpService = {
        post: jest.fn(),
    };

    const mockEmailService = {
        sendConfirmation: jest.fn(),
    };

    const mockCalendarService = {
        getFreeSlots: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InterviewsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: HttpService, useValue: mockHttpService },
                { provide: EmailService, useValue: mockEmailService },
                { provide: CalendarService, useValue: mockCalendarService },
            ],
        }).compile();

        service = module.get<InterviewsService>(InterviewsService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('confirmBooking', () => {
        const token = 'valid-token';
        const slotTime = '2023-10-27T10:00:00.000Z';
        const interviewId = 'interview-1';
        const interviewerId = 'interviewer-1';

        const mockInterview = {
            id: interviewId,
            bookingToken: token,
            status: 'PENDING',
            interviewerId: interviewerId,
            application: {
                candidate: {
                    firstName: 'John',
                    email: 'john@example.com',
                },
            },
        };

        it('should confirm booking if no conflict exists', async () => {
            mockPrismaService.interview.findUnique.mockResolvedValue(mockInterview);
            // Mock findFirst to return null (no conflict)
            mockPrismaService.interview.findFirst.mockResolvedValue(null);
            mockPrismaService.interview.update.mockResolvedValue({
                ...mockInterview,
                status: 'CONFIRMED',
            });

            await service.confirmBooking(token, slotTime);

            expect(prisma.interview.findFirst).toHaveBeenCalledWith({
                where: {
                    interviewerId: interviewerId,
                    status: 'CONFIRMED',
                    scheduledAt: new Date(slotTime),
                },
            });
            expect(prisma.interview.update).toHaveBeenCalled();
        });

        it('should throw BadRequestException if conflict exists', async () => {
            mockPrismaService.interview.findUnique.mockResolvedValue(mockInterview);
            // Mock findFirst to return a conflicting interview
            mockPrismaService.interview.findFirst.mockResolvedValue({
                id: 'conflict-interview',
                status: 'CONFIRMED',
            });

            await expect(service.confirmBooking(token, slotTime)).rejects.toThrow(
                BadRequestException,
            );

            expect(prisma.interview.findFirst).toHaveBeenCalledWith({
                where: {
                    interviewerId: interviewerId,
                    status: 'CONFIRMED',
                    scheduledAt: new Date(slotTime),
                },
            });
            expect(prisma.interview.update).not.toHaveBeenCalled();
        });
    });

    describe('createInvite', () => {
        const applicationId = 'app-1';
        const ownerId = 'owner-1';
        const hiringManagerId = 'hm-1';
        const recruiterId = 'recruiter-1';

        const mockApp = {
            id: applicationId,
            ownerId: null,
            job: {
                hiringManagerId: null,
            },
        };

        it('should assign to application owner if present', async () => {
            mockPrismaService.interview.findFirst.mockResolvedValue(null); // No existing invite
            mockPrismaService.application.findUnique.mockResolvedValue({
                ...mockApp,
                ownerId: ownerId,
            });
            mockPrismaService.interview.create.mockResolvedValue({
                id: 'invite-1',
                interviewerId: ownerId,
            });

            await service.createInvite(applicationId);

            expect(prisma.interview.create).toHaveBeenCalledWith({
                data: {
                    applicationId,
                    interviewerId: ownerId,
                    status: 'PENDING',
                },
            });
        });

        it('should assign to hiring manager if owner is missing', async () => {
            mockPrismaService.interview.findFirst.mockResolvedValue(null);
            mockPrismaService.application.findUnique.mockResolvedValue({
                ...mockApp,
                job: { hiringManagerId: hiringManagerId },
            });
            mockPrismaService.interview.create.mockResolvedValue({
                id: 'invite-1',
                interviewerId: hiringManagerId,
            });

            await service.createInvite(applicationId);

            expect(prisma.interview.create).toHaveBeenCalledWith({
                data: {
                    applicationId,
                    interviewerId: hiringManagerId,
                    status: 'PENDING',
                },
            });
        });

        it('should fallback to recruiter if neither owner nor hiring manager is present', async () => {
            mockPrismaService.interview.findFirst.mockResolvedValue(null);
            mockPrismaService.application.findUnique.mockResolvedValue(mockApp);
            mockPrismaService.user.findFirst.mockResolvedValue({ id: recruiterId });
            mockPrismaService.interview.create.mockResolvedValue({
                id: 'invite-1',
                interviewerId: recruiterId,
            });

            await service.createInvite(applicationId);

            expect(prisma.interview.create).toHaveBeenCalledWith({
                data: {
                    applicationId,
                    interviewerId: recruiterId,
                    status: 'PENDING',
                },
            });
        });

        it('should throw NotFoundException if no interviewer found', async () => {
            mockPrismaService.interview.findFirst.mockResolvedValue(null);
            mockPrismaService.application.findUnique.mockResolvedValue(mockApp);
            mockPrismaService.user.findFirst.mockResolvedValue(null); // No recruiter

            await expect(service.createInvite(applicationId)).rejects.toThrow(
                'No interviewer configured in system',
            );
        });
    });
});
