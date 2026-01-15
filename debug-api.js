// Native fetch used
const API = 'http://localhost:3001';

const urls = [
    '/jobs',
    '/interviews?startDate=' + new Date().toISOString() + '&limit=100',
    '/reporting/funnel',
    '/reporting/performance',
    '/reporting/time-to-hire',
    '/reporting/source',
    '/reporting/rejection-reasons',
    '/reporting/stats'
];

async function check() {
    console.log('--- Checking API Endpoints ---');
    for (const url of urls) {
        const fullUrl = API + url;
        try {
            console.log(`Fetching ${fullUrl}...`);
            const start = Date.now();
            const res = await fetch(fullUrl);
            const duration = Date.now() - start;

            console.log(`Status: ${res.status} (${duration}ms)`);
            if (res.ok) {
                const text = await res.text();
                console.log(`Body Prefix: ${text.substring(0, 100)}...`);
                try {
                    JSON.parse(text);
                    console.log('JSON: Valid');
                } catch (e) {
                    console.log('JSON: INVALID');
                }
            } else {
                console.log('Error Body:', await res.text());
            }
        } catch (e) {
            console.log('FETCH FAILED:', e.message);
        }
        console.log('--------------------------------');
    }
}

// Minimal polyfill if fetch is missing (older node) or utilize global fetch if Node 18+
if (!global.fetch) {
    console.log("Global fetch not found, using http");
    // Simple http get fallback or just rely on the user environment likely being modern
}

check();
