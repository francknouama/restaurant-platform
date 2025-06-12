-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    table_id VARCHAR(255) NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120 CHECK (duration_minutes > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    special_requests TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_reservation_time ON reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reservations_table_time ON reservations(table_id, reservation_time);
CREATE INDEX IF NOT EXISTS idx_reservations_customer_status ON reservations(customer_id, status);

-- Unique constraint to prevent double booking (same table at overlapping times)
-- This is a simplified constraint; in reality, you might need a more complex check
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_unique_table_time 
ON reservations(table_id, reservation_time) 
WHERE status IN ('PENDING', 'CONFIRMED', 'SEATED');