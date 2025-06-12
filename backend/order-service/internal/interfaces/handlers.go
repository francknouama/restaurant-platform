package interfaces

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/restaurant-platform/order-service/internal/application"
	"github.com/restaurant-platform/order-service/internal/domain"
	"github.com/restaurant-platform/shared/pkg/errors"
)

// OrderHandler handles HTTP requests for orders
type OrderHandler struct {
	orderService domain.OrderService
}

// NewOrderHandler creates a new order handler
func NewOrderHandler(orderService domain.OrderService) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
	}
}

// CreateOrder creates a new order
// POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req application.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Validate order type
	orderType, err := validateOrderType(req.Type)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid order type",
			Message: err.Error(),
		})
		return
	}

	order, err := h.orderService.CreateOrder(c.Request.Context(), req.CustomerID, orderType)
	if err != nil {
		handleError(c, err)
		return
	}

	// Set table or delivery address based on type
	if req.TableID != "" && orderType == domain.OrderTypeDineIn {
		if err := h.orderService.SetTableForOrder(c.Request.Context(), order.ID, req.TableID); err != nil {
			handleError(c, err)
			return
		}
		order.TableID = req.TableID
	}

	if req.Address != "" && orderType == domain.OrderTypeDelivery {
		if err := h.orderService.SetDeliveryAddress(c.Request.Context(), order.ID, req.Address); err != nil {
			handleError(c, err)
			return
		}
		order.DeliveryAddress = req.Address
	}

	if req.Notes != "" {
		if err := h.orderService.AddOrderNotes(c.Request.Context(), order.ID, req.Notes); err != nil {
			handleError(c, err)
			return
		}
		order.Notes = req.Notes
	}

	c.JSON(http.StatusCreated, application.ToOrderResponse(order))
}

// GetOrder retrieves an order by ID
// GET /api/v1/orders/:id
func (h *OrderHandler) GetOrder(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	order, err := h.orderService.GetOrderByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, application.ToOrderResponse(order))
}

// AddItemToOrder adds an item to an order
// POST /api/v1/orders/:id/items
func (h *OrderHandler) AddItemToOrder(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	var req application.AddItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.orderService.AddItemToOrder(
		c.Request.Context(),
		id,
		req.MenuItemID,
		req.Name,
		req.Quantity,
		req.UnitPrice,
		req.Modifications,
		req.Notes,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item added successfully"})
}

// UpdateItemQuantity updates the quantity of an item in an order
// PATCH /api/v1/orders/:id/items/:itemId/quantity
func (h *OrderHandler) UpdateItemQuantity(c *gin.Context) {
	orderID := domain.OrderID(c.Param("id"))
	itemID := domain.OrderItemID(c.Param("itemId"))

	var req application.UpdateItemQuantityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.orderService.UpdateItemQuantity(c.Request.Context(), orderID, itemID, req.Quantity)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item quantity updated successfully"})
}

// RemoveItemFromOrder removes an item from an order
// DELETE /api/v1/orders/:id/items/:itemId
func (h *OrderHandler) RemoveItemFromOrder(c *gin.Context) {
	orderID := domain.OrderID(c.Param("id"))
	itemID := domain.OrderItemID(c.Param("itemId"))

	err := h.orderService.RemoveItemFromOrder(c.Request.Context(), orderID, itemID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item removed successfully"})
}

// UpdateOrderStatus updates the status of an order
// PATCH /api/v1/orders/:id/status
func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	var req application.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	status, err := validateOrderStatus(req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid status",
			Message: err.Error(),
		})
		return
	}

	err = h.orderService.UpdateOrderStatus(c.Request.Context(), id, status)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}

// SetTable sets the table for a dine-in order
// PATCH /api/v1/orders/:id/table
func (h *OrderHandler) SetTable(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	var req application.SetTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.orderService.SetTableForOrder(c.Request.Context(), id, req.TableID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Table set successfully"})
}

// SetDeliveryAddress sets the delivery address for a delivery order
// PATCH /api/v1/orders/:id/delivery-address
func (h *OrderHandler) SetDeliveryAddress(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	var req application.SetDeliveryAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.orderService.SetDeliveryAddress(c.Request.Context(), id, req.Address)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delivery address set successfully"})
}

// AddNotes adds notes to an order
// PATCH /api/v1/orders/:id/notes
func (h *OrderHandler) AddNotes(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	var req application.AddNotesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.orderService.AddOrderNotes(c.Request.Context(), id, req.Notes)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notes added successfully"})
}

// PayOrder marks an order as paid
// PATCH /api/v1/orders/:id/pay
func (h *OrderHandler) PayOrder(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	err := h.orderService.PayOrder(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order paid successfully"})
}

// CancelOrder cancels an order
// DELETE /api/v1/orders/:id
func (h *OrderHandler) CancelOrder(c *gin.Context) {
	id := domain.OrderID(c.Param("id"))

	err := h.orderService.CancelOrder(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
}

// GetOrdersByCustomer retrieves orders for a specific customer
// GET /api/v1/orders/customer/:customerId
func (h *OrderHandler) GetOrdersByCustomer(c *gin.Context) {
	customerID := c.Param("customerId")

	orders, err := h.orderService.GetOrdersByCustomer(c.Request.Context(), customerID)
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// GetOrdersByStatus retrieves orders with a specific status
// GET /api/v1/orders/status/:status
func (h *OrderHandler) GetOrdersByStatus(c *gin.Context) {
	statusStr := c.Param("status")

	status, err := validateOrderStatus(statusStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid status",
			Message: err.Error(),
		})
		return
	}

	orders, err := h.orderService.GetOrdersByStatus(c.Request.Context(), status)
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// GetOrdersByTable retrieves orders for a specific table
// GET /api/v1/orders/table/:tableId
func (h *OrderHandler) GetOrdersByTable(c *gin.Context) {
	tableID := c.Param("tableId")

	orders, err := h.orderService.GetOrdersByTable(c.Request.Context(), tableID)
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// GetActiveOrders retrieves all active orders
// GET /api/v1/orders/active
func (h *OrderHandler) GetActiveOrders(c *gin.Context) {
	orders, err := h.orderService.GetActiveOrders(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.OrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// ListOrders retrieves orders with pagination and filters
// GET /api/v1/orders
func (h *OrderHandler) ListOrders(c *gin.Context) {
	var req application.OrderListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Build filters
	filters := domain.OrderFilters{
		CustomerID: req.CustomerID,
		TableID:    req.TableID,
	}

	if req.Status != nil {
		status, err := validateOrderStatus(*req.Status)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid status filter",
				Message: err.Error(),
			})
			return
		}
		filters.Status = &status
	}

	if req.Type != nil {
		orderType, err := validateOrderType(*req.Type)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid type filter",
				Message: err.Error(),
			})
			return
		}
		filters.Type = &orderType
	}

	if req.DateFrom != nil {
		dateFrom, err := time.Parse(time.RFC3339, *req.DateFrom)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid date_from format",
				Message: "Use RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.StartDate = &dateFrom
	}

	if req.DateTo != nil {
		dateTo, err := time.Parse(time.RFC3339, *req.DateTo)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid date_to format",
				Message: "Use RFC3339 format (e.g., 2023-01-01T23:59:59Z)",
			})
			return
		}
		filters.EndDate = &dateTo
	}

	if req.MinAmount != nil {
		filters.MinAmount = req.MinAmount
	}

	if req.MaxAmount != nil {
		filters.MaxAmount = req.MaxAmount
	}

	orders, totalCount, err := h.orderService.ListOrders(c.Request.Context(), req.Offset, req.Limit, filters)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.ToOrderListResponse(orders, totalCount, req.Offset, req.Limit)
	c.JSON(http.StatusOK, response)
}

// Health check handler
// GET /health
func (h *OrderHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, application.HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Service:   "order-service",
	})
}

// Validation helpers

func validateOrderType(orderType string) (domain.OrderType, error) {
	switch orderType {
	case string(domain.OrderTypeDineIn):
		return domain.OrderTypeDineIn, nil
	case string(domain.OrderTypeTakeout):
		return domain.OrderTypeTakeout, nil
	case string(domain.OrderTypeDelivery):
		return domain.OrderTypeDelivery, nil
	default:
		return "", errors.NewValidationError("type", "invalid order type")
	}
}

func validateOrderStatus(status string) (domain.OrderStatus, error) {
	switch status {
	case string(domain.OrderStatusCreated):
		return domain.OrderStatusCreated, nil
	case string(domain.OrderStatusPaid):
		return domain.OrderStatusPaid, nil
	case string(domain.OrderStatusPreparing):
		return domain.OrderStatusPreparing, nil
	case string(domain.OrderStatusReady):
		return domain.OrderStatusReady, nil
	case string(domain.OrderStatusCompleted):
		return domain.OrderStatusCompleted, nil
	case string(domain.OrderStatusCancelled):
		return domain.OrderStatusCancelled, nil
	default:
		return "", errors.NewValidationError("status", "invalid order status")
	}
}

// Error handling helper
func handleError(c *gin.Context, err error) {
	switch {
	case errors.IsNotFound(err):
		c.JSON(http.StatusNotFound, application.ErrorResponse{
			Error:   "Not found",
			Message: err.Error(),
		})
	case errors.IsValidationError(err):
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Validation error",
			Message: err.Error(),
		})
	case errors.IsBusinessError(err):
		c.JSON(http.StatusUnprocessableEntity, application.ErrorResponse{
			Error:   "Business rule violation",
			Message: err.Error(),
			Code:    errors.GetErrorCode(err),
		})
	default:
		c.JSON(http.StatusInternalServerError, application.ErrorResponse{
			Error:   "Internal server error",
			Message: "An unexpected error occurred",
		})
	}
}