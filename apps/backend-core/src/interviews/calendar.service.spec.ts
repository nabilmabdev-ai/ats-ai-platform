import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CalendarService', () => {
    let service: CalendarService;
    let prisma: PrismaService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
        },
        interview: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<CalendarService>(CalendarService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getFreeSlots', () => {
        it('should generate slots in candidate timezone', async () => {
            // Interviewer is in Europe/Paris (UTC+1 or +2)
            // Candidate is in America/New_York (UTC-5 or -4)
            // Work hours 9-17 Paris time.

            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'interviewer-1',
                fullName: 'Pierre',
                availability: {
                    timezone: 'Europe/Paris',
                    workHours: { start: 9, end: 17 },
                },
            });

            mockPrisma.interview.findMany.mockResolvedValue([]);

            // Test date: 2025-06-10 (Tuesday) - Summer time
            // Paris is UTC+2
            // NY is UTC-4
            // 9am Paris = 7am UTC = 3am NY
            // 10am Paris = 8am UTC = 4am NY
            // ...
            // 2pm Paris = 12pm UTC = 8am NY
            // 3pm Paris = 1pm UTC = 9am NY (First reasonable slot for candidate?)

            const start = new Date('2025-06-10T00:00:00Z'); // Start of day UTC
            const end = new Date('2025-06-10T23:59:59Z');   // End of day UTC

            const result = await service.getFreeSlots(
                start,
                end,
                'interviewer-1',
                'America/New_York',
            );

            expect(result.interviewerName).toBe('Pierre');
            expect(result.slots.length).toBeGreaterThan(0);

            // Check first slot
            // 9am Paris = 7am UTC
            const firstSlot = result.slots.find(s => s.utc === '2025-06-10T07:00:00.000Z');
            expect(firstSlot).toBeDefined();
            // 7am UTC in NY (UTC-4) is 3am
            expect(firstSlot?.local).toContain('03:00');

            // Check a slot that is 5pm Paris = 3pm UTC = 11am NY
            // Wait, work ends at 17 (5pm), so last slot is 16:00 (4pm)
            // 16:00 Paris = 14:00 UTC
            const lastSlot = result.slots.find(s => s.utc === '2025-06-10T14:00:00.000Z');
            expect(lastSlot).toBeDefined();
            expect(lastSlot?.local).toContain('10:00'); // 14:00 UTC - 4 = 10:00
        });

        it('should exclude weekends', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'interviewer-1',
                fullName: 'Pierre',
                availability: {
                    timezone: 'Europe/Paris',
                    workHours: { start: 9, end: 17 },
                },
            });
            mockPrisma.interview.findMany.mockResolvedValue([]);

            // 2025-06-07 is Saturday, 08 is Sunday
            const start = new Date('2025-06-07T00:00:00Z');
            const end = new Date('2025-06-08T23:59:59Z');

            const result = await service.getFreeSlots(
                start,
                end,
                'interviewer-1',
                'UTC',
            );

            expect(result.slots.length).toBe(0);
        });
    });
});
