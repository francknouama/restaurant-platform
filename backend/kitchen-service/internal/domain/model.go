package domain

import (
	"restaurant-platform/shared/pkg/errors"
	"restaurant-platform/shared/pkg/types"
	"time"
)

// Kitchen domain entity markers for type-safe IDs
type (
	KitchenOrderEntity struct{}
	KitchenItemEntity  struct{}
)

// Type-safe ID types using generics
type (
	KitchenOrderID = types.ID[KitchenOrderEntity]
	KitchenItemID  = types.ID[KitchenItemEntity]
)

// KitchenOrderStatus represents the possible states of a kitchen order
type KitchenOrderStatus string

const (
	KitchenOrderStatusNew       KitchenOrderStatus = "NEW"
	KitchenOrderStatusPreparing KitchenOrderStatus = "PREPARING"
	KitchenOrderStatusReady     KitchenOrderStatus = "READY"
	KitchenOrderStatusCompleted KitchenOrderStatus = "COMPLETED"
	KitchenOrderStatusCancelled KitchenOrderStatus = "CANCELLED"
)

// KitchenItemStatus represents the possible states of a kitchen item
type KitchenItemStatus string

const (
	KitchenItemStatusNew       KitchenItemStatus = "NEW"
	KitchenItemStatusPreparing KitchenItemStatus = "PREPARING"
	KitchenItemStatusReady     KitchenItemStatus = "READY"
	KitchenItemStatusCancelled KitchenItemStatus = "CANCELLED"
)

// KitchenPriority represents the priority level of a kitchen order
type KitchenPriority string

const (
	KitchenPriorityLow    KitchenPriority = "LOW"
	KitchenPriorityNormal KitchenPriority = "NORMAL"
	KitchenPriorityHigh   KitchenPriority = "HIGH"
	KitchenPriorityUrgent KitchenPriority = "URGENT"
)

// KitchenOrder is the aggregate root for the kitchen domain
type KitchenOrder struct {
	ID              KitchenOrderID     `json:"id"`
	OrderID         string             `json:"order_id"`
	TableID         string             `json:"table_id,omitempty"`
	Status          KitchenOrderStatus `json:"status"`
	Items           []*KitchenItem     `json:"items"`
	Priority        KitchenPriority    `json:"priority"`
	AssignedStation string             `json:"assigned_station,omitempty"`
	EstimatedTime   time.Duration      `json:"estimated_time"`
	StartedAt       time.Time          `json:"started_at,omitempty"`
	CompletedAt     time.Time          `json:"completed_at,omitempty"`
	Notes           string             `json:"notes,omitempty"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`
}

// KitchenItem represents an item in a kitchen order
type KitchenItem struct {
	ID              KitchenItemID     `json:"id"`
	MenuItemID      string            `json:"menu_item_id"`
	Name            string            `json:"name"`
	Quantity        int               `json:"quantity"`
	Status          KitchenItemStatus `json:"status"`
	PrepTime        time.Duration     `json:"prep_time"`
	StartedAt       time.Time         `json:"started_at,omitempty"`
	CompletedAt     time.Time         `json:"completed_at,omitempty"`
	AssignedStation string            `json:"assigned_station,omitempty"`
	Notes           string            `json:"notes,omitempty"`
	Modifications   []string          `json:"modifications,omitempty"`
}

// KitchenOrderFilters for querying kitchen orders
type KitchenOrderFilters struct {
	Status     *KitchenOrderStatus
	Priority   *KitchenPriority
	Station    *string
	OrderID    *string
	DateFrom   *time.Time
	DateTo     *time.Time
}

// NewKitchenOrder creates a new kitchen order with validated fields
func NewKitchenOrder(orderID, tableID string) (*KitchenOrder, error) {
	if orderID == "" {
		return nil, errors.NewValidationError("orderID", "order ID is required")
	}

	now := time.Now()
	return &KitchenOrder{
		ID:            KitchenOrderID("ko_" + now.Format("20060102150405")), // Simple ID generation
		OrderID:       orderID,
		TableID:       tableID,
		Status:        KitchenOrderStatusNew,
		Items:         make([]*KitchenItem, 0),
		Priority:      KitchenPriorityNormal,
		EstimatedTime: 0,
		CreatedAt:     now,
		UpdatedAt:     now,
	}, nil
}

// AddItem adds an item to the kitchen order
func (ko *KitchenOrder) AddItem(menuItemID, name string, quantity int, prepTime time.Duration, mods []string, notes string) error {
	if menuItemID == "" {
		return errors.NewValidationError("menuItemID", "menu item ID is required")
	}
	if quantity <= 0 {
		return errors.NewValidationError("quantity", "quantity must be positive")
	}

	// Create a new item
	item := &KitchenItem{
		ID:            KitchenItemID("ki_" + time.Now().Format("20060102150405")),
		MenuItemID:    menuItemID,
		Name:          name,
		Quantity:      quantity,
		Status:        KitchenItemStatusNew,
		PrepTime:      prepTime,
		Modifications: mods,
		Notes:         notes,
	}

	// Add to items
	ko.Items = append(ko.Items, item)

	// Recalculate estimated time
	ko.recalculateEstimatedTime()

	ko.UpdatedAt = time.Now()
	return nil
}

// RemoveItem removes an item from the kitchen order
func (ko *KitchenOrder) RemoveItem(itemID KitchenItemID) error {
	for i, item := range ko.Items {
		if item.ID == itemID {
			// Remove the item
			ko.Items = append(ko.Items[:i], ko.Items[i+1:]...)

			// Recalculate estimated time
			ko.recalculateEstimatedTime()

			ko.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.WrapBusinessError("ITEM_NOT_FOUND", "item not found in kitchen order", errors.ErrNotFound)
}

// recalculateEstimatedTime updates the estimated preparation time
func (ko *KitchenOrder) recalculateEstimatedTime() {
	var maxPrepTime time.Duration
	for _, item := range ko.Items {
		if item.Status != KitchenItemStatusReady && item.Status != KitchenItemStatusCancelled {
			if item.PrepTime > maxPrepTime {
				maxPrepTime = item.PrepTime
			}
		}
	}
	ko.EstimatedTime = maxPrepTime
}

// AssignToStation assigns the kitchen order to a station
func (ko *KitchenOrder) AssignToStation(stationID string) error {
	if stationID == "" {
		return errors.NewValidationError("stationID", "station ID is required")
	}

	ko.AssignedStation = stationID
	ko.UpdatedAt = time.Now()
	return nil
}

// UpdateItemStatus changes the status of an item
func (ko *KitchenOrder) UpdateItemStatus(itemID KitchenItemID, status KitchenItemStatus) error {
	for _, item := range ko.Items {
		if item.ID == itemID {
			// Validate status transition
			switch item.Status {
			case KitchenItemStatusNew:
				if status != KitchenItemStatusPreparing && status != KitchenItemStatusCancelled {
					return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "invalid status transition")
				}
				if status == KitchenItemStatusPreparing {
					item.StartedAt = time.Now()
				}
			case KitchenItemStatusPreparing:
				if status != KitchenItemStatusReady && status != KitchenItemStatusCancelled {
					return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "invalid status transition")
				}
				if status == KitchenItemStatusReady {
					item.CompletedAt = time.Now()
				}
			case KitchenItemStatusReady, KitchenItemStatusCancelled:
				return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "cannot change status of ready or cancelled item")
			}

			item.Status = status

			// Check if all items are ready or cancelled to update order status
			ko.updateOrderStatus()

			// Recalculate estimated time
			ko.recalculateEstimatedTime()

			ko.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.WrapBusinessError("ITEM_NOT_FOUND", "item not found in kitchen order", errors.ErrNotFound)
}

// UpdateStatus changes the kitchen order status
func (ko *KitchenOrder) UpdateStatus(status KitchenOrderStatus) error {
	// Validate status transition
	switch ko.Status {
	case KitchenOrderStatusNew:
		if status != KitchenOrderStatusPreparing && status != KitchenOrderStatusCancelled {
			return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "invalid status transition")
		}
		if status == KitchenOrderStatusPreparing {
			ko.StartedAt = time.Now()
		}
	case KitchenOrderStatusPreparing:
		if status != KitchenOrderStatusReady && status != KitchenOrderStatusCancelled {
			return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "invalid status transition")
		}
	case KitchenOrderStatusReady:
		if status != KitchenOrderStatusCompleted && status != KitchenOrderStatusCancelled {
			return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "invalid status transition")
		}
		if status == KitchenOrderStatusCompleted {
			ko.CompletedAt = time.Now()
		}
	case KitchenOrderStatusCompleted, KitchenOrderStatusCancelled:
		return errors.NewBusinessError("INVALID_STATUS_TRANSITION", "cannot change status of completed or cancelled order")
	}

	ko.Status = status
	ko.UpdatedAt = time.Now()
	return nil
}

// updateOrderStatus updates the kitchen order status based on item statuses
func (ko *KitchenOrder) updateOrderStatus() {
	if ko.Status == KitchenOrderStatusCompleted || ko.Status == KitchenOrderStatusCancelled {
		return
	}

	// Check if all items are ready
	allReady := true
	allComplete := true
	anyPreparing := false

	for _, item := range ko.Items {
		if item.Status != KitchenItemStatusReady && item.Status != KitchenItemStatusCancelled {
			allReady = false
		}
		if item.Status == KitchenItemStatusPreparing {
			anyPreparing = true
		}
		if item.Status != KitchenItemStatusCancelled {
			allComplete = false
		}
	}

	// Update order status based on items
	if allComplete {
		ko.Status = KitchenOrderStatusCancelled
	} else if allReady {
		ko.Status = KitchenOrderStatusReady
	} else if anyPreparing {
		ko.Status = KitchenOrderStatusPreparing
	}
}

// SetPriority sets the priority of the kitchen order
func (ko *KitchenOrder) SetPriority(priority KitchenPriority) {
	ko.Priority = priority
	ko.UpdatedAt = time.Now()
}

// AddNotes adds notes to the kitchen order
func (ko *KitchenOrder) AddNotes(notes string) {
	ko.Notes = notes
	ko.UpdatedAt = time.Now()
}

// Cancel cancels the kitchen order
func (ko *KitchenOrder) Cancel() error {
	if ko.Status == KitchenOrderStatusCompleted {
		return errors.NewBusinessError("ORDER_NOT_CANCELLABLE", "cannot cancel a completed order")
	}

	ko.Status = KitchenOrderStatusCancelled

	// Cancel all items that are not ready
	for _, item := range ko.Items {
		if item.Status != KitchenItemStatusReady {
			item.Status = KitchenItemStatusCancelled
		}
	}

	ko.UpdatedAt = time.Now()
	return nil
}

// IsComplete checks if the kitchen order is complete
func (ko *KitchenOrder) IsComplete() bool {
	return ko.Status == KitchenOrderStatusCompleted
}

// IsReady checks if the kitchen order is ready for serving
func (ko *KitchenOrder) IsReady() bool {
	return ko.Status == KitchenOrderStatusReady
}

// IsCancelled checks if the kitchen order is cancelled
func (ko *KitchenOrder) IsCancelled() bool {
	return ko.Status == KitchenOrderStatusCancelled
}

// TimeElapsed returns the time elapsed since the order was started
func (ko *KitchenOrder) TimeElapsed() time.Duration {
	if ko.StartedAt.IsZero() {
		return 0
	}

	if ko.CompletedAt.IsZero() {
		return time.Since(ko.StartedAt)
	}

	return ko.CompletedAt.Sub(ko.StartedAt)
}

// TimeRemaining returns the estimated time remaining
func (ko *KitchenOrder) TimeRemaining() time.Duration {
	if ko.Status == KitchenOrderStatusReady || ko.Status == KitchenOrderStatusCompleted || ko.Status == KitchenOrderStatusCancelled {
		return 0
	}

	elapsed := ko.TimeElapsed()
	if elapsed >= ko.EstimatedTime {
		return 0
	}

	return ko.EstimatedTime - elapsed
}

// Validate checks if the kitchen order is valid
func (ko *KitchenOrder) Validate() error {
	if ko.OrderID == "" {
		return errors.NewValidationError("orderID", "order ID is required")
	}

	if len(ko.Items) == 0 {
		return errors.NewValidationError("items", "kitchen order must have at least one item")
	}

	return nil
}