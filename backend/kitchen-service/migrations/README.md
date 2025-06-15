# Kitchen Service Database Migrations

This directory contains SQL migration files for the Kitchen Service database schema.

**Database Name**: `kitchen_service_db`

## Migration Files

1. **001_create_kitchen_orders_table.sql** - Kitchen order management tables and indexes

## Running Migrations

Execute migrations against the Kitchen Service database:

```bash
# Create database
createdb -U postgres kitchen_service_db

# Run migrations
psql -U postgres -d kitchen_service_db -f 001_create_kitchen_orders_table.sql
```

## Environment Variables

Set these environment variables for the Kitchen Service:

```bash
export KITCHEN_DB_HOST=localhost
export KITCHEN_DB_PORT=5432
export KITCHEN_DB_USERNAME=postgres
export KITCHEN_DB_PASSWORD=your_password
export KITCHEN_DB_NAME=kitchen_service_db
export KITCHEN_DB_SSLMODE=disable
```

## Database Schema

- **kitchen_orders**: Stores kitchen preparation workflow
  - Links to orders via order_id (event-driven, no foreign key)
  - Priority system: LOW, NORMAL, HIGH, URGENT
  - Status flow: PENDING → IN_PROGRESS → READY → COMPLETED
  - Chef assignment and timing tracking