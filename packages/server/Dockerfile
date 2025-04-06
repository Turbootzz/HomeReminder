# 1. Base Image (Choose Node version)
FROM node:18-alpine AS base

# 2. Set working directory
WORKDIR /app

# 3. Copy root package.json and lockfile AND workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 4. Copy server package.json
COPY packages/server/package.json ./packages/server/

# 5. Install ONLY production dependencies using pnpm workspace filter
# --prod flag installs only dependencies, not devDependencies
# Use --frozen-lockfile for reproducible builds in CI/CD
RUN npm install -g pnpm && \
    pnpm install --filter server --prod --frozen-lockfile

# 6. Copy Prisma schema
COPY packages/server/prisma ./packages/server/prisma

# 7. Generate Prisma Client (needed for runtime)
# Ensure your schema definition doesn't rely on dev dependencies for generation
# If it does, you might need a multi-stage build where you install dev deps first
RUN pnpm --filter server exec prisma generate

# 8. Copy server source code AFTER installing deps (leverage caching)
COPY packages/server/src ./packages/server/src

# 9. Build TypeScript code
# If you haven't installed devDependencies, you need tsc globally or use a build stage
# Option A: Install devDeps temporarily (simpler Dockerfile)
# RUN pnpm install --filter server --dev --frozen-lockfile && \
#     pnpm --filter server run build && \
#     pnpm prune --filter server --prod # Remove devDependencies after build

# Option B: Multi-stage build (more optimized) - Preferred
# Stage 1: Build Stage
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/server/package.json ./packages/server/
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/server/prisma ./packages/server/prisma
COPY packages/server/src ./packages/server/src
# Install ALL dependencies needed for build and prisma generate
RUN npm install -g pnpm && \
    pnpm install --filter server --frozen-lockfile
# Generate prisma client again if needed by build process
RUN pnpm --filter server exec prisma generate
# Build the code
RUN pnpm --filter server run build

# Stage 2: Production Stage
FROM base AS production
WORKDIR /app
# Copy only production dependencies from base stage's node_modules
COPY --from=base /app/node_modules ./node_modules
# Copy server-specific production node_modules (might be nested)
COPY --from=base /app/packages/server/node_modules ./packages/server/node_modules
# Copy built code from builder stage
COPY --from=builder /app/packages/server/dist ./packages/server/dist
# Copy prisma schema and client (needed at runtime)
COPY --from=builder /app/packages/server/prisma ./packages/server/prisma
# Copy generated client files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/server/node_modules/.prisma ./packages/server/node_modules/.prisma


# 10. Expose port
EXPOSE 5001

# 11. Define command to run the app
# Note: Use the relative path from the WORKDIR /app
CMD ["node", "packages/server/dist/index.js"]