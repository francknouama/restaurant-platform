package interfaces

import (
	"net/http"
	"strconv"
	"time"
	
	"github.com/restaurant-platform/inventory-service/internal/application"
	inventory "github.com/restaurant-platform/inventory-service/internal/domain"

	"github.com/gin-gonic/gin"
)

type InventoryHandler struct {
	inventoryService *application.InventoryService
}

func NewInventoryHandler(inventoryService *application.InventoryService) *InventoryHandler {
	return &InventoryHandler{
		inventoryService: inventoryService,
	}
}

type CreateItemRequest struct {
	SKU          string                `json:"sku" binding:"required"`
	Name         string                `json:"name" binding:"required"`
	Description  string                `json:"description"`
	InitialStock float64               `json:"initial_stock" binding:"min=0"`
	Unit         inventory.UnitType    `json:"unit" binding:"required"`
	Cost         float64               `json:"cost" binding:"min=0"`
	Category     string                `json:"category"`
	Location     string                `json:"location"`
}

type AddStockRequest struct {
	Quantity    float64 `json:"quantity" binding:"required,min=0"`
	Notes       string  `json:"notes"`
	Reference   string  `json:"reference"`
	PerformedBy string  `json:"performed_by"`
}

type ReserveStockRequest struct {
	SKU         string  `json:"sku" binding:"required"`
	Quantity    float64 `json:"quantity" binding:"required,min=0"`
	Reference   string  `json:"reference" binding:"required"`
	PerformedBy string  `json:"performed_by"`
}

func (h *InventoryHandler) CreateItem(c *gin.Context) {
	var req CreateItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.inventoryService.CreateItem(
		c.Request.Context(),
		req.SKU,
		req.Name,
		req.InitialStock,
		req.Unit,
		req.Cost,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, item)
}

func (h *InventoryHandler) GetItem(c *gin.Context) {
	id := inventory.InventoryItemID(c.Param("id"))
	
	item, err := h.inventoryService.GetItem(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *InventoryHandler) GetItemBySKU(c *gin.Context) {
	sku := c.Param("sku")
	
	item, err := h.inventoryService.GetItemBySKU(c.Request.Context(), sku)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

func (h *InventoryHandler) ListItems(c *gin.Context) {
	offsetStr := c.DefaultQuery("offset", "0")
	limitStr := c.DefaultQuery("limit", "10")
	
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset parameter"})
		return
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit parameter"})
		return
	}

	items, total, err := h.inventoryService.ListItems(c.Request.Context(), offset, limit, inventory.InventoryFilters{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"items":  items,
		"total":  total,
		"offset": offset,
		"limit":  limit,
	}

	c.JSON(http.StatusOK, response)
}

func (h *InventoryHandler) AddStock(c *gin.Context) {
	id := inventory.InventoryItemID(c.Param("id"))
	
	var req AddStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.inventoryService.AddStock(
		c.Request.Context(),
		id,
		req.Quantity,
		req.Notes,
		req.Reference,
		req.PerformedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock added successfully"})
}

func (h *InventoryHandler) UseStock(c *gin.Context) {
	id := inventory.InventoryItemID(c.Param("id"))
	
	var req AddStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.inventoryService.UseStock(
		c.Request.Context(),
		id,
		req.Quantity,
		req.Notes,
		req.Reference,
		req.PerformedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock used successfully"})
}

func (h *InventoryHandler) ReserveStock(c *gin.Context) {
	var req ReserveStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.inventoryService.ReserveStock(
		c.Request.Context(),
		req.SKU,
		req.Quantity,
		req.Reference,
		req.PerformedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock reserved successfully"})
}

func (h *InventoryHandler) CheckAvailability(c *gin.Context) {
	sku := c.Query("sku")
	quantityStr := c.Query("quantity")
	
	if sku == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sku parameter is required"})
		return
	}
	
	quantity, err := strconv.ParseFloat(quantityStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid quantity parameter"})
		return
	}

	available, err := h.inventoryService.CheckAvailability(c.Request.Context(), sku, quantity)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sku":       sku,
		"quantity":  quantity,
		"available": available,
	})
}

func (h *InventoryHandler) GetStockLevel(c *gin.Context) {
	sku := c.Param("sku")
	
	level, err := h.inventoryService.GetStockLevel(c.Request.Context(), sku)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sku":   sku,
		"level": level,
	})
}

func (h *InventoryHandler) GetLowStockItems(c *gin.Context) {
	items, err := h.inventoryService.GetLowStockItems(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *InventoryHandler) GetOutOfStockItems(c *gin.Context) {
	items, err := h.inventoryService.GetOutOfStockItems(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// Movement handlers

type RecordMovementRequest struct {
	Type        inventory.MovementType `json:"type" binding:"required"`
	Quantity    float64                `json:"quantity" binding:"required,min=0"`
	Notes       string                 `json:"notes"`
	Reference   string                 `json:"reference"`
	PerformedBy string                 `json:"performed_by"`
}

func (h *InventoryHandler) RecordMovement(c *gin.Context) {
	id := inventory.InventoryItemID(c.Param("id"))
	
	var req RecordMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.inventoryService.RecordMovement(
		c.Request.Context(),
		id,
		req.Type,
		req.Quantity,
		req.Notes,
		req.Reference,
		req.PerformedBy,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Movement recorded successfully"})
}

func (h *InventoryHandler) GetMovements(c *gin.Context) {
	id := inventory.InventoryItemID(c.Param("id"))
	limitStr := c.DefaultQuery("limit", "20")
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit parameter"})
		return
	}

	movements, err := h.inventoryService.GetMovementsByItemID(c.Request.Context(), id, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"movements": movements})
}

// Supplier handlers

type CreateSupplierRequest struct {
	Name        string `json:"name" binding:"required"`
	ContactName string `json:"contact_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Website     string `json:"website"`
	Notes       string `json:"notes"`
}

func (h *InventoryHandler) CreateSupplier(c *gin.Context) {
	var req CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier, err := h.inventoryService.CreateSupplier(
		c.Request.Context(),
		req.Name,
		req.ContactName,
		req.Email,
		req.Phone,
		req.Address,
		req.Website,
		req.Notes,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, supplier)
}

func (h *InventoryHandler) GetSupplier(c *gin.Context) {
	id := inventory.SupplierID(c.Param("id"))
	
	supplier, err := h.inventoryService.GetSupplierByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, supplier)
}

type UpdateSupplierRequest struct {
	Name        string `json:"name" binding:"required"`
	ContactName string `json:"contact_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Website     string `json:"website"`
	Notes       string `json:"notes"`
	IsActive    bool   `json:"is_active"`
}

func (h *InventoryHandler) UpdateSupplier(c *gin.Context) {
	id := inventory.SupplierID(c.Param("id"))
	
	var req UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	supplier := &inventory.Supplier{
		ID:          id,
		Name:        req.Name,
		ContactName: req.ContactName,
		Email:       req.Email,
		Phone:       req.Phone,
		Address:     req.Address,
		Website:     req.Website,
		Notes:       req.Notes,
		IsActive:    req.IsActive,
		UpdatedAt:   time.Now(),
	}

	err := h.inventoryService.UpdateSupplier(c.Request.Context(), supplier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Supplier updated successfully"})
}

func (h *InventoryHandler) DeleteSupplier(c *gin.Context) {
	id := inventory.SupplierID(c.Param("id"))
	
	err := h.inventoryService.DeleteSupplier(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (h *InventoryHandler) ListSuppliers(c *gin.Context) {
	offsetStr := c.DefaultQuery("offset", "0")
	limitStr := c.DefaultQuery("limit", "20")
	
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset parameter"})
		return
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit parameter"})
		return
	}

	suppliers, total, err := h.inventoryService.ListSuppliers(c.Request.Context(), offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suppliers": suppliers,
		"total":     total,
	})
}