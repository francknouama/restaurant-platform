# Docker Images Used in Restaurant Platform

This document lists all Docker images used in the Restaurant Platform setup.

## 📦 Production Images

### Core Services

| Service | Image | Version | Purpose |
|---------|-------|---------|---------|
| **PostgreSQL** | `postgres:15-alpine` | 15.x | Primary database for restaurant data |
| **Redis** | `redis:7-alpine` | 7.x | Caching and session storage |
| **Frontend** | `nginx:alpine` | latest | Static file serving and reverse proxy |

### Tools & Utilities

| Service | Image | Version | Purpose |
|---------|-------|---------|---------|
| **Migrate** | `migrate/migrate:latest` | latest | Database schema migrations |

### Custom Built

| Service | Base Image | Purpose |
|---------|------------|---------|
| **Backend API** | `golang:1.24-alpine` → `scratch` | Go REST API server |

## 🔧 Development Images

### Development Overrides

| Service | Image | Changes from Production |
|---------|-------|------------------------|
| **PostgreSQL** | `postgres:15-alpine` | Different database name and port |
| **Redis** | `redis:7-alpine` | Different port for dev isolation |
| **Backend API** | `golang:1.24-alpine` | Hot reload with Air, debug mode |

## 📋 Image Details

### PostgreSQL (`postgres:15-alpine`)
- **Size**: ~230MB
- **Features**: 
  - Alpine Linux base for security
  - PostgreSQL 15 with JSON/JSONB support
  - Built-in health checks
  - UTF-8 encoding
- **Environment**: 
  - Production: `restaurant_platform` database
  - Development: `restaurant_platform_dev` database

### Redis (`redis:7-alpine`)
- **Size**: ~30MB
- **Features**:
  - Alpine Linux base
  - AOF persistence enabled
  - Built-in health checks
  - Memory efficient
- **Environment**:
  - Production: Port 6379
  - Development: Port 6380

### Backend API (Custom)
- **Production Build**:
  - Multi-stage build starting from `golang:1.24-alpine`
  - Final image based on `scratch` (~20MB)
  - Statically linked binary
  - Non-root user for security
- **Development Build**:
  - Single stage from `golang:1.24-alpine`
  - Air hot reload tool installed
  - Source code mounted for live editing
  - Debug mode enabled

### Nginx (`nginx:alpine`)
- **Size**: ~25MB
- **Features**:
  - Alpine Linux base
  - Static file serving
  - Reverse proxy to backend API
  - CORS configuration
  - Gzip compression

### Migrate (`migrate/migrate:latest`)
- **Size**: ~15MB
- **Features**:
  - CLI tool for database migrations
  - PostgreSQL driver included
  - Runs as one-time job
  - Profile-based execution

## 🔒 Security Considerations

### Image Selection Criteria
- **Alpine Linux**: Used where possible for minimal attack surface
- **Official Images**: Using official Docker Hub images
- **Specific Versions**: Pinned versions to avoid breaking changes
- **Minimal Base**: `scratch` for production Go binary

### Security Features
- **Non-root Users**: All services run as non-root
- **Health Checks**: All services have health monitoring
- **Network Isolation**: Services communicate via Docker networks
- **Resource Limits**: CPU and memory limits in production

## 📊 Resource Usage

### Typical Resource Consumption

| Service | CPU | Memory | Disk |
|---------|-----|--------|------|
| PostgreSQL | 0.1-0.5 CPU | 256-512MB | 1-10GB |
| Redis | 0.05-0.2 CPU | 50-200MB | 100-500MB |
| Backend API | 0.1-0.3 CPU | 50-128MB | 20MB |
| Nginx | 0.05-0.1 CPU | 10-50MB | 25MB |

### Storage Volumes

| Volume | Purpose | Estimated Size |
|--------|---------|----------------|
| `postgres_data` | Database storage | 1-10GB |
| `redis_data` | Cache persistence | 100-500MB |

## 🔄 Update Strategy

### Image Updates
```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d

# Clean old images
docker image prune
```

### Version Pinning
- **PostgreSQL**: Pinned to major version (15) for stability
- **Redis**: Pinned to major version (7) for compatibility
- **Golang**: Pinned to specific version (1.24) for build consistency
- **Nginx**: Uses latest Alpine for security updates

## 🚀 Optimization

### Production Optimizations
- Multi-stage builds reduce image size
- Scratch-based final images for minimal footprint
- Alpine Linux for security and size
- Health checks for reliability
- Resource limits for predictable performance

### Development Optimizations
- Source code mounting for hot reload
- Separate ports to avoid conflicts
- Debug modes enabled
- Development-specific environment variables