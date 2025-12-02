import { PrismaClient, AppStatus, InterviewStatus, OfferStatus, ESignStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing operations (interviews, offers)...');

  const interviewer = await prisma.user.findFirst({ where: { email: 'tech@ats.ai' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@ats.ai' } });
  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@ats.ai' } });
  const offerTemplate = await prisma.documentTemplate.findFirst({ where: { type: 'OFFER' } });

  // 1. Get David (Interview Phase)
  const davidApp = await prisma.application.findFirst({
    where: { candidate: { email: 'david.bernard@example.com' } },
    include: { candidate: true }
  });

  if (davidApp && interviewer) {
    console.log('   Creating completed interview for David...');

    // Create completed interview with scorecard
    await prisma.interview.create({
      data: {
        applicationId: davidApp.id,
        interviewerId: interviewer.id,
        status: InterviewStatus.COMPLETED,
        scheduledAt: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
        aiNotes: `### AI Transcript Summary\n- Candidate demonstrated strong knowledge of React hooks.\n- Correctly identified performance bottlenecks in the code challenge.\n- Communication was clear and concise.`,
        scorecard: {
          "React Knowledge": 4,
          "Problem Solving": 5,
          "Communication": 4
        },
        scorecardType: 'AI',
        humanNotes: 'I agree with the AI. Strong candidate, ready for next round.',
        humanScorecard: { "Decision": "PASS" }
      }
    });

    // Create upcoming interview (Culture Fit)
    await prisma.interview.create({
      data: {
        applicationId: davidApp.id,
        interviewerId: manager!.id,
        status: InterviewStatus.CONFIRMED,
        scheduledAt: new Date(new Date().setDate(new Date().getDate() + 1)), // Tomorrow
        confirmedSlot: new Date(new Date().setDate(new Date().getDate() + 1)),
      }
    });
  }

  // 2. Get Emily (Hired) -> Create accepted offer
  const emilyApp = await prisma.application.findFirst({
    where: { candidate: { email: 'emilie.dubois@example.com' } }
  });

  if (emilyApp && manager && offerTemplate) {
    console.log('   Creating accepted offer for Emily...');
    await prisma.offer.create({
      data: {
        applicationId: emilyApp.id,
        createdById: manager.id,
        status: OfferStatus.ACCEPTED,
        templateId: offerTemplate.id,
        salary: 85000,
        currency: 'GBP',
        equity: '0.2%',
        startDate: new Date('2025-01-01'),
        offerLetter: '<html><body><h1>Offer Accepted</h1></body></html>',
        generatedOfferUrl: '/uploads/mock-offer-emily.pdf',
        eSignStatus: ESignStatus.SIGNED,
        eSignProviderId: 'mock-docusign-id-123',
        signedDocumentUrl: '/uploads/signed-offer-emily.pdf'
      }
    });
  }

  // 3. Create candidate with "Offer Sent" status
  const fiona = await prisma.candidate.create({
    data: {
      firstName: 'Fiona', lastName: 'Leroy', email: 'fiona.leroy@example.com',
      location: 'Remote', experience: 5,
      resumeText: 'Fullstack Developer...',
      resumeS3Key: 'uploads/fiona.pdf'
    }
  });

  const job = await prisma.job.findFirst({ where: { title: { contains: 'React' } } });

  if (job) {
    const fionaApp = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: fiona.id,
        status: AppStatus.OFFER,
        aiScore: 0.90,
        ownerId: recruiter?.id
      }
    });

    console.log('   Creating sent offer for Fiona...');
    await prisma.offer.create({
      data: {
        applicationId: fionaApp.id,
        createdById: recruiter!.id,
        status: OfferStatus.SENT,
        templateId: offerTemplate?.id,
        salary: 75000,
        currency: 'GBP',
        equity: '0.1%',
        startDate: new Date('2025-02-01'),
        offerLetter: '<p>Offer pending response</p>',
        generatedOfferUrl: '/uploads/mock-offer-fiona.pdf',
        eSignStatus: ESignStatus.SENT,
        eSignProviderId: 'mock-docusign-id-456'
      }
    });

    // Add comments
    await prisma.comment.create({
      data: {
        content: "Offer sent today via email. Expecting response by Friday.",
        applicationId: fionaApp.id,
        authorId: recruiter!.id
      }
    });
  }

  console.log('✅ Operations initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });