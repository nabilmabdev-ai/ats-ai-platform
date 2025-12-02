
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const apps = await prisma.application.findMany({
        include: { job: true, candidate: true }
    });
    console.log('Total applications:', apps.length);
    apps.forEach(app => {
        console.log(`App ID: ${app.id}, Job ID: ${app.jobId}, Job Title: ${app.job.title}, Status: ${app.status}, Candidate: ${app.candidate.email}`);
    });

    const jobs = await prisma.job.findMany({
        include: { _count: { select: { applications: true } } }
    });
    console.log('Total jobs:', jobs.length);
    jobs.forEach(job => {
        console.log(`Job ID: ${job.id}, Title: ${job.title}, App Count: ${job._count.applications}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
