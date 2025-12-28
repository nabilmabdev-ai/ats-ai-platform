import fetch from 'node-fetch';

async function testGenerate() {
    const url = 'http://localhost:3001/interviews/generate-questions';
    const body = {
        jobTitle: 'Software Engineer',
        jobDescription: 'We are looking for a React developer.',
        skills: ['React', 'TypeScript', 'Node.js'],
        candidateName: 'John Doe'
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            console.error('Error:', res.status, res.statusText);
            const text = await res.text();
            console.error('Body:', text);
            return;
        }

        const data = await res.json();
        console.log('Response Keys:', Object.keys(data));
        console.log('Role Specific Count:', data.role_specific?.length);
        console.log('Behavioral Count:', data.behavioral?.length);
        console.log('Competency Count:', data.competency?.length);
        console.log('Red Flags Count:', data.red_flags?.length);
        console.log('Full Data:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testGenerate();
