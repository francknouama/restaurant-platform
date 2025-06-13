package application

import (
	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"time"
)

// CreateKitchenOrderRequest represents the request to create a kitchen order
type CreateKitchenOrderRequest struct {
	OrderID string `json:"order_id" binding:"required"`
	TableID string `json:"table_id,omitempty"`
}

// AddKitchenItemRequest represents the request to add an item to a kitchen order
type AddKitchenItemRequest struct {
	MenuItemID    string   `json:"menu_item_id" binding:"required"`
	Name          string   `json:"name" binding:"required"`
	Quantity      int      `json:"quantity" binding:"required,min=1"`
	PrepTime      int      `json:"prep_time" binding:"min=0"` // in seconds
	Modifications []string `json:"modifications,omitempty"`
	Notes         string   `json:"notes,omitempty"`
}

// UpdateItemStatusRequest represents the request to update a kitchen item status
type UpdateItemStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// UpdateOrderStatusRequest represents the request to update a kitchen order status
type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// AssignToStationRequest represents the request to assign a kitchen order to a station
type AssignToStationRequest struct {
	StationID string `json:"station_id" binding:"required"`
}

// SetPriorityRequest represents the request to set the priority of a kitchen order
type SetPriorityRequest struct {
	Priority string `json:"priority" binding:"required"`
}

// KitchenOrderResponse represents the response containing kitchen order details
type KitchenOrderResponse struct {
	ID              string                `json:"id"`
	OrderID         string                `json:"order_id"`
	TableID         string                `json:"table_id,omitempty"`
	Status          string                `json:"status"`
	Items           []*KitchenItemResponse `json:"items"`
	Priority        string                `json:"priority"`
	AssignedStation string                `json:"assigned_station,omitempty"`
	EstimatedTime   int                   `json:"estimated_time"` // in seconds
	StartedAt       *time.Time            `json:"started_at,omitempty"`
	CompletedAt     *time.Time            `json:"completed_at,omitempty"`
	Notes           string                `json:"notes,omitempty"`
	CreatedAt       time.Time             `json:"created_at"`
	UpdatedAt       time.Time             `json:"updated_at"`
	TimeElapsed     int                   `json:"time_elapsed"`     // in seconds
	TimeRemaining   int                   `json:"time_remaining"`   // in seconds
}

// KitchenItemResponse represents the response containing kitchen item details
type KitchenItemResponse struct {
	ID              string     `json:"id"`
	MenuItemID      string     `json:"menu_item_id"`
	Name            string     `json:"name"`
	Quantity        int        `json:"quantity"`
	Status          string     `json:"status"`
	PrepTime        int        `json:"prep_time"` // in seconds
	StartedAt       *time.Time `json:"started_at,omitempty"`
	CompletedAt     *time.Time `json:"completed_at,omitempty"`
	AssignedStation string     `json:"assigned_station,omitempty"`
	Notes           string     `json:"notes,omitempty"`
	Modifications   []string   `json:"modifications,omitempty"`
}

// KitchenOrderListRequest represents the request to list kitchen orders
type KitchenOrderListRequest struct {
	Offset   int     `form:"offset,default=0" binding:"min=0"`
	Limit    int     `form:"limit,default=20" binding:"min=1,max=100"`
	Status   *string `form:"status"`
	Priority *string `form:"priority"`
	Station  *string `form:"station"`
	OrderID  *string `form:"order_id"`
	DateFrom *string `form:"date_from"`
	DateTo   *string `form:"date_to"`
}

// KitchenOrderListResponse represents the response containing a list of kitchen orders
type KitchenOrderListResponse struct {
	Orders     []*KitchenOrderResponse `json:"orders"`
	TotalCount int                     `json:"total_count"`
	Offset     int                     `json:"offset"`
	Limit      int                     `json:"limit"`
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// Helper functions to convert between domain and DTO

// ToKitchenOrderResponse converts a domain kitchen order to response DTO
func ToKitchenOrderResponse(order *domain.KitchenOrder) *KitchenOrderResponse {
	items := make([]*KitchenItemResponse, len(order.Items))
	for i, item := range order.Items {
		items[i] = ToKitchenItemResponse(item)
	}

	var startedAt, completedAt *time.Time
	if !order.StartedAt.IsZero() {
		startedAt = &order.StartedAt
	}
	if !order.CompletedAt.IsZero() {
		completedAt = &order.CompletedAt
	}

	return &KitchenOrderResponse{
		ID:              string(order.ID),
		OrderID:         order.OrderID,
		TableID:         order.TableID,
		Status:          string(order.Status),
		Items:           items,
		Priority:        string(order.Priority),
		AssignedStation: order.AssignedStation,
		EstimatedTime:   int(order.EstimatedTime.Seconds()),
		StartedAt:       startedAt,
		CompletedAt:     completedAt,
		Notes:           order.Notes,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
		TimeElapsed:     int(order.TimeElapsed().Seconds()),
		TimeRemaining:   int(order.TimeRemaining().Seconds()),
	}
}

// ToKitchenItemResponse converts a domain kitchen item to response DTO
func ToKitchenItemResponse(item *domain.KitchenItem) *KitchenItemResponse {
	var startedAt, completedAt *time.Time
	if !item.StartedAt.IsZero() {
		startedAt = &item.StartedAt
	}
	if !item.CompletedAt.IsZero() {
		completedAt = &item.CompletedAt
	}

	return &KitchenItemResponse{
		ID:              string(item.ID),
		MenuItemID:      item.MenuItemID,
		Name:            item.Name,
		Quantity:        item.Quantity,
		Status:          string(item.Status),
		PrepTime:        int(item.PrepTime.Seconds()),
		StartedAt:       startedAt,
		CompletedAt:     completedAt,
		AssignedStation: item.AssignedStation,
		Notes:           item.Notes,
		Modifications:   item.Modifications,
	}
}

// ToKitchenOrderListResponse converts domain kitchen orders to list response DTO
func ToKitchenOrderListResponse(orders []*domain.KitchenOrder, totalCount, offset, limit int) *KitchenOrderListResponse {
	orderResponses := make([]*KitchenOrderResponse, len(orders))
	for i, order := range orders {
		orderResponses[i] = ToKitchenOrderResponse(order)
	}

	return &KitchenOrderListResponse{
		Orders:     orderResponses,
		TotalCount: totalCount,
		Offset:     offset,
		Limit:      limit,
	}
}