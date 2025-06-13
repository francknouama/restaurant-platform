package interfaces

import (
	"context"
	"net/http"
	"github.com/restaurant-platform/menu-service/internal/application"
	menu "github.com/restaurant-platform/menu-service/internal/domain"

	"github.com/gin-gonic/gin"
)

// MenuServiceInterface defines the contract for menu service operations
type MenuServiceInterface interface {
	CreateMenu(ctx context.Context, name string) (*menu.Menu, error)
	GetActiveMenu(ctx context.Context) (*menu.Menu, error)
	GetMenuByID(ctx context.Context, id string) (*menu.Menu, error)
	GetMenus(ctx context.Context, offset, limit int) ([]*menu.Menu, int, error)
	GetAvailableItems(ctx context.Context) ([]*menu.MenuItem, error)
	GetMenuItem(ctx context.Context, id menu.ItemID) (*menu.MenuItem, error)
	AddCategoryToMenu(ctx context.Context, menuID, name, description string, displayOrder int) (*menu.MenuCategory, error)
	AddItemToCategory(ctx context.Context, menuID string, categoryID menu.CategoryID, name, description string, price float64) (*menu.MenuItem, error)
	SetItemAvailability(ctx context.Context, menuID string, itemID menu.ItemID, isAvailable bool) error
	ActivateMenu(ctx context.Context, menuID string) error
	DeactivateMenu(ctx context.Context, menuID string) error
}

type MenuHandler struct {
	menuService MenuServiceInterface
}

func NewMenuHandler(menuService MenuServiceInterface) *MenuHandler {
	return &MenuHandler{
		menuService: menuService,
	}
}

func (h *MenuHandler) CreateMenu(c *gin.Context) {
	var req application.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	menu, err := h.menuService.CreateMenu(c.Request.Context(), req.Name)
	if err != nil {
		handleError(c, err)
		return
	}

	handleCreated(c, application.MenuToResponse(menu))
}

func (h *MenuHandler) GetActiveMenu(c *gin.Context) {
	menu, err := h.menuService.GetActiveMenu(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.MenuToResponse(menu))
}

func (h *MenuHandler) GetMenus(c *gin.Context) {
	// Parse pagination parameters with defaults
	offset := 0
	limit := 20

	menus, total, err := h.menuService.GetMenus(c.Request.Context(), offset, limit)
	if err != nil {
		handleError(c, err)
		return
	}

	var menuResponses []*application.MenuResponse
	for _, menu := range menus {
		menuResponses = append(menuResponses, application.MenuToResponse(menu))
	}

	response := gin.H{
		"success": true,
		"data": gin.H{
			"items":   menuResponses,
			"total":   total,
			"page":    1,
			"limit":   limit,
			"hasNext": (offset + limit) < total,
			"hasPrev": offset > 0,
		},
	}

	c.JSON(http.StatusOK, response)
}

func (h *MenuHandler) GetMenu(c *gin.Context) {
	id := c.Param("id")
	menu, err := h.menuService.GetMenuByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application.MenuToResponse(menu))
}

func (h *MenuHandler) GetAvailableItems(c *gin.Context) {
	items, err := h.menuService.GetAvailableItems(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []*application.MenuItemResponse
	for _, item := range items {
		response = append(response, application.MenuItemToResponse(item))
	}

	c.JSON(http.StatusOK, response)
}

func (h *MenuHandler) GetMenuItem(c *gin.Context) {
	id := menu.ItemID(c.Param("id"))
	item, err := h.menuService.GetMenuItem(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application.MenuItemToResponse(item))
}

func (h *MenuHandler) AddCategory(c *gin.Context) {
	menuID := c.Param("id")
	var req application.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.menuService.AddCategoryToMenu(
		c.Request.Context(),
		menuID,
		req.Name,
		req.Description,
		req.DisplayOrder,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, application.MenuCategoryToResponse(category))
}

func (h *MenuHandler) AddMenuItem(c *gin.Context) {
	menuID := c.Param("id")
	var req application.CreateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	item, err := h.menuService.AddItemToCategory(
		c.Request.Context(),
		menuID,
		menu.CategoryID(req.CategoryID),
		req.Name,
		req.Description,
		req.Price,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, application.MenuItemToResponse(item))
}

func (h *MenuHandler) UpdateItemAvailability(c *gin.Context) {
	menuID := c.Param("menuId")
	itemID := menu.ItemID(c.Param("itemId"))

	var req application.UpdateItemAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.menuService.SetItemAvailability(c.Request.Context(), menuID, itemID, req.IsAvailable)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Item availability updated"})
}

func (h *MenuHandler) ActivateMenu(c *gin.Context) {
	menuID := c.Param("id")
	err := h.menuService.ActivateMenu(c.Request.Context(), menuID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu activated"})
}

func (h *MenuHandler) DeactivateMenu(c *gin.Context) {
	menuID := c.Param("id")
	err := h.menuService.DeactivateMenu(c.Request.Context(), menuID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Menu deactivated"})
}