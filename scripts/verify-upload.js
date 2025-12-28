const http = require('http');
const fs = require('fs');
const path = require('path');

const boundary = '--------------------------' + Date.now().toString(16);
const filename = 'test-logo.txt';
const fileContent = 'fake image content';

// Create a dummy file
fs.writeFileSync(filename, fileContent);

const postDataStart = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    'Content-Type: text/plain',
    '',
    fileContent,
    `--${boundary}--`
].join('\r\n');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/uploads',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postDataStart),
        'x-user-id': '7dab14af-99fa-4ede-9b71-ad3d31a01231'
    }
};

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);

    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(postDataStart);
req.end();

// Cleanup
// fs.unlinkSync(filename);
