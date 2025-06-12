package events

import (
	"encoding/json"
	"time"
)

// EventType represents the type of domain event
type EventType string

const (
	// Menu Events
	MenuCreatedEvent     EventType = "menu.created"
	MenuActivatedEvent   EventType = "menu.activated"
	MenuDeactivatedEvent EventType = "menu.deactivated"
	MenuItemAddedEvent   EventType = "menu.item.added"
	MenuItemUpdatedEvent EventType = "menu.item.updated"
	MenuItemRemovedEvent EventType = "menu.item.removed"
	ItemAvailabilityChangedEvent EventType = "menu.item.availability.changed"

	// Reservation Events
	ReservationCreatedEvent   EventType = "reservation.created"
	ReservationConfirmedEvent EventType = "reservation.confirmed"
	ReservationCancelledEvent EventType = "reservation.cancelled"
	ReservationCompletedEvent EventType = "reservation.completed"
	ReservationNoShowEvent    EventType = "reservation.no_show"
	ReservationUpdatedEvent   EventType = "reservation.updated"

	// Inventory Events
	InventoryItemCreatedEvent     EventType = "inventory.item.created"
	InventoryItemUpdatedEvent     EventType = "inventory.item.updated"
	StockReceivedEvent           EventType = "inventory.stock.received"
	StockUsedEvent               EventType = "inventory.stock.used"
	StockAdjustedEvent           EventType = "inventory.stock.adjusted"
	LowStockAlertEvent           EventType = "inventory.alert.low_stock"
	OutOfStockAlertEvent         EventType = "inventory.alert.out_of_stock"
	StockReservedEvent           EventType = "inventory.stock.reserved"
	SupplierCreatedEvent         EventType = "inventory.supplier.created"
	SupplierUpdatedEvent         EventType = "inventory.supplier.updated"

	// Kitchen Events
	KitchenOrderCreatedEvent        EventType = "kitchen.order.created"
	KitchenOrderStatusChangedEvent  EventType = "kitchen.order.status.changed"
	KitchenOrderAssignedEvent       EventType = "kitchen.order.assigned"
	KitchenOrderPriorityChangedEvent EventType = "kitchen.order.priority.changed"
	KitchenOrderCompletedEvent      EventType = "kitchen.order.completed"
	KitchenOrderCancelledEvent      EventType = "kitchen.order.cancelled"
	KitchenItemStatusChangedEvent   EventType = "kitchen.item.status.changed"

	// Order Events
	OrderCreatedEvent           EventType = "order.created"
	OrderUpdatedEvent           EventType = "order.updated"
	OrderPaidEvent              EventType = "order.paid"
	OrderStatusChangedEvent     EventType = "order.status.changed"
	OrderCancelledEvent         EventType = "order.cancelled"
	OrderCompletedEvent         EventType = "order.completed"
)

// DomainEvent represents a domain event in the system
type DomainEvent struct {
	ID          string                 `json:"id"`
	Type        EventType              `json:"type"`
	AggregateID string                 `json:"aggregate_id"`
	Version     int                    `json:"version"`
	Data        map[string]interface{} `json:"data"`
	Metadata    map[string]interface{} `json:"metadata"`
	OccurredAt  time.Time              `json:"occurred_at"`
}

// NewDomainEvent creates a new domain event
func NewDomainEvent(eventType EventType, aggregateID string, data map[string]interface{}) *DomainEvent {
	return &DomainEvent{
		ID:          generateEventID(),
		Type:        eventType,
		AggregateID: aggregateID,
		Version:     1,
		Data:        data,
		Metadata:    make(map[string]interface{}),
		OccurredAt:  time.Now(),
	}
}

// WithMetadata adds metadata to the event
func (e *DomainEvent) WithMetadata(key string, value interface{}) *DomainEvent {
	e.Metadata[key] = value
	return e
}

// ToJSON serializes the event to JSON
func (e *DomainEvent) ToJSON() ([]byte, error) {
	return json.Marshal(e)
}

// FromJSON deserializes an event from JSON
func FromJSON(data []byte) (*DomainEvent, error) {
	var event DomainEvent
	err := json.Unmarshal(data, &event)
	return &event, err
}

func generateEventID() string {
	return time.Now().Format("20060102150405") + "_" + generateRandomString(8)
}

func generateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}