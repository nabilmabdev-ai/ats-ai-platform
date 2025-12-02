import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting score migration...');

    // Find all applications with a score <= 2 (indicating the old distance metric)
    const applications = await prisma.application.findMany({
        where: {
            aiScore: {
                lte: 2,
                not: null,
            },
        },
    });

    console.log(`Found ${applications.length} applications to migrate.`);

    for (const app of applications) {
        if (app.aiScore === null) continue;

        // Reverse the formula:
        // Old: distScore = (100 - originalScore) / 50
        // New: originalScore = 100 - (distScore * 50)

        const originalScore = Math.round(100 - (app.aiScore * 50));

        console.log(`Migrating App ${app.id}: ${app.aiScore} -> ${originalScore}`);

        await prisma.application.update({
            where: { id: app.id },
            data: { aiScore: originalScore },
        });
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
