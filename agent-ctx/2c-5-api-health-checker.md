# Task 2c-5: API Health Checker

## Summary
Comprehensive health check of ALL 59 ORRA API route files. Read every route, tested each with curl, identified and fixed 12 issues across 9 files.

## Issues Found and Fixed

### Critical (500 errors)
1. **GET /api/posts** — 500 on page=0 or limit=abc → Added NaN/negative validation
2. **GET /api/hubs/[hubId]/posts** — Same pagination crash → Added validation
3. **GET /api/reels/[id]** — 500 for nonexistent ID → Added existence check before view increment, proper 404

### High (Missing validation/sanitization)
4. **POST /api/hubs/[hubId]/posts** — No sanitization + race condition → Added sanitizeText(), validateLength(), atomic increment
5. **POST /api/dance/entries** — No sanitization/length limit → Added sanitizeText(), validateLength()
6. **POST /api/games/hot-take** — No max length/sanitization → Added validateLength(), sanitizeText()
7. **POST /api/games/submit** — No length limit/sanitization → Added validateLength(), sanitizeText()
8. **POST /api/orra/spend** — No action whitelist → Added validActions array + max amount cap

### Medium
9. **PATCH /api/games/session/[id]** — No length limit/sanitization → Added for string playerInput
10. **POST /api/stories** — No image URL length validation → Added validateLength()
11. **POST/GET /api/blocks** — Inconsistent response format → Wrapped in data object
12. **POST/GET /api/mutes** — Inconsistent response format → Wrapped in data object

## Files Modified
- /src/app/api/posts/route.ts
- /src/app/api/hubs/[hubId]/posts/route.ts
- /src/app/api/reels/[id]/route.ts
- /src/app/api/dance/entries/route.ts
- /src/app/api/games/hot-take/route.ts
- /src/app/api/games/submit/route.ts
- /src/app/api/games/session/[id]/route.ts
- /src/app/api/stories/route.ts
- /src/app/api/blocks/route.ts
- /src/app/api/mutes/route.ts
- /src/app/api/orra/spend/route.ts

## Security Verified
- Path traversal: Safe (uploads, serve-file)
- SQL injection: Safe (Prisma parameterized)
- Auth checks: All write endpoints require auth
- Rate limiting: Present on signup and forgot-password
