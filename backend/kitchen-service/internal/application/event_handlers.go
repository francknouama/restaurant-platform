package application

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// EventHandler handles domain events from other services
type EventHandler struct {
	kitchenService domain.KitchenService
}

// NewEventHandler creates a new event handler
func NewEventHandler(kitchenService domain.KitchenService) *EventHandler {
	return &EventHandler{
		kitchenService: kitchenService,
	}
}

// HandleOrderEvent processes order-related events
func (h *EventHandler) HandleOrderEvent(ctx context.Context, event *events.DomainEvent) error {
	switch event.Type {
	case events.OrderCreatedEvent:
		return h.handleOrderCreated(ctx, event)
	case events.OrderPaidEvent:
		return h.handleOrderPaid(ctx, event)
	case events.OrderCancelledEvent:
		return h.handleOrderCancelled(ctx, event)
	default:
		log.Printf("Unhandled order event type: %s", event.Type)
		return nil
	}
}

// handleOrderCreated processes order created events
func (h *EventHandler) handleOrderCreated(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing order created event: %s", event.AggregateID)

	var eventData struct {
		OrderID     string  `json:"order_id"`
		CustomerID  string  `json:"customer_id"`
		TableID     string  `json:"table_id"`
		OrderType   string  `json:"order_type"`
		TotalAmount float64 `json:"total_amount"`
		Status      string  `json:"status"`
	}

	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}

	log.Printf("Order created: %s for customer: %s at table: %s", 
		eventData.OrderID, eventData.CustomerID, eventData.TableID)

	// Create a kitchen order when an order is created
	// Note: In a real implementation, you might wait for the order to be paid
	_, err = h.kitchenService.CreateKitchenOrder(ctx, eventData.OrderID, eventData.TableID)
	if err != nil {
		log.Printf("Failed to create kitchen order for order %s: %v", eventData.OrderID, err)
		return err
	}

	log.Printf("Kitchen order created for order: %s", eventData.OrderID)
	return nil
}

// handleOrderPaid processes order paid events
func (h *EventHandler) handleOrderPaid(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing order paid event: %s", event.AggregateID)

	var eventData struct {
		OrderID   string `json:"order_id"`
		OldStatus string `json:"old_status"`
		NewStatus string `json:"new_status"`
		UpdatedBy string `json:"updated_by"`
	}

	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}

	log.Printf("Order paid: %s, transitioning kitchen order to preparing", eventData.OrderID)

	// Get the kitchen order and start preparation
	kitchenOrder, err := h.kitchenService.GetKitchenOrderByOrderID(ctx, eventData.OrderID)
	if err != nil {
		log.Printf("Failed to get kitchen order for order %s: %v", eventData.OrderID, err)
		return err
	}

	// Update kitchen order status to preparing
	err = h.kitchenService.UpdateOrderStatus(ctx, kitchenOrder.ID, domain.KitchenOrderStatusPreparing)
	if err != nil {
		log.Printf("Failed to update kitchen order status for order %s: %v", eventData.OrderID, err)
		return err
	}

	log.Printf("Kitchen order %s started preparation for paid order: %s", kitchenOrder.ID, eventData.OrderID)
	return nil
}

// handleOrderCancelled processes order cancelled events
func (h *EventHandler) handleOrderCancelled(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing order cancelled event: %s", event.AggregateID)

	var eventData struct {
		OrderID   string `json:"order_id"`
		OldStatus string `json:"old_status"`
		NewStatus string `json:"new_status"`
		UpdatedBy string `json:"updated_by"`
	}

	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}

	log.Printf("Order cancelled: %s, cancelling corresponding kitchen order", eventData.OrderID)

	// Get the kitchen order and cancel it
	kitchenOrder, err := h.kitchenService.GetKitchenOrderByOrderID(ctx, eventData.OrderID)
	if err != nil {
		log.Printf("Failed to get kitchen order for order %s: %v", eventData.OrderID, err)
		return err
	}

	// Cancel the kitchen order
	err = h.kitchenService.CancelKitchenOrder(ctx, kitchenOrder.ID)
	if err != nil {
		log.Printf("Failed to cancel kitchen order for order %s: %v", eventData.OrderID, err)
		return err
	}

	log.Printf("Kitchen order %s cancelled for cancelled order: %s", kitchenOrder.ID, eventData.OrderID)
	return nil
}