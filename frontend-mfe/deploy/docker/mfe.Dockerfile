# Generic Dockerfile for all MFEs
# Build stage
FROM node:18-alpine AS builder

# Accept MFE name as build argument
ARG MFE_NAME

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY package.json ./

# Copy shared packages
COPY packages/ ./packages/

# Copy specific MFE
COPY apps/${MFE_NAME}/ ./apps/${MFE_NAME}/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared packages
RUN pnpm --filter @restaurant/shared-ui build && \
    pnpm --filter @restaurant/shared-state build && \
    pnpm --filter @restaurant/shared-utils build

# Build the MFE
RUN pnpm --filter @restaurant/${MFE_NAME} build

# Production stage
FROM nginx:alpine

# Accept MFE name for runtime
ARG MFE_NAME

# Copy nginx configuration
COPY deploy/docker/nginx.conf /etc/nginx/nginx.conf

# Copy built files
COPY --from=builder /app/apps/${MFE_NAME}/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]