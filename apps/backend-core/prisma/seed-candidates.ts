import { PrismaClient, AppStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing candidates...');

  const reactJob = await prisma.job.findFirst({ where: { title: { contains: 'React' } } });
  const backendJob = await prisma.job.findFirst({ where: { title: { contains: 'Backend' } } });
  const salesJob = await prisma.job.findFirst({ where: { title: { contains: 'Sales' } } });

  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@ats.ai' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@ats.ai' } });

  if (!reactJob || !backendJob) throw new Error('❌ Missing jobs.');

  // 1. Perfect Candidate for React (Screening)
  const alice = await prisma.candidate.create({
    data: {
      firstName: 'Alice', lastName: 'Lemoine', email: 'alice.lemoine@example.com',
      location: 'London', education: 'MSc Computer Science', experience: 6,
      resumeText: 'Senior React Developer. 6 years exp. Stack: React, TypeScript, Next.js, Tailwind. Team Lead (5 ppl).',
      resumeS3Key: 'uploads/alice.pdf',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.SCREENING,
          aiScore: 0.95,
          aiSummary: 'Excellent match. Meets all criteria and has leadership experience.',
          aiParsingData: { skills: ['React', 'TypeScript', 'Next.js'], experience_years: 6 },
          knockoutAnswers: { q1: 'Yes', q2: 'Yes' },
          ownerId: recruiter?.id
        }
      }
    }
  });

  // 2. Auto-Rejected (React Job)
  await prisma.candidate.create({
    data: {
      firstName: 'Bob', lastName: 'Durand', email: 'bob.durand@example.com',
      location: 'Manchester', education: 'Bootcamp', experience: 1,
      resumeText: 'Junior Developer. HTML, CSS, Basic React.',
      resumeS3Key: 'uploads/bob.pdf',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.REJECTED,
          aiScore: 0.40,
          isAutoRejected: true,
          aiSummary: 'Does not meet minimum experience requirements.',
          knockoutAnswers: { q1: 'Yes', q2: 'No' }, // Failed experience question
          ownerId: recruiter?.id
        }
      }
    }
  });

  // 3. Good Backend Profile (Applied)
  await prisma.candidate.create({
    data: {
      firstName: 'Charles', lastName: 'Martin', email: 'charles.martin@example.com',
      location: 'Remote', experience: 8,
      resumeText: 'Node.js Expert. Microservices, AWS, Docker. 8 years experience.',
      resumeS3Key: 'uploads/charlie.pdf',
      applications: {
        create: {
          jobId: backendJob.id,
          status: AppStatus.APPLIED,
          aiScore: 0.88,
          aiSummary: 'Strong backend candidate.',
          knockoutAnswers: { q1: 'Yes' },
          ownerId: recruiter?.id
        }
      }
    }
  });

  // 4. Interview Phase (React Job)
  await prisma.candidate.create({
    data: {
      firstName: 'David', lastName: 'Bernard', email: 'david.bernard@example.com',
      location: 'London', experience: 5,
      resumeText: 'React Developer. Redux, Jest, Cypress.',
      resumeS3Key: 'uploads/david.pdf',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.INTERVIEW,
          aiScore: 0.85,
          aiSummary: 'Solid technical skills. Good profile.',
          tags: ['Technical', 'Shortlisted'],
          ownerId: recruiter?.id
        }
      }
    }
  });

  // 5. Hired Candidate (React Job)
  await prisma.candidate.create({
    data: {
      firstName: 'Emily', lastName: 'Dubois', email: 'emilie.dubois@example.com',
      location: 'London', experience: 7,
      resumeText: 'Full Stack. React + Node.',
      resumeS3Key: 'uploads/emily.pdf',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.HIRED,
          aiScore: 0.98,
          aiSummary: 'Perfect candidate.',
          ownerId: manager?.id
        }
      }
    }
  });

  // 6. Sales Candidate (Pending Job)
  if (salesJob) {
    await prisma.candidate.create({
      data: {
        firstName: 'Samuel', lastName: 'Petit', email: 'samuel.petit@example.com',
        location: 'London', experience: 10,
        resumeText: 'Enterprise Sales Director. Closed 5M ARR.',
        applications: {
          create: {
            jobId: salesJob.id,
            status: AppStatus.APPLIED,
            aiScore: 0.92,
            aiSummary: 'High value candidate.',
            ownerId: recruiter?.id
          }
        }
      }
    });
  }

  console.log('✅ Candidates initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });