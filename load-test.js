/**
 * ORRA Load Test - Simulating 50 Concurrent Users
 * 
 * Tests:
 * 1. Login with credentials (all 13 seeded users + 37 new signups)
 * 2. Fetch /api/me (authenticated user data)
 * 3. Fetch /api/posts (feed)
 * 4. Create a post
 * 5. Like a post
 * 6. Update profile
 * 
 * Reports: Response times, success rates, error rates, throughput
 */

const BASE_URL = 'http://localhost:3000';

// Seeded demo accounts
const DEMO_ACCOUNTS = [
  { email: 'nick@orra.app', password: 'password123', name: 'Nick Joseph' },
  { email: 'jessica@orra.app', password: 'password123', name: 'Jessica Art' },
  { email: 'david@orra.app', password: 'password123', name: 'David Chen' },
  { email: 'sarah@orra.app', password: 'password123', name: 'Sarah Kim' },
  { email: 'marcus@orra.app', password: 'password123', name: 'Marcus Rivera' },
  { email: 'elena@orra.app', password: 'password123', name: 'Elena Rodriguez' },
  { email: 'techdaily@orra.app', password: 'password123', name: 'Tech Daily' },
  { email: 'wellness@orra.app', password: 'password123', name: 'Wellness Guru' },
  { email: 'cyberdrift@orra.app', password: 'password123', name: 'Cyber Drifter' },
  { email: 'musiccentral@orra.app', password: 'password123', name: 'Music Central' },
  { email: 'lunasky@orra.app', password: 'password123', name: 'Luna Sky' },
  { email: 'kaistorm@orra.app', password: 'password123', name: 'Kai Storm' },
  { email: 'novablaze@orra.app', password: 'password123', name: 'Nova Blaze' },
];

// Results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  byEndpoint: {},
  loginResults: { success: 0, failed: 0, times: [] },
  users: [],
};

function recordRequest(endpoint, duration, success, error = null) {
  results.totalRequests++;
  if (success) results.successfulRequests++;
  else results.failedRequests++;
  results.responseTimes.push(duration);
  
  if (!results.byEndpoint[endpoint]) {
    results.byEndpoint[endpoint] = { count: 0, success: 0, failed: 0, times: [] };
  }
  results.byEndpoint[endpoint].count++;
  if (success) results.byEndpoint[endpoint].success++;
  else results.byEndpoint[endpoint].failed++;
  results.byEndpoint[endpoint].times.push(duration);
  
  if (error) {
    results.errors.push({ endpoint, error: error.slice(0, 100), duration });
  }
}

// Helper: make HTTP request and measure time
async function timedFetch(url, options = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000), // 15s timeout
    });
    const duration = performance.now() - start;
    const text = await res.text();
    return { status: res.status, duration, body: text, ok: res.ok };
  } catch (err) {
    const duration = performance.now() - start;
    return { status: 0, duration, body: '', ok: false, error: err.message };
  }
}

// Step 1: Login and get session cookie
async function loginUser(email, password) {
  const start = performance.now();
  try {
    // First get the CSRF token
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, {
      signal: AbortSignal.timeout(10000),
    });
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    
    // Get cookies from CSRF response
    const setCookieHeader = csrfRes.headers.get('set-cookie') || '';
    const cookies = setCookieHeader;
    
    // Now login with credentials
    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies,
      },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&csrfToken=${encodeURIComponent(csrfToken)}`,
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });
    
    const duration = performance.now() - start;
    
    // Get session cookie from login response
    const loginCookies = loginRes.headers.get('set-cookie') || '';
    const sessionCookie = loginCookies.split(',').find(c => c.includes('next-auth.session-token')) || loginCookies;
    
    // Extract just the session token cookie
    const cookieMatch = sessionCookie.match(/next-auth\.session-token=[^;]+/);
    const finalCookie = cookieMatch ? cookieMatch[0] : (cookies ? cookies.split(';')[0] : '');
    
    const success = loginRes.status === 302 || loginRes.ok;
    
    results.loginResults.times.push(duration);
    if (success) results.loginResults.success++;
    else results.loginResults.failed++;
    
    return { success, cookie: finalCookie, duration };
  } catch (err) {
    const duration = performance.now() - start;
    results.loginResults.times.push(duration);
    results.loginResults.failed++;
    return { success: false, cookie: '', duration, error: err.message };
  }
}

// Step 2: Sign up a new user (for simulating 50 total users)
async function signUpUser(index) {
  const email = `testuser${index}@orra.app`;
  const name = `Test User ${index}`;
  const handle = `@testuser${index}`;
  
  const { status, duration, body, ok, error } = await timedFetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, handle, password: 'password123' }),
  });
  
  recordRequest('POST /api/auth/signup', duration, ok && status === 201, error || (ok ? null : `Status ${status}: ${body.slice(0, 100)}`));
  
  if (ok && status === 201) {
    // Now login with the new account
    return await loginUser(email, 'password123');
  }
  
  // If email already registered, try logging in instead
  if (status === 400 && body.includes('already registered')) {
    return await loginUser(email, 'password123');
  }
  
  return { success: false, cookie: '', duration };
}

// Simulate a single user session
async function simulateUser(userId, cookie) {
  const userActions = [];
  
  // Action 1: Fetch user profile (/api/me)
  {
    const res = await timedFetch(`${BASE_URL}/api/me`, {
      headers: { 'Cookie': cookie },
    });
    recordRequest('GET /api/me', res.duration, res.ok, res.error);
    userActions.push({ action: 'fetch_profile', time: res.duration, ok: res.ok });
  }
  
  // Action 2: Fetch feed posts
  {
    const res = await timedFetch(`${BASE_URL}/api/posts?limit=10`, {
      headers: { 'Cookie': cookie },
    });
    recordRequest('GET /api/posts', res.duration, res.ok, res.error);
    userActions.push({ action: 'fetch_posts', time: res.duration, ok: res.ok });
    
    // Try to parse posts and like the first one
    let firstPostId = null;
    try {
      const data = JSON.parse(res.body);
      if (data.success && data.data?.posts?.length > 0) {
        firstPostId = data.data.posts[0].id;
      }
    } catch {}
    
    // Action 3: Like a post
    if (firstPostId) {
      const likeRes = await timedFetch(`${BASE_URL}/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        body: JSON.stringify({ targetId: firstPostId, targetType: 'post' }),
      });
      recordRequest('POST /api/likes', likeRes.duration, likeRes.ok, likeRes.error);
      userActions.push({ action: 'like_post', time: likeRes.duration, ok: likeRes.ok });
    }
  }
  
  // Action 4: Create a post
  {
    const createRes = await timedFetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({
        text: `Load test post from User ${userId} at ${new Date().toISOString()}`,
        images: [],
        vibeTag: 'hyped',
      }),
    });
    recordRequest('POST /api/posts', createRes.duration, createRes.ok, createRes.error);
    userActions.push({ action: 'create_post', time: createRes.duration, ok: createRes.ok });
  }
  
  // Action 5: Fetch posts again (to see other users' posts)
  {
    const res = await timedFetch(`${BASE_URL}/api/posts?limit=20`, {
      headers: { 'Cookie': cookie },
    });
    recordRequest('GET /api/posts (refresh)', res.duration, res.ok, res.error);
    userActions.push({ action: 'refresh_feed', time: res.duration, ok: res.ok });
  }
  
  // Action 6: Update profile
  {
    const profileRes = await timedFetch(`${BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({
        bio: `Load test bio for User ${userId}`,
        location: userId <= 13 ? 'New Orleans, LA' : 'Test City',
      }),
    });
    recordRequest('PUT /api/users/profile', profileRes.duration, profileRes.ok, profileRes.error);
    userActions.push({ action: 'update_profile', time: profileRes.duration, ok: profileRes.ok });
  }
  
  // Action 7: Fetch stories
  {
    const res = await timedFetch(`${BASE_URL}/api/stories`, {
      headers: { 'Cookie': cookie },
    });
    recordRequest('GET /api/stories', res.duration, res.ok || res.status === 404, res.error);
    userActions.push({ action: 'fetch_stories', time: res.duration, ok: res.ok });
  }
  
  // Action 8: Fetch notifications
  {
    const res = await timedFetch(`${BASE_URL}/api/notifications`, {
      headers: { 'Cookie': cookie },
    });
    recordRequest('GET /api/notifications', res.duration, res.ok || res.status === 404, res.error);
    userActions.push({ action: 'fetch_notifications', time: res.duration, ok: res.ok });
  }
  
  return userActions;
}

// Calculate statistics
function stats(times) {
  if (times.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...times].sort((a, b) => a - b);
  return {
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
    p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
    p99: Math.round(sorted[Math.floor(sorted.length * 0.99)]),
  };
}

// Main test runner
async function main() {
  console.log('🚀 ORRA Load Test - Simulating 50 Concurrent Users');
  console.log('=' .repeat(60));
  console.log(`Target: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');
  
  // Phase 1: Check server is up
  console.log('📡 Phase 1: Checking server availability...');
  const healthCheck = await timedFetch(BASE_URL);
  if (!healthCheck.ok && healthCheck.status !== 200) {
    console.log(`❌ Server not available! Status: ${healthCheck.status}`);
    process.exit(1);
  }
  console.log(`✅ Server is up (response time: ${Math.round(healthCheck.duration)}ms)`);
  console.log('');
  
  // Phase 2: Login all 13 demo users + sign up 37 more = 50 total
  console.log('🔐 Phase 2: Authenticating 50 users (13 demo + 37 new signups)...');
  const loginStart = performance.now();
  const userSessions = [];
  
  // Login demo users in parallel
  const demoLoginPromises = DEMO_ACCOUNTS.map((account, i) => 
    loginUser(account.email, account.password).then(result => ({
      userId: i + 1,
      name: account.name,
      ...result,
    }))
  );
  const demoResults = await Promise.all(demoLoginPromises);
  userSessions.push(...demoResults);
  
  console.log(`  ✅ Demo users: ${demoResults.filter(r => r.success).length}/13 logged in`);
  
  // Sign up 37 more users in parallel batches of 10
  for (let batch = 0; batch < 4; batch++) {
    const batchSize = batch === 3 ? 7 : 10;
    const batchPromises = [];
    for (let i = 0; i < batchSize; i++) {
      const userIndex = 14 + batch * 10 + i;
      batchPromises.push(
        signUpUser(userIndex).then(result => ({
          userId: userIndex,
          name: `Test User ${userIndex}`,
          ...result,
        }))
      );
    }
    const batchResults = await Promise.all(batchPromises);
    userSessions.push(...batchResults);
    console.log(`  ✅ Batch ${batch + 1}: ${batchResults.filter(r => r.success).length}/${batchSize} signed up`);
  }
  
  const loginDuration = performance.now() - loginStart;
  const successfulLogins = userSessions.filter(u => u.success).length;
  console.log(`\n  📊 Login Results: ${successfulLogins}/50 authenticated in ${Math.round(loginDuration)}ms`);
  console.log(`  📊 Login time stats: ${JSON.stringify(stats(results.loginResults.times))}`);
  console.log('');
  
  if (successfulLogins === 0) {
    console.log('❌ No users could authenticate. Aborting test.');
    process.exit(1);
  }
  
  // Phase 3: Simulate concurrent user activity
  console.log('👥 Phase 3: Simulating concurrent user activity (8 actions per user)...');
  const activityStart = performance.now();
  
  // Run all 50 users' actions concurrently
  const activeUsers = userSessions.filter(u => u.success && u.cookie);
  const userActionPromises = activeUsers.map(user => 
    simulateUser(user.userId, user.cookie)
  );
  
  const actionResults = await Promise.all(userActionPromises);
  const activityDuration = performance.now() - activityStart;
  
  const totalActions = actionResults.reduce((sum, actions) => sum + actions.length, 0);
  const successfulActions = actionResults.reduce(
    (sum, actions) => sum + actions.filter(a => a.ok).length, 0
  );
  
  console.log(`  ✅ Completed ${totalActions} total actions in ${Math.round(activityDuration)}ms`);
  console.log(`  ✅ Successful: ${successfulActions}/${totalActions} (${Math.round(successfulActions/totalActions*100)}%)`);
  console.log('');
  
  // Phase 4: Stress test - rapid repeated requests from all users
  console.log('⚡ Phase 4: Stress test - 5 rapid feed refreshes per user...');
  const stressStart = performance.now();
  
  const stressPromises = activeUsers.map(user => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        timedFetch(`${BASE_URL}/api/posts?limit=10&page=${i+1}`, {
          headers: { 'Cookie': user.cookie },
        }).then(res => {
          recordRequest('GET /api/posts (stress)', res.duration, res.ok, res.error);
          return res;
        })
      );
    }
    return Promise.all(requests);
  });
  
  await Promise.all(stressPromises);
  const stressDuration = performance.now() - stressStart;
  const stressRequests = activeUsers.length * 5;
  
  console.log(`  ✅ Completed ${stressRequests} rapid requests in ${Math.round(stressDuration)}ms`);
  console.log(`  ✅ Throughput: ${Math.round(stressRequests / (stressDuration / 1000))} req/sec`);
  console.log('');
  
  // Phase 5: Unauthenticated load (public pages)
  console.log('🌐 Phase 5: Unauthenticated page load test (50 concurrent)...');
  const unauthStart = performance.now();
  
  const unauthPromises = [];
  for (let i = 0; i < 50; i++) {
    unauthPromises.push(
      timedFetch(BASE_URL).then(res => {
        recordRequest('GET / (unauth)', res.duration, res.ok, res.error);
        return res;
      })
    );
  }
  
  await Promise.all(unauthPromises);
  const unauthDuration = performance.now() - unauthStart;
  
  console.log(`  ✅ 50 page loads in ${Math.round(unauthDuration)}ms`);
  console.log('');
  
  // ============================================
  // FINAL REPORT
  // ============================================
  console.log('=' .repeat(60));
  console.log('📊 ORRA LOAD TEST REPORT - 50 CONCURRENT USERS');
  console.log('=' .repeat(60));
  console.log('');
  
  // Overall stats
  console.log('── OVERALL ──');
  console.log(`Total Requests:      ${results.totalRequests}`);
  console.log(`Successful:          ${results.successfulRequests} (${Math.round(results.successfulRequests/results.totalRequests*100)}%)`);
  console.log(`Failed:              ${results.failedRequests} (${Math.round(results.failedRequests/results.totalRequests*100)}%)`);
  console.log(`Response Time (avg): ${stats(results.responseTimes).avg}ms`);
  console.log(`Response Time (p50): ${stats(results.responseTimes).p50}ms`);
  console.log(`Response Time (p95): ${stats(results.responseTimes).p95}ms`);
  console.log(`Response Time (p99): ${stats(results.responseTimes).p99}ms`);
  console.log(`Response Time (max): ${stats(results.responseTimes).max}ms`);
  console.log('');
  
  // Auth stats
  console.log('── AUTHENTICATION ──');
  console.log(`Successful Logins:   ${results.loginResults.success}/50`);
  console.log(`Failed Logins:       ${results.loginResults.failed}/50`);
  console.log(`Login Time (avg):    ${stats(results.loginResults.times).avg}ms`);
  console.log(`Login Time (p95):    ${stats(results.loginResults.times).p95}ms`);
  console.log('');
  
  // Per-endpoint stats
  console.log('── PER-ENDPOINT ──');
  for (const [endpoint, data] of Object.entries(results.byEndpoint)) {
    const s = stats(data.times);
    const successRate = Math.round(data.success / data.count * 100);
    console.log(`${endpoint}`);
    console.log(`  Requests: ${data.count} | Success: ${successRate}% | Avg: ${s.avg}ms | P50: ${s.p50}ms | P95: ${s.p95}ms | Max: ${s.max}ms`);
  }
  console.log('');
  
  // Throughput
  const totalTestDuration = (performance.now() - loginStart) / 1000;
  const throughput = Math.round(results.totalRequests / totalTestDuration);
  console.log('── THROUGHPUT ──');
  console.log(`Total Test Duration: ${Math.round(totalTestDuration)}s`);
  console.log(`Overall Throughput:  ${throughput} req/sec`);
  console.log(`Concurrent Users:    50`);
  console.log('');
  
  // Verdict
  console.log('── VERDICT ──');
  const avgResponseTime = stats(results.responseTimes).avg;
  const p95ResponseTime = stats(results.responseTimes).p95;
  const successRate = Math.round(results.successfulRequests / results.totalRequests * 100);
  
  const canSupport50 = successRate >= 95 && p95ResponseTime < 5000 && results.loginResults.success >= 40;
  
  if (canSupport50) {
    console.log('✅ ORRA CAN support 50 concurrent users');
    console.log(`   - ${successRate}% success rate (target: ≥95%)`);
    console.log(`   - ${p95ResponseTime}ms P95 response time (target: <5000ms)`);
    console.log(`   - ${results.loginResults.success}/50 users authenticated (target: ≥40)`);
    console.log(`   - ${throughput} req/sec throughput`);
  } else {
    console.log('⚠️  ORRA may need optimization for 50 concurrent users');
    if (successRate < 95) console.log(`   - ❌ Success rate ${successRate}% is below 95% target`);
    else console.log(`   - ✅ Success rate ${successRate}% meets ≥95% target`);
    if (p95ResponseTime >= 5000) console.log(`   - ❌ P95 response time ${p95ResponseTime}ms exceeds 5000ms target`);
    else console.log(`   - ✅ P95 response time ${p95ResponseTime}ms is under 5000ms target`);
    if (results.loginResults.success < 40) console.log(`   - ❌ Only ${results.loginResults.success}/50 users could authenticate`);
    else console.log(`   - ✅ ${results.loginResults.success}/50 users authenticated`);
  }
  console.log('');
  
  // Errors (show first 10)
  if (results.errors.length > 0) {
    console.log('── ERRORS (first 10) ──');
    results.errors.slice(0, 10).forEach(e => {
      console.log(`  ${e.endpoint}: ${e.error} (${Math.round(e.duration)}ms)`);
    });
    console.log('');
  }
  
  console.log('=' .repeat(60));
  console.log('Load test complete.');
}

main().catch(err => {
  console.error('Load test failed:', err);
  process.exit(1);
});
