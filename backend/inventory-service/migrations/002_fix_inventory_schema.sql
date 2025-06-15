-- Fix inventory table schema to match domain model
-- Drop existing tables first
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;

-- Create inventory table with correct schema
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(255) PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    current_stock DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    unit VARCHAR(20) NOT NULL,
    min_threshold DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    max_threshold DECIMAL(10, 3),
    reorder_point DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    category VARCHAR(100),
    location VARCHAR(255),
    supplier_id VARCHAR(255),
    last_ordered TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create stock_movements table for tracking inventory changes
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(255) PRIMARY KEY,
    inventory_item_id VARCHAR(255) NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('RECEIVED', 'USED', 'WASTED', 'ADJUSTED', 'RETURNED')),
    quantity DECIMAL(10, 3) NOT NULL,
    previous_stock DECIMAL(10, 3) NOT NULL,
    new_stock DECIMAL(10, 3) NOT NULL,
    notes TEXT,
    reference VARCHAR(255), -- Order ID, supplier delivery ID, etc.
    performed_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id ON inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_current_stock ON inventory(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder_point ON inventory(reorder_point);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);

-- Create indexes for suppliers table
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);

-- Create indexes for stock_movements table
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_item_id ON stock_movements(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(current_stock, reorder_point);
CREATE INDEX IF NOT EXISTS idx_inventory_category_stock ON inventory(category, current_stock);
CREATE INDEX IF NOT EXISTS idx_movements_item_date ON stock_movements(inventory_item_id, created_at DESC);