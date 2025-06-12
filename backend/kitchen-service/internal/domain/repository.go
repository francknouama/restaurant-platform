package domain

import (
	"context"
)

// KitchenOrderRepository defines the data access interface for kitchen orders
type KitchenOrderRepository interface {
	// Save saves a kitchen order
	Save(ctx context.Context, order *KitchenOrder) error

	// FindByID retrieves a kitchen order by its ID
	FindByID(ctx context.Context, id KitchenOrderID) (*KitchenOrder, error)

	// FindByOrderID retrieves a kitchen order by its corresponding order ID
	FindByOrderID(ctx context.Context, orderID string) (*KitchenOrder, error)

	// Update updates an existing kitchen order
	Update(ctx context.Context, order *KitchenOrder) error

	// Delete deletes a kitchen order
	Delete(ctx context.Context, id KitchenOrderID) error

	// FindByStatus retrieves kitchen orders with a specific status
	FindByStatus(ctx context.Context, status KitchenOrderStatus) ([]*KitchenOrder, error)

	// FindByStation retrieves kitchen orders assigned to a specific station
	FindByStation(ctx context.Context, stationID string) ([]*KitchenOrder, error)

	// FindActive retrieves all active kitchen orders (not completed or cancelled)
	FindActive(ctx context.Context) ([]*KitchenOrder, error)

	// List retrieves kitchen orders with pagination and filters
	List(ctx context.Context, offset, limit int, filters KitchenOrderFilters) ([]*KitchenOrder, int, error)

	// Count returns the total number of kitchen orders matching the filters
	Count(ctx context.Context, filters KitchenOrderFilters) (int, error)
}