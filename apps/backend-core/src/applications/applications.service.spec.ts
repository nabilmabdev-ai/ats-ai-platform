
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { InterviewsService } from '../interviews/interviews.service';
import { OffersService } from '../offers/offers.service';
import { EmailService } from '../email/email.service';
import { DeduplicationService } from '../deduplication/deduplication.service';
import { getQueueToken } from '@nestjs/bullmq';
import { AppStatus, Role } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

const mockPrismaService = {
  application: {
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  applicationHistory: {
    create: jest.fn(),
  },
  comment: {
    create: jest.fn(),
  }
};

const mockInterviewsService = {
  findByApp: jest.fn(),
  updateStatus: jest.fn(),
  triggerInvite: jest.fn(),
};

const mockOffersService = {
  findByApp: jest.fn(),
  updateStatus: jest.fn(),
};

const mockEmailService = {};
const mockDeduplicationService = {};
const mockQueue = { add: jest.fn() };

describe('ApplicationsService - Status Transitions', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InterviewsService, useValue: mockInterviewsService },
        { provide: OffersService, useValue: mockOffersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: DeduplicationService, useValue: mockDeduplicationService },
        { provide: getQueueToken('applications'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    jest.clearAllMocks();
  });

  describe('updateStatus', () => {
    it('should allow forward move without restriction', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'APPLIED', jobId: 'job1', candidateId: 'cand1'
      });
      mockPrismaService.application.update.mockResolvedValue({ id: '1', status: 'SCREENING' });

      await service.updateStatus('1', AppStatus.SCREENING);

      expect(mockPrismaService.application.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: 'SCREENING' }
      }));
    });

    it('should BLOCK backward move for INTERVIEWER', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'INTERVIEW', jobId: 'job1', candidateId: 'cand1'
      });

      await expect(
        service.updateStatus('1', AppStatus.SCREENING, 'reason', 'notes', Role.INTERVIEWER, 'user1')
      ).rejects.toThrow(ConflictException);
    });

    it('should ALLOW backward move for RECRUITER', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'INTERVIEW', jobId: 'job1', candidateId: 'cand1'
      });
      mockInterviewsService.findByApp.mockResolvedValue([]);
      mockPrismaService.application.update.mockResolvedValue({ id: '1', status: 'SCREENING' });

      await service.updateStatus('1', AppStatus.SCREENING, 'reason', 'notes', Role.RECRUITER, 'user1');

      expect(mockPrismaService.application.update).toHaveBeenCalled();
    });

    it('should BLOCK move from HIRED if not ADMIN', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'HIRED', jobId: 'job1', candidateId: 'cand1'
      });

      await expect(
        service.updateStatus('1', AppStatus.OFFER, 'reason', 'notes', Role.RECRUITER, 'user1')
      ).rejects.toThrow('Only Admins can reverse a HIRED decision');
    });

    it('should ALLOW move from HIRED if ADMIN', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'HIRED', jobId: 'job1', candidateId: 'cand1'
      });
      mockOffersService.findByApp.mockResolvedValue({ id: 'offer1', status: 'ACCEPTED' });
      mockPrismaService.application.update.mockResolvedValue({ id: '1', status: 'OFFER' });

      await service.updateStatus('1', AppStatus.OFFER, 'reason', 'notes', Role.ADMIN, 'user1');

      expect(mockPrismaService.application.update).toHaveBeenCalled();
    });

    it('should trigger side effects: Cancel Interview', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'INTERVIEW', jobId: 'job1', candidateId: 'cand1'
      });
      mockInterviewsService.findByApp.mockResolvedValue([
        { id: 'int1', status: 'PENDING' },
        { id: 'int2', status: 'COMPLETED' }
      ]);
      mockPrismaService.application.update.mockResolvedValue({ id: '1', status: 'SCREENING' });

      await service.updateStatus('1', AppStatus.SCREENING, 'reason', 'notes', Role.ADMIN, 'user1');

      // Should cancel PENDING but ignore COMPLETED? Logic says cancel PENDING/CONFIRMED
      expect(mockInterviewsService.updateStatus).toHaveBeenCalledWith('int1', 'CANCELLED');
      expect(mockInterviewsService.updateStatus).not.toHaveBeenCalledWith('int2', 'CANCELLED');
    });

    it('should trigger side effects: Void Offer', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: '1', status: 'OFFER', jobId: 'job1', candidateId: 'cand1'
      });
      mockOffersService.findByApp.mockResolvedValue({ id: 'offer1', status: 'DRAFT' });
      mockInterviewsService.findByApp.mockResolvedValue([]);
      mockPrismaService.application.update.mockResolvedValue({ id: '1', status: 'INTERVIEW' });

      await service.updateStatus('1', AppStatus.INTERVIEW, 'reason', 'notes', Role.ADMIN, 'user1');

      expect(mockOffersService.updateStatus).toHaveBeenCalledWith('offer1', 'FAILED');
    });
  });
});
