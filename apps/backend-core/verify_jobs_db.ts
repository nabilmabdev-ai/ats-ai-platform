
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.job.count();
    console.log(`Total Jobs in DB: ${count}`);
    
    if (count > 0) {
        const jobs = await prisma.job.findMany({ take: 5 });
        console.log('First 5 jobs:', JSON.stringify(jobs, null, 2));
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
