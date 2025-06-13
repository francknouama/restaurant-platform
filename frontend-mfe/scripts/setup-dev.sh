#!/bin/bash

echo "🚀 Setting up Restaurant Platform MFE Development Environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    echo "Run: npm install -g pnpm"
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend is not running on port 8080${NC}"
    echo "Please start the backend services first."
    echo "Run: cd ../backend && docker-compose up -d"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
pnpm install

# Setup environment files
echo -e "${GREEN}🔧 Setting up environment files...${NC}"
if [ ! -f apps/shell-app/.env ]; then
    cp apps/shell-app/.env.example apps/shell-app/.env
    echo "Created apps/shell-app/.env"
fi

# Build shared packages
echo -e "${GREEN}🏗️  Building shared packages...${NC}"
pnpm build:shared

# Start development servers
echo -e "${GREEN}🎉 Starting development servers...${NC}"
echo ""
echo "Shell App: http://localhost:3000"
echo "Menu MFE: http://localhost:3001"
echo "Orders MFE: http://localhost:3002"
echo "Kitchen MFE: http://localhost:3003"
echo "Reservations MFE: http://localhost:3004"
echo "Inventory MFE: http://localhost:3005"
echo ""
echo -e "${GREEN}Starting all MFEs...${NC}"

# Run development servers
pnpm dev