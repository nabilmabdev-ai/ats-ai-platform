
// Native fetch is available in Node 18+

async function checkCandidatesApi() {
    try {
        const jobId = '73415e0c-4968-4dcb-a877-e4f98e8325f0';
        const url = `http://localhost:3001/jobs/${jobId}/candidates`;
        console.log('Fetching:', url);

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed: ${res.status} ${res.statusText}`);

        const data = await res.json();
        if (data.applications && data.applications.length > 0) {
            const app = data.applications[0];
            console.log('First Application Candidate Keys:', Object.keys(app.candidate));
            console.log('Resume Key:', app.candidate.resumeS3Key);
            console.log('Cover Letter Key:', app.coverLetterS3Key); // Check if it's on app or candidate
        } else {
            console.log('No applications found');
        }
    } catch (e) {
        console.error(e);
    }
}

checkCandidatesApi();
