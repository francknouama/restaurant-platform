package application

import (
	"context"
	"fmt"
	"log"

	"github.com/restaurant-platform/order-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// OrderService implements the order business logic
type OrderService struct {
	orderRepo      domain.OrderRepository
	eventPublisher events.EventPublisher
}

// NewOrderService creates a new order service
func NewOrderService(orderRepo domain.OrderRepository, eventPublisher events.EventPublisher) *OrderService {
	return &OrderService{
		orderRepo:      orderRepo,
		eventPublisher: eventPublisher,
	}
}

// CreateOrder creates a new order
func (s *OrderService) CreateOrder(ctx context.Context, customerID string, orderType domain.OrderType) (*domain.Order, error) {
	order, err := domain.NewOrder(customerID, orderType)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to save order: %w", err)
	}

	log.Printf("Created order: %s for customer: %s", order.ID, customerID)

	// Publish OrderCreatedEvent
	eventData := events.ToEventData(events.OrderCreatedData{
		OrderID:     string(order.ID),
		CustomerID:  order.CustomerID,
		TableID:     order.TableID,
		OrderType:   string(order.Type),
		TotalAmount: order.TotalAmount,
		Status:      string(order.Status),
	})

	event := events.NewDomainEvent(events.OrderCreatedEvent, string(order.ID), eventData).
		WithMetadata("service", "order-service").
		WithMetadata("customer_id", customerID)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish order created event: %v", err)
	}

	return order, nil
}

// GetOrderByID retrieves an order by ID
func (s *OrderService) GetOrderByID(ctx context.Context, id domain.OrderID) (*domain.Order, error) {
	return s.orderRepo.GetByID(ctx, id)
}

// AddItemToOrder adds an item to an existing order
func (s *OrderService) AddItemToOrder(ctx context.Context, orderID domain.OrderID, menuItemID, name string, quantity int, unitPrice float64, modifications []string, notes string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.AddItem(menuItemID, name, quantity, unitPrice, modifications, notes); err != nil {
		return fmt.Errorf("failed to add item to order: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Added item %s to order: %s", name, orderID)
	return nil
}

// RemoveItemFromOrder removes an item from an order
func (s *OrderService) RemoveItemFromOrder(ctx context.Context, orderID domain.OrderID, itemID domain.OrderItemID) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.RemoveItem(itemID); err != nil {
		return fmt.Errorf("failed to remove item from order: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Removed item %s from order: %s", itemID, orderID)
	return nil
}

// UpdateItemQuantity updates the quantity of an item in an order
func (s *OrderService) UpdateItemQuantity(ctx context.Context, orderID domain.OrderID, itemID domain.OrderItemID, quantity int) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.UpdateItemQuantity(itemID, quantity); err != nil {
		return fmt.Errorf("failed to update item quantity: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Updated item %s quantity to %d in order: %s", itemID, quantity, orderID)
	return nil
}

// UpdateOrderStatus changes the status of an order
func (s *OrderService) UpdateOrderStatus(ctx context.Context, orderID domain.OrderID, status domain.OrderStatus) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	previousStatus := order.Status

	if err := order.UpdateStatus(status); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Updated order %s status from %s to %s", orderID, previousStatus, status)

	// Publish OrderStatusChangedEvent
	eventData := events.ToEventData(events.OrderStatusChangedData{
		OrderID:   string(order.ID),
		OldStatus: string(previousStatus),
		NewStatus: string(status),
		UpdatedBy: "order-service",
	})

	var eventType events.EventType
	switch status {
	case domain.OrderStatusPaid:
		eventType = events.OrderPaidEvent
	case domain.OrderStatusCancelled:
		eventType = events.OrderCancelledEvent
	case domain.OrderStatusCompleted:
		eventType = events.OrderCompletedEvent
	default:
		eventType = events.OrderStatusChangedEvent
	}

	event := events.NewDomainEvent(eventType, string(order.ID), eventData).
		WithMetadata("service", "order-service").
		WithMetadata("customer_id", order.CustomerID)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish order status changed event: %v", err)
	}

	return nil
}

// SetTableForOrder sets the table ID for a dine-in order
func (s *OrderService) SetTableForOrder(ctx context.Context, orderID domain.OrderID, tableID string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.SetTableID(tableID); err != nil {
		return fmt.Errorf("failed to set table for order: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Set table %s for order: %s", tableID, orderID)
	return nil
}

// SetDeliveryAddress sets the delivery address for a delivery order
func (s *OrderService) SetDeliveryAddress(ctx context.Context, orderID domain.OrderID, address string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.SetDeliveryAddress(address); err != nil {
		return fmt.Errorf("failed to set delivery address for order: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Set delivery address for order: %s", orderID)
	return nil
}

// AddOrderNotes adds notes to an order
func (s *OrderService) AddOrderNotes(ctx context.Context, orderID domain.OrderID, notes string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	order.AddNotes(notes)

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Added notes to order: %s", orderID)
	return nil
}

// CancelOrder cancels an order
func (s *OrderService) CancelOrder(ctx context.Context, orderID domain.OrderID) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("failed to get order: %w", err)
	}

	if err := order.Cancel(); err != nil {
		return fmt.Errorf("failed to cancel order: %w", err)
	}

	if err := s.orderRepo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}

	log.Printf("Cancelled order: %s", orderID)

	// Publish OrderCancelledEvent
	eventData := events.ToEventData(events.OrderStatusChangedData{
		OrderID:   string(order.ID),
		OldStatus: string(domain.OrderStatusCreated), // Could be any previous status
		NewStatus: string(domain.OrderStatusCancelled),
		UpdatedBy: "order-service",
	})

	event := events.NewDomainEvent(events.OrderCancelledEvent, string(order.ID), eventData).
		WithMetadata("service", "order-service").
		WithMetadata("customer_id", order.CustomerID)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish order cancelled event: %v", err)
	}

	return nil
}

// PayOrder marks an order as paid
func (s *OrderService) PayOrder(ctx context.Context, orderID domain.OrderID) error {
	return s.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPaid)
}

// GetOrdersByCustomer retrieves orders for a specific customer
func (s *OrderService) GetOrdersByCustomer(ctx context.Context, customerID string) ([]*domain.Order, error) {
	return s.orderRepo.FindByCustomer(ctx, customerID)
}

// GetOrdersByStatus retrieves orders with a specific status
func (s *OrderService) GetOrdersByStatus(ctx context.Context, status domain.OrderStatus) ([]*domain.Order, error) {
	return s.orderRepo.FindByStatus(ctx, status)
}

// GetOrdersByTable retrieves orders for a specific table
func (s *OrderService) GetOrdersByTable(ctx context.Context, tableID string) ([]*domain.Order, error) {
	return s.orderRepo.FindByTable(ctx, tableID)
}

// GetActiveOrders retrieves all active orders
func (s *OrderService) GetActiveOrders(ctx context.Context) ([]*domain.Order, error) {
	return s.orderRepo.GetActiveOrders(ctx)
}

// ListOrders retrieves orders with pagination and filters
func (s *OrderService) ListOrders(ctx context.Context, offset, limit int, filters domain.OrderFilters) ([]*domain.Order, int, error) {
	return s.orderRepo.List(ctx, offset, limit, filters)
}