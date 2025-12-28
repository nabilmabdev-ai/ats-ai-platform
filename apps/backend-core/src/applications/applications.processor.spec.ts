import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsProcessor } from './applications.processor';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { EmailService } from '../email/email.service';
import { Job } from 'bullmq';
import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';

jest.mock('axios');
jest.mock('form-data');

describe('ApplicationsProcessor', () => {
  let processor: ApplicationsProcessor;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsProcessor,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            candidate: {
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: SearchService,
          useValue: {
            indexCandidate: jest.fn(),
            deleteCandidate: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendParsingErrorEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ApplicationsProcessor>(ApplicationsProcessor);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should stream file from URL to AI service', async () => {
    const mockJob = {
      name: 'process-application',
      data: {
        applicationId: 'app-1',
        filePath: 'http://example.com/resume.pdf',
        jobId: 'job-1',
      },
    } as Job;

    const mockApplication = {
      id: 'app-1',
      candidateId: 'cand-1',
      job: { screeningTemplate: null },
      candidate: { firstName: 'John', lastName: 'Doe' },
    };

    (prismaService.application.findUnique as jest.Mock).mockResolvedValue(
      mockApplication,
    );
    (prismaService.candidate.findUnique as jest.Mock).mockResolvedValue(
      mockApplication.candidate,
    );

    // Mock axios.get to return a stream
    const mockStream = new Readable();
    mockStream.push('dummy pdf content');
    mockStream.push(null);
    (axios.get as jest.Mock).mockResolvedValue({
      data: mockStream,
      status: 200,
    });

    // Mock axios.post for AI service
    (axios.post as jest.Mock).mockResolvedValue({
      data: { skills: [], raw_text: 'parsed text' },
    });

    // Mock FormData
    const mockFormDataInstance = {
      append: jest.fn(),
      getHeaders: jest
        .fn()
        .mockReturnValue({ 'content-type': 'multipart/form-data' }),
    };
    (FormData as unknown as jest.Mock).mockImplementation(
      () => mockFormDataInstance,
    );

    await processor.process(mockJob);

    // Verify axios.get was called with stream responseType
    expect(axios.get).toHaveBeenCalledWith('http://example.com/resume.pdf', {
      responseType: 'stream',
    });

    // Verify FormData.append was called with the stream
    expect(mockFormDataInstance.append).toHaveBeenCalledWith(
      'file',
      mockStream,
      expect.objectContaining({
        filename: 'resume.pdf',
        contentType: 'application/pdf',
      }),
    );

    // Verify axios.post was called
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/parse-cv'),
      mockFormDataInstance,
      expect.any(Object),
    );
  });

  it('should process manual candidate resume', async () => {
    const mockJob = {
      name: 'process-candidate-resume',
      data: { candidateId: 'cand-manual', filePath: 'C:/uploads/resume.pdf' },
    } as Job;

    const mockCandidate = {
      id: 'cand-manual',
      firstName: 'Manu',
      lastName: 'Al',
      resumeText: '',
      resumeS3Key: 'C:/uploads/resume.pdf',
    };

    (prismaService.candidate.findUnique as jest.Mock).mockResolvedValue(
      mockCandidate,
    );

    // Mock axios.post for AI service (parse-cv and vectorize)
    (axios.post as jest.Mock).mockResolvedValue({
      data: {
        skills: ['Manual'],
        raw_text: 'Manual content',
        location: 'Remote',
        experience_years: 5,
      },
    });

    // Mock fs (indirectly via stream)
    // Since we refactored to use fs.createReadStream, we need to mock it if we test local file path
    // For simplicity in this test, let's use a URL to trigger the axios.get path which is already mocked above,
    // or just accept that fs read might fail if not mocked.
    // Let's use URL for the test data to reuse stream mock easily, OR better, mock fs.
    // Since we can't easily mock fs here without jest.mock('fs'), let's change filePath to URL.
    mockJob.data.filePath = 'http://example.com/manual-resume.pdf';

    const mockStream = new Readable();
    mockStream.push('manual pdf');
    mockStream.push(null);
    (axios.get as jest.Mock).mockResolvedValue({ data: mockStream });

    await processor.process(mockJob);

    // Verify Candidate Update
    expect(prismaService.candidate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'cand-manual' },
        data: expect.objectContaining({
          resumeText: 'Manual content',
          experience: 5,
        }),
      }),
    );

    // Verify Vectorize Call
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/vectorize-candidate'),
      expect.objectContaining({
        candidate_id: 'cand-manual',
        text: expect.stringContaining('Manual content'),
      }),
    );
  });
});
