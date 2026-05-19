# Task 2c-4: Upload & Media System Tester & Fixer

## Summary
Tested and fixed the ORRA social media app's file upload and media system. Found and fixed 8 issues, with the most critical being that story uploads were saving base64 data URLs directly to the database instead of saving files to disk.

## Issues Found & Fixed

### Critical
1. **Story API saves base64 directly to DB** — POST /api/stories was storing entire base64 data URLs in the Story.image column. Fixed by rewriting the endpoint to save files to disk via sharp (images) and writeFile (videos), storing only URL paths in DB.

### High
2. **No file type validation on story creation** — Added ALLOWED_IMAGE_TYPES and ALLOWED_VIDEO_TYPES validation
3. **No file size validation on story creation** — Added 10MB/50MB limits with descriptive error messages
4. **Story model missing mediaType field** — Added `mediaType String @default("image")` to schema, ran db:push
5. **StoryBar only accepted images** — Added video file input, upload button, preview, and upload flow
6. **StoryViewer only rendered images** — Added conditional `<video>` rendering for video stories

### Medium/Low
7. **StoryGroupData type missing mediaType** — Added to TypeScript interfaces in api-hooks.ts
8. **Fallback stories missing mediaType** — Added `mediaType: 'image'` to all FALLBACK_STORIES entries

## Files Modified
- `/prisma/schema.prisma` — Added mediaType field to Story model
- `/src/app/api/stories/route.ts` — Complete rewrite of POST endpoint
- `/src/components/aura/story-viewer.tsx` — Video upload + rendering support
- `/src/lib/api-hooks.ts` — Added mediaType to interfaces

## What Was Already Working (No Changes Needed)
- `/api/uploads` — Upload API works correctly (POST base64, GET file serving with Range support)
- `/api/serve-file` — File serving routes work correctly
- Post image/video upload via `/api/posts` — Works correctly with uploadedFiles
- Profile avatar/cover upload via `/api/users/profile` — Works correctly with saveBase64AsFile
- Reel video upload via `/api/reels` — Works correctly with videoFile
- Create Post Modal UI — Image/video upload flow is correct
- Edit Profile Modal UI — Avatar/cover upload flow is correct
