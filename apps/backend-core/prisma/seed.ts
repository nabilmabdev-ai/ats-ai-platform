// @ts-nocheck
import { PrismaClient, Job, AppStatus, InterviewStatus, OfferStatus, JobStatus, Role, RemoteType, JobPriority, ScorecardType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 STARTING IO SOLUTIONS MOROCCO SEEDING...');

  // 1. CLEANUP
  console.log('🧹 Cleaning database...');
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  await prisma.comment.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.duplicateGroupMember.deleteMany();
  await prisma.duplicateGroup.deleteMany();
  await prisma.duplicateExclusion.deleteMany();
  await prisma.applicationHistory.deleteMany();
  await prisma.questionTemplate.deleteMany();
  await prisma.jobTemplate.deleteMany();
  await prisma.screeningTemplate.deleteMany();
  await prisma.jobWorkflowTemplate.deleteMany();
  await prisma.documentTemplate.deleteMany(); // Added

  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // 2. COMPANY & USERS
  console.log('🏢 Creating Company: IO Solutions Morocco...');
  await prisma.company.create({
    data: {
      name: 'IO Solutions Morocco',
      description: 'As a global outsourcing player, IO Solutions has been combining leadership, people and processes for over 15 years... The headquarters launches New Customer Support Office in Casablanca, Morocco.',
      enableAutoMerge: true,
      // Branding
      headerImageUrl: 'https://placehold.co/600x100/dc2626/FFF?text=IO+Solutions+Morocco',
      footerImageUrl: 'https://placehold.co/600x50/333333/FFF?text=IOS+Morocco',
      showEmailHeader: true,
      showEmailFooter: true,
      address: 'Zenith Millenium, Lotissement Attawfiq, Sidi Maarouf, Casablanca, Morocco',
      showCompanyAddress: true,
      emailTemplates: {
        "interview_invite": {
          "subject": "Entretien chez IO Solutions Morocco (Zenith Millenium)",
          "body": "Bonjour {{candidate_name}},\n\nNous aimerions vous inviter à un entretien dans nos locaux à Sidi Maarouf (Zenith Millenium).\n\nTransport assuré pour les shifts de nuit.\n\nCordialement,\nL'équipe Recrutement"
        },
        "rejection": {
          "subject": "Mise à jour concernant votre candidature - IO Solutions",
          "body": "Bonjour {{candidate_name}},\n\nMerci pour l'intérêt porté à IO Solutions.\n\nMalheureusement..."
        }
      }
    },
  });

  const passwordHash = await bcrypt.hash('password', 10);

  // Default Availability (Casablanca Time: UTC+1)
  const defaultAvailability = {
    timezone: "Africa/Casablanca",
    schedule: {
      monday: [{ start: "09:00", end: "18:00" }],
      tuesday: [{ start: "09:00", end: "18:00" }],
      wednesday: [{ start: "09:00", end: "18:00" }],
      thursday: [{ start: "09:00", end: "18:00" }],
      friday: [{ start: "09:00", end: "18:00" }]
    }
  };

  const users = await Promise.all([
    prisma.user.create({
      data: { email: 'admin@iosolutions.com', fullName: 'Alice Admin', role: Role.ADMIN, passwordHash, availability: defaultAvailability },
    }),
    prisma.user.create({
      data: { email: 'recruiter@iosolutions.com', fullName: 'Bob Recruiter', role: Role.RECRUITER, passwordHash, availability: defaultAvailability, googleCalendarId: 'primary' },
    }),
    prisma.user.create({
      data: { email: 'manager@iosolutions.com', fullName: 'Carol Manager', role: Role.MANAGER, passwordHash, availability: defaultAvailability },
    }),
    prisma.user.create({
      data: { email: 'dave@iosolutions.com', fullName: 'Dave Interviewer', role: Role.INTERVIEWER, passwordHash, availability: defaultAvailability },
    }),
  ]);
  const recruiter = users[1];
  const hiringManager = users[2];

  // 3. SETTINGS & TEMPLATES
  console.log('⚙️ Creating Settings & Templates...');

  // Screening Templates
  const bilingualScreening = await prisma.screeningTemplate.create({
    data: {
      name: "Bilingual Agent Screening (FR/EN)",
      requiredSkills: ["French (C1)", "English (B2+)", "Customer Service"],
      interviewQuestions: [
        { id: "q1", text: "Pouvez-vous vous présenter en français ?", type: "text" },
        { id: "q2", text: "Can you describe a challenging customer interaction in English?", type: "text" },
        { id: "q3", text: "Êtes-vous disponible pour des shifts rotatifs (soir/nuit) ?", type: "boolean" }
      ]
    }
  });

  // Job Templates
  const csTemplate = await prisma.jobTemplate.create({
    data: {
      name: "Customer Service Specialist (Bilingual)",
      structure: "Standard IO Solutions Job Structure",
      defaultDepartment: "Operations",
      defaultLocation: "Casablanca, Morocco",
      defaultRemoteType: RemoteType.ONSITE,
      defaultScreeningTemplateId: bilingualScreening.id,
      aiTone: "Professional and Welcoming"
    }
  });

  // Offer Templates
  const cdiTemplate = await prisma.documentTemplate.create({
    data: {
      name: "CDI Contract (Standard Morocco)",
      type: "OFFER",
      content: `
        <h1>Contrat de Travail à Durée Indéterminée</h1>
        <p>Entre <strong>IO Solutions Morocco</strong> et {{candidate_name}}.</p>
        <p><strong>Poste:</strong> {{job_title}}</p>
        <p><strong>Salaire:</strong> {{salary}} MAD</p>
        <p><strong>Avantages:</strong></p>
        <ul>
          <li>CNSS + AMO</li>
          <li>Assurance Maladie Privée</li>
          <li>Transport assuré (21h - 07h)</li>
          <li>Primes de performance</li>
        </ul>
        <p>Lieu: Zenith Millenium, Sidi Maarouf.</p>
      `
    }
  });

  // Question Templates
  await prisma.questionTemplate.create({
    data: {
      title: "Customer Service Situational",
      isGlobal: true,
      createdById: recruiter.id,
      questions: [
        { id: "cs1", text: "Comment gérer un client mécontent ?", category: "Soft Skills" },
        { id: "cs2", text: "Sell me this service/pen.", category: "Sales" }
      ]
    }
  });

  // 4. JOBS (Morocco Context)
  console.log('💼 Creating Jobs...');
  const jobs: Job[] = [];

  const jobDefinitions = [
    {
      title: "Customer service & sales specialist bilingual",
      location: "Rabat",
      desc: "The Customer service and sales specialist will handle customer relationships through chat and phone interactions..."
    },
    {
      title: "English & french spoken customer service & sales specialist",
      location: "Rabat",
      desc: "Due to our continued growth... strong written and verbal communication abilities in both English and French."
    },
    {
      title: "Bilingual customer service and sales specialist",
      location: "Rabat (Evening Shift)",
      desc: "Rotating shifts (12 PM - 5 AM). Net salary + bonuses. Transport provided."
    }
  ];

  for (const def of jobDefinitions) {
    // Spread jobs over the last 12 months to show trends
    const jobCreatedAt = faker.date.past({ years: 1.5 });

    jobs.push(await prisma.job.create({
      data: {
        title: def.title,
        department: "Operations",
        status: JobStatus.PUBLISHED,
        priority: JobPriority.HIGH,
        remoteType: RemoteType.ONSITE,
        location: def.location,
        descriptionText: def.desc + "\n\nAVANTAGES SOCIAUX:\n- CNSS + AMO\n- Transport assuré\n- Primes de performance",
        hiringManagerId: hiringManager.id,
        templateId: csTemplate.id,
        screeningTemplateId: bilingualScreening.id,
        salaryMin: 4000,
        salaryMax: 6000,
        createdAt: jobCreatedAt,
      }
    }));
  }

  // 5. CANDIDATES & APPLICATIONS
  console.log('👥 Creating Candidates & Applications...');

  const statuses: AppStatus[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
  const createdCandidates = [];

  for (const job of jobs as any[]) {
    // Increased volume: 40-80 to ensure data density metrics
    const appCount = faker.number.int({ min: 40, max: 80 });

    for (let k = 0; k < appCount; k++) {
      const candidate = await prisma.candidate.create({
        data: {
          email: faker.internet.email(),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          phone: "+212 6" + faker.string.numeric(8), // Moroccan Phone
          location: "Casablanca",
          experience: faker.number.int({ min: 0, max: 5 }),
        }
      });
      createdCandidates.push(candidate);

      const finalStatus = faker.helpers.weightedArrayElement([
        { weight: 20, value: 'APPLIED' },
        { weight: 15, value: 'SCREENING' },
        { weight: 10, value: 'INTERVIEW' },
        { weight: 5, value: 'OFFER' },
        { weight: 5, value: 'HIRED' },
        { weight: 15, value: 'REJECTED' }
      ]) as AppStatus;

      // Applications should be created *after* the job, up to today
      const appCreatedAt = faker.date.between({ from: job.createdAt, to: new Date() });

      // Explicit Rejection Reasons for "Rejected" status
      let rejectionReason = null;
      if (finalStatus === 'REJECTED') {
        rejectionReason = faker.helpers.arrayElement([
          "Language Skills (French)",
          "Language Skills (English)",
          "Availability (Night Shift)",
          "Salary Expectations",
          "No Show",
          "Culture Fit"
        ]);
      }

      const application = await prisma.application.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          status: finalStatus,
          createdAt: appCreatedAt,
          ownerId: recruiter.id,
          source: faker.helpers.arrayElement(["LinkedIn", "Tanqeeb", "Rekrute.com", "Referral"]),
          aiScore: faker.number.int({ min: 50, max: 95 }),
          aiSummary: "Candidate has relevant experience in call centers.",
          rejectionReason: rejectionReason, // Set reason
        }
      });

      // History for Time to Hire
      // Create a simplified history chain
      const steps = [];
      steps.push({ status: 'APPLIED', date: appCreatedAt });

      let currentDate = new Date(appCreatedAt);

      if (['SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'].includes(finalStatus)) {
        currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 86400000);
        steps.push({ status: 'SCREENING', date: currentDate });
      }

      if (['INTERVIEW', 'OFFER', 'HIRED'].includes(finalStatus) || (finalStatus === 'REJECTED' && Math.random() > 0.5)) {
        currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 2, max: 7 }) * 86400000);
        steps.push({ status: 'INTERVIEW', date: currentDate });

        // Create Interview record
        await prisma.interview.create({
          data: {
            applicationId: application.id,
            interviewerId: recruiter.id,
            status: InterviewStatus.COMPLETED,
            scheduledAt: currentDate,
            scorecard: { rating: faker.number.int({ min: 1, max: 5 }), notes: "Language check." }
          }
        });
      }

      if (['OFFER', 'HIRED'].includes(finalStatus)) {
        currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 1, max: 3 }) * 86400000);
        steps.push({ status: 'OFFER', date: currentDate });

        await prisma.offer.create({
          data: {
            applicationId: application.id,
            createdById: recruiter.id,
            status: finalStatus === 'HIRED' ? OfferStatus.ACCEPTED : OfferStatus.SENT,
            salary: faker.number.int({ min: 4500, max: 6000 }),
            currency: 'MAD',
            startDate: faker.date.future(),
            offerLetter: cdiTemplate.content,
            templateId: cdiTemplate.id,
            createdAt: currentDate // Critical for Time to Hire
          }
        });
      }

      if (finalStatus === 'HIRED') {
        currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 1, max: 3 }) * 86400000);
        steps.push({ status: 'HIRED', date: currentDate });
      }

      if (finalStatus === 'REJECTED' && !steps.find(s => s.status === 'REJECTED')) {
        currentDate = new Date(currentDate.getTime() + faker.number.int({ min: 1, max: 5 }) * 86400000);
        steps.push({ status: 'REJECTED', date: currentDate });
      }

      // Insert History
      for (const step of steps) {
        if (step.date > new Date()) step.date = new Date(); // Cap at now

        await prisma.applicationHistory.create({
          data: {
            applicationId: application.id,
            toStatus: step.status as AppStatus,
            changedById: recruiter.id,
            createdAt: step.date
          }
        });
      }
    }
  }

  // 6. DUPLICATES
  console.log('👯 Creating Duplicates...');
  if (createdCandidates.length > 0) {
    const original = createdCandidates[0];
    const dup = await prisma.candidate.create({
      data: {
        email: "dup." + original.email,
        firstName: original.firstName,
        lastName: original.lastName,
        phone: original.phone,
        location: "Casablanca"
      }
    });
    await prisma.duplicateGroup.create({
      data: {
        status: 'OPEN',
        members: {
          create: [
            { candidateId: original.id, confidence: 'HIGH' },
            { candidateId: dup.id, confidence: 'HIGH' }
          ]
        }
      }
    });
  }

  // 7. UPCOMING INTERVIEWS (Calendar Demo)
  console.log('📅 Seeding Upcoming Interviews...');
  const demoJob = jobs[0]; // Use the first job
  if (demoJob && recruiter) {
    const today = new Date();
    // Helper to set time
    const setTime = (d: Date, h: number, m: number) => {
      const newDate = new Date(d);
      newDate.setHours(h, m, 0, 0);
      return newDate;
    };

    const interviewCandidates = [
      {
        firstName: 'Alice', lastName: 'Wonder', email: 'alice.wonder@example.com',
        phone: '+212600111222',
        status: AppStatus.INTERVIEW,
        resumeText: 'Customer Success Manager. 5 years experience.',
        interviewTime: setTime(today, 10, 0), // Today 10 AM
        interviewStatus: 'CONFIRMED'
      },
      {
        firstName: 'Bob', lastName: 'Builder', email: 'bob.builder@example.com',
        phone: '+212600333444',
        status: AppStatus.INTERVIEW,
        resumeText: 'Project Manager with construction experience.',
        interviewTime: setTime(today, 14, 30), // Today 2:30 PM
        interviewStatus: 'PENDING'
      },
      {
        firstName: 'Charlie', lastName: 'Chaplin', email: 'charlie.chaplin@example.com',
        phone: '+212600555666',
        status: AppStatus.INTERVIEW,
        resumeText: 'Silent actor seeking voice role.',
        interviewTime: setTime(new Date(today.getTime() + 86400000), 11, 0), // Tomorrow 11 AM
        interviewStatus: 'CONFIRMED'
      },
      {
        firstName: 'Diana', lastName: 'Prince', email: 'diana.prince@example.com',
        phone: '+212600777888',
        status: AppStatus.INTERVIEW,
        resumeText: 'Security specialist.',
        interviewTime: setTime(new Date(today.getTime() + 86400000 * 2), 9, 0), // Day after tomorrow 9 AM
        interviewStatus: 'CONFIRMED'
      },
      {
        firstName: 'Evan', lastName: 'Cancelled', email: 'evan.cancelled@example.com',
        phone: '+212600999000',
        status: AppStatus.INTERVIEW,
        resumeText: 'Former applicant.',
        interviewTime: setTime(new Date(today.getTime() - 86400000), 15, 0), // Yesterday 3 PM
        interviewStatus: 'CANCELLED'
      },
      {
        firstName: 'Fiona', lastName: 'Pending', email: 'fiona.pending@example.com',
        phone: '+212600123123',
        status: AppStatus.INTERVIEW,
        resumeText: 'Awaiting confirmation.',
        interviewTime: setTime(new Date(today.getTime() + 86400000 * 3), 10, 0), // 3 Days later 10 AM
        interviewStatus: 'PENDING'
      },
      {
        firstName: 'George', lastName: 'Unscheduled', email: 'george.unscheduled@example.com',
        phone: '+212600456456',
        status: AppStatus.INTERVIEW,
        resumeText: 'Ready for interview but not scheduled.',
        interviewTime: new Date(), // Dummy date, won't be used
        interviewStatus: 'PENDING',
        skipInterview: true // FLAG TO SKIP CREATION
      }
    ];

    for (const c of interviewCandidates) {
      // Check for existing candidate
      let candidate = await prisma.candidate.findUnique({ where: { email: c.email } });

      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            resumeText: c.resumeText,
            applications: {
              create: {
                jobId: demoJob.id,
                status: c.status as AppStatus,
                ownerId: recruiter.id
              }
            }
          }
        });
      }

      // Fetch the application we just created/found
      const application = await prisma.application.findFirst({
        where: { candidateId: candidate.id, jobId: demoJob.id }
      });

      if (application && !(c as any).skipInterview) {
        // Create Interview
        await prisma.interview.create({
          data: {
            applicationId: application.id,
            interviewerId: recruiter.id,
            scheduledAt: c.interviewTime,
            status: c.interviewStatus as any,
            confirmedSlot: c.interviewStatus === 'CONFIRMED' ? c.interviewTime : null
          }
        });
        console.log(`- Scheduled interview for ${c.firstName} ${c.lastName} at ${c.interviewTime.toLocaleString()}`);
      } else if (application && (c as any).skipInterview) {
        console.log(`- Created unscheduled candidate ${c.firstName} ${c.lastName} (Smart Schedule Target)`);
      }
    }
  }

  console.log('✅ IO SOLUTIONS MOROCCO SEEDING COMPLETED.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });