package application

import (
	"context"
	"log"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
	"github.com/restaurant-platform/shared/pkg/errors"
)

// Command structures for application service
type CreateInventoryItemCommand struct {
	SKU          string  `json:"sku"`
	Name         string  `json:"name"`
	InitialStock float64 `json:"initial_stock"`
	Unit         string  `json:"unit"`
	Cost         float64 `json:"cost"`
	Category     string  `json:"category,omitempty"`
	MinThreshold float64 `json:"min_threshold"`
	MaxThreshold float64 `json:"max_threshold"`
	ReorderPoint float64 `json:"reorder_point"`
}


// InventoryService provides business logic for inventory operations
type InventoryService struct {
	inventoryRepo  inventory.InventoryRepository
	eventPublisher events.EventPublisher
}

// NewInventoryService creates a new inventory service instance
func NewInventoryService(inventoryRepo inventory.InventoryRepository, eventPublisher events.EventPublisher) *InventoryService {
	return &InventoryService{
		inventoryRepo:  inventoryRepo,
		eventPublisher: eventPublisher,
	}
}

// CreateItem creates a new inventory item
func (s *InventoryService) CreateItem(ctx context.Context, sku, name string, initialStock float64, unit inventory.UnitType, cost float64) (*inventory.InventoryItem, error) {
	item, err := inventory.NewInventoryItem(sku, name, initialStock, unit, cost)
	if err != nil {
		return nil, err
	}

	err = s.inventoryRepo.CreateItem(ctx, item)
	if err != nil {
		return nil, err
	}

	// Publish inventory item created event
	eventData, err := events.ToEventData(events.InventoryItemCreatedData{
		ItemID:       item.ID.String(),
		SKU:          item.SKU,
		Name:         item.Name,
		Category:     item.Category,
		CurrentStock: item.CurrentStock,
		Unit:         string(item.Unit),
		Cost:         item.Cost,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return nil, err
	}

	event := events.NewDomainEvent(events.InventoryItemCreatedEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish inventory item created event: %v", err)
	}

	return item, nil
}

// GetItem retrieves an inventory item by ID
func (s *InventoryService) GetItem(ctx context.Context, id inventory.InventoryItemID) (*inventory.InventoryItem, error) {
	return s.inventoryRepo.GetItemByID(ctx, id)
}

// GetItemBySKU retrieves an inventory item by SKU
func (s *InventoryService) GetItemBySKU(ctx context.Context, sku string) (*inventory.InventoryItem, error) {
	return s.inventoryRepo.GetItemBySKU(ctx, sku)
}

// AddStock adds stock to an inventory item
func (s *InventoryService) AddStock(ctx context.Context, itemID inventory.InventoryItemID, quantity float64, notes, reference, performedBy string) error {
	item, err := s.inventoryRepo.GetItemByID(ctx, itemID)
	if err != nil {
		return err
	}

	movement, err := item.AddMovement(inventory.MovementTypeReceived, quantity, notes, reference, performedBy)
	if err != nil {
		return err
	}

	err = s.inventoryRepo.UpdateItem(ctx, item)
	if err != nil {
		return err
	}

	// Publish stock received event
	eventData, err := events.ToEventData(events.StockMovementData{
		ItemID:        item.ID.String(),
		SKU:           item.SKU,
		ItemName:      item.Name,
		MovementType:  string(movement.Type),
		Quantity:      movement.Quantity,
		PreviousStock: movement.PreviousStock,
		NewStock:      movement.NewStock,
		Reference:     reference,
		PerformedBy:   performedBy,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(events.StockReceivedEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish stock received event: %v", err)
	}

	return nil
}

// UseStock removes stock from an inventory item
func (s *InventoryService) UseStock(ctx context.Context, itemID inventory.InventoryItemID, quantity float64, notes, reference, performedBy string) error {
	item, err := s.inventoryRepo.GetItemByID(ctx, itemID)
	if err != nil {
		return err
	}

	previousStock := item.CurrentStock
	movement, err := item.AddMovement(inventory.MovementTypeUsed, quantity, notes, reference, performedBy)
	if err != nil {
		return err
	}

	err = s.inventoryRepo.UpdateItem(ctx, item)
	if err != nil {
		return err
	}

	// Publish stock used event
	eventData, err := events.ToEventData(events.StockMovementData{
		ItemID:        item.ID.String(),
		SKU:           item.SKU,
		ItemName:      item.Name,
		MovementType:  string(movement.Type),
		Quantity:      movement.Quantity,
		PreviousStock: movement.PreviousStock,
		NewStock:      movement.NewStock,
		Reference:     reference,
		PerformedBy:   performedBy,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(events.StockUsedEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish stock used event: %v", err)
	}

	// Check for low stock or out of stock alerts
	s.checkAndPublishStockAlerts(ctx, item, previousStock)

	return nil
}

// ReserveStock reserves stock for an order
func (s *InventoryService) ReserveStock(ctx context.Context, sku string, quantity float64, reference, performedBy string) error {
	item, err := s.inventoryRepo.GetItemBySKU(ctx, sku)
	if err != nil {
		return err
	}

	if !item.CanFulfillOrder(quantity) {
		// Publish out of stock alert
		s.publishOutOfStockAlert(ctx, item, quantity)
		return errors.ErrInsufficientStock
	}

	movement, err := item.ReserveStock(quantity, reference, performedBy)
	if err != nil {
		return err
	}

	err = s.inventoryRepo.UpdateItem(ctx, item)
	if err != nil {
		return err
	}

	// Publish stock reserved event
	eventData, err := events.ToEventData(events.StockMovementData{
		ItemID:        item.ID.String(),
		SKU:           item.SKU,
		ItemName:      item.Name,
		MovementType:  "RESERVED",
		Quantity:      movement.Quantity,
		PreviousStock: movement.PreviousStock,
		NewStock:      movement.NewStock,
		Reference:     reference,
		PerformedBy:   performedBy,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(events.StockReservedEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU).
		WithMetadata("order_reference", reference)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish stock reserved event: %v", err)
	}

	return nil
}

// CheckAvailability checks if enough stock is available
func (s *InventoryService) CheckAvailability(ctx context.Context, sku string, quantity float64) (bool, error) {
	return s.inventoryRepo.CheckStockAvailability(ctx, sku, quantity)
}

// GetStockLevel gets the current stock level for an item
func (s *InventoryService) GetStockLevel(ctx context.Context, sku string) (float64, error) {
	item, err := s.inventoryRepo.GetItemBySKU(ctx, sku)
	if err != nil {
		return 0, err
	}
	return item.CurrentStock, nil
}

// UpdateThresholds updates the stock thresholds for an item
func (s *InventoryService) UpdateThresholds(ctx context.Context, itemID inventory.InventoryItemID, min, max, reorderPoint float64) error {
	item, err := s.inventoryRepo.GetItemByID(ctx, itemID)
	if err != nil {
		return err
	}

	err = item.UpdateThresholds(min, max, reorderPoint)
	if err != nil {
		return err
	}

	return s.inventoryRepo.UpdateItem(ctx, item)
}

// GetLowStockItems returns items that are below reorder point
func (s *InventoryService) GetLowStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	return s.inventoryRepo.GetLowStockItems(ctx)
}

// GetOutOfStockItems returns items that are out of stock
func (s *InventoryService) GetOutOfStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	return s.inventoryRepo.GetOutOfStockItems(ctx)
}

// ListItems returns a list of inventory items with filtering
func (s *InventoryService) ListItems(ctx context.Context, offset, limit int, filters inventory.InventoryFilters) ([]*inventory.InventoryItem, int, error) {
	return s.inventoryRepo.ListItems(ctx, offset, limit)
}

// RecordMovement records a stock movement
func (s *InventoryService) RecordMovement(ctx context.Context, itemID inventory.InventoryItemID, movementType inventory.MovementType, quantity float64, notes, reference, performedBy string) error {
	item, err := s.inventoryRepo.GetItemByID(ctx, itemID)
	if err != nil {
		return err
	}

	movement, err := item.AddMovement(movementType, quantity, notes, reference, performedBy)
	if err != nil {
		return err
	}

	// Save the movement
	err = s.inventoryRepo.CreateMovement(ctx, movement)
	if err != nil {
		return err
	}

	// Update the item with new stock level
	err = s.inventoryRepo.UpdateItem(ctx, item)
	if err != nil {
		return err
	}

	// Publish movement event based on type
	eventType := events.StockUsedEvent
	switch movementType {
	case inventory.MovementTypeReceived:
		eventType = events.StockReceivedEvent
	case inventory.MovementTypeWasted:
		eventType = events.StockWastedEvent
	case inventory.MovementTypeAdjusted:
		eventType = events.StockAdjustedEvent
	case inventory.MovementTypeReturned:
		eventType = events.StockReturnedEvent
	}

	eventData, err := events.ToEventData(events.StockMovementData{
		ItemID:        item.ID.String(),
		SKU:           item.SKU,
		ItemName:      item.Name,
		MovementType:  string(movement.Type),
		Quantity:      movement.Quantity,
		PreviousStock: movement.PreviousStock,
		NewStock:      movement.NewStock,
		Reference:     reference,
		PerformedBy:   performedBy,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(eventType, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU)

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish stock movement event: %v", err)
	}

	return nil
}

// CreateInventoryItem creates a new inventory item using command
func (s *InventoryService) CreateInventoryItem(ctx context.Context, cmd CreateInventoryItemCommand) (*inventory.InventoryItem, error) {
	unitType := inventory.UnitType(cmd.Unit)
	item, err := inventory.NewInventoryItem(cmd.SKU, cmd.Name, cmd.InitialStock, unitType, cmd.Cost)
	if err != nil {
		return nil, err
	}

	// Set additional fields
	item.Category = cmd.Category
	if err := item.UpdateThresholds(cmd.MinThreshold, cmd.MaxThreshold, cmd.ReorderPoint); err != nil {
		return nil, err
	}

	err = s.inventoryRepo.CreateItem(ctx, item)
	if err != nil {
		return nil, err
	}

	return item, nil
}

// GetInventoryItemByID gets an inventory item by ID
func (s *InventoryService) GetInventoryItemByID(ctx context.Context, id inventory.InventoryItemID) (*inventory.InventoryItem, error) {
	return s.inventoryRepo.GetItemByID(ctx, id)
}

// GetMovementsByItemID gets stock movements for an item
func (s *InventoryService) GetMovementsByItemID(ctx context.Context, itemID inventory.InventoryItemID, limit int) ([]*inventory.StockMovement, error) {
	return s.inventoryRepo.GetMovementsByItemID(ctx, itemID, limit, 0)
}

// CreateSupplier creates a new supplier with full details
func (s *InventoryService) CreateSupplier(ctx context.Context, name, contactName, email, phone, address, website, notes string) (*inventory.Supplier, error) {
	supplier, err := inventory.NewSupplier(name)
	if err != nil {
		return nil, err
	}

	// Update supplier with additional details
	err = supplier.UpdateDetails(name, contactName, email, phone, address, website, notes)
	if err != nil {
		return nil, err
	}

	err = s.inventoryRepo.CreateSupplier(ctx, supplier)
	if err != nil {
		return nil, err
	}

	// Publish supplier created event
	eventData, err := events.ToEventData(events.SupplierEventData{
		SupplierID:  supplier.ID.String(),
		Name:        supplier.Name,
		ContactName: supplier.ContactName,
		Email:       supplier.Email,
		Phone:       supplier.Phone,
		IsActive:    supplier.IsActive,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return nil, err
	}

	event := events.NewDomainEvent(events.SupplierCreatedEvent, supplier.ID.String(), eventData).
		WithMetadata("service", "inventory-service")

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish supplier created event: %v", err)
	}

	return supplier, nil
}

// GetSupplierByID gets a supplier by ID
func (s *InventoryService) GetSupplierByID(ctx context.Context, id inventory.SupplierID) (*inventory.Supplier, error) {
	return s.inventoryRepo.GetSupplierByID(ctx, id)
}

// UpdateSupplier updates a supplier
func (s *InventoryService) UpdateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	err := s.inventoryRepo.UpdateSupplier(ctx, supplier)
	if err != nil {
		return err
	}

	// Publish supplier updated event
	eventData, err := events.ToEventData(events.SupplierEventData{
		SupplierID:  supplier.ID.String(),
		Name:        supplier.Name,
		ContactName: supplier.ContactName,
		Email:       supplier.Email,
		Phone:       supplier.Phone,
		IsActive:    supplier.IsActive,
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(events.SupplierUpdatedEvent, supplier.ID.String(), eventData).
		WithMetadata("service", "inventory-service")

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish supplier updated event: %v", err)
	}

	return nil
}

// DeleteSupplier deletes a supplier
func (s *InventoryService) DeleteSupplier(ctx context.Context, id inventory.SupplierID) error {
	// Check if supplier has any items
	items, err := s.inventoryRepo.GetItemsBySupplier(ctx, id)
	if err != nil {
		return err
	}

	if len(items) > 0 {
		return errors.WrapConflict("DeleteSupplier", "supplier", "supplier has associated inventory items", nil)
	}

	err = s.inventoryRepo.DeleteSupplier(ctx, id)
	if err != nil {
		return err
	}

	// Publish supplier deleted event
	eventData, err := events.ToEventData(events.SupplierDeletedData{
		SupplierID: id.String(),
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}

	event := events.NewDomainEvent(events.SupplierDeletedEvent, id.String(), eventData).
		WithMetadata("service", "inventory-service")

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish supplier deleted event: %v", err)
	}

	return nil
}

// ListSuppliers lists suppliers with pagination
func (s *InventoryService) ListSuppliers(ctx context.Context, offset, limit int) ([]*inventory.Supplier, int, error) {
	return s.inventoryRepo.ListSuppliersWithPagination(ctx, offset, limit)
}

// Helper function to check and publish stock alerts
func (s *InventoryService) checkAndPublishStockAlerts(ctx context.Context, item *inventory.InventoryItem, previousStock float64) {
	// Check if item just went out of stock
	if item.IsOutOfStock() && previousStock > 0 {
		s.publishOutOfStockAlert(ctx, item, 0)
	} else if item.IsLowStock() && previousStock > item.ReorderPoint {
		// Check if item just went below reorder point
		s.publishLowStockAlert(ctx, item)
	}
}

// Helper function to publish low stock alert
func (s *InventoryService) publishLowStockAlert(ctx context.Context, item *inventory.InventoryItem) {
	eventData, err := events.ToEventData(events.StockAlertData{
		ItemID:       item.ID.String(),
		SKU:          item.SKU,
		ItemName:     item.Name,
		CurrentStock: item.CurrentStock,
		Threshold:    item.ReorderPoint,
		AlertType:    "LOW_STOCK",
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return
	}

	event := events.NewDomainEvent(events.LowStockAlertEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU).
		WithMetadata("alert_level", "WARNING")

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish low stock alert: %v", err)
	}
}

// Helper function to publish out of stock alert
func (s *InventoryService) publishOutOfStockAlert(ctx context.Context, item *inventory.InventoryItem, requestedQuantity float64) {
	eventData, err := events.ToEventData(events.StockAlertData{
		ItemID:       item.ID.String(),
		SKU:          item.SKU,
		ItemName:     item.Name,
		CurrentStock: item.CurrentStock,
		Threshold:    requestedQuantity,
		AlertType:    "OUT_OF_STOCK",
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return
	}

	event := events.NewDomainEvent(events.OutOfStockAlertEvent, item.ID.String(), eventData).
		WithMetadata("service", "inventory-service").
		WithMetadata("sku", item.SKU).
		WithMetadata("alert_level", "CRITICAL")

	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish out of stock alert: %v", err)
	}
}
