package domain

import (
	"context"
	"time"
)

// KitchenService defines the business operations for kitchen orders
type KitchenService interface {
	// CreateKitchenOrder creates a new kitchen order from a regular order
	CreateKitchenOrder(ctx context.Context, orderID, tableID string) (*KitchenOrder, error)

	// GetKitchenOrder retrieves a kitchen order by ID
	GetKitchenOrder(ctx context.Context, id KitchenOrderID) (*KitchenOrder, error)

	// GetKitchenOrderByOrderID retrieves a kitchen order by its corresponding order ID
	GetKitchenOrderByOrderID(ctx context.Context, orderID string) (*KitchenOrder, error)

	// AddKitchenItem adds an item to a kitchen order
	AddKitchenItem(ctx context.Context, kitchenOrderID KitchenOrderID, menuItemID, name string, quantity int, prepTime time.Duration, modifications []string, notes string) error

	// UpdateItemStatus changes the status of an item in a kitchen order
	UpdateItemStatus(ctx context.Context, kitchenOrderID KitchenOrderID, itemID string, status KitchenItemStatus) error

	// UpdateOrderStatus changes the status of a kitchen order
	UpdateOrderStatus(ctx context.Context, kitchenOrderID KitchenOrderID, status KitchenOrderStatus) error

	// AssignToStation assigns a kitchen order to a station
	AssignToStation(ctx context.Context, kitchenOrderID KitchenOrderID, stationID string) error

	// SetPriority sets the priority of a kitchen order
	SetPriority(ctx context.Context, kitchenOrderID KitchenOrderID, priority KitchenPriority) error

	// CancelKitchenOrder cancels a kitchen order
	CancelKitchenOrder(ctx context.Context, kitchenOrderID KitchenOrderID) error

	// CompleteKitchenOrder marks a kitchen order as completed
	CompleteKitchenOrder(ctx context.Context, kitchenOrderID KitchenOrderID) error

	// GetActiveOrders retrieves all active kitchen orders
	GetActiveOrders(ctx context.Context) ([]*KitchenOrder, error)

	// GetOrdersByStatus retrieves kitchen orders with a specific status
	GetOrdersByStatus(ctx context.Context, status KitchenOrderStatus) ([]*KitchenOrder, error)

	// GetOrdersByStation retrieves kitchen orders assigned to a specific station
	GetOrdersByStation(ctx context.Context, stationID string) ([]*KitchenOrder, error)

	// ListKitchenOrders retrieves kitchen orders with pagination and filters
	ListKitchenOrders(ctx context.Context, offset, limit int, filters KitchenOrderFilters) ([]*KitchenOrder, int, error)
}