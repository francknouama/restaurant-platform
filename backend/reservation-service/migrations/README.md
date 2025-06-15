# Reservation Service Database Migrations

This directory contains SQL migration files for the Reservation Service database schema.

**Database Name**: `reservation_service_db`

## Migration Files

1. **001_create_reservations_table.sql** - Core reservation management tables and indexes

## Running Migrations

Execute migrations against the Reservation Service database:

```bash
# Create database
createdb -U postgres reservation_service_db

# Run migrations
psql -U postgres -d reservation_service_db -f 001_create_reservations_table.sql
```

## Environment Variables

Set these environment variables for the Reservation Service:

```bash
export RESERVATION_DB_HOST=localhost
export RESERVATION_DB_PORT=5432
export RESERVATION_DB_USERNAME=postgres
export RESERVATION_DB_PASSWORD=your_password
export RESERVATION_DB_NAME=reservation_service_db
export RESERVATION_DB_SSLMODE=disable
```

## Database Schema

- **reservations**: Stores table reservations and booking information
  - Status flow: PENDING → CONFIRMED → SEATED → COMPLETED
  - Support for cancellations and no-shows
  - Party size management and duration tracking
  - Special requests and contact information
  - Unique constraint prevents double-booking