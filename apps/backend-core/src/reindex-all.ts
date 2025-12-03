
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function reindexAll() {
    console.log('🔄 Starting Full Re-index of Candidates...');

    const candidates = await prisma.candidate.findMany();
    console.log(`📋 Found ${candidates.length} candidates in Postgres.`);

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    console.log(`🤖 AI Service URL: ${aiServiceUrl}`);

    let successCount = 0;
    let failCount = 0;

    for (const candidate of candidates) {
        try {
            // Construct payload matching what the AI service expects
            // Endpoint: /vectorize-candidate
            const semanticText = `Candidate: ${candidate.firstName} ${candidate.lastName}\n${candidate.resumeText || ''}`;

            const payload = {
                candidate_id: candidate.id,
                text: semanticText,
                location: candidate.location || 'Unknown',
                experience: candidate.experience || 0,
            };

            await axios.post(`${aiServiceUrl}/vectorize-candidate`, payload);
            process.stdout.write('.'); // Progress dot
            successCount++;
        } catch (error: any) {
            process.stdout.write('X');
            console.error(`\n❌ Failed to index ${candidate.email}: ${error.message}`);
            failCount++;
        }
    }

    console.log(`\n\n🏁 Re-index Complete.`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

reindexAll()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
