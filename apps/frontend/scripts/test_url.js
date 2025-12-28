
const process = { env: { NEXT_PUBLIC_API_URL: 'http://localhost:3001' } };

const getResumeUrl = (path) => {
    if (!path) return '#';
    let cleanPath = path.trim();
    // Remove surrounding quotes if present
    cleanPath = cleanPath.replace(/^["']|["']$/g, '');

    console.log('Input:', path);
    console.log('Clean:', cleanPath);

    if (cleanPath.match(/^https?:\/\//i)) {
        console.log('Matched HTTP/S');
        return cleanPath;
    }

    console.log('Not Matched');
    return `${process.env.NEXT_PUBLIC_API_URL}/${cleanPath.replace(/\\/g, '/')}`;
};

const url1 = 'https://iosolutions.ca/wp-content/uploads/gravity_forms/1-1d5baf030e82d22f87ca2b5e5a0308d2/2025/12/CV-OUSSAMA-TARAR.pdf';
const url2 = 'https://iosolutions.ca/wp-content/uploads/gravity_forms/1-1d5baf030e82d22f87ca2b5e5a0308d2/2025/12/Kl.pdf';
const urlWithQuotes = '"https://iosolutions.ca/wp-content/uploads/gravity_forms/1-1d5baf030e82d22f87ca2b5e5a0308d2/2025/12/Kl.pdf"';
const urlWithSpaces = '  https://iosolutions.ca/wp-content/uploads/gravity_forms/1-1d5baf030e82d22f87ca2b5e5a0308d2/2025/12/Kl.pdf  ';

console.log('--- Test 1 ---');
console.log('Result:', getResumeUrl(url1));
console.log('--- Test 2 ---');
console.log('Result:', getResumeUrl(url2));
console.log('--- Test 3 (Quotes) ---');
console.log('Result:', getResumeUrl(urlWithQuotes));
console.log('--- Test 4 (Spaces) ---');
console.log('Result:', getResumeUrl(urlWithSpaces));
