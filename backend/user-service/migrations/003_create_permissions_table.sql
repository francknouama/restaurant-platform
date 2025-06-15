-- User Service Database Schema - Permissions
-- Database: user_service_db

-- Create permissions table for granular access control
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(255) NOT NULL,
    permission_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add constraints
ALTER TABLE permissions 
ADD CONSTRAINT check_permission_name_format 
CHECK (name ~ '^[a-z_:]+$' AND LENGTH(name) >= 3);

ALTER TABLE permissions 
ADD CONSTRAINT check_resource_format 
CHECK (resource ~ '^[a-z_]+$' AND LENGTH(resource) >= 3);

ALTER TABLE permissions 
ADD CONSTRAINT check_action_format 
CHECK (action ~ '^[a-z_]+$' AND LENGTH(action) >= 3);

-- Ensure unique combination of resource and action
ALTER TABLE permissions 
ADD CONSTRAINT unique_resource_action 
UNIQUE (resource, action);

-- Insert default restaurant permissions
INSERT INTO permissions (id, name, resource, action, description, created_at) VALUES
    -- Menu permissions
    ('perm_menu_view', 'menu:view', 'menu', 'view', 'View menu items and categories', CURRENT_TIMESTAMP),
    ('perm_menu_create', 'menu:create', 'menu', 'create', 'Create new menu items and categories', CURRENT_TIMESTAMP),
    ('perm_menu_update', 'menu:update', 'menu', 'update', 'Update existing menu items and categories', CURRENT_TIMESTAMP),
    ('perm_menu_delete', 'menu:delete', 'menu', 'delete', 'Delete menu items and categories', CURRENT_TIMESTAMP),
    ('perm_menu_manage', 'menu:manage', 'menu', 'manage', 'Full menu management access', CURRENT_TIMESTAMP),
    
    -- Order permissions
    ('perm_order_view', 'order:view', 'order', 'view', 'View orders and order details', CURRENT_TIMESTAMP),
    ('perm_order_create', 'order:create', 'order', 'create', 'Create new orders', CURRENT_TIMESTAMP),
    ('perm_order_update', 'order:update', 'order', 'update', 'Update order status and details', CURRENT_TIMESTAMP),
    ('perm_order_delete', 'order:delete', 'order', 'delete', 'Cancel or delete orders', CURRENT_TIMESTAMP),
    ('perm_order_manage', 'order:manage', 'order', 'manage', 'Full order management access', CURRENT_TIMESTAMP),
    
    -- Kitchen permissions
    ('perm_kitchen_view', 'kitchen:view', 'kitchen', 'view', 'View kitchen dashboard and order queue', CURRENT_TIMESTAMP),
    ('perm_kitchen_update', 'kitchen:update', 'kitchen', 'update', 'Update kitchen order status and assignments', CURRENT_TIMESTAMP),
    ('perm_kitchen_manage', 'kitchen:manage', 'kitchen', 'manage', 'Full kitchen operations access', CURRENT_TIMESTAMP),
    
    -- Reservation permissions
    ('perm_reservation_view', 'reservation:view', 'reservation', 'view', 'View reservations and table bookings', CURRENT_TIMESTAMP),
    ('perm_reservation_create', 'reservation:create', 'reservation', 'create', 'Create new reservations', CURRENT_TIMESTAMP),
    ('perm_reservation_update', 'reservation:update', 'reservation', 'update', 'Update reservation details and status', CURRENT_TIMESTAMP),
    ('perm_reservation_delete', 'reservation:delete', 'reservation', 'delete', 'Cancel or delete reservations', CURRENT_TIMESTAMP),
    ('perm_reservation_manage', 'reservation:manage', 'reservation', 'manage', 'Full reservation management access', CURRENT_TIMESTAMP),
    
    -- Inventory permissions
    ('perm_inventory_view', 'inventory:view', 'inventory', 'view', 'View inventory levels and stock', CURRENT_TIMESTAMP),
    ('perm_inventory_update', 'inventory:update', 'inventory', 'update', 'Update inventory levels and stock movements', CURRENT_TIMESTAMP),
    ('perm_inventory_manage', 'inventory:manage', 'inventory', 'manage', 'Full inventory management access', CURRENT_TIMESTAMP),
    
    -- User permissions
    ('perm_user_view', 'user:view', 'user', 'view', 'View user accounts and profiles', CURRENT_TIMESTAMP),
    ('perm_user_create', 'user:create', 'user', 'create', 'Create new user accounts', CURRENT_TIMESTAMP),
    ('perm_user_update', 'user:update', 'user', 'update', 'Update user profiles and roles', CURRENT_TIMESTAMP),
    ('perm_user_delete', 'user:delete', 'user', 'delete', 'Deactivate or delete user accounts', CURRENT_TIMESTAMP),
    ('perm_user_manage', 'user:manage', 'user', 'manage', 'Full user management access', CURRENT_TIMESTAMP),
    
    -- Report permissions
    ('perm_report_view', 'report:view', 'report', 'view', 'View reports and analytics', CURRENT_TIMESTAMP),
    ('perm_report_manage', 'report:manage', 'report', 'manage', 'Full reporting and analytics access', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;