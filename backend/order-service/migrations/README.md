# Order Service Database Migrations

This directory contains SQL migration files for the Order Service database schema.

**Database Name**: `order_service_db`

## Migration Files

1. **001_create_orders_table.sql** - Core order management tables and indexes

## Running Migrations

Execute migrations against the Order Service database:

```bash
# Create database
createdb -U postgres order_service_db

# Run migrations
psql -U postgres -d order_service_db -f 001_create_orders_table.sql
```

## Environment Variables

Set these environment variables for the Order Service:

```bash
export ORDER_DB_HOST=localhost
export ORDER_DB_PORT=5432
export ORDER_DB_USERNAME=postgres
export ORDER_DB_PASSWORD=your_password
export ORDER_DB_NAME=order_service_db
export ORDER_DB_SSLMODE=disable
```

## Database Schema

- **orders**: Stores customer orders with items as JSONB
  - Order types: DINE_IN, TAKEOUT, DELIVERY
  - Status flow: CREATED → PAID → PREPARING → READY → COMPLETED
  - Automatic tax calculation (10%)
  - Support for table assignments and delivery addresses