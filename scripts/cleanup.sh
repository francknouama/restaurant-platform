#!/bin/bash

# Restaurant Platform Cleanup Script
# Stops all services and cleans up resources

set -e

echo "🧹 Restaurant Platform Cleanup"
echo "=============================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop all compose files
print_status "Stopping Docker Compose services..."

docker compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.full.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
docker compose -f docker-compose.microservices.yml down --remove-orphans 2>/dev/null || true

print_success "All services stopped"

# Optional: Remove volumes (uncomment if you want to clean database data)
read -p "Do you want to remove database volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removing volumes..."
    docker volume rm restaurant-platform_postgres_data 2>/dev/null || true
    docker volume rm restaurant-platform_redis_data 2>/dev/null || true
    print_success "Volumes removed"
else
    print_status "Volumes preserved"
fi

# Optional: Remove images
read -p "Do you want to remove built images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Removing built images..."
    docker images | grep restaurant | awk '{print $3}' | xargs -r docker rmi 2>/dev/null || true
    print_success "Images removed"
else
    print_status "Images preserved"
fi

# Clean up dangling images and containers
print_status "Cleaning up Docker system..."
docker system prune -f >/dev/null 2>&1 || true

print_success "✨ Cleanup complete!"
echo ""
echo "To restart the platform, run:"
echo "  ./scripts/bootstrap.sh"