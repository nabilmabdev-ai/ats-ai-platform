import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Data Fix...');

    // 1. Create Screening Template
    console.log('Creating Screening Template...');
    const template = await prisma.screeningTemplate.create({
        data: {
            name: 'Customer Service Specialist',
            requiredSkills: ['Customer Service', 'Communication', 'Problem Solving', 'Bilingual', 'English', 'French'],
            niceToHaves: ['Sales', 'CRM', 'Zendesk', 'HubSpot'],
            scoringWeights: { skills: 0.5, experience: 0.3, education: 0.2 },
            interviewQuestions: [
                'Describe a time you turned a negative customer experience into a positive one.',
                'How do you handle high-pressure situations?',
                'Sell me this pen (demonstrate sales skills).'
            ],
        },
    });
    console.log('✅ Created Template:', template.id);

    // 2. Update Job
    const jobId = 'cc4b3067-1522-49d2-8494-4368eddc2696';
    console.log(`Updating Job ${jobId}...`);
    await prisma.job.update({
        where: { id: jobId },
        data: { screeningTemplateId: template.id },
    });
    console.log('✅ Updated Job');

    // 3. Mark Applications for Retry
    console.log('Marking applications for retry...');
    const result = await prisma.application.updateMany({
        where: { jobId: jobId },
        data: {
            aiParsingError: true, // This triggers the recovery logic
            aiScore: null,        // Clear old score
            aiSummary: null       // Clear old summary
        },
    });
    console.log(`✅ Marked ${result.count} applications for retry.`);
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => await prisma.$disconnect());
