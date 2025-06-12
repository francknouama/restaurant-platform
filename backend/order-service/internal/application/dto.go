package application

import (
	"time"

	"github.com/restaurant-platform/order-service/internal/domain"
)

// Request DTOs

type CreateOrderRequest struct {
	CustomerID string            `json:"customer_id" binding:"required"`
	Type       string            `json:"type" binding:"required"`
	TableID    string            `json:"table_id,omitempty"`
	Address    string            `json:"delivery_address,omitempty"`
	Notes      string            `json:"notes,omitempty"`
}

type AddItemRequest struct {
	MenuItemID    string   `json:"menu_item_id" binding:"required"`
	Name          string   `json:"name" binding:"required"`
	Quantity      int      `json:"quantity" binding:"required,min=1"`
	UnitPrice     float64  `json:"unit_price" binding:"required,min=0"`
	Modifications []string `json:"modifications,omitempty"`
	Notes         string   `json:"notes,omitempty"`
}

type UpdateItemQuantityRequest struct {
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type SetTableRequest struct {
	TableID string `json:"table_id" binding:"required"`
}

type SetDeliveryAddressRequest struct {
	Address string `json:"delivery_address" binding:"required"`
}

type AddNotesRequest struct {
	Notes string `json:"notes" binding:"required"`
}

type OrderListRequest struct {
	Offset     int     `form:"offset,default=0"`
	Limit      int     `form:"limit,default=10"`
	CustomerID string  `form:"customer_id"`
	Status     *string `form:"status"`
	Type       *string `form:"type"`
	TableID    string  `form:"table_id"`
	DateFrom   *string `form:"date_from"`
	DateTo     *string `form:"date_to"`
	MinAmount  *float64 `form:"min_amount"`
	MaxAmount  *float64 `form:"max_amount"`
}

// Response DTOs

type OrderResponse struct {
	ID              string              `json:"id"`
	CustomerID      string              `json:"customer_id"`
	Type            string              `json:"type"`
	Status          string              `json:"status"`
	Items           []*OrderItemResponse `json:"items"`
	TotalAmount     float64             `json:"total_amount"`
	TaxAmount       float64             `json:"tax_amount"`
	TableID         string              `json:"table_id,omitempty"`
	DeliveryAddress string              `json:"delivery_address,omitempty"`
	Notes           string              `json:"notes,omitempty"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

type OrderItemResponse struct {
	ID            string   `json:"id"`
	MenuItemID    string   `json:"menu_item_id"`
	Name          string   `json:"name"`
	Quantity      int      `json:"quantity"`
	UnitPrice     float64  `json:"unit_price"`
	Modifications []string `json:"modifications,omitempty"`
	Notes         string   `json:"notes,omitempty"`
	Subtotal      float64  `json:"subtotal"`
}

type OrderListResponse struct {
	Orders     []*OrderResponse `json:"orders"`
	Total      int              `json:"total"`
	Offset     int              `json:"offset"`
	Limit      int              `json:"limit"`
	HasMore    bool             `json:"has_more"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

type HealthResponse struct {
	Status    string    `json:"status"`
	Service   string    `json:"service"`
	Timestamp time.Time `json:"timestamp"`
}

// Conversion functions

func ToOrderResponse(order *domain.Order) *OrderResponse {
	items := make([]*OrderItemResponse, len(order.Items))
	for i, item := range order.Items {
		items[i] = &OrderItemResponse{
			ID:            string(item.ID),
			MenuItemID:    item.MenuItemID,
			Name:          item.Name,
			Quantity:      item.Quantity,
			UnitPrice:     item.UnitPrice,
			Modifications: item.Modifications,
			Notes:         item.Notes,
			Subtotal:      item.Subtotal,
		}
	}

	return &OrderResponse{
		ID:              string(order.ID),
		CustomerID:      order.CustomerID,
		Type:            string(order.Type),
		Status:          string(order.Status),
		Items:           items,
		TotalAmount:     order.TotalAmount,
		TaxAmount:       order.TaxAmount,
		TableID:         order.TableID,
		DeliveryAddress: order.DeliveryAddress,
		Notes:           order.Notes,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}
}

func ToOrderListResponse(orders []*domain.Order, total, offset, limit int) *OrderListResponse {
	responses := make([]*OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = ToOrderResponse(order)
	}

	hasMore := offset+len(orders) < total

	return &OrderListResponse{
		Orders:  responses,
		Total:   total,
		Offset:  offset,
		Limit:   limit,
		HasMore: hasMore,
	}
}