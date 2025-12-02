import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DocumentTemplatesService } from '../src/document-templates/document-templates.service';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('DocumentTemplatesController (e2e)', () => {
  let app: INestApplication<App>;

  const mockDocumentTemplatesService = {
    findAll: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DocumentTemplatesService)
      .useValue(mockDocumentTemplatesService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/document-templates (GET)', () => {
    return request(app.getHttpServer())
      .get('/document-templates')
      .expect(200)
      .expect([]);
  });
});
