# Restaurant Platform - Microservices Database Migration Guide

This guide explains the microservices database architecture where **each service has its own dedicated database**.

## Database Architecture Overview

The Restaurant Platform follows microservices principles with **database-per-service** pattern:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Menu Service  │    │  Order Service  │    │ Kitchen Service │
│                 │    │                 │    │                 │
│ menu_service_db │    │order_service_db │    │kitchen_service_db│
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Inventory Service│    │Reservation Svc  │    │  User Service   │
│                 │    │                 │    │                 │
│inventory_svc_db │    │reservation_svc_db│   │ user_service_db │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Service-Specific Databases

### 1. Menu Service (`menu_service_db`)
- **Tables**: menus
- **Purpose**: Menu management with categories, items, and pricing
- **Location**: `backend/menu-service/migrations/`

### 2. Order Service (`order_service_db`)
- **Tables**: orders
- **Purpose**: Customer order processing and status tracking
- **Location**: `backend/order-service/migrations/`

### 3. Kitchen Service (`kitchen_service_db`)
- **Tables**: kitchen_orders
- **Purpose**: Kitchen workflow and order preparation
- **Location**: `backend/kitchen-service/migrations/`

### 4. Inventory Service (`inventory_service_db`)
- **Tables**: inventory, inventory_transactions
- **Purpose**: Stock management and supply chain
- **Location**: `backend/inventory-service/migrations/`

### 5. Reservation Service (`reservation_service_db`)
- **Tables**: reservations
- **Purpose**: Table booking and customer management
- **Location**: `backend/reservation-service/migrations/`

### 6. User Service (`user_service_db`)
- **Tables**: users, roles, permissions, role_permissions, user_sessions
- **Purpose**: Authentication, authorization, and user management
- **Location**: `backend/user-service/migrations/`

## Setting Up All Databases

### Prerequisites
```bash
# PostgreSQL should be installed and running
sudo systemctl start postgresql
# or
brew services start postgresql
```

### Create All Databases
```bash
#!/bin/bash
# Create all service databases
createdb -U postgres menu_service_db
createdb -U postgres order_service_db
createdb -U postgres kitchen_service_db
createdb -U postgres inventory_service_db
createdb -U postgres reservation_service_db
createdb -U postgres user_service_db
```

### Run All Migrations
```bash
#!/bin/bash
# Navigate to backend directory
cd backend

# Menu Service
echo "🍽️  Setting up Menu Service database..."
psql -U postgres -d menu_service_db -f menu-service/migrations/001_create_menus_table.sql

# Order Service  
echo "📋 Setting up Order Service database..."
psql -U postgres -d order_service_db -f order-service/migrations/001_create_orders_table.sql

# Kitchen Service
echo "👨‍🍳 Setting up Kitchen Service database..."
psql -U postgres -d kitchen_service_db -f kitchen-service/migrations/001_create_kitchen_orders_table.sql

# Inventory Service
echo "📦 Setting up Inventory Service database..."
psql -U postgres -d inventory_service_db -f inventory-service/migrations/001_create_inventory_tables.sql

# Reservation Service
echo "📅 Setting up Reservation Service database..."
psql -U postgres -d reservation_service_db -f reservation-service/migrations/001_create_reservations_table.sql

# User Service (multiple migrations)
echo "👥 Setting up User Service database..."
psql -U postgres -d user_service_db -f user-service/migrations/001_create_users_table.sql
psql -U postgres -d user_service_db -f user-service/migrations/002_create_roles_table.sql
psql -U postgres -d user_service_db -f user-service/migrations/003_create_permissions_table.sql
psql -U postgres -d user_service_db -f user-service/migrations/004_create_user_sessions_table.sql
psql -U postgres -d user_service_db -f user-service/migrations/005_setup_role_permissions.sql

echo "✅ All databases initialized successfully!"
```

## Environment Variables by Service

Each service needs its own database configuration:

### Menu Service
```bash
export MENU_DB_HOST=localhost
export MENU_DB_PORT=5432
export MENU_DB_USERNAME=postgres
export MENU_DB_PASSWORD=your_password
export MENU_DB_NAME=menu_service_db
export MENU_DB_SSLMODE=disable
```

### Order Service
```bash
export ORDER_DB_HOST=localhost
export ORDER_DB_PORT=5432
export ORDER_DB_USERNAME=postgres
export ORDER_DB_PASSWORD=your_password
export ORDER_DB_NAME=order_service_db
export ORDER_DB_SSLMODE=disable
```

### Kitchen Service
```bash
export KITCHEN_DB_HOST=localhost
export KITCHEN_DB_PORT=5432
export KITCHEN_DB_USERNAME=postgres
export KITCHEN_DB_PASSWORD=your_password
export KITCHEN_DB_NAME=kitchen_service_db
export KITCHEN_DB_SSLMODE=disable
```

### Inventory Service
```bash
export INVENTORY_DB_HOST=localhost
export INVENTORY_DB_PORT=5432
export INVENTORY_DB_USERNAME=postgres
export INVENTORY_DB_PASSWORD=your_password
export INVENTORY_DB_NAME=inventory_service_db
export INVENTORY_DB_SSLMODE=disable
```

### Reservation Service
```bash
export RESERVATION_DB_HOST=localhost
export RESERVATION_DB_PORT=5432
export RESERVATION_DB_USERNAME=postgres
export RESERVATION_DB_PASSWORD=your_password
export RESERVATION_DB_NAME=reservation_service_db
export RESERVATION_DB_SSLMODE=disable
```

### User Service
```bash
export USER_DB_HOST=localhost
export USER_DB_PORT=5432
export USER_DB_USERNAME=postgres
export USER_DB_PASSWORD=your_password
export USER_DB_NAME=user_service_db
export USER_DB_SSLMODE=disable
```

## Data Consistency and Communication

### Event-Driven Architecture
Since each service has its own database, services communicate through:

1. **Event Publishing**: Services emit events when data changes
2. **Event Consumption**: Services listen for relevant events from other services
3. **Eventual Consistency**: Data consistency is maintained eventually, not immediately

### Cross-Service References
- **No Foreign Keys**: Services don't reference other service's data via foreign keys
- **Event-Based Updates**: Services maintain local copies of needed data via events
- **ID References**: Services store other service's entity IDs as strings (e.g., `order_id` in kitchen_orders)

### Example Event Flow
```
Order Created → Kitchen Service creates kitchen_order
Order Updated → Kitchen Service updates local kitchen_order
Kitchen Status → Order Service updates order status
```

## Migration Management

### Individual Service Migrations
Each service manages its own migration lifecycle:

```bash
# Menu Service only
cd backend/menu-service
psql -U postgres -d menu_service_db -f migrations/001_create_menus_table.sql

# Order Service only  
cd backend/order-service
psql -U postgres -d order_service_db -f migrations/001_create_orders_table.sql
```

### Backup Strategy
Each database should be backed up independently:

```bash
# Backup all service databases
pg_dump -U postgres menu_service_db > menu_service_backup.sql
pg_dump -U postgres order_service_db > order_service_backup.sql
pg_dump -U postgres kitchen_service_db > kitchen_service_backup.sql
pg_dump -U postgres inventory_service_db > inventory_service_backup.sql
pg_dump -U postgres reservation_service_db > reservation_service_backup.sql
pg_dump -U postgres user_service_db > user_service_backup.sql
```

## Benefits of This Architecture

1. **Service Independence**: Each service can evolve its schema independently
2. **Fault Isolation**: Database issues in one service don't affect others
3. **Technology Freedom**: Each service could use different database technologies
4. **Scalability**: Each database can be scaled independently based on service needs
5. **Team Autonomy**: Different teams can own different services completely

## Migration from Shared Database

If migrating from the previous shared database approach:

1. **Export Data**: Extract data from the shared `restaurant_platform` database
2. **Transform Data**: Split data by service boundaries
3. **Import Data**: Load data into respective service databases
4. **Update Connections**: Update each service to connect to its own database
5. **Test Thoroughly**: Ensure event-driven communication works correctly

## Next Steps

1. Update each service's database connection configuration
2. Implement event publishing/consumption for cross-service data needs
3. Remove any remaining foreign key references between services
4. Update deployment scripts to create all databases
5. Update backup and monitoring scripts for multiple databases