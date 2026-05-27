# =============================================================================
# ORRA Social App - Dockerfile
# =============================================================================
# Build: docker build -t orra-social-app .
# Run:   docker run -p 3000:3000 -v orra-data:/app/db orra-social-app
#
# This Dockerfile creates a production-ready container with:
# - Node.js 20 LTS
# - SQLite with persistent volume support
# - Health check endpoint
# - Auto-seeding on first run
# =============================================================================

FROM node:20-slim

# Install dependencies needed for better-sqlite3 and sharp
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js application
RUN npm run build

# Create data directories
RUN mkdir -p /app/db /app/public/uploads /app/logs

# Environment variables (override at runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_URL=file:/app/db/custom.db
ENV NEXTAUTH_SECRET=orra-super-secret-key-2025-production
ENV NEXTAUTH_URL=http://localhost:3000
ENV AUTH_TRUST_HOST=true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
