package inventory

import (
	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/shared/pkg/types"
	"time"
)

// Inventory domain entity markers for type-safe IDs
type (
	InventoryItemEntity struct{}
	SupplierEntity      struct{}
	MovementEntity      struct{}
)

// Implement EntityMarker interface
func (InventoryItemEntity) IsEntity() {}
func (SupplierEntity) IsEntity()      {}
func (MovementEntity) IsEntity()      {}

// Type-safe ID types using generics
type (
	InventoryItemID = types.ID[InventoryItemEntity]
	SupplierID      = types.ID[SupplierEntity]
	MovementID      = types.ID[MovementEntity]
)

// MovementType represents the type of stock movement
type MovementType string

const (
	MovementTypeReceived MovementType = "RECEIVED"
	MovementTypeUsed     MovementType = "USED"
	MovementTypeWasted   MovementType = "WASTED"
	MovementTypeAdjusted MovementType = "ADJUSTED"
	MovementTypeReturned MovementType = "RETURNED"
)

// UnitType represents the unit of measurement for an inventory item
type UnitType string

const (
	UnitTypeKilograms   UnitType = "KG"
	UnitTypeLiters      UnitType = "L"
	UnitTypeUnits       UnitType = "UNITS"
	UnitTypeGrams       UnitType = "G"
	UnitTypeMilliliters UnitType = "ML"
)

// InventoryItem is the aggregate root for the inventory domain
type InventoryItem struct {
	ID           InventoryItemID  `json:"id"`
	SKU          string           `json:"sku"`
	Name         string           `json:"name"`
	Description  string           `json:"description,omitempty"`
	CurrentStock float64          `json:"current_stock"`
	Unit         UnitType         `json:"unit"`
	MinThreshold float64          `json:"min_threshold"`
	MaxThreshold float64          `json:"max_threshold"`
	ReorderPoint float64          `json:"reorder_point"`
	Cost         float64          `json:"cost"`
	Category     string           `json:"category,omitempty"`
	Location     string           `json:"location,omitempty"`
	SupplierID   SupplierID       `json:"supplier_id,omitempty"`
	LastOrdered  time.Time        `json:"last_ordered,omitempty"`
	ExpiryDate   time.Time        `json:"expiry_date,omitempty"`
	Movements    []*StockMovement `json:"movements,omitempty"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
}

// StockMovement represents a change in stock level of an inventory item
type StockMovement struct {
	ID              MovementID      `json:"id"`
	InventoryItemID InventoryItemID `json:"inventory_item_id"`
	Type            MovementType    `json:"type"`
	Quantity        float64         `json:"quantity"`
	PreviousStock   float64         `json:"previous_stock"`
	NewStock        float64         `json:"new_stock"`
	Notes           string          `json:"notes,omitempty"`
	Reference       string          `json:"reference,omitempty"` // Order ID, supplier delivery ID, etc.
	PerformedBy     string          `json:"performed_by,omitempty"`
	CreatedAt       time.Time       `json:"created_at"`
}

// Supplier represents a vendor that supplies inventory items
type Supplier struct {
	ID          SupplierID `json:"id"`
	Name        string     `json:"name"`
	ContactName string     `json:"contact_name,omitempty"`
	Email       string     `json:"email,omitempty"`
	Phone       string     `json:"phone,omitempty"`
	Address     string     `json:"address,omitempty"`
	Website     string     `json:"website,omitempty"`
	Notes       string     `json:"notes,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// NewInventoryItem creates a new inventory item with validated fields
func NewInventoryItem(sku, name string, initialStock float64, unit UnitType, cost float64) (*InventoryItem, error) {
	if sku == "" {
		return nil, errors.WrapValidation("NewInventoryItem", "sku", "SKU is required", nil)
	}
	if name == "" {
		return nil, errors.WrapValidation("NewInventoryItem", "name", "name is required", nil)
	}
	if initialStock < 0 {
		return nil, errors.WrapValidation("NewInventoryItem", "initialStock", "initial stock cannot be negative", nil)
	}
	if cost < 0 {
		return nil, errors.WrapValidation("NewInventoryItem", "cost", "cost cannot be negative", nil)
	}

	now := time.Now()
	return &InventoryItem{
		ID:           types.NewID[InventoryItemEntity]("inv"),
		SKU:          sku,
		Name:         name,
		CurrentStock: initialStock,
		Unit:         unit,
		Cost:         cost,
		Movements:    make([]*StockMovement, 0),
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

// NewSupplier creates a new supplier with validated fields
func NewSupplier(name string) (*Supplier, error) {
	if name == "" {
		return nil, errors.WrapValidation("NewSupplier", "name", "supplier name is required", nil)
	}

	now := time.Now()
	return &Supplier{
		ID:        types.NewID[SupplierEntity]("sup"),
		Name:      name,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// AddMovement adds a stock movement to an inventory item
func (i *InventoryItem) AddMovement(movementType MovementType, quantity float64, notes, reference, performedBy string) (*StockMovement, error) {
	if quantity <= 0 && movementType != MovementTypeAdjusted {
		return nil, errors.WrapValidation("AddMovement", "quantity", "quantity must be positive", nil)
	}

	previousStock := i.CurrentStock
	var newStock float64

	switch movementType {
	case MovementTypeReceived:
		newStock = previousStock + quantity
	case MovementTypeUsed, MovementTypeWasted, MovementTypeReturned:
		if previousStock < quantity {
			return nil, errors.WrapConflict("AddMovement", "stock", "insufficient stock for this operation", nil)
		}
		newStock = previousStock - quantity
	case MovementTypeAdjusted:
		newStock = quantity // For adjustment, quantity is the new stock level
	default:
		return nil, errors.WrapValidation("AddMovement", "movementType", "invalid movement type", nil)
	}

	now := time.Now()
	movement := &StockMovement{
		ID:              types.NewID[MovementEntity]("mov"),
		InventoryItemID: i.ID,
		Type:            movementType,
		Quantity:        quantity,
		PreviousStock:   previousStock,
		NewStock:        newStock,
		Notes:           notes,
		Reference:       reference,
		PerformedBy:     performedBy,
		CreatedAt:       now,
	}

	i.CurrentStock = newStock
	i.UpdatedAt = now
	i.Movements = append(i.Movements, movement)

	return movement, nil
}

// UpdateThresholds updates the inventory item thresholds
func (i *InventoryItem) UpdateThresholds(min, max, reorderPoint float64) error {
	if min < 0 || max < 0 || reorderPoint < 0 {
		return errors.WrapValidation("UpdateThresholds", "thresholds", "thresholds cannot be negative", nil)
	}
	if max < min {
		return errors.WrapConflict("UpdateThresholds", "thresholds", "maximum threshold cannot be less than minimum threshold", nil)
	}
	if reorderPoint < min || reorderPoint > max {
		return errors.WrapConflict("UpdateThresholds", "reorder_point", "reorder point must be between minimum and maximum thresholds", nil)
	}

	i.MinThreshold = min
	i.MaxThreshold = max
	i.ReorderPoint = reorderPoint
	i.UpdatedAt = time.Now()

	return nil
}

// IsLowStock checks if the inventory item is below the reorder point
func (i *InventoryItem) IsLowStock() bool {
	return i.CurrentStock <= i.ReorderPoint
}

// IsOutOfStock checks if the inventory item is out of stock
func (i *InventoryItem) IsOutOfStock() bool {
	return i.CurrentStock <= 0
}

// CanFulfillOrder checks if there's enough stock to fulfill an order quantity
func (i *InventoryItem) CanFulfillOrder(quantity float64) bool {
	return i.CurrentStock >= quantity
}

// ReserveStock reduces available stock for an order (without creating movement yet)
func (i *InventoryItem) ReserveStock(quantity float64, reference, performedBy string) (*StockMovement, error) {
	if !i.CanFulfillOrder(quantity) {
		return nil, errors.ErrInsufficientStock
	}

	return i.AddMovement(MovementTypeUsed, quantity, "Stock reserved for order", reference, performedBy)
}

// SetSupplier assigns a supplier to the inventory item
func (i *InventoryItem) SetSupplier(supplierID SupplierID) {
	i.SupplierID = supplierID
	i.UpdatedAt = time.Now()
}

// UpdateDetails updates the inventory item details
func (i *InventoryItem) UpdateDetails(name, description, category, location string, cost float64) error {
	if name == "" {
		return errors.WrapValidation("UpdateDetails", "name", "name is required", nil)
	}
	if cost < 0 {
		return errors.WrapValidation("UpdateDetails", "cost", "cost cannot be negative", nil)
	}

	i.Name = name
	i.Description = description
	i.Category = category
	i.Location = location
	i.Cost = cost
	i.UpdatedAt = time.Now()

	return nil
}

// UpdateSupplierDetails updates the supplier details
func (s *Supplier) UpdateDetails(name, contactName, email, phone, address, website, notes string) error {
	if name == "" {
		return errors.WrapValidation("UpdateSupplierDetails", "name", "name is required", nil)
	}

	s.Name = name
	s.ContactName = contactName
	s.Email = email
	s.Phone = phone
	s.Address = address
	s.Website = website
	s.Notes = notes
	s.UpdatedAt = time.Now()

	return nil
}

// Activate activates the supplier
func (s *Supplier) Activate() {
	s.IsActive = true
	s.UpdatedAt = time.Now()
}

// Deactivate deactivates the supplier
func (s *Supplier) Deactivate() {
	s.IsActive = false
	s.UpdatedAt = time.Now()
}