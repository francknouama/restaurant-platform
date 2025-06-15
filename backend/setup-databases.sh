#!/bin/bash

# Restaurant Platform - Microservices Database Setup Script
# This script creates all service databases and runs their migrations

set -e  # Exit on any error

echo "🏗️  Restaurant Platform Database Setup"
echo "========================================="

# Database credentials (modify as needed)
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if PostgreSQL is running
check_postgres() {
    echo -e "${BLUE}🔍 Checking PostgreSQL connection...${NC}"
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
        echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
        echo "Please ensure PostgreSQL is running and accessible with user '$DB_USER'"
        exit 1
    fi
    echo -e "${GREEN}✅ PostgreSQL connection successful${NC}"
}

# Function to create a database if it doesn't exist
create_database() {
    local db_name=$1
    echo -e "${BLUE}📦 Creating database: $db_name${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$db_name"; then
        echo -e "${YELLOW}⚠️  Database $db_name already exists, skipping creation${NC}"
    else
        createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$db_name"
        echo -e "${GREEN}✅ Database $db_name created successfully${NC}"
    fi
}

# Function to run migrations for a service
run_migrations() {
    local service_name=$1
    local db_name=$2
    local migration_path=$3
    
    echo -e "${BLUE}🚀 Running migrations for $service_name${NC}"
    
    if [ ! -d "$migration_path" ]; then
        echo -e "${RED}❌ Migration directory not found: $migration_path${NC}"
        return 1
    fi
    
    # Run migrations in order
    for migration_file in "$migration_path"/*.sql; do
        if [ -f "$migration_file" ]; then
            local filename=$(basename "$migration_file")
            echo -e "${YELLOW}   📄 Running: $filename${NC}"
            
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_name" -f "$migration_file" > /dev/null 2>&1; then
                echo -e "${GREEN}   ✅ $filename completed${NC}"
            else
                echo -e "${RED}   ❌ $filename failed${NC}"
                return 1
            fi
        fi
    done
    
    echo -e "${GREEN}✅ $service_name migrations completed${NC}"
}

# Main setup function
main() {
    echo -e "${BLUE}Starting database setup...${NC}\n"
    
    # Check PostgreSQL connection
    check_postgres
    echo ""
    
    # Service configurations: service_name:db_name:migration_path
    declare -a services=(
        "Menu Service:menu_service_db:menu-service/migrations"
        "Order Service:order_service_db:order-service/migrations"
        "Kitchen Service:kitchen_service_db:kitchen-service/migrations"
        "Inventory Service:inventory_service_db:inventory-service/migrations"
        "Reservation Service:reservation_service_db:reservation-service/migrations"
        "User Service:user_service_db:user-service/migrations"
    )
    
    # Process each service
    for service_config in "${services[@]}"; do
        IFS=':' read -r service_name db_name migration_path <<< "$service_config"
        
        echo -e "${BLUE}🔧 Setting up $service_name${NC}"
        echo "   Database: $db_name"
        echo "   Migrations: $migration_path"
        
        # Create database
        create_database "$db_name"
        
        # Run migrations
        if run_migrations "$service_name" "$db_name" "$migration_path"; then
            echo -e "${GREEN}✅ $service_name setup completed successfully${NC}"
        else
            echo -e "${RED}❌ $service_name setup failed${NC}"
            exit 1
        fi
        
        echo ""
    done
    
    echo -e "${GREEN}🎉 All databases setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Summary:${NC}"
    echo "   • 6 service databases created"
    echo "   • All migrations executed successfully"
    echo "   • Services are ready to run"
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "   1. Set environment variables for each service"
    echo "   2. Update service configurations to use separate databases"
    echo "   3. Test service connections"
    echo ""
    echo -e "${BLUE}📖 For more information, see:${NC}"
    echo "   • MIGRATION_GUIDE.md - Complete migration documentation"
    echo "   • Each service's migrations/README.md - Service-specific details"
}

# Run main function
main "$@"