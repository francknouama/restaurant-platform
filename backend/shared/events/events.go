package events

import (
	"encoding/json"
	"fmt"
)

// Package-level exports for convenience
var (
	// Event stream names
	MenuStream        = "menu-events"
	ReservationStream = "reservation-events"
	OrderStream       = "order-events"
	KitchenStream     = "kitchen-events"
	InventoryStream   = "inventory-events"
)

// Menu Event Data Structures

// MenuCreatedData represents data for menu created event
type MenuCreatedData struct {
	MenuID   string `json:"menu_id"`
	Name     string `json:"name"`
	Version  int    `json:"version"`
	IsActive bool   `json:"is_active"`
}

// MenuActivatedData represents data for menu activated event
type MenuActivatedData struct {
	MenuID  string `json:"menu_id"`
	Name    string `json:"name"`
	Version int    `json:"version"`
}

// ItemAvailabilityChangedData represents data for item availability changed event
type ItemAvailabilityChangedData struct {
	MenuID      string `json:"menu_id"`
	ItemID      string `json:"item_id"`
	ItemName    string `json:"item_name"`
	IsAvailable bool   `json:"is_available"`
	CategoryID  string `json:"category_id"`
}

// Reservation Event Data Structures

// ReservationCreatedData represents data for reservation created event
type ReservationCreatedData struct {
	ReservationID string `json:"reservation_id"`
	CustomerID    string `json:"customer_id"`
	TableID       string `json:"table_id"`
	PartySize     int    `json:"party_size"`
	DateTime      string `json:"date_time"`
	Status        string `json:"status"`
}

// ReservationStatusChangedData represents data for reservation status change events
type ReservationStatusChangedData struct {
	ReservationID string `json:"reservation_id"`
	CustomerID    string `json:"customer_id"`
	TableID       string `json:"table_id"`
	PartySize     int    `json:"party_size"`
	DateTime      string `json:"date_time"`
	OldStatus     string `json:"old_status"`
	NewStatus     string `json:"new_status"`
}

// Inventory Event Data Structures

// InventoryItemCreatedData represents data for inventory item created event
type InventoryItemCreatedData struct {
	ItemID       string  `json:"item_id"`
	SKU          string  `json:"sku"`
	Name         string  `json:"name"`
	Category     string  `json:"category"`
	CurrentStock float64 `json:"current_stock"`
	Unit         string  `json:"unit"`
	Cost         float64 `json:"cost"`
}

// StockMovementData represents data for stock movement events
type StockMovementData struct {
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

// StockAlertData represents data for stock alert events
type StockAlertData struct {
	ItemID       string  `json:"item_id"`
	SKU          string  `json:"sku"`
	ItemName     string  `json:"item_name"`
	CurrentStock float64 `json:"current_stock"`
	Threshold    float64 `json:"threshold"`
	AlertType    string  `json:"alert_type"`
}

// SupplierEventData represents data for supplier events
type SupplierEventData struct {
	SupplierID   string `json:"supplier_id"`
	Name         string `json:"name"`
	ContactName  string `json:"contact_name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	IsActive     bool   `json:"is_active"`
}

// Kitchen Event Data Structures

// KitchenOrderCreatedData represents data for kitchen order created event
type KitchenOrderCreatedData struct {
	KitchenOrderID string `json:"kitchen_order_id"`
	OrderID        string `json:"order_id"`
	TableID        string `json:"table_id"`
	Status         string `json:"status"`
	Priority       string `json:"priority"`
	EstimatedTime  int64  `json:"estimated_time"`
}

// KitchenOrderStatusChangedData represents data for kitchen order status change events
type KitchenOrderStatusChangedData struct {
	KitchenOrderID string `json:"kitchen_order_id"`
	OrderID        string `json:"order_id"`
	OldStatus      string `json:"old_status"`
	NewStatus      string `json:"new_status"`
	UpdatedBy      string `json:"updated_by"`
}

// KitchenItemStatusChangedData represents data for kitchen item status change events
type KitchenItemStatusChangedData struct {
	KitchenOrderID string `json:"kitchen_order_id"`
	ItemID         string `json:"item_id"`
	MenuItemID     string `json:"menu_item_id"`
	ItemName       string `json:"item_name"`
	OldStatus      string `json:"old_status"`
	NewStatus      string `json:"new_status"`
	UpdatedBy      string `json:"updated_by"`
}

// Order Event Data Structures

// OrderCreatedData represents data for order created event
type OrderCreatedData struct {
	OrderID     string  `json:"order_id"`
	CustomerID  string  `json:"customer_id"`
	TableID     string  `json:"table_id"`
	OrderType   string  `json:"order_type"`
	TotalAmount float64 `json:"total_amount"`
	Status      string  `json:"status"`
}

// OrderStatusChangedData represents data for order status change events
type OrderStatusChangedData struct {
	OrderID   string `json:"order_id"`
	OldStatus string `json:"old_status"`
	NewStatus string `json:"new_status"`
	UpdatedBy string `json:"updated_by"`
}

// Helper functions to create event data maps

// EventData represents any valid event data structure
type EventData interface {
	MenuCreatedData | MenuActivatedData | ItemAvailabilityChangedData |
	ReservationCreatedData | ReservationStatusChangedData |
	InventoryItemCreatedData | StockMovementData | StockAlertData | SupplierEventData |
	OrderCreatedData | OrderStatusChangedData |
	KitchenOrderCreatedData | KitchenOrderStatusChangedData | KitchenItemStatusChangedData
}

// ToEventData converts a struct to event data map using Go 1.24.4 generics
func ToEventData[T EventData](data T) (map[string]interface{}, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal event data: %w", err)
	}
	
	var result map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal to map: %w", err)
	}
	
	return result, nil
}

// Legacy ToEventData for backward compatibility
func ToEventDataLegacy(data interface{}) map[string]interface{} {
	result := make(map[string]interface{})
	// Legacy implementation for backward compatibility
	switch v := data.(type) {
	case MenuCreatedData:
		result["menu_id"] = v.MenuID
		result["name"] = v.Name
		result["version"] = v.Version
		result["is_active"] = v.IsActive
	case MenuActivatedData:
		result["menu_id"] = v.MenuID
		result["name"] = v.Name
		result["version"] = v.Version
	case ItemAvailabilityChangedData:
		result["menu_id"] = v.MenuID
		result["item_id"] = v.ItemID
		result["item_name"] = v.ItemName
		result["is_available"] = v.IsAvailable
		result["category_id"] = v.CategoryID
	case ReservationCreatedData:
		result["reservation_id"] = v.ReservationID
		result["customer_id"] = v.CustomerID
		result["table_id"] = v.TableID
		result["party_size"] = v.PartySize
		result["date_time"] = v.DateTime
		result["status"] = v.Status
	case ReservationStatusChangedData:
		result["reservation_id"] = v.ReservationID
		result["customer_id"] = v.CustomerID
		result["table_id"] = v.TableID
		result["party_size"] = v.PartySize
		result["date_time"] = v.DateTime
		result["old_status"] = v.OldStatus
		result["new_status"] = v.NewStatus
	case InventoryItemCreatedData:
		result["item_id"] = v.ItemID
		result["sku"] = v.SKU
		result["name"] = v.Name
		result["category"] = v.Category
		result["current_stock"] = v.CurrentStock
		result["unit"] = v.Unit
		result["cost"] = v.Cost
	case StockMovementData:
		result["item_id"] = v.ItemID
		result["sku"] = v.SKU
		result["item_name"] = v.ItemName
		result["movement_type"] = v.MovementType
		result["quantity"] = v.Quantity
		result["previous_stock"] = v.PreviousStock
		result["new_stock"] = v.NewStock
		result["reference"] = v.Reference
		result["performed_by"] = v.PerformedBy
	case StockAlertData:
		result["item_id"] = v.ItemID
		result["sku"] = v.SKU
		result["item_name"] = v.ItemName
		result["current_stock"] = v.CurrentStock
		result["threshold"] = v.Threshold
		result["alert_type"] = v.AlertType
	case SupplierEventData:
		result["supplier_id"] = v.SupplierID
		result["name"] = v.Name
		result["contact_name"] = v.ContactName
		result["email"] = v.Email
		result["phone"] = v.Phone
		result["is_active"] = v.IsActive
	case KitchenOrderCreatedData:
		result["kitchen_order_id"] = v.KitchenOrderID
		result["order_id"] = v.OrderID
		result["table_id"] = v.TableID
		result["status"] = v.Status
		result["priority"] = v.Priority
		result["estimated_time"] = v.EstimatedTime
	case KitchenOrderStatusChangedData:
		result["kitchen_order_id"] = v.KitchenOrderID
		result["order_id"] = v.OrderID
		result["old_status"] = v.OldStatus
		result["new_status"] = v.NewStatus
		result["updated_by"] = v.UpdatedBy
	case KitchenItemStatusChangedData:
		result["kitchen_order_id"] = v.KitchenOrderID
		result["item_id"] = v.ItemID
		result["menu_item_id"] = v.MenuItemID
		result["item_name"] = v.ItemName
		result["old_status"] = v.OldStatus
		result["new_status"] = v.NewStatus
		result["updated_by"] = v.UpdatedBy
	case OrderCreatedData:
		result["order_id"] = v.OrderID
		result["customer_id"] = v.CustomerID
		result["table_id"] = v.TableID
		result["order_type"] = v.OrderType
		result["total_amount"] = v.TotalAmount
		result["status"] = v.Status
	case OrderStatusChangedData:
		result["order_id"] = v.OrderID
		result["old_status"] = v.OldStatus
		result["new_status"] = v.NewStatus
		result["updated_by"] = v.UpdatedBy
	}
	return result
}