import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 STARTING MAIN SEEDING SEQUENCE...\n');

  const scripts = [
    'prisma/seed-foundation.ts',       // Users, Templates, Settings
    'prisma/seed-jobs.ts',             // Jobs in various states
    'prisma/seed-candidates.ts',       // Candidates & Applications
    'prisma/seed-interviews-offers.ts' // Interviews, Comments, Offers
  ];

  for (const script of scripts) {
    console.log(`▶️  Executing: ${script}`);
    try {
      execSync(`npx ts-node ${script}`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`❌ Failed to execute ${script}`);
      process.exit(1);
    }
    console.log('--------------------------------------------------\n');
  }

  console.log('✅ ALL SEEDING COMPLETED SUCCESSFULLY.');
  console.log('   Login Credentials (Password: password123):');
  console.log('   - Admin:      admin@iosolutions.com');
  console.log('   - Recruiter:  recruiter@iosolutions.com');
  console.log('   - Manager:    director@iosolutions.com');
  console.log('   - Interviewer: teamlead@iosolutions.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });