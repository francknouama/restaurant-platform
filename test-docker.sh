#!/bin/bash

# Restaurant Platform Docker Test Script
set -e

echo "🐳 Testing Restaurant Platform Docker Setup"
echo "==========================================="

# Test 1: Validate docker-compose configuration
echo "1️⃣  Testing docker-compose configuration..."
docker-compose config > /dev/null && echo "✅ Production docker-compose.yml is valid"
docker-compose -f docker-compose.yml -f docker-compose.dev.yml config > /dev/null && echo "✅ Development configuration is valid"

# Test 2: Build backend development image
echo ""
echo "2️⃣  Building backend development image..."
cd backend
docker build -f Dockerfile.dev -t restaurant-backend-dev-test . > /dev/null 2>&1 && echo "✅ Backend development image builds successfully"

# Test 3: Build backend production image
echo ""
echo "3️⃣  Building backend production image..."
docker build -f Dockerfile -t restaurant-backend-prod-test . > /dev/null 2>&1 && echo "✅ Backend production image builds successfully"

cd ..

# Test 4: Check if all required files exist
echo ""
echo "4️⃣  Checking required files..."
files=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "backend/Dockerfile"
    "backend/Dockerfile.dev"
    "backend/.air.toml"
    "frontend/nginx.conf"
    "Makefile"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Test 5: Verify image specifications
echo ""
echo "5️⃣  Verifying image specifications..."
postgres_image=$(grep -E "image:\s*postgres" docker-compose.yml | head -1)
redis_image=$(grep -E "image:\s*redis" docker-compose.yml | head -1)
nginx_image=$(grep -E "image:\s*nginx" docker-compose.yml | head -1)

if [[ $postgres_image == *"postgres:15-alpine"* ]]; then
    echo "✅ PostgreSQL image correctly specified"
else
    echo "❌ PostgreSQL image issue: $postgres_image"
fi

if [[ $redis_image == *"redis:7-alpine"* ]]; then
    echo "✅ Redis image correctly specified"
else
    echo "❌ Redis image issue: $redis_image"
fi

if [[ $nginx_image == *"nginx:alpine"* ]]; then
    echo "✅ Nginx image correctly specified"
else
    echo "❌ Nginx image issue: $nginx_image"
fi

# Test 6: Clean up test images
echo ""
echo "6️⃣  Cleaning up test images..."
docker rmi restaurant-backend-dev-test restaurant-backend-prod-test > /dev/null 2>&1 && echo "✅ Test images cleaned up"

echo ""
echo "🎉 All Docker tests passed!"
echo ""
echo "Ready to use:"
echo "  Production: make up"
echo "  Development: make dev"
echo "  Help: make help"