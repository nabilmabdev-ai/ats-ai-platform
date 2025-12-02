import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CommentsService } from '../src/comments/comments.service';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CommentsController (e2e)', () => {
  let app: INestApplication<App>;

  const mockCommentsService = {
    findByApplication: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CommentsService)
      .useValue(mockCommentsService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/comments/application/:id (GET)', () => {
    const applicationId = 'some-application-id';
    return request(app.getHttpServer())
      .get(`/comments/application/${applicationId}`)
      .expect(200)
      .expect([]);
  });
});
