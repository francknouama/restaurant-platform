# Database Migrations

This directory contains SQL migration files for the Restaurant Platform database schema.

## Migration Files

1. **001_create_menus_table.sql** - Creates the menus table with categories stored as JSONB
2. **002_create_orders_table.sql** - Creates the orders table with items stored as JSONB
3. **003_create_reservations_table.sql** - Creates the reservations table for table bookings
4. **004_create_kitchen_orders_table.sql** - Creates the kitchen_orders table for kitchen management
5. **005_create_inventory_table.sql** - Creates inventory and inventory_transactions tables

## Running Migrations

To run these migrations, execute them in order against your PostgreSQL database:

```bash
# Using psql
psql -U postgres -d restaurant_platform -f migrations/001_create_menus_table.sql
psql -U postgres -d restaurant_platform -f migrations/002_create_orders_table.sql
psql -U postgres -d restaurant_platform -f migrations/003_create_reservations_table.sql
psql -U postgres -d restaurant_platform -f migrations/004_create_kitchen_orders_table.sql
psql -U postgres -d restaurant_platform -f migrations/005_create_inventory_table.sql
```

Or run all at once:
```bash
for file in migrations/*.sql; do
    echo "Running $file..."
    psql -U postgres -d restaurant_platform -f "$file"
done
```

## Environment Setup

Make sure to set the following environment variables before starting the application:

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_NAME=restaurant_platform
export DB_SSLMODE=disable

export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=
export REDIS_DB=0

export SERVER_PORT=8080
export SERVER_HOST=localhost
```

## Database Schema Overview

- **menus**: Stores menu configurations with categories and items as JSONB
- **orders**: Stores customer orders with items as JSONB
- **reservations**: Stores table reservations and booking information
- **kitchen_orders**: Stores kitchen workflow and order preparation status
- **inventory**: Stores ingredient and supply inventory
- **inventory_transactions**: Tracks all inventory movements and changes