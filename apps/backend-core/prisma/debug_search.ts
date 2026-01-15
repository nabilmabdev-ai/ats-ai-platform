
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Candidate Search ---');

    // 1. Count Total Candidates
    const total = await prisma.candidate.count();
    console.log(`Total Candidates in DB: ${total}`);

    // 2. Simulate Default Search Query (CandidatesService logic)
    // q is undefined, filters empty.
    const whereClause = {
        AND: []
    };

    const results = await prisma.candidate.findMany({
        where: whereClause,
        take: 10,
        orderBy: { createdAt: 'desc' }, // default sort
        include: { applications: { include: { job: true } } }
    });

    console.log(`Simulated Search Results: ${results.length}`);

    if (results.length > 0) {
        console.log('Sample Result:', JSON.stringify(results[0], null, 2));
    } else {
        console.log('No results found with empty filter.');
    }

    // 3. Count Candidates with Applications
    const withApps = await prisma.candidate.count({
        where: {
            applications: {
                some: {}
            }
        }
    });
    console.log(`Candidates with Applications: ${withApps}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
