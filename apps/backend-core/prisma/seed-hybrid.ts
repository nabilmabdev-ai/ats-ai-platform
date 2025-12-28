import { PrismaClient, AppStatus, Role, RemoteType, JobStatus, JobPriority, Job } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Hybrid Seeding (Foundation + Faker)...');

    // --- 1. CLEANUP ---
    console.log('   🧹 Cleaning database...');
    await prisma.comment.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.application.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.job.deleteMany();

    // --- 2. USERS & CONFIGURATION (Static/Foundation) ---
    const recruiter = await prisma.user.findFirst({ where: { email: 'recruiter@iosolutions.com' } });
    const admin = await prisma.user.findFirst({ where: { email: 'admin@iosolutions.com' } });
    const teamlead = await prisma.user.findFirst({ where: { email: 'teamlead@iosolutions.com' } });

    if (!recruiter || !admin || !teamlead) {
        console.error('❌ Critical users not found. Please run "npm run seed:foundation" first.');
        process.exit(1);
    }

    // Update Company Description
    console.log('   🏢 Updating Company Info...');
    const companyDesc = "As a global outsourcing player, IO Solutions has been combining leadership, people and processes for over 15 years to provide clients worldwide with tailored service and expertise that meets international standards. The group offers a global and multi-sectoral offering based on 4 solution areas: Telecommunications, Retail, Utilities and Financial Services. Founded in 2007, we are a Canadian leader in customer experience outsourcing. The group currently has over 1,500 employees in 4 operating centers. The headquarters launches New Customer Support Office in Casablanca, Morocco.";

    await prisma.company.updateMany({
        data: { description: companyDesc }
    });


    // --- 2.5 TEMPLATES & SETTINGS (IO Solutions Specific) ---
    console.log('   📝 Generating Settings Templates...');

    // A. Question Templates
    const phoneScreenQuestions = await prisma.questionTemplate.create({
        data: {
            title: 'Dépistage Téléphonique (Phone Screen)',
            isGlobal: true,
            questions: [
                { id: 'q1', text: 'Parlez-vous couramment français et anglais?', category: 'Langues' },
                { id: 'q2', text: 'Avez-vous de l\'expérience en centre d\'appel?', category: 'Experience' },
                { id: 'q3', text: 'Êtes-vous disponible pour des horaires rotatifs (y compris nuit)?', category: 'Logistique' },
                { id: 'q4', text: 'Quelle est votre prétention salariale?', category: 'Administratif' }
            ],
            createdById: admin.id
        }
    });

    const salesQuestions = await prisma.questionTemplate.create({
        data: {
            title: 'Entretien Commercial (Sales Check)',
            isGlobal: true,
            questions: [
                { id: 's1', text: 'Vendez-moi ce stylo.', category: 'Technique de Vente' },
                { id: 's2', text: 'Comment gérez-vous un refus client?', category: 'Résilience' },
                { id: 's3', text: 'Donnez un exemple d\'objectif commercial atteint.', category: 'Experience' }
            ],
            createdById: admin.id
        }
    });

    // B. Scorecards (ScreeningTemplate)
    const bilingualScorecard = await prisma.screeningTemplate.create({
        data: {
            name: 'Évaluation Agent Bilingue',
            requiredSkills: ['Français (C1)', 'Anglais (B2)', 'Écoute Active', 'Relation Client'],
            niceToHaves: ['Expérience CRM', 'Vitesse de frappe'],
            scoringWeights: { skills: 0.4, experience: 0.3, communication: 0.3 },
            interviewQuestions: [
                "Can you maintain a conversation in English for 5 minutes?",
                "Comment réagissez-vous face à un client agressif ?"
            ]
        }
    });

    const salesScorecard = await prisma.screeningTemplate.create({
        data: {
            name: 'Évaluation Commerciale (Sales)',
            requiredSkills: ['Négociation', 'Persuasion', 'Français Courant', 'Résilience'],
            niceToHaves: ['Expérience Télévente', 'Chasse commerciale'],
            scoringWeights: { skills: 0.5, mindset: 0.3, experience: 0.2 },
            interviewQuestions: [
                "Demonstrate how you close a sale.",
                "Racontez votre vente la plus difficile."
            ]
        }
    });

    // C. Document Templates (Offer Templates)
    const cdiOffer = await prisma.documentTemplate.create({
        data: {
            name: 'Contrat CDI - Rabat',
            type: 'OFFER',
            content: `
        <div style="font-family: 'Arial', sans-serif; padding: 40px; color: #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://iosolutions.com/logo.png" alt="IO Solutions" style="height: 50px;">
            <h2>Offre d'Emploi / Job Offer</h2>
          </div>
          <p>Cher(e) <strong>{{candidate.firstName}} {{candidate.lastName}}</strong>,</p>
          <p>Nous sommes ravis de vous accueillir chez <strong>IO Solutions Maroc</strong> !</p>
          <p>Voici les détails de votre offre pour le poste de <strong>{{job.title}}</strong> :</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Date de début :</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">{{offer.startDate}}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Salaire Fixe :</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">{{offer.salary}} MAD Net</td>
            </tr>
             <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Primes :</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">Performance + Assiduité</td>
            </tr>
          </table>

          <p>Avantages :</p>
          <ul>
            <li>CNSS + AMO</li>
            <li>Mutuelle Privée</li>
            <li>Transport Assuré</li>
          </ul>

          <p>Veuillez signer électroniquement pour accepter cette offre.</p>
          <br>
          <p>Cordialement,<br>L'équipe RH IO Solutions</p>
        </div>
      `
        }
    });

    // D. Job Templates
    await prisma.jobTemplate.create({
        data: {
            name: 'Standard Customer Service Agent',
            defaultDepartment: 'Operations',
            defaultLocation: 'Rabat, Morocco',
            defaultRemoteType: RemoteType.ONSITE,
            defaultScreeningTemplateId: bilingualScorecard.id,
            structure: `# {{job_title}}\n\n## Description\n{{ai_generated_description}}\n\n## Qualifications\n- Fluent in French & English\n- Customer Oriented`,
            aiTone: 'Professional, Welcoming'
        }
    });

    const salesJobTemplate = await prisma.jobTemplate.create({
        data: {
            name: 'Sales Representative',
            defaultDepartment: 'Sales',
            defaultLocation: 'Casablanca, Morocco',
            defaultRemoteType: RemoteType.ONSITE,
            defaultScreeningTemplateId: salesScorecard.id,
            structure: `# {{job_title}}\n\n## Mission\nDrive sales and revenue.\n\n## Requirements\n- Proven sales track record\n- Aggressive but polite`,
            aiTone: 'Dynamic, Energetic, Persuasive'
        }
    });


    // --- 3. JOBS (Specific User Context) ---
    console.log('   💼 Generatng Hybrid Jobs...');

    const commonDescription = `
## Descriptif du poste
Due to our continued growth and success, we are expanding our team in Morocco. We are seeking to hire bilingual Customer Service Specialists with a sales focus. The Customer service and sales specialist will handle customer relationships through chat and phone interactions, resolving issues, recommending products and ensuring all appropriate follow-up to confirm complete customer satisfaction. We are seeking candidates who demonstrate strong written and verbal communication abilities in both English and French.

The company offers a structured program designed to help employees progress in their careers by providing opportunities for skill development, training, and potential promotion within the organization, allowing them to move into more challenging and rewarding roles over time.

## WHAT WE OFFER (WHY YOU SHOULD JOIN OUR TEAM?)
- Career growth and development with our Advancement program.
- Full-time paid training and our trainers will teach you everything you need to reach your potential.
- Stability of employment, social benefits and stimulating performance premiums.
- A diverse, equitable and family-friendly work environment.

## Profil Recherché / QUALIFICATIONS
- Excellent customer service with superb communication skills with a passion for helping people.
- Ability to provide attentive, courteous and efficient customer service through the quality of your service delivery.
- A strong enthusiasm and drive to actively promote and sell products or services.
- Assist and advise customers with solutions adapted to their needs.
- Ability to work in a fast-paced, computer environment with strong organizational and time management skills.
- Proven problem-solving skills and technical aptitude.
- Punctuality and respect for work schedules.

## Avantages sociaux et autres
- CNSS + AMO + Private insurance
- Paid training
- Transport provided for each shift (Rotating evening shifts)
- Full-time position
- Net salary + bonuses
`;

    // Specific Job Scenarios from User
    const jobDefinitions = [
        {
            title: 'Bilingual customer service and sales specialist',
            dept: 'Operations',
            count: 2,
            location: 'Rabat, Morocco',
            requirements: ['English', 'French', 'Sales', 'Customer Service']
        },
        {
            title: 'English & french spoken customer service & sales specialist',
            dept: 'Operations',
            count: 2,
            location: 'Rabat, Morocco',
            requirements: ['English', 'French', 'Communication']
        },
        {
            title: 'Customer service & sales specialist bilingual',
            dept: 'Operations',
            count: 2,
            location: 'Rabat, Morocco',
            requirements: ['Bilingual', 'Sales', 'Tech Aptitude']
        }
    ];

    const jobs: Job[] = [];

    for (const def of jobDefinitions) {
        for (let i = 0; i < def.count; i++) {
            const isPublished = true; // User seems to want these active

            const job = await prisma.job.create({
                data: {
                    title: def.title,
                    department: def.dept,
                    status: JobStatus.PUBLISHED,
                    priority: JobPriority.HIGH,
                    remoteType: RemoteType.ONSITE,
                    location: def.location,
                    headcount: faker.number.int({ min: 5, max: 20 }), // "High Volume" implied
                    descriptionText: commonDescription,
                    requirements: def.requirements,
                    salaryMin: 4500, // Inferred from "Net salary + bonuses" context usually ~4000-6000 MAD
                    salaryMax: 7000,
                    hiringManagerId: teamlead?.id || admin.id,
                    approvedById: admin.id,
                    approvedAt: new Date(),
                }
            });
            jobs.push(job);
        }
    }

    // --- 4. CANDIDATES & APPLICATIONS (Faker Driven) ---
    console.log(`   👥 Generating Candidates & Applications for ${jobs.length} jobs...`);

    // We will generate ~50 candidates distributed across jobs
    const candidateCount = 50;

    for (let i = 0; i < candidateCount; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName });

        // Pick a random job
        const randomJob = faker.helpers.arrayElement(jobs);

        // Determine status flow based on probability
        const status = faker.helpers.weightedArrayElement([
            { weight: 40, value: AppStatus.APPLIED },
            { weight: 20, value: AppStatus.SCREENING },
            { weight: 15, value: AppStatus.INTERVIEW },
            { weight: 10, value: AppStatus.OFFER },
            { weight: 5, value: AppStatus.HIRED },
            { weight: 10, value: AppStatus.REJECTED },
        ]);

        const aiScore = faker.number.int({ min: 60, max: 99 });

        // Prepare nested data based on status
        const applicationCreateData: any = {
            jobId: randomJob.id,
            status: status,
            aiScore: aiScore,
            aiSummary: `AI Analysis: Candidate is a good fit for ${randomJob.title}. Strong communication skills noted in resume.`,
            ownerId: recruiter.id,
            createdAt: faker.date.recent({ days: 30 }),
        };

        // If INTERVIEW status, schedule an interview
        if (status === AppStatus.INTERVIEW) {
            const interviewDate = faker.date.soon({ days: 7 });
            applicationCreateData.interviews = {
                create: {
                    interviewerId: teamlead.id,
                    status: 'PENDING',
                    scheduledAt: interviewDate,
                    bookingToken: faker.string.uuid()
                }
            };
        }

        // If OFFER or HIRED status, create an offer
        if (status === AppStatus.OFFER || status === AppStatus.HIRED) {
            applicationCreateData.offer = {
                create: {
                    status: status === AppStatus.HIRED ? 'ACCEPTED' : 'SENT',
                    salary: faker.number.int({ min: 5000, max: 8000 }),
                    currency: 'MAD',
                    startDate: faker.date.future(),
                    offerLetter: '<p>Standard Offer Letter Content</p>',
                    createdById: recruiter.id
                }
            };
        }

        await prisma.candidate.create({
            data: {
                firstName,
                lastName,
                email,
                phone: faker.phone.number(),
                resumeText: faker.lorem.paragraphs(2),
                applications: {
                    create: applicationCreateData
                }
            }
        });

        if (i % 10 === 0) process.stdout.write('.');
    }

    console.log('\n✅ Hybrid Seeding Completed Successfully!');
    console.log(`   - Updated Company Info`);
    console.log(`   - Generated ${jobs.length} Jobs based on new context`);
    console.log(`   - Generated ${candidateCount} Candidates/Applications`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
