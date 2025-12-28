import { PrismaClient, AppStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function debugSourcing() {
  console.log('🔍 Starting Silver Medalist Debugger...');

  // 1. Get the most recently created job
  const job = await prisma.job.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (!job) {
    console.error('❌ No jobs found in the database.');
    return;
  }

  console.log(`\n📋 Analyzing Job: "${job.title}" (ID: ${job.id})`);
  console.log(
    `   Description length: ${job.descriptionText?.length || 0} chars`,
  );

  // 2. Call AI Service
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  console.log(`\n🤖 Connecting to AI Service at: ${aiServiceUrl}`);

  const queryText = `
    Job Title: ${job.title}
    Description: ${job.descriptionText}
    Requirements: ${JSON.stringify(job.requirements)}
  `.trim();

  let matches: any[] = [];
  try {
    const response = await axios.post(`${aiServiceUrl}/match-job`, {
      job_description: queryText,
      limit: 50,
      offset: 0,
    });
    matches = response.data.matches || [];
    console.log(`✅ AI Service returned ${matches.length} matches.`);
  } catch (error: any) {
    console.error('❌ AI Service Call Failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    return;
  }

  if (matches.length === 0) {
    console.warn(
      '⚠️ No matches found by AI. Check if embeddings exist for candidates.',
    );
    return;
  }

  // 3. Fetch Candidates
  const candidateIds = matches.map((m: any) => m.candidate_id);
  const candidates = await prisma.candidate.findMany({
    where: { id: { in: candidateIds } },
    include: {
      applications: {
        select: { status: true, jobId: true },
      },
    },
  });

  console.log(`\n👥 Fetched ${candidates.length} candidate profiles from DB.`);

  // 4. Run Filtering Logic
  console.log('\n🕵️ Running Filter Logic:');

  let passedCount = 0;

  for (const c of candidates) {
    const hasRejection = c.applications.some(
      (app) => app.status === AppStatus.REJECTED,
    );
    const isHired = c.applications.some(
      (app) => app.status === AppStatus.HIRED,
    );
    const appliedToThisJob = c.applications.some((app) => app.jobId === job.id);

    const isSilverMedalist = hasRejection && !isHired && !appliedToThisJob;

    console.log(
      `   - Candidate ${c.id.substring(0, 8)} (${c.firstName} ${c.lastName})`,
    );
    console.log(
      `     Has Rejection: ${hasRejection} | Is Hired: ${isHired} | Applied to this: ${appliedToThisJob}`,
    );

    if (isSilverMedalist) {
      console.log(`     ✅ MATCH! Is Silver Medalist.`);
      passedCount++;
    } else {
      console.log(`     ❌ Skipped.`);
    }
  }

  console.log(`\n🏁 Summary: ${passedCount} candidates would be sourced.`);
}

debugSourcing()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
