
const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in newer node

async function checkApi() {
    const apiUrl = 'http://localhost:3001/jobs?page=1&limit=9';
    console.log(`Fetching from: ${apiUrl}`);
    try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
            console.error(`Error: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }
        const data = await res.json();
        console.log('API Response Keys:', Object.keys(data));
        if (data.data) {
            console.log('Number of jobs:', data.data.length);
            if (data.data.length > 0) {
                console.log('First job sample:', JSON.stringify(data.data[0], null, 2));
            }
        } else {
            console.log('No "data" property found in response!');
            console.log('Full response:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

checkApi();
