
import { PrismaClient } from '@prisma/client';
import { InterviewsService } from '../src/interviews/interviews.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/email/email.service';
import { HttpService } from '@nestjs/axios';
import { CalendarService } from '../src/interviews/calendar.service';

// Mock dependencies
const mockEmailService = {
    sendConfirmation: () => Promise.resolve(true),
};
const mockHttpService = {};
const mockCalendarService = {};

async function runVerification() {
    const prisma = new PrismaClient();

    // Setup NestJS module to get the service
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            InterviewsService,
            { provide: PrismaService, useValue: prisma },
            { provide: EmailService, useValue: mockEmailService },
            { provide: HttpService, useValue: mockHttpService },
            { provide: CalendarService, useValue: mockCalendarService },
        ],
    }).compile();

    const service = module.get<InterviewsService>(InterviewsService);

    console.log('--- Starting Verification ---');

    try {
        // 1. Setup Data
        // Create a dummy interviewer
        const interviewer = await prisma.user.create({
            data: {
                email: `interviewer_${Date.now()}@test.com`,
                passwordHash: 'hash',
                role: 'INTERVIEWER',
                fullName: 'Test Interviewer',
            },
        });

        // Create a dummy job
        const job = await prisma.job.create({
            data: {
                title: 'Test Job',
                status: 'PUBLISHED',
            },
        });

        // Create a dummy candidate
        const candidate = await prisma.candidate.create({
            data: {
                email: `candidate_${Date.now()}@test.com`,
                firstName: 'Test',
                lastName: 'Candidate',
            },
        });

        // Create an application
        const app = await prisma.application.create({
            data: {
                jobId: job.id,
                candidateId: candidate.id,
                status: 'INTERVIEW',
            },
        });

        // Create TWO pending interviews for the SAME slot
        const slotTime = new Date();
        slotTime.setMilliseconds(0);
        slotTime.setSeconds(0);
        // Future date
        slotTime.setDate(slotTime.getDate() + 1);

        const interview1 = await prisma.interview.create({
            data: {
                applicationId: app.id,
                interviewerId: interviewer.id,
                status: 'PENDING',
                bookingToken: `token1_${Date.now()}`,
            },
        });

        const interview2 = await prisma.interview.create({
            data: {
                applicationId: app.id, // Same app for simplicity, or different app
                interviewerId: interviewer.id,
                status: 'PENDING',
                bookingToken: `token2_${Date.now()}`,
            },
        });

        console.log(`Created pending interviews: ${interview1.id}, ${interview2.id}`);

        // 2. Execute Concurrent Booking
        console.log('Attempting concurrent booking...');

        const promise1 = service.confirmBooking(interview1.bookingToken!, slotTime.toISOString())
            .then(() => ({ id: interview1.id, status: 'fulfilled' }))
            .catch((e) => ({ id: interview1.id, status: 'rejected', reason: e.message }));

        const promise2 = service.confirmBooking(interview2.bookingToken!, slotTime.toISOString())
            .then(() => ({ id: interview2.id, status: 'fulfilled' }))
            .catch((e) => ({ id: interview2.id, status: 'rejected', reason: e.message }));

        const results = await Promise.all([promise1, promise2]);

        console.log('Results:', results);

        // 3. Verify Results
        const fulfilled = results.filter(r => r.status === 'fulfilled');
        const rejected = results.filter(r => r.status === 'rejected');

        if (fulfilled.length === 1 && rejected.length === 1) {
            console.log('SUCCESS: Exactly one booking succeeded and one failed.');
            const rejectedReason = (rejected[0] as any).reason;
            if (rejectedReason && rejectedReason.includes('already been booked')) {
                console.log('SUCCESS: Error message is correct.');
            } else {
                console.warn('WARNING: Error message might be unexpected:', rejectedReason);
            }
        } else {
            console.error('FAILURE: Unexpected outcome.', results);
            // Don't exit here, let cleanup run
        }

        await prisma.interview.deleteMany({ where: { id: { in: [interview1.id, interview2.id] } } });
        await prisma.application.delete({ where: { id: app.id } });
        await prisma.candidate.delete({ where: { id: candidate.id } });
        await prisma.job.delete({ where: { id: job.id } });
        await prisma.user.delete({ where: { id: interviewer.id } });

    } catch (error) {
        console.error('Test Script Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runVerification();
