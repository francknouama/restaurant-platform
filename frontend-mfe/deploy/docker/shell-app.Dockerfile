# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy shell app
COPY apps/shell-app/ ./apps/shell-app/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @restaurant/shared-ui build && \
    pnpm --filter @restaurant/shared-state build && \
    pnpm --filter @restaurant/shared-utils build

# Build shell app
RUN pnpm --filter @restaurant/shell-app build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY deploy/docker/nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/apps/shell-app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]