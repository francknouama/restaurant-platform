package application

import (
	"context"
	"encoding/json"
	"log"

	"github.com/restaurant-platform/order-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// EventHandler handles domain events from other services
type EventHandler struct {
	orderService domain.OrderService
}

// NewEventHandler creates a new event handler
func NewEventHandler(orderService domain.OrderService) *EventHandler {
	return &EventHandler{
		orderService: orderService,
	}
}

// HandleKitchenEvent processes kitchen-related events
func (h *EventHandler) HandleKitchenEvent(ctx context.Context, event *events.DomainEvent) error {
	switch event.Type {
	case events.KitchenOrderStatusChangedEvent:
		return h.handleKitchenOrderStatusChanged(ctx, event)
	case events.KitchenOrderCompletedEvent:
		return h.handleKitchenOrderCompleted(ctx, event)
	default:
		log.Printf("Unhandled kitchen event type: %s", event.Type)
		return nil
	}
}

// handleKitchenOrderStatusChanged processes kitchen order status change events
func (h *EventHandler) handleKitchenOrderStatusChanged(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing kitchen order status changed event: %s", event.AggregateID)

	var eventData struct {
		KitchenOrderID string `json:"kitchen_order_id"`
		OrderID        string `json:"order_id"`
		OldStatus      string `json:"old_status"`
		NewStatus      string `json:"new_status"`
		UpdatedBy      string `json:"updated_by"`
	}

	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}

	log.Printf("Kitchen order %s (order: %s) status changed from %s to %s", 
		eventData.KitchenOrderID, eventData.OrderID, eventData.OldStatus, eventData.NewStatus)

	// Update order status based on kitchen status
	orderID := domain.OrderID(eventData.OrderID)
	
	switch eventData.NewStatus {
	case "PREPARING":
		// Update order to preparing when kitchen starts preparation
		err = h.orderService.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPreparing)
		if err != nil {
			log.Printf("Failed to update order %s to preparing: %v", eventData.OrderID, err)
			return err
		}
		log.Printf("Order %s updated to preparing", eventData.OrderID)

	case "READY":
		// Update order to ready when kitchen completes preparation
		err = h.orderService.UpdateOrderStatus(ctx, orderID, domain.OrderStatusReady)
		if err != nil {
			log.Printf("Failed to update order %s to ready: %v", eventData.OrderID, err)
			return err
		}
		log.Printf("Order %s updated to ready", eventData.OrderID)

	case "COMPLETED":
		// Kitchen order completed - order is ready for serving/pickup/delivery
		err = h.orderService.UpdateOrderStatus(ctx, orderID, domain.OrderStatusReady)
		if err != nil {
			log.Printf("Failed to update order %s to ready: %v", eventData.OrderID, err)
			return err
		}
		log.Printf("Order %s ready for serving/pickup/delivery", eventData.OrderID)

	case "CANCELLED":
		// Kitchen cancelled the order
		err = h.orderService.CancelOrder(ctx, orderID)
		if err != nil {
			log.Printf("Failed to cancel order %s: %v", eventData.OrderID, err)
			return err
		}
		log.Printf("Order %s cancelled by kitchen", eventData.OrderID)
	}

	return nil
}

// handleKitchenOrderCompleted processes kitchen order completed events
func (h *EventHandler) handleKitchenOrderCompleted(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing kitchen order completed event: %s", event.AggregateID)

	var eventData struct {
		KitchenOrderID string `json:"kitchen_order_id"`
		OrderID        string `json:"order_id"`
		CompletedAt    string `json:"completed_at"`
	}

	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}

	log.Printf("Kitchen order %s completed for order: %s", eventData.KitchenOrderID, eventData.OrderID)

	// Mark order as ready when kitchen completes preparation
	orderID := domain.OrderID(eventData.OrderID)
	err = h.orderService.UpdateOrderStatus(ctx, orderID, domain.OrderStatusReady)
	if err != nil {
		log.Printf("Failed to update order %s to ready: %v", eventData.OrderID, err)
		return err
	}

	log.Printf("Order %s is ready for serving/pickup/delivery", eventData.OrderID)
	return nil
}