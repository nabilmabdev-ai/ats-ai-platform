import { PrismaClient, Role, RemoteType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing foundation data for IO Solutions...');

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

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@iosolutions.com',
      fullName: 'System Admin',
      role: Role.ADMIN,
      timezone: 'Africa/Casablanca',
    },
    {
      email: 'recruiter@iosolutions.com',
      fullName: 'Amine Recruiter',
      role: Role.RECRUITER,
      timezone: 'Africa/Casablanca',
    },
    {
      email: 'director@iosolutions.com',
      fullName: 'Karim Director',
      role: Role.MANAGER,
      timezone: 'Africa/Casablanca',
    },
    {
      email: 'teamlead@iosolutions.com',
      fullName: 'Sarah TeamLead',
      role: Role.INTERVIEWER,
      timezone: 'Africa/Casablanca',
    },
    {
      id: 'system-user',
      email: 'system@iosolutions.com',
      fullName: 'System User',
      role: Role.ADMIN,
      timezone: 'UTC',
    }
  ];

  for (const u of users) {
    await prisma.user.create({
      data: {
        id: (u as any).id, // Optional ID for system user
        email: u.email,
        fullName: u.fullName,
        passwordHash,
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
      name: 'High Volume Agent Recruitment',
      region: 'Morocco',
      jobFamily: 'Operations',
      defaultStages: ['APPLIED', 'PHONE_SCREENING', 'LANGUAGE_TEST', 'OPS_INTERVIEW', 'OFFER', 'HIRED']
    }
  });

  await prisma.jobWorkflowTemplate.create({
    data: {
      name: 'Management Recruitment',
      region: 'Morocco',
      jobFamily: 'Management',
      defaultStages: ['APPLIED', 'SCREENING', 'MANAGER_INTERVIEW', 'DIRECTOR_INTERVIEW', 'OFFER', 'HIRED']
    }
  });

  // --- 4. SCREENING TEMPLATES ---
  console.log('   🧠 Initializing screening templates...');

  const bilingualAgentScorecard = await prisma.screeningTemplate.create({
    data: {
      name: 'Bilingual Agent (Fr/En)',
      requiredSkills: ['French (C1)', 'English (B2)', 'Active Listening', 'Typing Speed'],
      niceToHaves: ['CRM Experience', 'Previous BPO Experience'],
      scoringWeights: { skills: 0.5, experience: 0.3, education: 0.2 },
      interviewQuestions: [
        "Can you introduce yourself in English and then switch to French?",
        "How do you handle an angry customer?",
        "What is your availability for rotating shifts?"
      ]
    }
  });

  const techSupportScorecard = await prisma.screeningTemplate.create({
    data: {
      name: 'Technical Support Specialist',
      requiredSkills: ['Troubleshooting', 'Networking Basics', 'Empathy', 'French (C1)'],
      niceToHaves: ['CompTIA A+', 'Cisco CCNA'],
      scoringWeights: { skills: 0.6, experience: 0.3, education: 0.1 },
      interviewQuestions: [
        "Walk me through how you would troubleshoot a 'No Internet' issue.",
        "How do you explain a technical concept to a non-technical person?",
        "Describe a time you went above and beyond for a customer."
      ]
    }
  });

  // --- 5. LEGAL TEMPLATES ---
  console.log('   ⚖️  Initializing legal templates...');

  await prisma.legalTemplate.create({
    data: {
      region: 'Morocco',
      language: 'fr',
      content: `\n\n### ⚖️ Mentions Légales\nCe poste est ouvert à tous. Nous valorisons la diversité.\n**CNSS/AMO:** Déclaré à 100%.\n**Contrat:** CDI.`
    }
  });

  // --- 6. JOB TEMPLATES ---
  console.log('   📄 Initializing job templates...');

  await prisma.jobTemplate.create({
    data: {
      name: 'Customer Service Representative',
      structure: `# {{job_title}}\n\n## 🚀 Mission\n{{ai_summary}}\n\n## ⚡ Responsabilités\n{{ai_responsibilities}}\n\n## 🛠️ Profil Recherché\n{{ai_requirements}}\n\n## 🎁 Avantages\n- Salaire motivant + Primes\n- Transport assuré\n- Assurance Maladie Complémentaire\n- Plan de carrière\n\n{{> legal_block}}`,
      defaultDepartment: 'Operations',
      defaultLocation: 'Rabat',
      defaultRemoteType: RemoteType.ONSITE,
      defaultScreeningTemplateId: bilingualAgentScorecard.id,
      aiTone: 'Professional, Welcoming, Dynamic'
    }
  });

  // --- 7. DOCUMENT TEMPLATES (OFFERS) ---
  console.log('   🤝 Initializing offer templates...');

  await prisma.documentTemplate.create({
    data: {
      name: 'CDI Standard (Maroc)',
      type: 'OFFER',
      content: `
        <div style="font-family: Arial, sans-serif;">
          <h1>Offre d'Emploi</h1>
          <p>Bonjour <strong>{{candidate.firstName}}</strong>,</p>
          <p>Nous avons le plaisir de vous offrir le poste de <strong>{{job.title}}</strong> chez IO Solutions !</p>
          <ul>
            <li>Salaire de base: {{offer.salaryFormatted}} MAD</li>
            <li>Date de début: {{offer.startDate}}</li>
          </ul>
        </div>
      `
    }
  });

  // --- 8. COMPANY SETTINGS ---
  console.log('   🏢 Initializing company settings...');

  await prisma.company.create({
    data: {
      name: 'IO Solutions Contact Center',
      logoUrl: '/logo.png',
      address: 'Casablanca, Morocco',
      careerPageUrl: 'https://careers.iosolutions.com',
      defaultTimezone: 'Africa/Casablanca',
      aiTone: 'Professional, Dynamic, Customer-Focused',
      enableAutoMerge: true,
      description: 'As a global outsourcing player, IO Solutions has been combining leadership, people and processes for over 15 years to provide clients worldwide with tailored service and expertise that meets international standards. The group offers a global and multi-sectoral offering based on 4 solution areas: Telecommunications, Retail, Utilities and Financial Services. Founded in 2007, we are a Canadian leader in customer experience outsourcing. The group currently has over 1,500 employees in 4 operating centers.'
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