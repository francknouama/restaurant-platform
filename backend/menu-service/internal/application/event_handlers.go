package application

import (
	"context"
	"encoding/json"
	"log"
	"github.com/restaurant-platform/shared/events"
)

// EventHandler handles domain events from other services
type EventHandler struct {
	menuService *MenuService
}

// NewEventHandler creates a new event handler
func NewEventHandler(menuService *MenuService) *EventHandler {
	return &EventHandler{
		menuService: menuService,
	}
}

// HandleInventoryEvent processes inventory-related events
func (h *EventHandler) HandleInventoryEvent(ctx context.Context, event *events.DomainEvent) error {
	switch event.Type {
	case events.LowStockAlertEvent:
		return h.handleLowStockAlert(ctx, event)
	case events.OutOfStockAlertEvent:
		return h.handleOutOfStockAlert(ctx, event)
	case events.StockReceivedEvent:
		return h.handleStockReceived(ctx, event)
	default:
		log.Printf("Unhandled inventory event type: %s", event.Type)
		return nil
	}
}

// handleLowStockAlert processes low stock alerts from inventory service
func (h *EventHandler) handleLowStockAlert(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing low stock alert: %s", event.AggregateID)
	
	var eventData struct {
		ItemID       string  `json:"item_id"`
		SKU          string  `json:"sku"`
		ItemName     string  `json:"item_name"`
		CurrentStock float64 `json:"current_stock"`
		Threshold    float64 `json:"threshold"`
		AlertType    string  `json:"alert_type"`
	}
	
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}
	
	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}
	
	log.Printf("Low stock alert for item %s (%s): current=%f, threshold=%f", 
		eventData.ItemName, eventData.SKU, eventData.CurrentStock, eventData.Threshold)
	
	// In a real implementation, you might:
	// 1. Check if this ingredient is used in any menu items
	// 2. Automatically set menu items as unavailable if ingredient is critical
	// 3. Notify restaurant staff about potential menu changes
	// 4. Update menu item descriptions to indicate limited availability
	
	return nil
}

// handleOutOfStockAlert processes out of stock alerts from inventory service
func (h *EventHandler) handleOutOfStockAlert(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing out of stock alert: %s", event.AggregateID)
	
	var eventData struct {
		ItemID       string  `json:"item_id"`
		SKU          string  `json:"sku"`
		ItemName     string  `json:"item_name"`
		CurrentStock float64 `json:"current_stock"`
		Threshold    float64 `json:"threshold"`
		AlertType    string  `json:"alert_type"`
	}
	
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}
	
	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}
	
	log.Printf("OUT OF STOCK alert for item %s (%s): current=%f", 
		eventData.ItemName, eventData.SKU, eventData.CurrentStock)
	
	// In a real implementation, you might:
	// 1. Automatically set menu items as unavailable if this ingredient is required
	// 2. Find menu items that use this ingredient and mark them as unavailable
	// 3. Send notifications to kitchen and management
	// 4. Suggest menu item substitutions
	
	// Example: Auto-disable menu items based on ingredient availability
	// This would require a mapping between inventory SKUs and menu items
	
	return nil
}

// handleStockReceived processes stock received events from inventory service
func (h *EventHandler) handleStockReceived(ctx context.Context, event *events.DomainEvent) error {
	log.Printf("Processing stock received event: %s", event.AggregateID)
	
	var eventData struct {
		ItemID        string  `json:"item_id"`
		SKU           string  `json:"sku"`
		ItemName      string  `json:"item_name"`
		MovementType  string  `json:"movement_type"`
		Quantity      float64 `json:"quantity"`
		PreviousStock float64 `json:"previous_stock"`
		NewStock      float64 `json:"new_stock"`
		Reference     string  `json:"reference"`
		PerformedBy   string  `json:"performed_by"`
	}
	
	dataBytes, err := json.Marshal(event.Data)
	if err != nil {
		return err
	}
	
	if err := json.Unmarshal(dataBytes, &eventData); err != nil {
		return err
	}
	
	log.Printf("Stock received for item %s (%s): +%f (new total: %f)", 
		eventData.ItemName, eventData.SKU, eventData.Quantity, eventData.NewStock)
	
	// In a real implementation, you might:
	// 1. Re-enable menu items that were disabled due to low stock
	// 2. Update menu item availability based on ingredient stock levels
	// 3. Notify kitchen staff that ingredients are available again
	// 4. Automatically adjust menu item descriptions
	
	return nil
}