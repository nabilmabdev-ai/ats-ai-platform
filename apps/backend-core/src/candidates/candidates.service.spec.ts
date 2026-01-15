import { Test, TestingModule } from '@nestjs/testing';
import { CandidatesService } from './candidates.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { SearchService } from '../search/search.service';
import { getQueueToken } from '@nestjs/bullmq';
import { DeduplicationService } from '../deduplication/deduplication.service';

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
    findFirst: jest.fn(),
  },
  interview: {
    updateMany: jest.fn(),
  },
  comment: {
    updateMany: jest.fn(),
    create: jest.fn(),
  },
  offer: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
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
        { provide: DeduplicationService, useValue: { normalizePhone: jest.fn((p) => p) } },
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
          applications: [{ id: 'app2', jobId: 'job1', status: 'INTERVIEW' }],
        });

      // Conflict with lower status
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 'app1',
        status: 'APPLIED',
        offer: null,
      });

      await service.mergeCandidates(primaryId, secondaryId);

      // Should update primary status to INTERVIEW
      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app1' },
        data: expect.objectContaining({ status: 'INTERVIEW' }),
      });
    });

    it('should move offer if primary has none', async () => {
      const primaryId = 'p1';
      const secondaryId = 's1';

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce({ id: primaryId })
        .mockResolvedValueOnce({
          id: secondaryId,
          applications: [{ id: 'app2', jobId: 'job1', status: 'OFFER' }],
        });

      // Conflict with no offer
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 'app1',
        status: 'INTERVIEW',
        offer: null,
      });

      // Secondary has offer
      mockPrismaService.offer.findUnique.mockResolvedValueOnce({
        id: 'offer2',
      });

      await service.mergeCandidates(primaryId, secondaryId);

      // Should move offer2 to app1
      expect(mockPrismaService.offer.update).toHaveBeenCalledWith({
        where: { id: 'offer2' },
        data: { applicationId: 'app1' },
      });
    });

    it('should create a system note on the latest application', async () => {
      const primaryId = 'p1';
      const secondaryId = 's1';

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce({
          id: primaryId,
          firstName: 'Prim',
          lastName: 'Ary',
          email: 'p@test.com',
        })
        .mockResolvedValueOnce({
          id: secondaryId,
          firstName: 'Sec',
          lastName: 'Ond',
          email: 's@test.com',
          applications: [],
        });

      mockPrismaService.application.findUnique.mockResolvedValue(null); // No conflicts

      // Mock finding latest app
      mockPrismaService.application.findFirst.mockResolvedValue({
        id: 'latest-app-id',
      });

      // Mock finding admin user
      mockPrismaService.user.findFirst.mockResolvedValue({ id: 'admin-id' });

      await service.mergeCandidates(primaryId, secondaryId);

      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          applicationId: 'latest-app-id',
          authorId: 'admin-id',
          content: expect.stringContaining('System Note'),
        }),
      });
    });

    it('should deep merge application data (parsing, metadata) when conflict occurs', async () => {
      const primaryId = 'p1';
      const secondaryId = 's1';

      mockPrismaService.candidate.findUnique
        .mockResolvedValueOnce({ id: primaryId })
        .mockResolvedValueOnce({
          id: secondaryId,
          applications: [
            {
              id: 'app2',
              jobId: 'job1',
              status: 'APPLIED',
              aiParsingData: { skills: ['Node.js'] },
              aiSummary: 'Secondary Summary',
              coverLetterS3Key: 'secondary_cl.pdf',
              tags: ['tag2'],
              knockoutAnswers: { q2: 'a2' },
              metadata: { source: 'linkedin' },
            },
          ],
        });

      // Conflict exists
      mockPrismaService.application.findUnique.mockResolvedValueOnce({
        id: 'app1',
        status: 'APPLIED',
        aiParsingData: { skills: ['React'] },
        aiSummary: 'Primary Summary',
        coverLetterS3Key: null,
        tags: ['tag1'],
        knockoutAnswers: { q1: 'a1' },
        metadata: { referrer: 'friend' },
      });

      await service.mergeCandidates(primaryId, secondaryId);

      // Should update primary app with merged data
      expect(mockPrismaService.application.update).toHaveBeenCalledWith({
        where: { id: 'app1' },
        data: expect.objectContaining({
          aiParsingData: { skills: ['React', 'Node.js'] }, // Array merge logic might vary, but for object it should be merged
          // Actually for JSON, if we implement deep merge, it depends.
          // Let's assume my implementation will do a shallow merge of top-level keys or specific array logic.
          // For this test, let's assume we implement Object.assign or similar for JSON fields.
          // But wait, in the plan I said "Primary takes precedence".
          // So if keys collide, Primary wins. If keys are new, they are added.
          // For arrays like tags, we want union.

          coverLetterS3Key: 'secondary_cl.pdf', // Primary was null

          tags: expect.arrayContaining(['tag1', 'tag2']),

          aiSummary: expect.stringContaining(
            'Primary Summary\n\n--- Merged from Duplicate ---\n\nSecondary Summary',
          ),
        }),
      });
    });
  });
});
