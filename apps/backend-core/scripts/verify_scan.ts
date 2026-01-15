import { Test, TestingModule } from '@nestjs/testing';
import { ScanService } from '../src/deduplication/scan.service';
import { DeduplicationService } from '../src/deduplication/deduplication.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { DeduplicationModule } from '../src/deduplication/deduplication.module';

async function run() {
    const module: TestingModule = await Test.createTestingModule({
        imports: [DeduplicationModule],
        providers: [PrismaService], // Ensure Prisma is available if not in module exports logic (it likely is)
    }).compile();

    const scanService = module.get<ScanService>(ScanService);
    const prisma = module.get<PrismaService>(PrismaService);

    // Seed some data? Or just run on existing?
    // Let's create two duplicates just to be sure
    console.log('Seeding duplicates...');

    const email1 = `dup1_${Date.now()}@test.com`;
    const email2 = `dup2_${Date.now()}@test.com`;

    await prisma.candidate.create({
        data: { firstName: 'Scan', lastName: 'Tester', email: email1, phone: '555-0100' }
    });
    await prisma.candidate.create({
        data: { firstName: 'Scan', lastName: 'Tester', email: email2, phone: '555-0100' } // Same name/phone
    });

    console.log('Running scan...');
    await scanService.scanDatabase();
    console.log('Scan complete.');

    // Verify group creation
    const groups = await prisma.duplicateGroup.findMany({
        include: { members: { include: { candidate: true } } }
    });

    console.log(`Found ${groups.length} groups.`);
    for (const g of groups) {
        console.log(`Group ${g.id} has ${g.members.length} members:`);
        g.members.forEach(m => console.log(` - ${m.candidate.email}`));
    }
}

run().catch(console.error);
