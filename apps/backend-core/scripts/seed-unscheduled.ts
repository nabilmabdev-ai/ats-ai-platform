
import { PrismaClient, AppStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Unscheduled Candidates...');

    const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@iosolutions.com' } });
    if (!recruiter) {
        console.error('❌ Recruiter not found. Run seed:foundation first.');
        process.exit(1);
    }

    const jobs = await prisma.job.findMany({ where: { status: 'PUBLISHED' } });
    if (jobs.length === 0) {
        console.error('❌ No published jobs found.');
        process.exit(1);
    }

    const count = 5;
    console.log(`   Generating ${count} candidates who need scheduling...`);

    for (let i = 0; i < count; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });
        const randomJob = faker.helpers.arrayElement(jobs);

        await prisma.candidate.create({
            data: {
                firstName,
                lastName,
                email,
                phone: faker.phone.number(),
                resumeText: faker.lorem.paragraphs(2),
                applications: {
                    create: {
                        jobId: randomJob.id,
                        status: AppStatus.INTERVIEW, // Critical: Status is INTERVIEW
                        aiScore: faker.number.int({ min: 70, max: 95 }),
                        aiSummary: 'Strong candidate, ready for interview.',
                        ownerId: recruiter.id,
                        // Critical: We do NOT create an interview record here
                    }
                }
            }
        });
        process.stdout.write('.');
    }

    console.log('\n✅ Done! Reload the Interviews page to see them in "Smart Schedule".');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
