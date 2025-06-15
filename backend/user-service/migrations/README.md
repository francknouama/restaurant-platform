# User Service Database Migrations

This directory contains SQL migration files for the User Service database schema.

**Database Name**: `user_service_db`

## Migration Files

1. **001_create_users_table.sql** - Core user accounts and authentication
2. **002_create_roles_table.sql** - Role-based access control roles
3. **003_create_permissions_table.sql** - Granular permissions and role-permission mapping
4. **004_create_user_sessions_table.sql** - JWT session management and tracking
5. **005_setup_role_permissions.sql** - Default role permission assignments

## Running Migrations

Execute migrations in order against the User Service database:

```bash
# Create database
createdb -U postgres user_service_db

# Run migrations in order
psql -U postgres -d user_service_db -f 001_create_users_table.sql
psql -U postgres -d user_service_db -f 002_create_roles_table.sql
psql -U postgres -d user_service_db -f 003_create_permissions_table.sql
psql -U postgres -d user_service_db -f 004_create_user_sessions_table.sql
psql -U postgres -d user_service_db -f 005_setup_role_permissions.sql
```

Or run all at once:
```bash
for file in 001_*.sql 002_*.sql 003_*.sql 004_*.sql 005_*.sql; do
    echo "Running migration: $file"
    psql -U postgres -d user_service_db -f "$file"
done
```

## Environment Variables

Set these environment variables for the User Service:

```bash
export USER_DB_HOST=localhost
export USER_DB_PORT=5432
export USER_DB_USERNAME=postgres
export USER_DB_PASSWORD=your_password
export USER_DB_NAME=user_service_db
export USER_DB_SSLMODE=disable
```

## Database Schema

- **users**: User accounts with email/password authentication
- **roles**: Predefined restaurant roles (admin, manager, kitchen_staff, waitstaff, host, cashier)
- **permissions**: Granular permissions for different resources and actions
- **role_permissions**: Many-to-many mapping between roles and permissions
- **user_sessions**: JWT session tracking with refresh tokens

## Default Roles and Permissions

### Roles
- **admin**: Full system access
- **manager**: Operational access with reporting
- **kitchen_staff**: Kitchen and inventory management
- **waitstaff**: Order and customer service
- **host**: Reservation and seating management  
- **cashier**: Payment processing and order completion

### Permission Structure
- Format: `resource:action` (e.g., `menu:view`, `order:create`)
- Resources: menu, order, kitchen, reservation, inventory, user, report
- Actions: view, create, update, delete, manage