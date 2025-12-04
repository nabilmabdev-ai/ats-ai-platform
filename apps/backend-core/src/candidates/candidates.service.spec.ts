import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { SearchService } from '../search/search.service';
import { getQueueToken } from '@nestjs/bullmq';

const mockPrismaService = {
  candidate: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  application: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  interview: {
    updateMany: jest.fn(),
  },
  comment: {
    updateMany: jest.fn(),
  },
  offer: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockPrismaService)),
};

const mockHttpService = {};
const mockSearchService = {};
const mockQueue = { add: jest.fn() };

describe('CandidatesService', () => {
  let service: CandidatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: SearchService, useValue: mockSearchService },
        { provide: getQueueToken('applications'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mergeCandidates', () => {
    it('should merge candidates and move applications', async () => {
      const primaryId = 'primary-id';
      const secondaryId = 'secondary-id';

      const primaryCandidate = {
        id: primaryId,
        email: 'p@test.com',
        resumeS3Key: 'p.pdf',
      };

      const secondaryCandidate = {
        id: secondaryId,
        email: 's@test.com',
        resumeS3Key: 's.pdf',
        applications: [
          { id: 'app1', jobId: 'job1' }, // Conflict
          { id: 'app2', jobId: 'job2' }, // No Conflict
        ],
      };

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce(primaryCandidate)
        .mockResolvedValueOnce(secondaryCandidate);

      // Mock conflict check for app1
      mockPrismaService.application.findUnique
        .mockResolvedValueOnce({ id: 'existing-app-id' }) // Conflict found
        .mockResolvedValueOnce(null); // No conflict for app2

      await service.mergeCandidates(primaryId, secondaryId);

      // Verify Transaction
      expect(mockPrismaService.$transaction).toHaveBeenCalled();

      // Verify Profile Coalesce
      expect(mockPrismaService.candidate.update).toHaveBeenCalledWith({
        where: { id: primaryId },
        data: expect.any(Object),
      });

      // Verify Conflict Handling (app1)
      expect(mockPrismaService.interview.updateMany).toHaveBeenCalledWith({
        where: { applicationId: 'app1' },
        data: { applicationId: 'existing-app-id' },
      });
      expect(mockPrismaService.application.delete).toHaveBeenCalledWith({
        where: { id: 'app1' },
      });

      // Verify No Conflict Handling (app2)
      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app2' },
        data: { candidateId: primaryId },
      });

      // Verify Secondary Deletion
      expect(mockPrismaService.candidate.delete).toHaveBeenCalledWith({
        where: { id: secondaryId },
      });
    });

    it('should upgrade status if secondary is more advanced', async () => {
      const primaryId = 'p1';
      const secondaryId = 's1';

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce({ id: primaryId })
        .mockResolvedValueOnce({
          id: secondaryId,
          applications: [{ id: 'app2', jobId: 'job1', status: 'INTERVIEW' }]
        });

      // Conflict with lower status
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 'app1',
        status: 'APPLIED',
        offer: null
      });

      await service.mergeCandidates(primaryId, secondaryId);

      // Should update primary status to INTERVIEW
      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app1' },
        data: { status: 'INTERVIEW' }
      });
    });

    it('should move offer if primary has none', async () => {
      const primaryId = 'p1';
      const secondaryId = 's1';

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce({ id: primaryId })
        .mockResolvedValueOnce({
          id: secondaryId,
          applications: [{ id: 'app2', jobId: 'job1', status: 'OFFER' }]
        });

      // Conflict with no offer
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 'app1',
        status: 'INTERVIEW',
        offer: null
      });

      // Secondary has offer
      mockPrismaService.offer.findUnique.mockResolvedValueOnce({ id: 'offer2' });

      await service.mergeCandidates(primaryId, secondaryId);

      // Should move offer2 to app1
      expect(mockPrismaService.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer2' },
        data: { applicationId: 'app1' }
      });
    });
  });
});
