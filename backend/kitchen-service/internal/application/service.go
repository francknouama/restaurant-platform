package application

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
	"github.com/restaurant-platform/shared/pkg/errors"
)

// KitchenOrderService implements the kitchen order business logic
type KitchenOrderService struct {
	repo           domain.KitchenOrderRepository
	eventPublisher events.EventPublisher
}

// NewKitchenOrderService creates a new kitchen order service
func NewKitchenOrderService(repo domain.KitchenOrderRepository, eventPublisher events.EventPublisher) *KitchenOrderService {
	return &KitchenOrderService{
		repo:           repo,
		eventPublisher: eventPublisher,
	}
}

// CreateKitchenOrder creates a new kitchen order from a regular order
func (s *KitchenOrderService) CreateKitchenOrder(ctx context.Context, orderID, tableID string) (*domain.KitchenOrder, error) {
	// Create a new kitchen order
	order, err := domain.NewKitchenOrder(orderID, tableID)
	if err != nil {
		return nil, fmt.Errorf("failed to create kitchen order: %w", err)
	}

	// Save to repository
	if err := s.repo.Save(ctx, order); err != nil {
		return nil, fmt.Errorf("failed to save kitchen order: %w", err)
	}

	log.Printf("Created kitchen order: %s for order: %s", order.ID, orderID)

	// Publish KitchenOrderCreatedEvent
	eventData := events.ToEventData(events.KitchenOrderCreatedData{
		KitchenOrderID: string(order.ID),
		OrderID:        order.OrderID,
		TableID:        order.TableID,
		Status:         string(order.Status),
		Priority:       string(order.Priority),
		EstimatedTime:  int64(order.EstimatedTime.Seconds()),
	})

	event := events.NewDomainEvent(events.KitchenOrderCreatedEvent, string(order.ID), eventData).
		WithMetadata("service", "kitchen-service").
		WithMetadata("order_id", orderID)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish kitchen order created event: %v", err)
	}
	
	return order, nil
}

// GetKitchenOrder retrieves a kitchen order by ID
func (s *KitchenOrderService) GetKitchenOrder(ctx context.Context, id domain.KitchenOrderID) (*domain.KitchenOrder, error) {
	order, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen order: %w", err)
	}

	return order, nil
}

// GetKitchenOrderByOrderID retrieves a kitchen order by its corresponding order ID
func (s *KitchenOrderService) GetKitchenOrderByOrderID(ctx context.Context, orderID string) (*domain.KitchenOrder, error) {
	order, err := s.repo.FindByOrderID(ctx, orderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen order by order ID: %w", err)
	}

	return order, nil
}

// AddKitchenItem adds an item to a kitchen order
func (s *KitchenOrderService) AddKitchenItem(ctx context.Context, kitchenOrderID domain.KitchenOrderID, menuItemID, name string, quantity int, prepTime time.Duration, modifications []string, notes string) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	// Add the item to the order
	if err := order.AddItem(menuItemID, name, quantity, prepTime, modifications, notes); err != nil {
		return fmt.Errorf("failed to add item to kitchen order: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Added item %s to kitchen order: %s", name, kitchenOrderID)

	return nil
}

// UpdateItemStatus changes the status of an item in a kitchen order
func (s *KitchenOrderService) UpdateItemStatus(ctx context.Context, kitchenOrderID domain.KitchenOrderID, itemID string, status domain.KitchenItemStatus) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	// Store the previous status for events
	var previousStatus domain.KitchenItemStatus
	for _, item := range order.Items {
		if string(item.ID) == itemID {
			previousStatus = item.Status
			break
		}
	}

	// Update the item status
	if err := order.UpdateItemStatus(domain.KitchenItemID(itemID), status); err != nil {
		return fmt.Errorf("failed to update item status: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Updated item %s status from %s to %s in kitchen order: %s", itemID, previousStatus, status, kitchenOrderID)

	// TODO: Publish KitchenItemStatusChangedEvent

	return nil
}

// UpdateOrderStatus changes the status of a kitchen order
func (s *KitchenOrderService) UpdateOrderStatus(ctx context.Context, kitchenOrderID domain.KitchenOrderID, status domain.KitchenOrderStatus) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	previousStatus := order.Status

	// Update the order status
	if err := order.UpdateStatus(status); err != nil {
		return fmt.Errorf("failed to update order status: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Updated kitchen order %s status from %s to %s", kitchenOrderID, previousStatus, status)

	// Publish KitchenOrderStatusChangedEvent
	eventData := events.ToEventData(events.KitchenOrderStatusChangedData{
		KitchenOrderID: string(order.ID),
		OrderID:        order.OrderID,
		OldStatus:      string(previousStatus),
		NewStatus:      string(status),
		UpdatedBy:      "kitchen-service",
	})

	event := events.NewDomainEvent(events.KitchenOrderStatusChangedEvent, string(order.ID), eventData).
		WithMetadata("service", "kitchen-service").
		WithMetadata("order_id", order.OrderID)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish kitchen order status changed event: %v", err)
	}

	return nil
}

// AssignToStation assigns a kitchen order to a station
func (s *KitchenOrderService) AssignToStation(ctx context.Context, kitchenOrderID domain.KitchenOrderID, stationID string) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	// Assign to station
	if err := order.AssignToStation(stationID); err != nil {
		return fmt.Errorf("failed to assign kitchen order to station: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Assigned kitchen order %s to station: %s", kitchenOrderID, stationID)

	// TODO: Publish KitchenOrderAssignedEvent

	return nil
}

// SetPriority sets the priority of a kitchen order
func (s *KitchenOrderService) SetPriority(ctx context.Context, kitchenOrderID domain.KitchenOrderID, priority domain.KitchenPriority) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	previousPriority := order.Priority

	// Set priority
	order.SetPriority(priority)

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Set kitchen order %s priority from %s to %s", kitchenOrderID, previousPriority, priority)

	// TODO: Publish KitchenOrderPriorityChangedEvent

	return nil
}

// CancelKitchenOrder cancels a kitchen order
func (s *KitchenOrderService) CancelKitchenOrder(ctx context.Context, kitchenOrderID domain.KitchenOrderID) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	// Cancel the order
	if err := order.Cancel(); err != nil {
		return fmt.Errorf("failed to cancel kitchen order: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Cancelled kitchen order: %s", kitchenOrderID)

	// TODO: Publish KitchenOrderCancelledEvent

	return nil
}

// CompleteKitchenOrder marks a kitchen order as completed
func (s *KitchenOrderService) CompleteKitchenOrder(ctx context.Context, kitchenOrderID domain.KitchenOrderID) error {
	// Get the kitchen order
	order, err := s.repo.FindByID(ctx, kitchenOrderID)
	if err != nil {
		return fmt.Errorf("failed to get kitchen order: %w", err)
	}

	// Complete the order
	if err := order.UpdateStatus(domain.KitchenOrderStatusCompleted); err != nil {
		return fmt.Errorf("failed to complete kitchen order: %w", err)
	}

	// Update the repository
	if err := s.repo.Update(ctx, order); err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	log.Printf("Completed kitchen order: %s", kitchenOrderID)

	// TODO: Publish KitchenOrderCompletedEvent

	return nil
}

// GetActiveOrders retrieves all active kitchen orders
func (s *KitchenOrderService) GetActiveOrders(ctx context.Context) ([]*domain.KitchenOrder, error) {
	orders, err := s.repo.FindActive(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get active kitchen orders: %w", err)
	}

	return orders, nil
}

// GetOrdersByStatus retrieves kitchen orders with a specific status
func (s *KitchenOrderService) GetOrdersByStatus(ctx context.Context, status domain.KitchenOrderStatus) ([]*domain.KitchenOrder, error) {
	orders, err := s.repo.FindByStatus(ctx, status)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen orders by status: %w", err)
	}

	return orders, nil
}

// GetOrdersByStation retrieves kitchen orders assigned to a specific station
func (s *KitchenOrderService) GetOrdersByStation(ctx context.Context, stationID string) ([]*domain.KitchenOrder, error) {
	orders, err := s.repo.FindByStation(ctx, stationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get kitchen orders by station: %w", err)
	}

	return orders, nil
}

// ListKitchenOrders retrieves kitchen orders with pagination and filters
func (s *KitchenOrderService) ListKitchenOrders(ctx context.Context, offset, limit int, filters domain.KitchenOrderFilters) ([]*domain.KitchenOrder, int, error) {
	orders, totalCount, err := s.repo.List(ctx, offset, limit, filters)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list kitchen orders: %w", err)
	}

	return orders, totalCount, nil
}

// Validation helpers

// ValidateKitchenOrderStatus validates a kitchen order status string
func ValidateKitchenOrderStatus(status string) (domain.KitchenOrderStatus, error) {
	switch status {
	case string(domain.KitchenOrderStatusNew):
		return domain.KitchenOrderStatusNew, nil
	case string(domain.KitchenOrderStatusPreparing):
		return domain.KitchenOrderStatusPreparing, nil
	case string(domain.KitchenOrderStatusReady):
		return domain.KitchenOrderStatusReady, nil
	case string(domain.KitchenOrderStatusCompleted):
		return domain.KitchenOrderStatusCompleted, nil
	case string(domain.KitchenOrderStatusCancelled):
		return domain.KitchenOrderStatusCancelled, nil
	default:
		return "", errors.NewValidationError("status", "invalid kitchen order status")
	}
}

// ValidateKitchenItemStatus validates a kitchen item status string
func ValidateKitchenItemStatus(status string) (domain.KitchenItemStatus, error) {
	switch status {
	case string(domain.KitchenItemStatusNew):
		return domain.KitchenItemStatusNew, nil
	case string(domain.KitchenItemStatusPreparing):
		return domain.KitchenItemStatusPreparing, nil
	case string(domain.KitchenItemStatusReady):
		return domain.KitchenItemStatusReady, nil
	case string(domain.KitchenItemStatusCancelled):
		return domain.KitchenItemStatusCancelled, nil
	default:
		return "", errors.NewValidationError("status", "invalid kitchen item status")
	}
}

// ValidateKitchenPriority validates a kitchen priority string
func ValidateKitchenPriority(priority string) (domain.KitchenPriority, error) {
	switch priority {
	case string(domain.KitchenPriorityLow):
		return domain.KitchenPriorityLow, nil
	case string(domain.KitchenPriorityNormal):
		return domain.KitchenPriorityNormal, nil
	case string(domain.KitchenPriorityHigh):
		return domain.KitchenPriorityHigh, nil
	case string(domain.KitchenPriorityUrgent):
		return domain.KitchenPriorityUrgent, nil
	default:
		return "", errors.NewValidationError("priority", "invalid kitchen priority")
	}
}