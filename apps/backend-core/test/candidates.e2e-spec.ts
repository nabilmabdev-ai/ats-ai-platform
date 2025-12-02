import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CandidatesService } from '../src/candidates/candidates.service';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CandidatesController (e2e)', () => {
  let app: INestApplication<App>;

  const mockCandidatesService = {
    search: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CandidatesService)
      .useValue(mockCandidatesService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/candidates/search (GET)', () => {
    return request(app.getHttpServer())
      .get('/candidates/search')
      .expect(200)
      .expect([]);
  });
});
