import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../users/dto/create-user.dto';

async function verify() {
  console.log('Initializing test module...');
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UsersService,
      {
        provide: PrismaService,
        useValue: {
          user: {
            create: jest.fn().mockImplementation((args) =>
              Promise.resolve({
                id: 'test-id',
                ...args.data,
                createdAt: new Date(),
              }),
            ),
            update: jest
              .fn()
              .mockImplementation((args) =>
                Promise.resolve({ id: 'test-id', ...args.data }),
              ),
            findUnique: jest.fn(),
          },
        },
      },
    ],
  }).compile();

  const usersService = module.get<UsersService>(UsersService);

  // 1. Test Create with Timezone
  console.log('Testing create with America/New_York...');
  const created = await usersService.create({
    email: 'test@example.com',
    fullName: 'Test User',
    role: Role.RECRUITER,
    availability: {
      timezone: 'America/New_York',
      workHours: { start: 9, end: 17 },
    },
  });

  if ((created.availability as any)?.timezone !== 'America/New_York') {
    console.error(
      '❌ Create Failed: Expected America/New_York, got ' +
        (created.availability as any)?.timezone,
    );
    process.exit(1);
  }
  console.log('✅ Create Success');

  // 2. Test Default Timezone
  console.log('Testing create with default...');
  const defaultUser = await usersService.create({
    email: 'default@example.com',
    fullName: 'Default User',
    role: Role.RECRUITER,
  });

  if ((defaultUser.availability as any)?.timezone !== 'UTC') {
    // My change defaults to UTC
    console.error(
      '❌ Default Failed: Expected UTC, got ' +
        (defaultUser.availability as any)?.timezone,
    );
    process.exit(1);
  }
  console.log('✅ Default Success');

  // 3. Test Update
  console.log('Testing update...');
  const updated = await usersService.update('test-id', {
    availability: {
      timezone: 'Asia/Tokyo',
      workHours: { start: 10, end: 19 },
    },
  });

  // Note: Since I'm mocking, the update return val depends on my mock.
  // The mock returns `...args.data`.
  if ((updated.availability as any)?.timezone !== 'Asia/Tokyo') {
    console.error(
      '❌ Update Failed: Expected Asia/Tokyo, got ' +
        (updated.availability as any)?.timezone,
    );
    process.exit(1);
  }
  console.log('✅ Update Success');
}

verify();
