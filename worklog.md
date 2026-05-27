---
Task ID: 1
Agent: Main Agent
Task: Fix server freezing after 3-5 min idle — keep the ORRA container alive

Work Log:
- Diagnosed that localhost pings don't count as external traffic to the platform
- Discovered the public URL: https://preview-chat-706d244e-3872-423f-8515-99e9c1c9cde8.space.chatglm.site
- Found that ORRA_PUBLIC_URL was never set in dev.sh or server.js environment
- Found that discovered-url.txt was empty, so server.js's public URL ping was dead
- Updated dev.sh with 4-tier public URL auto-discovery system
- Updated server.js auto-discovery to include chat-UUID and hostname patterns
- Added public URL ping to dev.sh supervisor loop (every 10s)
- Added external-keepalive.sh as backup (pings public URL every 30s)
- Saved public URL to discovered-url.txt for persistence
- Set NEXTAUTH_URL to public URL (fixes auth)
- Restarted server with ORRA_PUBLIC_URL set
- Verified [KEEPALIVE] ★ PUBLIC URL ping OK — container is ALIVE!
- Committed and pushed all changes to GitHub

Stage Summary:
- Root cause: Server was only pinging localhost, which the platform doesn't count as real traffic
- Fix: Now pings the PUBLIC URL every 10 seconds (server.js) + every 30 seconds (external script)
- The public URL request goes through the platform's load balancer, so it counts as real traffic
- Server should now stay alive indefinitely
- All changes committed: e5f6dd7
