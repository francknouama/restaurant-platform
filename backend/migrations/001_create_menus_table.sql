-- Create menus table
CREATE TABLE IF NOT EXISTS menus (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    categories JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_menus_is_active ON menus(is_active);
CREATE INDEX IF NOT EXISTS idx_menus_start_date ON menus(start_date);
CREATE INDEX IF NOT EXISTS idx_menus_created_at ON menus(created_at);

-- Ensure only one active menu at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_menus_unique_active 
ON menus(is_active) WHERE is_active = true;