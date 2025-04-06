# Stage 1: Build the React app
FROM node:18-alpine AS build
WORKDIR /app

# Copy root configs and client package.json
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/client/package.json ./packages/client/
COPY packages/client/tsconfig.json ./packages/client/
COPY packages/client/vite.config.ts ./packages/client/
COPY packages/client/postcss.config.js ./packages/client/
COPY packages/client/tailwind.config.js ./packages/client/

# Install all dependencies for client
RUN npm install -g pnpm && \
    pnpm install --filter client --frozen-lockfile

# Copy client source code
COPY packages/client/src ./packages/client/src
COPY packages/client/public ./packages/client/public
COPY packages/client/index.html ./packages/client/

# Build the static files
RUN pnpm --filter client run build
# Output will be in packages/client/dist

# Stage 2: Serve static files with Nginx
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=build /app/packages/client/dist .

# Copy custom nginx config (optional but recommended)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]