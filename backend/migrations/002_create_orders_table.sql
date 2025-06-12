-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DINE_IN', 'TAKEOUT', 'DELIVERY')),
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' 
        CHECK (status IN ('CREATED', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    table_id VARCHAR(255),
    delivery_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders(total_amount);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status) WHERE table_id IS NOT NULL;