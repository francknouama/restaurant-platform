#!/bin/bash

# Restaurant Platform Bootstrap Script
# This script sets up the entire development environment

set -e

echo "🍽️  Restaurant Platform Bootstrap"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version >/dev/null 2>&1; then
    print_error "Docker Compose is not available. Please install Docker Compose and try again."
    exit 1
fi

print_status "Stopping any existing containers..."
docker compose -f docker-compose.test.yml down --remove-orphans 2>/dev/null || true

print_status "Building and starting services..."
docker compose -f docker-compose.test.yml up --build -d

print_status "Waiting for services to be healthy..."

# Wait for database
print_status "Waiting for PostgreSQL..."
while ! docker exec restaurant-postgres-test pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
    echo -n "."
done
echo ""
print_success "PostgreSQL is ready!"

# Wait for Redis
print_status "Waiting for Redis..."
while ! docker exec restaurant-redis-test redis-cli ping >/dev/null 2>&1; do
    sleep 2
    echo -n "."
done
echo ""
print_success "Redis is ready!"

# Wait for backend
print_status "Waiting for Backend API..."
for i in {1..30}; do
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        break
    fi
    sleep 3
    echo -n "."
done
echo ""

if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_success "Backend API is ready!"
else
    print_error "Backend API failed to start. Check logs with: docker compose -f docker-compose.test.yml logs backend"
    exit 1
fi

# Wait for frontend
print_status "Waiting for Frontend..."
for i in {1..30}; do
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        break
    fi
    sleep 3
    echo -n "."
done
echo ""

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend is ready!"
else
    print_warning "Frontend might still be starting up. Check logs with: docker compose -f docker-compose.test.yml logs frontend"
fi

echo ""
echo "🎉 Bootstrap Complete!"
echo "====================="
echo ""
echo "📋 Services Available:"
echo "   • Frontend:     http://localhost:3000"
echo "   • Backend API:  http://localhost:8080"
echo "   • Health Check: http://localhost:8080/health"
echo "   • API Docs:     http://localhost:8080/api"
echo ""
echo "🔧 Database Access:"
echo "   • PostgreSQL:   localhost:5432"
echo "   • Username:     postgres"
echo "   • Password:     postgres123"
echo "   • Database:     restaurant_platform"
echo ""
echo "💾 Cache Access:"
echo "   • Redis:        localhost:6379"
echo ""
echo "📊 Management Commands:"
echo "   • View logs:    docker compose -f docker-compose.test.yml logs -f"
echo "   • Stop:         docker compose -f docker-compose.test.yml down"
echo "   • Restart:      docker compose -f docker-compose.test.yml restart"
echo ""
print_success "Ready for testing! 🚀"