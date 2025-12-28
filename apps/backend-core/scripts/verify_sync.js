const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001';
const AI_URL = 'http://localhost:8000';

async function runVerification() {
    try {
        console.log('1. Finding a candidate...');
        // Fetch all candidates (no query param)
        const searchRes = await axios.get(`${BACKEND_URL}/candidates/search`);
        const candidates = searchRes.data;

        if (!candidates || candidates.length === 0) {
            console.error('No candidates found to test with.');
            return;
        }

        const candidate = candidates[0];
        const candidateId = candidate.id;
        console.log(`Selected Candidate: ${candidateId} (${candidate.firstName})`);

        const uniqueString = `AntigravityVerificationString_${Date.now()}`;
        console.log(`2. Updating candidate with unique string: ${uniqueString}`);

        await axios.patch(`${BACKEND_URL}/candidates/${candidateId}`, {
            resumeText: `Experienced Developer. ${uniqueString}`,
            experience: 10
        });
        console.log('Update successful.');

        console.log('3. Waiting for background job (5s)...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log('4. Searching Vector DB for unique string...');
        const vectorSearchRes = await axios.post(`${AI_URL}/search-candidates`, {
            query: uniqueString,
            limit: 5
        });

        const matches = vectorSearchRes.data.matches;
        console.log('Matches found:', matches);

        const found = matches.find(m => m.candidate_id === candidateId);

        if (found) {
            console.log('✅ SUCCESS: Candidate found in Vector DB with updated content!');
        } else {
            console.error('❌ FAILURE: Candidate not found in Vector DB.');
        }

    } catch (error) {
        console.error('Verification Failed:', error.message);
        console.error('Error Code:', error.code);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

runVerification();
