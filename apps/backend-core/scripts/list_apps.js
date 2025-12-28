
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listApps() {
    try {
        const apps = await prisma.application.findMany({
            take: 20,
            include: { candidate: true }
        });
        console.log('Found', apps.length, 'applications');
        apps.forEach(app => {
            console.log('ID:', app.id, 'Candidate:', app.candidate.firstName, 'Resume:', app.candidate.resumeS3Key);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

listApps();
