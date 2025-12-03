import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ApplicationsService } from '../src/applications/applications.service';
import { EmailService } from '../src/email/email.service';
import { InterviewsService } from '../src/interviews/interviews.service';
import { App } from 'supertest/types';

describe('ApplicationsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  const mockPrismaService = {
    application: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockEmailService = {
    sendInterviewInvite: jest.fn(),
    sendRejectionEmail: jest.fn(),
  };

  const mockInterviewsService = {
    createInvite: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .overrideProvider(InterviewsService)
      .useValue(mockInterviewsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  it('/applications (GET)', () => {
    return request(app.getHttpServer())
      .get('/applications')
      .expect(200)
      .expect([]);
  });
});
