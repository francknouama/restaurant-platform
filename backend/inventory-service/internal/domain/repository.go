package inventory

import (
	"context"
	"time"
)

// InventoryRepository defines the interface for inventory data access
type InventoryRepository interface {
	// InventoryItem operations
	CreateItem(ctx context.Context, item *InventoryItem) error
	GetItemByID(ctx context.Context, id InventoryItemID) (*InventoryItem, error)
	GetItemBySKU(ctx context.Context, sku string) (*InventoryItem, error)
	UpdateItem(ctx context.Context, item *InventoryItem) error
	DeleteItem(ctx context.Context, id InventoryItemID) error
	ListItems(ctx context.Context, offset, limit int) ([]*InventoryItem, int, error)
	
	// Stock availability queries
	GetLowStockItems(ctx context.Context) ([]*InventoryItem, error)
	GetOutOfStockItems(ctx context.Context) ([]*InventoryItem, error)
	GetItemsByCategory(ctx context.Context, category string) ([]*InventoryItem, error)
	SearchItems(ctx context.Context, query string) ([]*InventoryItem, error)
	CheckStockAvailability(ctx context.Context, sku string, quantity float64) (bool, error)
	
	// Stock movement operations
	CreateMovement(ctx context.Context, movement *StockMovement) error
	GetMovementsByItemID(ctx context.Context, itemID InventoryItemID, limit int) ([]*StockMovement, error)
	GetMovementsByDateRange(ctx context.Context, start, end time.Time) ([]*StockMovement, error)
	
	// Supplier operations
	CreateSupplier(ctx context.Context, supplier *Supplier) error
	GetSupplierByID(ctx context.Context, id SupplierID) (*Supplier, error)
	UpdateSupplier(ctx context.Context, supplier *Supplier) error
	DeleteSupplier(ctx context.Context, id SupplierID) error
	ListSuppliers(ctx context.Context, offset, limit int) ([]*Supplier, int, error)
	GetActiveSuppliers(ctx context.Context) ([]*Supplier, error)
	GetItemsBySupplier(ctx context.Context, supplierID SupplierID) ([]*InventoryItem, error)
}

// InventoryFilters defines filtering options for inventory queries
type InventoryFilters struct {
	Category     string
	SupplierID   SupplierID
	LowStock     bool
	OutOfStock   bool
	SearchQuery  string
	PriceMin     *float64
	PriceMax     *float64
}