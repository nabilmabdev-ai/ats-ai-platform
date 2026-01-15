
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Verification of Candidate Edit Logic...');

    // 1. Setup: Create two candidates
    const email1 = `test.user.1.${Date.now()}@example.com`;
    const email2 = `test.user.2.${Date.now()}@example.com`;

    const c1 = await prisma.candidate.create({
        data: {
            firstName: 'Test',
            lastName: 'User 1',
            email: email1,
        }
    });
    console.log(`✅ Created Candidate 1: ${c1.id} (${c1.email})`);

    const c2 = await prisma.candidate.create({
        data: {
            firstName: 'Test',
            lastName: 'User 2',
            email: email2,
        }
    });
    console.log(`✅ Created Candidate 2: ${c2.id} (${c2.email})`);

    // 2. Test: Update Candidate 1 (Audit Log Check)
    console.log('\n--- Testing Audit Log ---');
    const updatedC1 = await prisma.candidate.update({
        where: { id: c1.id },
        data: {
            firstName: 'Updated Name',
            location: 'New York'
        }
    });
    // Simulate Service Logic for Audit (Since we are running script, we emulate what service does)
    // Ideally we would import the service, but that requires NestJS context.
    // We will manually check if the logic we wrote in service *would* work?
    // No, we want to verify the Logic.
    // Best way to verify Service logic is to RUN the app and call the API.
    // But for this script, let's just use `fetch` to call the running backend?
    // The backend needs to be running.

    // Let's assume the backend IS running on localhost:3001 (based on previous logs).
    // We will use fetch.
}

// Rewriting main to use FETCH against running backend
const API_URL = 'http://localhost:3001';

async function testApi() {
    console.log('🧪 Starting API Verification...');

    // Create Candidate 1
    const email1 = `e1.${Date.now()}@test.com`;
    const res1 = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'User', lastName: 'One', email: email1 })
    });
    const c1 = await res1.json();
    if (!c1.id) throw new Error('Failed to create C1');
    console.log(`✅ Created C1: ${c1.id}`);

    // Create Candidate 2
    const email2 = `e2.${Date.now()}@test.com`;
    const res2 = await fetch(`${API_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: 'User', lastName: 'Two', email: email2 })
    });
    const c2 = await res2.json();
    if (!c2.id) throw new Error('Failed to create C2');
    console.log(`✅ Created C2: ${c2.id}`);

    // 1. Update C1 -> Check Audit
    console.log('\nTesting Update & Audit...');
    const updateRes = await fetch(`${API_URL}/candidates/${c1.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: 'Paris', phone: '+15550101' })
    });
    const updatedC1 = await updateRes.json();
    // We can't easily check AuditLog via API unless we have an endpoint.
    // But we can check DB via Prisma in this script to verify side-effect.

    // Wait a bit for async (if any)
    await new Promise(r => setTimeout(r, 1000));

    const auditLogs = await prisma.auditLog.findMany({
        where: { target: `Candidate:${c1.id}` },
        orderBy: { createdAt: 'desc' }
    });

    if (auditLogs.length > 0) {
        console.log(`✅ Audit Log Found:`, JSON.stringify(auditLogs[0].details));
    } else {
        console.error(`❌ No Audit Log found for ${c1.id}`);
    }

    // 2. Test Duplicate Check
    console.log('\nTesting Duplicate Email Check...');
    const failRes = await fetch(`${API_URL}/candidates/${c1.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email2 }) // Try to take C2's email
    });

    if (failRes.status === 400 || failRes.status === 409) {
        const errorBody = await failRes.json();
        console.log(`✅ Correctly rejected update: ${failRes.status}`, errorBody);
        if (errorBody.code === 'DUPLICATE_EMAIL' && errorBody.conflictCandidateId === c2.id) {
            console.log(`✅ Correct Error Code and Conflict ID`);
        } else {
            console.error(`❌ Unexpected Error Body:`, errorBody);
        }
    } else {
        console.error(`❌ Update should have failed but got: ${failRes.status}`);
    }
}

testApi().catch(console.error).finally(() => prisma.$disconnect());
