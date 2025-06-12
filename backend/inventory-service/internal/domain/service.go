package inventory

import (
	"context"
)

// InventoryService defines the business operations for inventory management
type InventoryService interface {
	// InventoryItem operations
	CreateItem(ctx context.Context, sku, name string, initialStock float64, unit UnitType, cost float64) (*InventoryItem, error)
	GetItem(ctx context.Context, id InventoryItemID) (*InventoryItem, error)
	GetItemBySKU(ctx context.Context, sku string) (*InventoryItem, error)
	UpdateItem(ctx context.Context, id InventoryItemID, name, description, category, location string, cost float64) error
	DeleteItem(ctx context.Context, id InventoryItemID) error
	ListItems(ctx context.Context, offset, limit int, filters InventoryFilters) ([]*InventoryItem, int, error)
	
	// Stock management
	AddStock(ctx context.Context, itemID InventoryItemID, quantity float64, notes, reference, performedBy string) error
	UseStock(ctx context.Context, itemID InventoryItemID, quantity float64, notes, reference, performedBy string) error
	AdjustStock(ctx context.Context, itemID InventoryItemID, newStock float64, notes, performedBy string) error
	ReserveStock(ctx context.Context, sku string, quantity float64, reference, performedBy string) error
	
	// Stock queries
	CheckAvailability(ctx context.Context, sku string, quantity float64) (bool, error)
	GetLowStockItems(ctx context.Context) ([]*InventoryItem, error)
	GetOutOfStockItems(ctx context.Context) ([]*InventoryItem, error)
	GetStockLevel(ctx context.Context, sku string) (float64, error)
	
	// Thresholds management
	UpdateThresholds(ctx context.Context, itemID InventoryItemID, min, max, reorderPoint float64) error
	
	// Movement history
	GetMovementHistory(ctx context.Context, itemID InventoryItemID, limit int) ([]*StockMovement, error)
	
	// Supplier management
	CreateSupplier(ctx context.Context, name string) (*Supplier, error)
	GetSupplier(ctx context.Context, id SupplierID) (*Supplier, error)
	UpdateSupplier(ctx context.Context, id SupplierID, name, contactName, email, phone, address, website, notes string) error
	ListSuppliers(ctx context.Context, offset, limit int) ([]*Supplier, int, error)
	AssignSupplier(ctx context.Context, itemID InventoryItemID, supplierID SupplierID) error
}