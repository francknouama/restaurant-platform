-- Inventory Service Database Schema
-- Database: inventory_service_db

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    current_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    minimum_quantity DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    maximum_quantity DECIMAL(10, 3),
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    supplier_id VARCHAR(255),
    supplier_name VARCHAR(255),
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    expiry_date DATE,
    location VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create inventory_transactions table for tracking stock movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id VARCHAR(255) PRIMARY KEY,
    inventory_id VARCHAR(255) NOT NULL REFERENCES inventory(id),
    transaction_type VARCHAR(20) NOT NULL 
        CHECK (transaction_type IN ('RESTOCK', 'USAGE', 'WASTE', 'ADJUSTMENT')),
    quantity_change DECIMAL(10, 3) NOT NULL,
    quantity_before DECIMAL(10, 3) NOT NULL,
    quantity_after DECIMAL(10, 3) NOT NULL,
    unit_cost DECIMAL(10, 2),
    reason VARCHAR(255),
    reference_id VARCHAR(255), -- Could reference order_id, etc. (event-driven, no FK)
    performed_by VARCHAR(255),
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_current_quantity ON inventory(current_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_minimum_quantity ON inventory(minimum_quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON inventory(is_active);

-- Create indexes for inventory_transactions table
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference_id ON inventory_transactions(reference_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inventory_category_active ON inventory(category, is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(current_quantity, minimum_quantity) 
    WHERE is_active = TRUE;