-- User Service Database Schema - Roles
-- Database: user_service_db

-- Create roles table for role-based access control
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

-- Add name validation constraint
ALTER TABLE roles 
ADD CONSTRAINT check_role_name_format 
CHECK (name ~ '^[a-z_]+$' AND LENGTH(name) >= 3);

-- Update updated_at timestamp automatically
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default restaurant roles
INSERT INTO roles (id, name, description, created_at, updated_at) VALUES
    ('role_admin', 'admin', 'Administrator with full system access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_manager', 'manager', 'Restaurant manager with operational access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_kitchen_staff', 'kitchen_staff', 'Kitchen staff with order and inventory access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_waitstaff', 'waitstaff', 'Wait staff with order and customer access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_host', 'host', 'Host with reservation and seating access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('role_cashier', 'cashier', 'Cashier with payment and order completion access', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Now add the foreign key constraint to users table
ALTER TABLE users 
ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;