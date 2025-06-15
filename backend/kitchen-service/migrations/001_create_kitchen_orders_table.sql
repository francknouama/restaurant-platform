-- Kitchen Service Database Schema
-- Database: kitchen_service_db

-- Create kitchen_orders table
CREATE TABLE IF NOT EXISTS kitchen_orders (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL, -- Reference to order in Order Service (via events)
    order_items JSONB NOT NULL DEFAULT '[]',
    priority VARCHAR(10) NOT NULL DEFAULT 'NORMAL' 
        CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED')),
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,
    assigned_chef_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_order_id ON kitchen_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_priority ON kitchen_orders(priority);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_chef_id ON kitchen_orders(assigned_chef_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_created_at ON kitchen_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_estimated_completion ON kitchen_orders(estimated_completion_time);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status_priority ON kitchen_orders(status, priority);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_chef_status ON kitchen_orders(assigned_chef_id, status) 
    WHERE assigned_chef_id IS NOT NULL;