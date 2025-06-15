# Menu Service Database Migrations

This directory contains SQL migration files for the Menu Service database schema.

**Database Name**: `menu_service_db`

## Migration Files

1. **001_create_menus_table.sql** - Core menu management tables and indexes

## Running Migrations

Execute migrations against the Menu Service database:

```bash
# Create database
createdb -U postgres menu_service_db

# Run migrations
psql -U postgres -d menu_service_db -f 001_create_menus_table.sql
```

## Environment Variables

Set these environment variables for the Menu Service:

```bash
export MENU_DB_HOST=localhost
export MENU_DB_PORT=5432
export MENU_DB_USERNAME=postgres
export MENU_DB_PASSWORD=your_password
export MENU_DB_NAME=menu_service_db
export MENU_DB_SSLMODE=disable
```

## Database Schema

- **menus**: Stores menu configurations with categories and items as JSONB
  - Only one menu can be active at a time
  - Version control for menu changes
  - Start/end date management for seasonal menus