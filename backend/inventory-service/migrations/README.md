# Inventory Service Database Migrations

This directory contains SQL migration files for the Inventory Service database schema.

**Database Name**: `inventory_service_db`

## Migration Files

1. **001_create_inventory_tables.sql** - Core inventory and transaction tables with indexes

## Running Migrations

Execute migrations against the Inventory Service database:

```bash
# Create database
createdb -U postgres inventory_service_db

# Run migrations
psql -U postgres -d inventory_service_db -f 001_create_inventory_tables.sql
```

## Environment Variables

Set these environment variables for the Inventory Service:

```bash
export INVENTORY_DB_HOST=localhost
export INVENTORY_DB_PORT=5432
export INVENTORY_DB_USERNAME=postgres
export INVENTORY_DB_PASSWORD=your_password
export INVENTORY_DB_NAME=inventory_service_db
export INVENTORY_DB_SSLMODE=disable
```

## Database Schema

- **inventory**: Stores ingredient and supply inventory
  - Quantity tracking with min/max thresholds
  - Supplier information and cost tracking
  - Expiry date and location management
  - Support for various units (lbs, kg, pieces, etc.)

- **inventory_transactions**: Tracks all inventory movements
  - Transaction types: RESTOCK, USAGE, WASTE, ADJUSTMENT
  - Full audit trail with before/after quantities
  - Reference tracking to external entities (orders, etc.)
  - User tracking for accountability