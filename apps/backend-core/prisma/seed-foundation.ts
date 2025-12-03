import { PrismaClient, Role, RemoteType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing foundation data...');

  // --- 1. CLEANUP ---
  try {
    await prisma.company.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.job.deleteMany();
    await prisma.jobTemplate.deleteMany();
    await prisma.screeningTemplate.deleteMany();
    await prisma.legalTemplate.deleteMany();
    await prisma.documentTemplate.deleteMany();
    await prisma.jobWorkflowTemplate.deleteMany();
    await prisma.user.deleteMany();
    console.log('   🧹 Database cleaned.');
  } catch (e) {
    console.log('   ⚠️ Cleanup skipped or partial.');
  }

  // --- 2. USERS ---
  console.log('   👤 Initializing users...');

  const adminPasswordHash = await bcrypt.hash('Sanaa2021', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@ats.ai',
      fullName: 'Alice Admin',
      role: Role.ADMIN,
      timezone: 'Europe/London',
      passwordHash: adminPasswordHash
    },
    {
      email: 'recruiter@ats.ai',
      fullName: 'Ben Recruiter',
      role: Role.RECRUITER,
      timezone: 'Europe/London',
      passwordHash: userPasswordHash
    },
    {
      email: 'manager@ats.ai',
      fullName: 'Sarah Manager',
      role: Role.MANAGER,
      timezone: 'America/New_York',
      passwordHash: userPasswordHash
    },
    {
      email: 'tech@ats.ai',
      fullName: 'David Dev',
      role: Role.INTERVIEWER,
      timezone: 'Europe/London',
      passwordHash: userPasswordHash
    },
    {
      email: 'sarah.sales@ats.ai',
      fullName: 'Sarah VP Sales',
      role: Role.MANAGER,
      timezone: 'Europe/London',
      passwordHash: userPasswordHash
    }
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        email: u.email,
        fullName: u.fullName,
        passwordHash: u.passwordHash,
        role: u.role,
        availability: {
          timezone: u.timezone,
          workHours: { start: 9, end: 18 }
        }
      }
    });
  }

  // --- 3. WORKFLOWS ---
  console.log('   🔄 Initializing workflows...');
  await prisma.jobWorkflowTemplate.create({
    data: {
      name: 'Standard Tech Recruitment',
      region: 'Global',
      jobFamily: 'Engineering',
      defaultStages: ['APPLIED', 'SCREENING', 'TECH_INTERVIEW', 'CULTURAL_INTERVIEW', 'OFFER', 'HIRED']
    }
  });

  // --- 4. SCREENING TEMPLATES (SCORECARDS) ---
  console.log('   🧠 Initializing screening templates...');

  const frontendScorecard = await prisma.screeningTemplate.create({
    data: {
      name: 'Frontend React Specialist',
      requiredSkills: ['React', 'TypeScript', 'Tailwind CSS', 'State Management'],
      niceToHaves: ['Next.js', 'Figma', 'Jest', 'GraphQL'],
      scoringWeights: { skills: 0.6, experience: 0.3, education: 0.1 },
      interviewQuestions: [
        "Explain the React rendering lifecycle.",
        "How do you optimize large lists in React?",
        "Describe a complex UI bug you solved."
      ]
    }
  });

  const backendScorecard = await prisma.screeningTemplate.create({
    data: {
      name: 'Backend Node.js/Cloud',
      requiredSkills: ['Node.js', 'PostgreSQL', 'API Design', 'Docker'],
      niceToHaves: ['Kubernetes', 'AWS', 'NestJS', 'Redis'],
      scoringWeights: { skills: 0.7, experience: 0.2, education: 0.1 },
      interviewQuestions: [
        "Explain the difference between SQL and NoSQL databases.",
        "How do you handle error handling in an Express/NestJS application?",
        "Describe your experience with containerization and orchestration."
      ]
    }
  });

  const salesScorecard = await prisma.screeningTemplate.create({
    data: {
      name: 'B2B Sales',
      requiredSkills: ['B2B Sales', 'CRM', 'Negotiation', 'Prospecting'],
      niceToHaves: ['SaaS Experience', 'HubSpot', 'French', 'English'],
      scoringWeights: { skills: 0.5, experience: 0.4, education: 0.1 },
      interviewQuestions: [
        "Walk me through your sales process from prospecting to closing.",
        "How do you handle objections during a demo?",
        "Describe a time you missed a quota and what you learned."
      ]
    }
  });

  // --- 5. LEGAL TEMPLATES ---
  console.log('   ⚖️  Initializing legal templates...');

  await prisma.legalTemplate.create({
    data: {
      region: 'UK',
      language: 'en',
      content: `\n\n### ⚖️ Legal Information (UK)\nThis role is open to all professionals. We value diversity and inclusion.\n**GDPR Notice:** Your data is processed in accordance with GDPR regulations.\n**Equal Opportunity:** We are an equal opportunity employer.`
    }
  });

  await prisma.legalTemplate.create({
    data: {
      region: 'US',
      language: 'en',
      content: `\n\n### ⚖️ Legal Information (US)\nWe are an Equal Opportunity Employer.\n**Privacy:** Your data is processed securely.`
    }
  });

  // --- 6. JOB TEMPLATES (STRUCTURE) ---
  console.log('   📄 Initializing job templates...');

  await prisma.jobTemplate.create({
    data: {
      name: 'Engineering Role (Standard)',
      structure: `# {{job_title}}\n\n## 🚀 The Mission\n{{ai_summary}}\n\n## ⚡ Key Responsibilities\n{{ai_responsibilities}}\n\n## 🛠️ Technical Requirements\n{{ai_requirements}}\n\n## 🎁 Benefits & Perks\n- Competitive Salary & Equity\n- Remote-First Culture\n- Premium Health Insurance\n- MacBook Pro M3\n\n{{> legal_block}}`,
      defaultDepartment: 'Engineering',
      defaultLocation: 'London',
      defaultRemoteType: RemoteType.HYBRID,
      defaultScreeningTemplateId: frontendScorecard.id,
      aiTone: 'Professional yet exciting'
    }
  });

  await prisma.jobTemplate.create({
    data: {
      name: 'Sales Role',
      structure: `# {{job_title}}\n\n## 💼 The Opportunity\n{{ai_summary}}\n\n## 🎯 What You'll Do\n{{ai_responsibilities}}\n\n## ✅ Who You Are\n{{ai_requirements}}\n\n## 💰 Compensation\n- Base Salary + Uncapped Commission\n- Quarterly Performance Bonuses\n\n{{> legal_block}}`,
      defaultDepartment: 'Sales',
      defaultRemoteType: RemoteType.ONSITE,
      defaultScreeningTemplateId: salesScorecard.id,
      aiTone: 'Persuasive and energetic'
    }
  });

  // --- 7. DOCUMENT TEMPLATES (OFFERS) ---
  console.log('   🤝 Initializing offer templates...');

  await prisma.documentTemplate.create({
    data: {
      name: 'Standard Job Offer (International)',
      type: 'OFFER',
      content: `
        <div style="font-family: Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.6;">
          <h1 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">Job Offer</h1>
          <p>Dear <strong>{{candidate.firstName}}</strong>,</p>
          <p>We are pleased to offer you the position of <strong>{{job.title}}</strong> at ATS.ai!</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Compensation Package</h3>
            <ul style="list-style: none; padding: 0;">
              <li>💰 <strong>Base Salary:</strong> {{offer.salaryFormatted}} {{offer.currency}} / year</li>
              <li>📈 <strong>Equity:</strong> {{offer.equity}}</li>
              <li>📅 <strong>Start Date:</strong> {{offer.startDate}}</li>
            </ul>
          </div>

          <p>We have been incredibly impressed by your background and are convinced you will be a major asset to our {{job.department}} team.</p>
          <p>Please sign below to accept this offer.</p>
          
          <div style="margin-top: 50px; border-top: 1px solid #000; width: 200px; padding-top: 5px;">
            Signature
          </div>
        </div>
      `
    }
  });

  await prisma.documentTemplate.create({
    data: {
      name: 'Contract (UK)',
      type: 'CONTRACT',
      content: `<h1>Employment Contract</h1><p>Between ATS.ai and {{candidate.firstName}} {{candidate.lastName}}...</p>`
    }
  });

  // --- 8. COMPANY SETTINGS ---
  console.log('   🏢 Initializing company settings...');

  await prisma.company.create({
    data: {
      name: 'ATS.ai',
      logoUrl: '/logo.png',
      address: '123 Tech Avenue, London, UK',
      careerPageUrl: 'https://careers.ats.ai',
      defaultTimezone: 'Europe/London',
      aiTone: 'Professional, Innovative, Inclusive',
      enableAutoMerge: true,
      description: 'ATS.ai is a leading provider of AI-powered recruitment solutions. We help companies hire the best talent faster and fairer.'
    }
  });

  console.log('✅ Foundation data initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });