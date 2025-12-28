const http = require('http');

const data = JSON.stringify({
    name: 'Updated Corp',
    address: '123 Tech Lane'
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/company',
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
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

req.write(data);
req.end();
