package domain

import (
	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/shared/pkg/types"
	"time"
)

// Order domain entity markers for type-safe IDs
type (
	OrderEntity     struct{}
	OrderItemEntity struct{}
)

// Implement EntityMarker interface
func (OrderEntity) IsEntity()     {}
func (OrderItemEntity) IsEntity() {}

// Type-safe ID types using generics
type (
	OrderID     = types.ID[OrderEntity]
	OrderItemID = types.ID[OrderItemEntity]
)

// OrderType represents the different types of orders
type OrderType string

const (
	OrderTypeDineIn   OrderType = "DINE_IN"
	OrderTypeTakeout  OrderType = "TAKEOUT"
	OrderTypeDelivery OrderType = "DELIVERY"
)

// OrderStatus represents the possible states of an order
type OrderStatus string

const (
	OrderStatusCreated   OrderStatus = "CREATED"
	OrderStatusPaid      OrderStatus = "PAID"
	OrderStatusPreparing OrderStatus = "PREPARING"
	OrderStatusReady     OrderStatus = "READY"
	OrderStatusCompleted OrderStatus = "COMPLETED"
	OrderStatusCancelled OrderStatus = "CANCELLED"
)

// Order is the aggregate root for the order domain
type Order struct {
	ID              OrderID      `json:"id"`
	CustomerID      string       `json:"customer_id"`
	Type            OrderType    `json:"type"`
	Status          OrderStatus  `json:"status"`
	Items           []*OrderItem `json:"items"`
	TotalAmount     float64      `json:"total_amount"`
	TaxAmount       float64      `json:"tax_amount"`
	TableID         string       `json:"table_id,omitempty"`
	DeliveryAddress string       `json:"delivery_address,omitempty"`
	Notes           string       `json:"notes,omitempty"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ID            OrderItemID `json:"id"`
	MenuItemID    string      `json:"menu_item_id"`
	Name          string      `json:"name"`
	Quantity      int         `json:"quantity"`
	UnitPrice     float64     `json:"unit_price"`
	Modifications []string    `json:"modifications,omitempty"`
	Notes         string      `json:"notes,omitempty"`
	Subtotal      float64     `json:"subtotal"`
}

// OrderFilters defines filtering options for order queries
type OrderFilters struct {
	CustomerID string
	Status     *OrderStatus
	Type       *OrderType
	StartDate  *time.Time
	EndDate    *time.Time
	TableID    string
	MinAmount  *float64
	MaxAmount  *float64
}

// NewOrder creates a new order with validated fields using modern error handling
func NewOrder(customerID string, orderType OrderType) (*Order, error) {
	if customerID == "" {
		return nil, errors.WrapValidation("NewOrder", "customerID", "customer ID is required", nil)
	}

	now := time.Now()
	return &Order{
		ID:          types.NewID[OrderEntity]("ord"),
		CustomerID:  customerID,
		Type:        orderType,
		Status:      OrderStatusCreated,
		Items:       make([]*OrderItem, 0),
		TotalAmount: 0,
		TaxAmount:   0,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// AddItem adds an item to the order and recalculates the total
func (o *Order) AddItem(menuItemID, name string, quantity int, unitPrice float64, mods []string, notes string) error {
	if menuItemID == "" {
		return errors.WrapValidation("AddItem", "menuItemID", "menu item ID is required", nil)
	}
	if quantity <= 0 {
		return errors.WrapValidation("AddItem", "quantity", "quantity must be positive", nil)
	}
	if unitPrice < 0 {
		return errors.WrapValidation("AddItem", "unitPrice", "unit price cannot be negative", nil)
	}

	// Create a new item
	item := &OrderItem{
		ID:            types.NewID[OrderItemEntity]("item"),
		MenuItemID:    menuItemID,
		Name:          name,
		Quantity:      quantity,
		UnitPrice:     unitPrice,
		Modifications: mods,
		Notes:         notes,
		Subtotal:      float64(quantity) * unitPrice,
	}

	// Add to items
	o.Items = append(o.Items, item)

	// Recalculate total
	o.recalculateTotal()

	o.UpdatedAt = time.Now()
	return nil
}

// RemoveItem removes an item from the order and recalculates the total
func (o *Order) RemoveItem(itemID OrderItemID) error {
	for i, item := range o.Items {
		if item.ID == itemID {
			// Remove the item
			o.Items = append(o.Items[:i], o.Items[i+1:]...)

			// Recalculate total
			o.recalculateTotal()

			o.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.WrapNotFound("Operation", "item", string(itemID), errors.ErrNotFound)
}

// UpdateItemQuantity updates the quantity of an item
func (o *Order) UpdateItemQuantity(itemID OrderItemID, quantity int) error {
	if quantity <= 0 {
		return errors.WrapValidation("UpdateItemQuantity", "quantity", "quantity must be positive", nil)
	}

	for _, item := range o.Items {
		if item.ID == itemID {
			// Update quantity
			item.Quantity = quantity
			item.Subtotal = float64(quantity) * item.UnitPrice

			// Recalculate total
			o.recalculateTotal()

			o.UpdatedAt = time.Now()
			return nil
		}
	}
	return errors.WrapNotFound("Operation", "item", string(itemID), errors.ErrNotFound)
}

// recalculateTotal updates the total amount of the order
func (o *Order) recalculateTotal() {
	var total float64
	for _, item := range o.Items {
		total += item.Subtotal
	}

	// Simple tax calculation (10%)
	taxRate := 0.10
	o.TaxAmount = total * taxRate
	o.TotalAmount = total + o.TaxAmount
}

// UpdateStatus changes the order status
func (o *Order) UpdateStatus(status OrderStatus) error {
	// Validate status transition
	switch o.Status {
	case OrderStatusCreated:
		if status != OrderStatusPaid && status != OrderStatusCancelled {
			return errors.WrapConflict("UpdateStatus", "status_transition", "invalid status transition from CREATED", nil)
		}
	case OrderStatusPaid:
		if status != OrderStatusPreparing && status != OrderStatusCancelled {
			return errors.WrapConflict("UpdateStatus", "status_transition", "invalid status transition from PAID", nil)
		}
	case OrderStatusPreparing:
		if status != OrderStatusReady && status != OrderStatusCancelled {
			return errors.WrapConflict("UpdateStatus", "status_transition", "invalid status transition from PREPARING", nil)
		}
	case OrderStatusReady:
		if status != OrderStatusCompleted && status != OrderStatusCancelled {
			return errors.WrapConflict("UpdateStatus", "status_transition", "invalid status transition from READY", nil)
		}
	case OrderStatusCompleted, OrderStatusCancelled:
		return errors.WrapConflict("UpdateStatus", "status_transition", "cannot change status of completed or cancelled order", nil)
	}

	o.Status = status
	o.UpdatedAt = time.Now()
	return nil
}

// SetTableID sets the table ID for dine-in orders
func (o *Order) SetTableID(tableID string) error {
	if o.Type != OrderTypeDineIn {
		return errors.WrapConflict("SetTableID", "order_type", "table ID can only be set for dine-in orders", nil)
	}
	if tableID == "" {
		return errors.WrapValidation("SetTableID", "tableID", "table ID is required for dine-in orders", nil)
	}

	o.TableID = tableID
	o.UpdatedAt = time.Now()
	return nil
}

// SetDeliveryAddress sets the delivery address for delivery orders
func (o *Order) SetDeliveryAddress(address string) error {
	if o.Type != OrderTypeDelivery {
		return errors.WrapConflict("SetDeliveryAddress", "order_type", "delivery address can only be set for delivery orders", nil)
	}
	if address == "" {
		return errors.WrapValidation("SetDeliveryAddress", "address", "delivery address is required for delivery orders", nil)
	}

	o.DeliveryAddress = address
	o.UpdatedAt = time.Now()
	return nil
}

// AddNotes adds notes to the order
func (o *Order) AddNotes(notes string) {
	o.Notes = notes
	o.UpdatedAt = time.Now()
}

// CanCancel checks if the order can be cancelled
func (o *Order) CanCancel() bool {
	return o.Status != OrderStatusCompleted && o.Status != OrderStatusCancelled
}

// Cancel cancels the order
func (o *Order) Cancel() error {
	if !o.CanCancel() {
		return errors.WrapConflict("Cancel", "order_status", "cannot cancel completed or already cancelled order", nil)
	}

	o.Status = OrderStatusCancelled
	o.UpdatedAt = time.Now()
	return nil
}

// IsEmpty checks if the order has no items
func (o *Order) IsEmpty() bool {
	return len(o.Items) == 0
}

// Validate checks if the order is valid for the given operation
func (o *Order) Validate() error {
	if o.CustomerID == "" {
		return errors.WrapValidation("Validate", "customerID", "customer ID is required", nil)
	}

	if len(o.Items) == 0 {
		return errors.WrapValidation("Validate", "items", "order must have at least one item", nil)
	}

	// Check type-specific requirements
	if o.Type == OrderTypeDineIn && o.TableID == "" {
		return errors.WrapValidation("Validate", "tableID", "table ID is required for dine-in orders", nil)
	}

	if o.Type == OrderTypeDelivery && o.DeliveryAddress == "" {
		return errors.WrapValidation("Validate", "deliveryAddress", "delivery address is required for delivery orders", nil)
	}

	return nil
}