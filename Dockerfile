# =============================================================================
# ORRA Social App - Multi-Stage Docker Build
# Next.js 16 + Prisma + SQLite + NextAuth
# =============================================================================

# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies required for native modules (SQLite, etc.)
RUN apk add --no-cache libc6-compat openssl

# Copy package manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run database seed (creates founder account and initial data)
RUN npx prisma db seed || true

# Build the Next.js application (outputs standalone by default in next.config)
RUN npm run build

# ---- Stage 3: Runner (Production) ----
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the standalone Next.js output (includes node_modules subset)
COPY --from=builder /app/.next/standalone ./

# Copy static assets that aren't included in standalone
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory with all assets
COPY --from=builder /app/public ./public

# Ensure image/music/upload directories exist (for volume mounts)
RUN mkdir -p ./public/images ./public/uploads ./public/music

# Copy Prisma schema and migrations for runtime
COPY --from=builder /app/prisma ./prisma

# Copy the database if it exists (will be overridden by volume mount in production)
COPY --from=builder /app/prisma/dev.db ./prisma/dev.db 2>/dev/null || true

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Health check — confirms the app is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the Next.js standalone server
CMD ["node", "server.js"]
