const http = require('http');

// Test login with all required fields
const loginData = JSON.stringify({ email: 'alex@orra.app', name: 'Alex', handle: '@alex', password: 'password123' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/signup',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Raw:', data);
    }
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.write(loginData);
req.end();
