import { PrismaClient, InterviewStatus, OfferStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing interviews and offers for IO Solutions...');

  const teamlead = await prisma.user.findFirst({ where: { email: 'teamlead@iosolutions.com' } });
  const director = await prisma.user.findFirst({ where: { email: 'director@iosolutions.com' } });

  // 1. INTERVIEW: Karim Berrada (Team Lead Role)
  const karim = await prisma.candidate.findFirst({ where: { lastName: 'Berrada' } });
  const karimApp = await prisma.application.findFirst({ where: { candidateId: karim?.id } });

  if (karimApp && director) {
    await prisma.interview.create({
      data: {
        applicationId: karimApp.id,
        interviewerId: director.id,
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        status: InterviewStatus.CONFIRMED,
      }
    });
  }

  // 2. OFFER: Leila Chraibi (Hired Bilingual Agent)
  const leila = await prisma.candidate.findFirst({ where: { lastName: 'Chraibi' } });
  const leilaApp = await prisma.application.findFirst({ where: { candidateId: leila?.id } });
  const offerTemplate = await prisma.documentTemplate.findFirst({ where: { type: 'OFFER' } });

  if (leilaApp && offerTemplate && director) {
    await prisma.offer.create({
      data: {
        applicationId: leilaApp.id,
        status: OfferStatus.ACCEPTED,
        salary: 6000,
        currency: 'MAD',
        startDate: new Date(Date.now() + 604800000), // Next week
        templateId: offerTemplate.id,
        offerLetter: offerTemplate.content,
        createdById: director.id
      }
    });
  }

  console.log('✅ Interviews and offers initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });