import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { UploadsModule } from '../src/uploads/uploads.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('UploadsController (e2e)', () => {
    let app: INestApplication;
    const validUserId = 'valid-user-id';
    const testFileName = 'test-secure-e2e.txt';
    const testFileContent = 'This is a secure file.';
    const uploadDir = path.join(process.cwd(), 'uploads');
    const testFilePath = path.join(uploadDir, testFileName);

    const mockPrismaService = {
        user: {
            findUnique: jest.fn().mockImplementation(({ where }) => {
                if (where.id === validUserId) {
                    return Promise.resolve({ id: validUserId, email: 'test@example.com' });
                }
                return Promise.resolve(null);
            }),
        },
    };

    beforeAll(async () => {
        // Ensure uploads dir exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        // Create test file
        fs.writeFileSync(testFilePath, testFileContent);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [UploadsModule],
        })
            .overrideProvider(PrismaService)
            .useValue(mockPrismaService)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        // Cleanup
        if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
        }
        await app.close();
    });

    it('/uploads/:filename (GET) - Fail without header', () => {
        return request(app.getHttpServer())
            .get(`/uploads/${testFileName}`)
            .expect(401);
    });

    it('/uploads/:filename (GET) - Fail with invalid user id', () => {
        return request(app.getHttpServer())
            .get(`/uploads/${testFileName}`)
            .set('x-user-id', 'invalid-id')
            .expect(401);
    });

    it('/uploads/:filename (GET) - Success with valid user id', () => {
        return request(app.getHttpServer())
            .get(`/uploads/${testFileName}`)
            .set('x-user-id', validUserId)
            .expect(200)
            .expect(testFileContent);
    });

    it('/uploads/:filename (GET) - Fail for non-existent file', () => {
        return request(app.getHttpServer())
            .get(`/uploads/non-existent-file.txt`)
            .set('x-user-id', validUserId)
            .expect(404);
    });
});
