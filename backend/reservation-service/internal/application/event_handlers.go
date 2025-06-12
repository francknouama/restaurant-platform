package application

import (
	"context"
	"encoding/json"
	"log"
	"github.com/restaurant-platform/shared/events"
)

// EventHandler handles domain events from other services
type EventHandler struct {
	reservationService *ReservationService
}

// NewEventHandler creates a new event handler
func NewEventHandler(reservationService *ReservationService) *EventHandler {
	return &EventHandler{
		reservationService: reservationService,
	}
}

// HandleMenuEvent processes menu-related events
func (h *EventHandler) HandleMenuEvent(ctx context.Context, event *events.DomainEvent) error {
	switch event.Type {
	case events.MenuActivatedEvent:
		return h.handleMenuActivated(ctx, event)
	case events.ItemAvailabilityChangedEvent:
		return h.handleItemAvailabilityChanged(ctx, event)
	default:
		log.Printf("Unhandled menu event type: %s", event.Type)
		return nil
	}
}

// handleMenuActivated processes menu activated events
func (h *EventHandler) handleMenuActivated(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing menu activated event: %s", event.AggregateID)
	
	// Example: Update reservation system when a new menu is activated
	// This could be used to validate that reserved menu items are still available
	
	var eventData struct {
		MenuID  string `json:"menu_id"`
		Name    string `json:"name"`
		Version int    `json:"version"`
	}
	
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}
	
	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}
	
	log.Printf("Menu %s (%s) version %d has been activated", eventData.MenuID, eventData.Name, eventData.Version)
	
	// In a real implementation, you might:
	// 1. Update cached menu data for reservation validation
	// 2. Trigger notifications to customers with upcoming reservations
	// 3. Validate that pre-ordered items are still available
	
	return nil
}

// handleItemAvailabilityChanged processes item availability changed events
func (h *EventHandler) handleItemAvailabilityChanged(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing item availability changed event: %s", event.AggregateID)
	
	var eventData struct {
		MenuID      string `json:"menu_id"`
		ItemID      string `json:"item_id"`
		ItemName    string `json:"item_name"`
		IsAvailable bool   `json:"is_available"`
		CategoryID  string `json:"category_id"`
	}
	
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}
	
	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}
	
	log.Printf("Item %s (%s) availability changed to: %v", eventData.ItemID, eventData.ItemName, eventData.IsAvailable)
	
	// In a real implementation, you might:
	// 1. Check if any upcoming reservations have pre-ordered this item
	// 2. Send notifications to affected customers
	// 3. Suggest alternative items if this one became unavailable
	
	return nil
}