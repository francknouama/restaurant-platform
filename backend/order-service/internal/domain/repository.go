package domain

import (
	"context"
	"time"
)

// OrderRepository defines the interface for order data access
type OrderRepository interface {
	// Create adds a new order to the repository
	Create(ctx context.Context, order *Order) error

	// GetByID retrieves an order by its ID
	GetByID(ctx context.Context, id OrderID) (*Order, error)

	// Update updates an existing order
	Update(ctx context.Context, order *Order) error

	// Delete removes an order from the repository
	Delete(ctx context.Context, id OrderID) error

	// List retrieves orders with pagination and filters
	List(ctx context.Context, offset, limit int, filters OrderFilters) ([]*Order, int, error)

	// FindByCustomer retrieves orders for a specific customer
	FindByCustomer(ctx context.Context, customerID string) ([]*Order, error)

	// FindByStatus retrieves orders with a specific status
	FindByStatus(ctx context.Context, status OrderStatus) ([]*Order, error)

	// FindByDateRange retrieves orders within a date range
	FindByDateRange(ctx context.Context, start, end time.Time) ([]*Order, error)

	// FindByTable retrieves orders for a specific table
	FindByTable(ctx context.Context, tableID string) ([]*Order, error)

	// FindByType retrieves orders of a specific type
	FindByType(ctx context.Context, orderType OrderType) ([]*Order, error)

	// GetTotalsByDateRange retrieves order totals within a date range
	GetTotalsByDateRange(ctx context.Context, start, end time.Time) (float64, error)

	// GetActiveOrders retrieves all orders that are not completed or cancelled
	GetActiveOrders(ctx context.Context) ([]*Order, error)
}

// OrderService defines the interface for order business logic
type OrderService interface {
	// CreateOrder creates a new order
	CreateOrder(ctx context.Context, customerID string, orderType OrderType) (*Order, error)

	// GetOrderByID retrieves an order by ID
	GetOrderByID(ctx context.Context, id OrderID) (*Order, error)

	// AddItemToOrder adds an item to an existing order
	AddItemToOrder(ctx context.Context, orderID OrderID, menuItemID, name string, quantity int, unitPrice float64, modifications []string, notes string) error

	// RemoveItemFromOrder removes an item from an order
	RemoveItemFromOrder(ctx context.Context, orderID OrderID, itemID OrderItemID) error

	// UpdateItemQuantity updates the quantity of an item in an order
	UpdateItemQuantity(ctx context.Context, orderID OrderID, itemID OrderItemID, quantity int) error

	// UpdateOrderStatus changes the status of an order
	UpdateOrderStatus(ctx context.Context, orderID OrderID, status OrderStatus) error

	// SetTableForOrder sets the table ID for a dine-in order
	SetTableForOrder(ctx context.Context, orderID OrderID, tableID string) error

	// SetDeliveryAddress sets the delivery address for a delivery order
	SetDeliveryAddress(ctx context.Context, orderID OrderID, address string) error

	// AddOrderNotes adds notes to an order
	AddOrderNotes(ctx context.Context, orderID OrderID, notes string) error

	// CancelOrder cancels an order
	CancelOrder(ctx context.Context, orderID OrderID) error

	// PayOrder marks an order as paid
	PayOrder(ctx context.Context, orderID OrderID) error

	// GetOrdersByCustomer retrieves orders for a specific customer
	GetOrdersByCustomer(ctx context.Context, customerID string) ([]*Order, error)

	// GetOrdersByStatus retrieves orders with a specific status
	GetOrdersByStatus(ctx context.Context, status OrderStatus) ([]*Order, error)

	// GetOrdersByTable retrieves orders for a specific table
	GetOrdersByTable(ctx context.Context, tableID string) ([]*Order, error)

	// GetActiveOrders retrieves all active orders
	GetActiveOrders(ctx context.Context) ([]*Order, error)

	// ListOrders retrieves orders with pagination and filters
	ListOrders(ctx context.Context, offset, limit int, filters OrderFilters) ([]*Order, int, error)
}