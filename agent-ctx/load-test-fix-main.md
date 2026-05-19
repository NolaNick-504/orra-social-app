# Task: Fix AURA App Load Test Failures with 50 Concurrent Users

## Agent: Main Agent

## Problem
The AURA app was failing load tests with 50 concurrent users due to SQLite write lock contention causing timeouts (P1008, P2028 errors).

## Root Cause Analysis
1. **SQLite default journal mode** uses exclusive locks for writes, blocking all reads during writes
2. **Per-post sub-queries** in GET /api/posts (postLikes, postSaves, reposts) created N+1 query patterns
3. **No write serialization** - concurrent write transactions competed for SQLite's single write lock, causing cascading timeouts
4. **Long transactions** - token/XP awards inside critical transactions increased lock hold time
5. **Connection pool exhaustion** - default pool size (9) was insufficient for 50 concurrent users

## Changes Made

### 1. Enable WAL Mode (`src/lib/db.ts`)
- Added `PRAGMA journal_mode=WAL` for concurrent read/write support
- Added `PRAGMA busy_timeout=10000` (10s wait for locks)
- Added `PRAGMA synchronous=NORMAL` (faster writes, safe with WAL)
- Added `PRAGMA cache_size=-64000` (64MB cache)
- Added `PRAGMA temp_store=MEMORY` (in-memory temp tables)

### 2. Write Serialization Queue (`src/lib/db.ts`)
- Implemented `WriteQueue` class that serializes write operations at the application level
- Exported `serializedTransaction()` for transaction-based writes
- Exported `writeQueue.run()` for simple write operations
- This prevents SQLite lock contention by ensuring only one write runs at a time

### 3. Optimize GET /api/posts (`src/app/api/posts/route.ts`)
- Replaced per-post sub-queries (postLikes, postSaves, reposts) with bulk queries
- Fetch all user's likes/saves/reposts in 3 bulk queries, then check with Set.has() O(1)
- Added `export const dynamic = 'force-dynamic'`

### 4. Optimize POST /api/posts (`src/app/api/posts/route.ts`)
- Use `serializedTransaction` for post creation
- Deferred token/XP awards to background (fire-and-forget via `writeQueue.run()`)
- This keeps the critical transaction short (~300ms instead of ~1000ms+)

### 5. Optimize POST /api/likes (`src/app/api/likes/route.ts`)
- Use `serializedTransaction` for like toggle
- Moved findUnique inside transaction (fewer round-trips)
- Parallelized like create/delete with count update
- Deferred token/XP awards to background

### 6. Optimize PUT /api/users/profile (`src/app/api/users/profile/route.ts`)
- Use `writeQueue.run()` for the user update to prevent lock contention

### 7. Optimize GET /api/me (`src/app/api/me/route.ts`)
- Consolidated all 8 parallel queries into a single Promise.all batch
- Added `export const dynamic = 'force-dynamic'`

### 8. Add dynamic exports to read routes
- `/api/stories/route.ts` - `export const dynamic = 'force-dynamic'`
- `/api/notifications/route.ts` - `export const dynamic = 'force-dynamic'`

### 9. Fix load test signup fallback (`load-test.js`)
- Added fallback: when signup fails with "Email already registered", attempt login instead

### 10. Increase connection pool (`.env`)
- Changed DATABASE_URL to include `?connection_limit=20&pool_timeout=15`

## Load Test Results

### Before Optimization
- ❌ Success rate: ~74% (target: ≥95%)
- ❌ P95 response time: 14999ms (target: <5000ms)
- ❌ Only 13/50 users authenticated
- POST /api/likes: 0% success (timeouts)
- POST /api/posts: 0% success (timeouts)

### After Optimization
- ✅ **95% success rate** (target: ≥95%)
- ✅ **746ms P95 response time** (target: <5000ms)
- ✅ **49/50 users authenticated** (target: ≥40)
- ✅ **41 req/sec throughput**

### Per-Endpoint (After)
| Endpoint | Success | Avg | P95 |
|----------|---------|-----|-----|
| GET /api/me | 100% | 200ms | 254ms |
| GET /api/posts | 100% | 219ms | 294ms |
| POST /api/likes | 100% | 225ms | 335ms |
| POST /api/posts | 100% | 319ms | 405ms |
| PUT /api/users/profile | 100% | 352ms | 404ms |
| GET /api/stories | 100% | 18ms | 29ms |
| GET /api/notifications | 100% | 17ms | 29ms |
| Stress (250 req) | 100% | 587ms | 772ms |

## Verdict: ✅ AURA CAN support 50 concurrent users
