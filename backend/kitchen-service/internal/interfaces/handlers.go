package interfaces

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/restaurant-platform/kitchen-service/internal/application"
	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"github.com/restaurant-platform/shared/pkg/errors"
)

// KitchenOrderHandler handles HTTP requests for kitchen orders
type KitchenOrderHandler struct {
	service domain.KitchenService
}

// NewKitchenOrderHandler creates a new kitchen order handler
func NewKitchenOrderHandler(service domain.KitchenService) *KitchenOrderHandler {
	return &KitchenOrderHandler{
		service: service,
	}
}

// CreateKitchenOrder creates a new kitchen order
// POST /api/v1/kitchen/orders
func (h *KitchenOrderHandler) CreateKitchenOrder(c *gin.Context) {
	var req application.CreateKitchenOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	order, err := h.service.CreateKitchenOrder(c.Request.Context(), req.OrderID, req.TableID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusCreated, application.ToKitchenOrderResponse(order))
}

// GetKitchenOrder retrieves a kitchen order by ID
// GET /api/v1/kitchen/orders/:id
func (h *KitchenOrderHandler) GetKitchenOrder(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	order, err := h.service.GetKitchenOrder(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, application.ToKitchenOrderResponse(order))
}

// GetKitchenOrderByOrderID retrieves a kitchen order by its corresponding order ID
// GET /api/v1/kitchen/orders/by-order/:orderID
func (h *KitchenOrderHandler) GetKitchenOrderByOrderID(c *gin.Context) {
	orderID := c.Param("orderID")

	order, err := h.service.GetKitchenOrderByOrderID(c.Request.Context(), orderID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, application.ToKitchenOrderResponse(order))
}

// AddKitchenItem adds an item to a kitchen order
// POST /api/v1/kitchen/orders/:id/items
func (h *KitchenOrderHandler) AddKitchenItem(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	var req application.AddKitchenItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	prepTime := time.Duration(req.PrepTime) * time.Second

	err := h.service.AddKitchenItem(
		c.Request.Context(),
		id,
		req.MenuItemID,
		req.Name,
		req.Quantity,
		prepTime,
		req.Modifications,
		req.Notes,
	)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item added successfully"})
}

// UpdateItemStatus updates the status of a kitchen item
// PATCH /api/v1/kitchen/orders/:id/items/:itemID/status
func (h *KitchenOrderHandler) UpdateItemStatus(c *gin.Context) {
	orderID := domain.KitchenOrderID(c.Param("id"))
	itemID := c.Param("itemID")

	var req application.UpdateItemStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	status, err := application.ValidateKitchenItemStatus(req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid status",
			Message: err.Error(),
		})
		return
	}

	err = h.service.UpdateItemStatus(c.Request.Context(), orderID, itemID, status)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item status updated successfully"})
}

// UpdateOrderStatus updates the status of a kitchen order
// PATCH /api/v1/kitchen/orders/:id/status
func (h *KitchenOrderHandler) UpdateOrderStatus(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	var req application.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	status, err := application.ValidateKitchenOrderStatus(req.Status)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid status",
			Message: err.Error(),
		})
		return
	}

	err = h.service.UpdateOrderStatus(c.Request.Context(), id, status)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order status updated successfully"})
}

// AssignToStation assigns a kitchen order to a station
// PATCH /api/v1/kitchen/orders/:id/assign
func (h *KitchenOrderHandler) AssignToStation(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	var req application.AssignToStationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	err := h.service.AssignToStation(c.Request.Context(), id, req.StationID)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order assigned to station successfully"})
}

// SetPriority sets the priority of a kitchen order
// PATCH /api/v1/kitchen/orders/:id/priority
func (h *KitchenOrderHandler) SetPriority(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	var req application.SetPriorityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	priority, err := application.ValidateKitchenPriority(req.Priority)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid priority",
			Message: err.Error(),
		})
		return
	}

	err = h.service.SetPriority(c.Request.Context(), id, priority)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order priority updated successfully"})
}

// CancelKitchenOrder cancels a kitchen order
// DELETE /api/v1/kitchen/orders/:id
func (h *KitchenOrderHandler) CancelKitchenOrder(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	err := h.service.CancelKitchenOrder(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order cancelled successfully"})
}

// CompleteKitchenOrder marks a kitchen order as completed
// PATCH /api/v1/kitchen/orders/:id/complete
func (h *KitchenOrderHandler) CompleteKitchenOrder(c *gin.Context) {
	id := domain.KitchenOrderID(c.Param("id"))

	err := h.service.CompleteKitchenOrder(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Order completed successfully"})
}

// GetActiveOrders retrieves all active kitchen orders
// GET /api/v1/kitchen/orders/active
func (h *KitchenOrderHandler) GetActiveOrders(c *gin.Context) {
	orders, err := h.service.GetActiveOrders(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.KitchenOrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToKitchenOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// GetOrdersByStatus retrieves kitchen orders with a specific status
// GET /api/v1/kitchen/orders/status/:status
func (h *KitchenOrderHandler) GetOrdersByStatus(c *gin.Context) {
	statusStr := c.Param("status")

	status, err := application.ValidateKitchenOrderStatus(statusStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid status",
			Message: err.Error(),
		})
		return
	}

	orders, err := h.service.GetOrdersByStatus(c.Request.Context(), status)
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.KitchenOrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToKitchenOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// GetOrdersByStation retrieves kitchen orders assigned to a specific station
// GET /api/v1/kitchen/orders/station/:stationID
func (h *KitchenOrderHandler) GetOrdersByStation(c *gin.Context) {
	stationID := c.Param("stationID")

	orders, err := h.service.GetOrdersByStation(c.Request.Context(), stationID)
	if err != nil {
		handleError(c, err)
		return
	}

	responses := make([]*application.KitchenOrderResponse, len(orders))
	for i, order := range orders {
		responses[i] = application.ToKitchenOrderResponse(order)
	}

	c.JSON(http.StatusOK, gin.H{"orders": responses})
}

// ListKitchenOrders retrieves kitchen orders with pagination and filters
// GET /api/v1/kitchen/orders
func (h *KitchenOrderHandler) ListKitchenOrders(c *gin.Context) {
	var req application.KitchenOrderListRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, application.ErrorResponse{
			Error:   "Invalid request",
			Message: err.Error(),
		})
		return
	}

	// Build filters
	filters := domain.KitchenOrderFilters{}

	if req.Status != nil {
		status, err := application.ValidateKitchenOrderStatus(*req.Status)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid status filter",
				Message: err.Error(),
			})
			return
		}
		filters.Status = &status
	}

	if req.Priority != nil {
		priority, err := application.ValidateKitchenPriority(*req.Priority)
		if err != nil {
			c.JSON(http.StatusBadRequest, application.ErrorResponse{
				Error:   "Invalid priority filter",
				Message: err.Error(),
			})
			return
		}
		filters.Priority = &priority
	}

	if req.Station != nil {
		filters.Station = req.Station
	}

	if req.OrderID != nil {
		filters.OrderID = req.OrderID
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
		filters.DateFrom = &dateFrom
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
		filters.DateTo = &dateTo
	}

	orders, totalCount, err := h.service.ListKitchenOrders(c.Request.Context(), req.Offset, req.Limit, filters)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.ToKitchenOrderListResponse(orders, totalCount, req.Offset, req.Limit)
	c.JSON(http.StatusOK, response)
}

// Health check handler
// GET /health
func (h *KitchenOrderHandler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, application.HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Service:   "kitchen-service",
	})
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
	case errors.IsConflictError(err):
		c.JSON(http.StatusUnprocessableEntity, application.ErrorResponse{
			Error:   "Business rule violation",
			Message: err.Error(),
			// Code removed - GetErrorCode not available in new API
		})
	default:
		c.JSON(http.StatusInternalServerError, application.ErrorResponse{
			Error:   "Internal server error",
			Message: "An unexpected error occurred",
		})
	}
}