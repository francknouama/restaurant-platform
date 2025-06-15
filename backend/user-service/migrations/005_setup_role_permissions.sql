-- User Service Database Schema - Role Permission Setup
-- Database: user_service_db

-- Setup default role permissions for restaurant RBAC

-- Admin role - Full access to everything
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions
    ('role_admin', 'perm_menu_manage', CURRENT_TIMESTAMP),
    -- Order permissions  
    ('role_admin', 'perm_order_manage', CURRENT_TIMESTAMP),
    -- Kitchen permissions
    ('role_admin', 'perm_kitchen_manage', CURRENT_TIMESTAMP),
    -- Reservation permissions
    ('role_admin', 'perm_reservation_manage', CURRENT_TIMESTAMP),
    -- Inventory permissions
    ('role_admin', 'perm_inventory_manage', CURRENT_TIMESTAMP),
    -- User permissions
    ('role_admin', 'perm_user_manage', CURRENT_TIMESTAMP),
    -- Report permissions
    ('role_admin', 'perm_report_manage', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager role - Operational access with reports
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions
    ('role_manager', 'perm_menu_view', CURRENT_TIMESTAMP),
    ('role_manager', 'perm_menu_update', CURRENT_TIMESTAMP),
    -- Order permissions
    ('role_manager', 'perm_order_manage', CURRENT_TIMESTAMP),
    -- Kitchen permissions
    ('role_manager', 'perm_kitchen_view', CURRENT_TIMESTAMP),
    ('role_manager', 'perm_kitchen_update', CURRENT_TIMESTAMP),
    -- Reservation permissions
    ('role_manager', 'perm_reservation_manage', CURRENT_TIMESTAMP),
    -- Inventory permissions
    ('role_manager', 'perm_inventory_view', CURRENT_TIMESTAMP),
    ('role_manager', 'perm_inventory_update', CURRENT_TIMESTAMP),
    -- User permissions (view only)
    ('role_manager', 'perm_user_view', CURRENT_TIMESTAMP),
    -- Report permissions
    ('role_manager', 'perm_report_view', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Kitchen staff role - Kitchen and inventory access
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions (view only)
    ('role_kitchen_staff', 'perm_menu_view', CURRENT_TIMESTAMP),
    -- Order permissions (view and update status)
    ('role_kitchen_staff', 'perm_order_view', CURRENT_TIMESTAMP),
    ('role_kitchen_staff', 'perm_order_update', CURRENT_TIMESTAMP),
    -- Kitchen permissions (full access)
    ('role_kitchen_staff', 'perm_kitchen_manage', CURRENT_TIMESTAMP),
    -- Inventory permissions (update stock levels)
    ('role_kitchen_staff', 'perm_inventory_view', CURRENT_TIMESTAMP),
    ('role_kitchen_staff', 'perm_inventory_update', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Wait staff role - Order creation and customer service
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions (view only)
    ('role_waitstaff', 'perm_menu_view', CURRENT_TIMESTAMP),
    -- Order permissions (create and update)
    ('role_waitstaff', 'perm_order_view', CURRENT_TIMESTAMP),
    ('role_waitstaff', 'perm_order_create', CURRENT_TIMESTAMP),
    ('role_waitstaff', 'perm_order_update', CURRENT_TIMESTAMP),
    -- Kitchen permissions (view queue)
    ('role_waitstaff', 'perm_kitchen_view', CURRENT_TIMESTAMP),
    -- Reservation permissions (view and update)
    ('role_waitstaff', 'perm_reservation_view', CURRENT_TIMESTAMP),
    ('role_waitstaff', 'perm_reservation_update', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Host role - Reservation and seating management
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions (view only)
    ('role_host', 'perm_menu_view', CURRENT_TIMESTAMP),
    -- Order permissions (view only)
    ('role_host', 'perm_order_view', CURRENT_TIMESTAMP),
    -- Reservation permissions (full access)
    ('role_host', 'perm_reservation_manage', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier role - Payment processing and order completion
INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES
    -- Menu permissions (view only)
    ('role_cashier', 'perm_menu_view', CURRENT_TIMESTAMP),
    -- Order permissions (view and update for payment)
    ('role_cashier', 'perm_order_view', CURRENT_TIMESTAMP),
    ('role_cashier', 'perm_order_update', CURRENT_TIMESTAMP),
    -- Kitchen permissions (view to coordinate pickup)
    ('role_cashier', 'perm_kitchen_view', CURRENT_TIMESTAMP),
    -- Report permissions (view daily sales)
    ('role_cashier', 'perm_report_view', CURRENT_TIMESTAMP)
ON CONFLICT (role_id, permission_id) DO NOTHING;