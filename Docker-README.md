# Restaurant Platform - Docker Setup

This document provides comprehensive instructions for running the Restaurant Platform using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

## 🏗️ Architecture

The platform consists of the following services:

- **Backend API**: Go application with Gin framework
- **PostgreSQL**: Primary database with restaurant data
- **Redis**: Caching and session storage
- **Frontend**: Nginx serving static files (future)
- **Migrate**: Database migration tool (optional)

## 🚀 Quick Start

### Production Environment

```bash
# Start all services
make up

# Or without make
docker-compose up -d

# View logs
make logs

# Stop services
make down
```

### Development Environment

```bash
# Start development environment with hot reload
make dev

# Or without make
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Stop development environment
make dev-down
```

## 📊 Service Details

### Backend API

- **Container**: `restaurant-backend`
- **Port**: `8080` (production), `8080` (development)
- **Health Check**: `http://localhost:8080/health`
- **Environment Variables**:
  - `DB_HOST`: Database hostname (default: postgres)
  - `DB_PORT`: Database port (default: 5432)
  - `DB_USERNAME`: Database username (default: postgres)
  - `DB_PASSWORD`: Database password (default: postgres123)
  - `DB_NAME`: Database name (default: restaurant_platform)
  - `REDIS_HOST`: Redis hostname (default: redis)
  - `REDIS_PORT`: Redis port (default: 6379)
  - `SERVER_PORT`: API server port (default: 8080)
  - `GIN_MODE`: Gin framework mode (release/debug)

### PostgreSQL Database

- **Container**: `restaurant-postgres`
- **Port**: `5432` (production), `5433` (development)
- **Database**: `restaurant_platform` (production), `restaurant_platform_dev` (development)
- **Username**: `postgres`
- **Password**: `postgres123`
- **Volume**: `postgres_data` (production), `postgres_dev_data` (development)

### Redis Cache

- **Container**: `restaurant-redis`
- **Port**: `6379` (production), `6380` (development)
- **Volume**: `redis_data` (production), `redis_dev_data` (development)
- **Persistence**: AOF enabled

## 🛠️ Development Features

### Hot Reload

The development environment includes hot reload using [Air](https://github.com/air-verse/air):

- Go code changes trigger automatic rebuilds
- No need to restart containers during development
- Real-time log output

### Database Migrations

```bash
# Run migrations (production)
make migrate

# Run migrations (development)
make migrate-dev

# Connect to database shell
make db-shell
```

### SQLC Code Generation

```bash
# Generate SQLC code
make sqlc

# Verify SQLC configuration
make sqlc-verify
```

## 🧪 Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run linting
make lint
```

## 📝 Available Commands

### Production Commands

- `make up` - Start production services
- `make down` - Stop all services
- `make build` - Build all service images
- `make logs` - View service logs

### Development Commands

- `make dev` - Start development environment
- `make dev-down` - Stop development environment
- `make dev-logs` - View development logs

### Database Commands

- `make migrate` - Run database migrations
- `make db-shell` - Connect to database shell
- `make reset-db` - Reset database with fresh data

### Maintenance Commands

- `make clean` - Clean containers and volumes
- `make clean-all` - Clean everything including images
- `make health` - Check service health status
- `make ps` - Show running containers

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root to override default settings:

```bash
# Database
DB_PASSWORD=your_secure_password
DB_NAME=your_database_name

# Redis
REDIS_PASSWORD=your_redis_password

# Backend
SERVER_PORT=8080
GIN_MODE=release
LOG_LEVEL=info

# SSL (for production)
DB_SSLMODE=require
```

### Custom Configuration

For production deployments, consider:

1. **Security**: Change default passwords
2. **SSL**: Enable SSL for database connections
3. **Resources**: Adjust container resource limits
4. **Monitoring**: Add health check endpoints
5. **Backup**: Configure database backup strategy

## 🚀 Production Deployment

### Preparation

```bash
# Prepare for deployment
make deploy-prepare
```

### Environment-Specific Overrides

Create `docker-compose.prod.yml` for production-specific settings:

```yaml
services:
  backend:
    environment:
      GIN_MODE: release
      LOG_LEVEL: warn
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

### SSL Configuration

For production with SSL:

```yaml
services:
  backend:
    environment:
      DB_SSLMODE: require
      REDIS_TLS: true
```

## 📊 Monitoring and Logs

### Health Checks

All services include health checks:

```bash
# Check overall health
make health

# View specific service health
docker-compose exec backend wget -q --spider http://localhost:8080/health
```

### Logging

```bash
# View all logs
make logs

# View specific service logs
docker-compose logs -f backend

# Follow logs with timestamps
docker-compose logs -f -t
```

### Resource Monitoring

```bash
# View container resource usage
docker stats

# View container processes
make ps
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Conflicts**: Change ports in docker-compose files
2. **Permission Issues**: Ensure Docker daemon is running
3. **Database Connection**: Check network connectivity between services
4. **Migration Failures**: Verify database schema and permissions

### Debug Commands

```bash
# Get shell access to containers
docker-compose exec backend sh
docker-compose exec postgres bash

# Check container logs
docker-compose logs backend
docker-compose logs postgres

# Inspect container configuration
docker-compose config

# Check network connectivity
docker network ls
docker network inspect restaurant-platform_restaurant-network
```

### Reset Environment

```bash
# Complete reset
make clean-all
make setup

# Reset just the database
make reset-db
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [Air Hot Reload Tool](https://github.com/air-verse/air)
- [SQLC Documentation](https://sqlc.dev/)

## 🤝 Contributing

When working with Docker setup:

1. Test changes in development environment first
2. Update this documentation for any configuration changes
3. Verify health checks work correctly
4. Test migration scripts with fresh database
5. Update resource limits as needed