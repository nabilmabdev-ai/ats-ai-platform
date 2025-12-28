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

  console.log('✅ Candidates initialization complete (Includes Duplicates for Merge Demo).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });