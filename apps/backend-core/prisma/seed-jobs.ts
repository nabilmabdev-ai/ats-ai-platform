import { PrismaClient, JobStatus, JobPriority, RemoteType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initializing jobs for IO Solutions...');

  const admin = await prisma.user.findFirst({ where: { email: 'admin@iosolutions.com' } });
  const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@iosolutions.com' } });
  const director = await prisma.user.findFirst({ where: { email: 'director@iosolutions.com' } });
  const teamlead = await prisma.user.findFirst({ where: { email: 'teamlead@iosolutions.com' } });

  const csrTemplate = await prisma.jobTemplate.findFirst({ where: { name: { contains: 'Customer Service' } } });
  const agentWorkflow = await prisma.jobWorkflowTemplate.findFirst({ where: { name: { contains: 'High Volume' } } });
  const mgmtWorkflow = await prisma.jobWorkflowTemplate.findFirst({ where: { name: { contains: 'Management' } } });

  const bilingualScorecard = await prisma.screeningTemplate.findFirst({ where: { name: { contains: 'Bilingual' } } });
  const techScorecard = await prisma.screeningTemplate.findFirst({ where: { name: { contains: 'Technical' } } });

  // 1. PUBLISHED: Bilingual Customer Service Specialist
  console.log('   Creating job: Bilingual Customer Service Specialist...');
  await prisma.job.create({
    data: {
      title: 'Bilingual Customer Service Specialist',
      department: 'Operations',
      status: JobStatus.PUBLISHED,
      priority: JobPriority.HIGH,
      remoteType: RemoteType.ONSITE,
      location: 'Rabat, Morocco',
      headcount: 20,
      descriptionText: `# Bilingual Customer Service Specialist
IO Solutions Contact Center - Rabat

## Descriptif du poste
Due to our continued growth, we are hiring bilingual Customer Service Specialists. You will handle customer relationships through chat and phone, resolving issues and ensuring satisfaction.

## Qualifications
- Excellent communication in English and French.
- Passion for helping people.
- Ability to work in a fast-paced environment.

## What We Offer
- Career growth opportunities.
- Paid training.
- Transport provided (9PM - 7AM).
- CNSS + AMO + Private Insurance.`,
      requirements: ['French (C1)', 'English (B2)', 'Customer Service'],
      salaryMin: 4500,
      salaryMax: 6500,
      hiringManagerId: teamlead?.id,
      approvedById: admin?.id,
      approvedAt: new Date(),
      templateId: csrTemplate?.id,
      workflowTemplateId: agentWorkflow?.id,
      screeningTemplateId: bilingualScorecard?.id,
      knockoutQuestions: [
        { id: 'q1', text: 'Are you fluent in both French and English?', correctAnswer: 'Yes' },
        { id: 'q2', text: 'Are you available for rotating shifts?', correctAnswer: 'Yes' }
      ],
      distribution: { linkedin: { status: 'POSTED' }, indeed: { status: 'POSTED' } }
    }
  });

  // 2. PUBLISHED: Technical Support Representative
  console.log('   Creating job: Technical Support Representative...');
  await prisma.job.create({
    data: {
      title: 'Technical Support Representative',
      department: 'Operations',
      status: JobStatus.PUBLISHED,
      priority: JobPriority.URGENT,
      remoteType: RemoteType.ONSITE,
      location: 'Casablanca, Morocco',
      headcount: 10,
      descriptionText: `# Technical Support Representative
IO Solutions Contact Center - Casablanca

## Mission
Provide technical assistance to customers facing internet and connectivity issues.

## Requirements
- Strong technical aptitude (Networking, Hardware).
- Fluent in French.
- Patience and problem-solving skills.`,
      requirements: ['Troubleshooting', 'French (C1)', 'Technical Knowledge'],
      salaryMin: 5000,
      salaryMax: 7000,
      hiringManagerId: teamlead?.id,
      approvedById: admin?.id,
      templateId: csrTemplate?.id,
      workflowTemplateId: agentWorkflow?.id,
      screeningTemplateId: techScorecard?.id,
    }
  });

  // 3. DRAFT: Team Leader - Operations
  console.log('   Creating job: Team Leader...');
  await prisma.job.create({
    data: {
      title: 'Team Leader - Operations',
      department: 'Operations',
      status: JobStatus.DRAFT,
      priority: JobPriority.MEDIUM,
      remoteType: RemoteType.ONSITE,
      location: 'Rabat, Morocco',
      headcount: 2,
      descriptionText: `Manage a team of 15-20 agents. Ensure KPIs are met.`,
      requirements: ['Management Experience', 'KPI Analysis', 'Coaching'],
      salaryMin: 8000,
      salaryMax: 10000,
      hiringManagerId: director?.id,
      workflowTemplateId: mgmtWorkflow?.id,
    }
  });

  // 4. CLOSED: Outbound Sales Agent
  console.log('   Creating job: Outbound Sales Agent...');
  await prisma.job.create({
    data: {
      title: 'Outbound Sales Agent',
      department: 'Sales',
      status: JobStatus.CLOSED,
      priority: JobPriority.MEDIUM,
      remoteType: RemoteType.ONSITE,
      location: 'Casablanca, Morocco',
      descriptionText: 'Telesales campaign finished.',
      hiringManagerId: teamlead?.id,
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