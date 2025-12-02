import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { InterviewsService } from '../src/interviews/interviews.service';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('InterviewsController (e2e)', () => {
  let app: INestApplication<App>;

  const mockInterviewsService = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InterviewsService)
      .useValue(mockInterviewsService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/interviews (GET)', () => {
    return request(app.getHttpServer())
      .get('/interviews')
      .expect(200)
      .expect([]);
  });
});
