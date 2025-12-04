import { PrismaClient, AppStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing candidates for IO Solutions...');

  const bilingualJob = await prisma.job.findFirst({ where: { title: { contains: 'Bilingual' } } });
  const techJob = await prisma.job.findFirst({ where: { title: { contains: 'Technical' } } });
  const teamLeadJob = await prisma.job.findFirst({ where: { title: { contains: 'Team Leader' } } });

  const candidates = [
    // 1. Qualified Bilingual Candidates (Applied)
    {
      firstName: 'Yassine', lastName: 'Benali', email: 'yassine.benali@gmail.com', phone: '+212600112233',
      jobId: bilingualJob?.id, status: AppStatus.APPLIED,
      resumeText: 'Fluent in English and French. 2 years experience in call center.'
    },
    {
      firstName: 'Sara', lastName: 'Mansouri', email: 'sara.mansouri@outlook.com', phone: '+212600445566',
      jobId: bilingualJob?.id, status: AppStatus.APPLIED,
      resumeText: 'Fresh graduate. English Literature major. Excellent communication skills.'
    },
    {
      firstName: 'Omar', lastName: 'Tazi', email: 'omar.tazi@gmail.com', phone: '+212600778899',
      jobId: bilingualJob?.id, status: AppStatus.APPLIED,
      resumeText: 'Experience in customer service for a French telecom operator.'
    },

    // 2. Tech Support Candidates (Screening)
    {
      firstName: 'Mehdi', lastName: 'El Amrani', email: 'mehdi.elamrani@gmail.com', phone: '+212611223344',
      jobId: techJob?.id, status: AppStatus.SCREENING,
      resumeText: 'Certified IT Technician. Knowledge of TCP/IP, DNS, DHCP.'
    },
    {
      firstName: 'Fatima', lastName: 'Zahra', email: 'fatima.zahra@gmail.com', phone: '+212622334455',
      jobId: techJob?.id, status: AppStatus.SCREENING,
      resumeText: 'Computer Science student. Passionate about hardware troubleshooting.'
    },

    // 3. Team Lead Candidates (Interview)
    {
      firstName: 'Karim', lastName: 'Berrada', email: 'karim.berrada@linkedin.com', phone: '+212633445566',
      jobId: teamLeadJob?.id, status: AppStatus.INTERVIEW,
      resumeText: '5 years experience as Team Manager in a major BPO. Managed team of 25.'
    },

    // 4. Rejected Candidates
    {
      firstName: 'Ahmed', lastName: 'Kabbaj', email: 'ahmed.kabbaj@gmail.com', phone: '+212644556677',
      jobId: bilingualJob?.id, status: AppStatus.REJECTED,
      resumeText: 'French level B1. Needs improvement.'
    },

    // 5. Hired Candidate
    {
      firstName: 'Leila', lastName: 'Chraibi', email: 'leila.chraibi@gmail.com', phone: '+212655667788',
      jobId: bilingualJob?.id, status: AppStatus.HIRED,
      resumeText: 'Perfect bilingual. 3 years experience. Immediate availability.'
    }
  ];

  for (const c of candidates) {
    if (!c.jobId) continue;

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
            status: c.status,
            aiScore: c.status === AppStatus.REJECTED ? 45 : 85,
            aiSummary: 'Candidate profile analysis...'
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