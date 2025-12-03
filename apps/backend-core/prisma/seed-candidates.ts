import { PrismaClient, AppStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing candidates...');

  const reactJob = await prisma.job.findFirst({ where: { title: { contains: 'React' } } });
  const backendJob = await prisma.job.findFirst({ where: { title: { contains: 'Backend' } } });
  const salesJob = await prisma.job.findFirst({ where: { title: { contains: 'Sales' } } });
  const productJob = await prisma.job.findFirst({ where: { title: { contains: 'Product Manager' } } });

  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@ats.ai' } });
  const manager = await prisma.user.findFirst({ where: { email: 'manager@ats.ai' } });

  if (!reactJob || !backendJob) throw new Error('❌ Missing jobs.');

  // 1. Perfect Candidate for React (Screening)
  const alice = await prisma.candidate.create({
    data: {
      firstName: 'Alice', lastName: 'Lemon', email: 'alice.lemon@example.com',
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
      firstName: 'Bob', lastName: 'Durant', email: 'bob.durant@example.com',
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
      firstName: 'David', lastName: 'Barnes', email: 'david.barnes@example.com',
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
      firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@example.com',
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
        firstName: 'Samuel', lastName: 'Small', email: 'samuel.small@example.com',
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

  // 7. New Candidates (Enrichment)

  // Frank Miller (React - Applied)
  await prisma.candidate.create({
    data: {
      firstName: 'Frank', lastName: 'Miller', email: 'frank.miller@example.com',
      location: 'London', experience: 3,
      resumeText: 'React Developer. 3 years experience. Redux, Material UI.',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.APPLIED,
          aiScore: 0.75,
          aiSummary: 'Good potential, but less experience than required.',
          ownerId: recruiter?.id
        }
      }
    }
  });

  // Grace Hopper (React - Screening)
  await prisma.candidate.create({
    data: {
      firstName: 'Grace', lastName: 'Hopper', email: 'grace.hopper@example.com',
      location: 'London', experience: 10,
      resumeText: 'Principal Engineer. React, Node, Go, Rust. Architected large scale systems.',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.SCREENING,
          aiScore: 0.99,
          aiSummary: 'Exceptional candidate. Overqualified but very strong.',
          ownerId: recruiter?.id
        }
      }
    }
  });

  // Henry Ford (React - Rejected)
  await prisma.candidate.create({
    data: {
      firstName: 'Henry', lastName: 'Ford', email: 'henry.ford@example.com',
      location: 'Detroit', experience: 0,
      resumeText: 'Industrialist. No coding experience.',
      applications: {
        create: {
          jobId: reactJob.id,
          status: AppStatus.REJECTED,
          aiScore: 0.10,
          isAutoRejected: true,
          aiSummary: 'No relevant technical skills.',
          ownerId: recruiter?.id
        }
      }
    }
  });

  // Ian Wright (Backend - Applied)
  await prisma.candidate.create({
    data: {
      firstName: 'Ian', lastName: 'Wright', email: 'ian.wright@example.com',
      location: 'Remote', experience: 5,
      resumeText: 'Backend Developer. Python, Django, Postgres.',
      applications: {
        create: {
          jobId: backendJob.id,
          status: AppStatus.APPLIED,
          aiScore: 0.65, // Lower score because stack mismatch (Python vs Node)
          aiSummary: 'Good backend experience but different stack (Python).',
          ownerId: recruiter?.id
        }
      }
    }
  });

  // Jane Doe (Product Manager - Applied)
  if (productJob) {
    await prisma.candidate.create({
      data: {
        firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@example.com',
        location: 'London', experience: 4,
        resumeText: 'Product Manager. Agile, Jira, User Stories. Launched 2 mobile apps.',
        applications: {
          create: {
            jobId: productJob.id,
            status: AppStatus.APPLIED,
            aiScore: 0.88,
            aiSummary: 'Strong product background.',
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