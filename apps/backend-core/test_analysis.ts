import fetch from 'node-fetch';

async function testAnalysis() {
    const url = 'http://localhost:3001/interviews/analyze';
    // We need a valid applicationId for this to work because the service looks up the app.
    // However, looking at interviews.service.ts, analyzeAndSave takes a DTO.
    // Let's check the DTO structure first.

    // Wait, I need to check the DTO in the code first to be sure what to send.
    // But based on page.tsx: body: JSON.stringify({ applicationId: appId, notes }),

    // I'll use a dummy ID and see if it fails gracefully or if I can mock it.
    // Actually, the service does:
    // const app = await this.prisma.application.findUnique({ where: { id: dto.applicationId } ...

    // So I need a real application ID.
    // I'll fetch one from the database first or just try to list applications.

    // For now, let's try to hit the endpoint and see if we get a "Not Found" which confirms the endpoint is reachable.

    const body = {
        applicationId: 'dummy-id',
        notes: 'Candidate was good.'
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);

    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testAnalysis();
