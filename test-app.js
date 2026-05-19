const http = require('http');

// Test that the server responds correctly
function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, size: data.length, hasError: data.includes('Application error') });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== ORRA Server Health Check ===\n');
  
  const tests = [
    { path: '/', name: 'Home Page' },
    { path: '/api/auth/session', name: 'Auth Session' },
    { path: '/api/orra', name: 'ORRA API' },
  ];
  
  for (const test of tests) {
    try {
      const result = await testEndpoint(test.path);
      const status = result.status === 200 ? '✅' : '❌';
      const errorCheck = result.hasError ? '⚠️ HAS APP ERROR' : '';
      console.log(`${status} ${test.name}: HTTP ${result.status} (${result.size} bytes) ${errorCheck}`);
    } catch (e) {
      console.log(`❌ ${test.name}: ${e.message}`);
    }
  }
  
  // Test login
  const loginData = JSON.stringify({ email: 'alex@orra.app', password: 'password123' });
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  };
  
  const loginResult = await new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.write(loginData);
    req.end();
  });
  
  console.log(`\n📋 Login test: HTTP ${loginResult.status}`);
  if (loginResult.status > 0) {
    try {
      const parsed = JSON.parse(loginResult.body);
      console.log(`   Success: ${parsed.success || false}`);
      if (parsed.error) console.log(`   Error: ${parsed.error}`);
    } catch {}
  }
  
  console.log('\n=== Server running on PM2 ===');
}

runTests().catch(console.error);
