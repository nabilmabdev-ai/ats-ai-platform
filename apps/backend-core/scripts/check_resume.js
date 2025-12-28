
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkResumeKey() {
    try {
        const appId = 'bcb9f147-54b8-4f0b-a0f5-80e799fac0cf';
        const application = await prisma.application.findUnique({
            where: { id: appId },
            include: { candidate: true }
        });

        if (application) {
            console.log('Candidate Name:', application.candidate.firstName, application.candidate.lastName);
            console.log('Resume S3 Key:', `"${application.candidate.resumeS3Key}"`); // Quotes to see whitespace
        } else {
            console.log('Application not found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkResumeKey();
