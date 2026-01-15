import { PrismaClient, AppStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing candidates for IO Solutions...');

  // Fetch Users to assign ownership
  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@iosolutions.com' } });

  // Fetch Jobs
  const bilingualJob = await prisma.job.findFirst({ where: { title: { contains: 'Bilingual' } } });
  const techJob = await prisma.job.findFirst({ where: { title: { contains: 'Technical' } } });
  const teamLeadJob = await prisma.job.findFirst({ where: { title: { contains: 'Team Leader' } } });

  const candidates = [
    // 1. The "Silver Medalist" (Rejected but high score)
    {
      firstName: 'Sarah', lastName: 'Silver', email: 'sarah.silver@gmail.com', phone: '+212600000001',
      jobId: bilingualJob?.id, status: AppStatus.REJECTED,
      resumeText: 'Strong sales background. Excellent French. 4 years experience.',
      aiScore: 92,
      tags: ['Silver Medalist', 'Future Consideration']
    },
    // 2. The "Duplicate" (Same person, different email - for Merge Demo)
    {
      firstName: 'Sarah', lastName: 'Silver', email: 'sarah.work@corporate.com', phone: '+212600000001', // Same phone
      jobId: bilingualJob?.id, status: AppStatus.APPLIED,
      resumeText: 'Strong sales background. Updated CV 2025.',
      aiScore: 0, // Not parsed yet
      tags: ['New Applicant']
    },

    // 3. Standard Hired
    {
      firstName: 'Leila', lastName: 'Chraibi', email: 'leila.chraibi@gmail.com', phone: '+212655667788',
      jobId: bilingualJob?.id, status: AppStatus.HIRED,
      resumeText: 'Perfect bilingual. 3 years experience. Immediate availability.',
      aiScore: 95,
      tags: []
    },

    // 4. Tech Candidate
    {
      firstName: 'Mehdi', lastName: 'El Amrani', email: 'mehdi.elamrani@gmail.com', phone: '+212611223344',
      jobId: techJob?.id, status: AppStatus.SCREENING,
      resumeText: 'Certified IT Technician. Knowledge of TCP/IP, DNS, DHCP.',
      aiScore: 88,
      tags: []
    },

    // 5. Team Lead Candidate
    {
      firstName: 'Karim', lastName: 'Berrada', email: 'karim.berrada@linkedin.com', phone: '+212633445566',
      jobId: teamLeadJob?.id, status: AppStatus.INTERVIEW,
      resumeText: '5 years experience as Team Manager in a major BPO.',
      aiScore: 90,
      tags: ['Top Candidate']
    }
  ];

  for (const c of candidates) {
    if (!c.jobId) continue;

    const existingCandidate = await prisma.candidate.findUnique({ where: { email: c.email } });

    if (existingCandidate) {
      console.log(`- Skipping ${c.email} (already exists)`);
      continue;
    }

    await prisma.candidate.create({
      data: {
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        resumeText: c.resumeText,
        applications: {
          create: {
            jobId: c.jobId,
            status: c.status as AppStatus,
            aiScore: c.aiScore,
            aiSummary: 'Auto-generated seed summary based on resume text...',
            ownerId: recruiter?.id, // Assign to recruiter
            tags: c.tags
          }
        }
      }
    });
  }

  // --- NEW: RELATED PROFILES DEMO (David Chen) ---
  if (!techJob || !recruiter) {
    console.error("❌ Pre-requisites missing: 'Technical' Job or 'Recruiter' user not found. Skipping related profiles demo.");
    return;
  }

  // Check if David Chen A already exists
  let davidA = await prisma.candidate.findFirst({ where: { email: 'david.chen.director@gmail.com' } });

  if (!davidA) {
    davidA = await prisma.candidate.create({
      data: {
        firstName: 'David', lastName: 'Chen', email: 'david.chen.director@gmail.com', phone: '+14155550201',
        resumeText: 'VP of Engineering. 15 years experience.',
        applications: { create: { jobId: techJob.id, status: AppStatus.OFFER, ownerId: recruiter.id } }
      }
    });
  }

  let davidB = await prisma.candidate.findFirst({ where: { email: 'd.chen.junior@university.edu' } });

  if (!davidB) {
    davidB = await prisma.candidate.create({
      data: {
        firstName: 'David', lastName: 'Chen', email: 'd.chen.junior@university.edu', phone: '+14155550202',
        resumeText: 'Computer Science Graduate. Dean List.',
        applications: { create: { jobId: techJob.id, status: AppStatus.REJECTED, ownerId: recruiter.id } }
      }
    });
  }

  // Create Exclusion (Related Profile Badge)
  if (davidA && davidB) {
    const existingExclusion = await prisma.duplicateExclusion.findFirst({
      where: {
        OR: [
          { candidateAId: davidA.id, candidateBId: davidB.id },
          { candidateAId: davidB.id, candidateBId: davidA.id }
        ]
      }
    });

    if (!existingExclusion) {
      await prisma.duplicateExclusion.create({
        data: {
          candidateAId: davidA.id,
          candidateBId: davidB.id
        }
      });
      console.log('✅ Created Related Profile Demo (David Chen).');
    }
  }


  // --- NEW: INTERVIEW SCHEDULE DEMO ---
  console.log('📅 Seeding Interview Schedule...');

  if (recruiter && bilingualJob) {
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
        jobId: bilingualJob.id,
        status: AppStatus.INTERVIEW,
        resumeText: 'Customer Success Manager. 5 years experience.',
        interviewTime: setTime(today, 10, 0), // Today 10 AM
        interviewStatus: 'CONFIRMED'
      },
      {
        firstName: 'Bob', lastName: 'Builder', email: 'bob.builder@example.com',
        phone: '+212600333444',
        jobId: bilingualJob.id,
        status: AppStatus.INTERVIEW,
        resumeText: 'Project Manager with construction experience.',
        interviewTime: setTime(today, 14, 30), // Today 2:30 PM
        interviewStatus: 'PENDING'
      },
      {
        firstName: 'Charlie', lastName: 'Chaplin', email: 'charlie.chaplin@example.com',
        phone: '+212600555666',
        jobId: bilingualJob.id,
        status: AppStatus.INTERVIEW,
        resumeText: 'Silent actor seeking voice role.',
        interviewTime: setTime(new Date(today.getTime() + 86400000), 11, 0), // Tomorrow 11 AM
        interviewStatus: 'CONFIRMED'
      },
      {
        firstName: 'Diana', lastName: 'Prince', email: 'diana.prince@example.com',
        phone: '+212600777888',
        jobId: bilingualJob.id,
        status: AppStatus.INTERVIEW,
        resumeText: 'Security specialist.',
        interviewTime: setTime(new Date(today.getTime() + 86400000 * 2), 9, 0), // Day after tomorrow 9 AM
        interviewStatus: 'CONFIRMED'
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
                jobId: c.jobId,
                status: c.status as AppStatus,
                ownerId: recruiter.id
              }
            }
          }
        });
      }

      // Fetch the application we just created/found
      const application = await prisma.application.findFirst({
        where: { candidateId: candidate.id, jobId: c.jobId }
      });

      if (application) {
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
      }
    }
  }

  // --- NEW: DUPLICATE GROUP DEMO (Sarah Silver) ---
  // We need to fetch the Sarah Silver candidates we just created.
  const sarahSilverA = await prisma.candidate.findFirst({ where: { email: 'sarah.silver@gmail.com' } });
  const sarahSilverB = await prisma.candidate.findFirst({ where: { email: 'sarah.work@corporate.com' } });

  if (sarahSilverA && sarahSilverB) {
    const group = await prisma.duplicateGroup.create({
      data: { status: 'OPEN' }
    });

    await prisma.duplicateGroupMember.createMany({
      data: [
        { groupId: group.id, candidateId: sarahSilverA.id, confidence: 'HIGH', matchReason: JSON.stringify({ strategy: 'PHONE_NAME' }) },
        { groupId: group.id, candidateId: sarahSilverB.id, confidence: 'HIGH', matchReason: JSON.stringify({ strategy: 'PHONE_NAME' }) }
      ]
    });
    console.log('✅ Created Duplicate Group Demo (Sarah Silver).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });