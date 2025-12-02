import { PrismaClient, JobStatus, JobPriority, RemoteType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing jobs...');

  const manager = await prisma.user.findFirst({ where: { email: 'manager@ats.ai' } });
  const admin = await prisma.user.findFirst({ where: { email: 'admin@ats.ai' } });
  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@ats.ai' } });
  const salesManager = await prisma.user.findFirst({ where: { email: 'sarah.sales@ats.ai' } });

  const engTemplate = await prisma.jobTemplate.findFirst({ where: { name: { contains: 'Engineering' } } });
  const workflow = await prisma.jobWorkflowTemplate.findFirst({ where: { name: 'Standard Tech Recruitment' } });

  const frontendScorecard = await prisma.screeningTemplate.findFirst({ where: { name: { contains: 'Frontend' } } });
  const backendScorecard = await prisma.screeningTemplate.findFirst({ where: { name: { contains: 'Backend' } } });
  const salesScorecard = await prisma.screeningTemplate.findFirst({ where: { name: { contains: 'Sales' } } });

  // 1. PUBLISHED: Senior React Developer
  console.log('   Creating job: Senior React Developer...');
  await prisma.job.create({
    data: {
      title: 'Senior React Developer',
      department: 'Engineering',
      status: JobStatus.PUBLISHED,
      priority: JobPriority.HIGH,
      remoteType: RemoteType.HYBRID,
      location: 'London, UK',
      headcount: 2,
      descriptionText: `# Senior React Developer\n\nWe are looking for an experienced React developer to lead our frontend initiatives.\n\n## Responsibilities\n- Architect high-performance systems.\n- Collaborate with the Design team.\n\n## Requirements\n- 5+ years of experience with React.\n- Expert in TypeScript.`,
      requirements: ['React', 'TypeScript', 'CSS-in-JS', 'Performance'],
      salaryMin: 60000,
      salaryMax: 85000,
      hiringManagerId: manager?.id,
      approvedById: admin?.id,
      approvedAt: new Date(),
      templateId: engTemplate?.id,
      workflowTemplateId: workflow?.id,
      screeningTemplateId: frontendScorecard?.id,
      knockoutQuestions: [
        { id: 'q1', text: 'Do you have a valid work permit for the UK?', correctAnswer: 'Yes' },
        { id: 'q2', text: 'Do you have at least 3 years of experience with React?', correctAnswer: 'Yes' }
      ],
      distribution: { linkedin: { status: 'POSTED' }, indeed: { status: 'POSTED' } }
    }
  });

  // 2. PUBLISHED: Lead Backend (Node.js)
  console.log('   Creating job: Lead Backend...');
  await prisma.job.create({
    data: {
      title: 'Lead Backend (Node.js)',
      department: 'Engineering',
      status: JobStatus.PUBLISHED,
      priority: JobPriority.URGENT,
      remoteType: RemoteType.REMOTE,
      location: 'Remote (EMEA)',
      headcount: 1,
      descriptionText: `# Lead Backend\n\nScale our microservices architecture.\n\n## Stack\n- Node.js, NestJS, Postgres.`,
      requirements: ['Node.js', 'PostgreSQL', 'System Design', 'Docker'],
      salaryMin: 75000,
      salaryMax: 100000,
      hiringManagerId: manager?.id,
      approvedById: admin?.id,
      templateId: engTemplate?.id,
      screeningTemplateId: backendScorecard?.id,
      knockoutQuestions: [{ id: 'q1', text: 'Have you managed a team before?', correctAnswer: 'Yes' }]
    }
  });

  // 3. PENDING APPROVAL: Sales Manager
  console.log('   Creating job: Sales Manager...');
  await prisma.job.create({
    data: {
      title: 'Sales Manager (Enterprise)',
      department: 'Sales',
      status: JobStatus.PENDING_APPROVAL,
      priority: JobPriority.HIGH,
      remoteType: RemoteType.ONSITE,
      location: 'London, UK',
      headcount: 1,
      descriptionText: `Drive adoption of our AI ATS in the UK market.`,
      requirements: ['B2B Sales', 'SaaS', 'HubSpot'],
      salaryMin: 80000,
      salaryMax: 120000,
      hiringManagerId: salesManager?.id,
      screeningTemplateId: salesScorecard?.id,
    }
  });

  // 4. DRAFT: Product Designer
  console.log('   Creating job: Product Designer...');
  await prisma.job.create({
    data: {
      title: 'Product Designer',
      department: 'Design',
      status: JobStatus.DRAFT,
      priority: JobPriority.MEDIUM,
      remoteType: RemoteType.HYBRID,
      location: 'New York, USA',
      descriptionText: 'Design the future of recruitment.',
      hiringManagerId: recruiter?.id,
    }
  });

  // 5. CLOSED: Former Intern
  await prisma.job.create({
    data: {
      title: 'Marketing Intern (Summer)',
      department: 'Marketing',
      status: JobStatus.CLOSED,
      priority: JobPriority.LOW,
      remoteType: RemoteType.ONSITE,
      location: 'London, UK',
      descriptionText: 'Internship position closed.',
    }
  });



  // 6. ARCHIVED: Legacy Java Developer
  console.log('   Creating job: Legacy Java Developer...');
  await prisma.job.create({
    data: {
      title: 'Legacy Java Developer',
      department: 'Engineering',
      status: JobStatus.ARCHIVED,
      priority: JobPriority.LOW,
      remoteType: RemoteType.ONSITE,
      location: 'Manchester, UK',
      descriptionText: 'Legacy system maintenance. Position archived.',
      hiringManagerId: manager?.id,
    }
  });

  // 7. CLOSED: Q1 Sales Representative
  console.log('   Creating job: Q1 Sales Representative...');
  await prisma.job.create({
    data: {
      title: 'Q1 Sales Representative',
      department: 'Sales',
      status: JobStatus.CLOSED,
      priority: JobPriority.MEDIUM,
      remoteType: RemoteType.REMOTE,
      location: 'Remote (UK)',
      descriptionText: 'Q1 hiring quota met.',
      hiringManagerId: salesManager?.id,
    }
  });

  console.log('✅ Jobs initialization complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });