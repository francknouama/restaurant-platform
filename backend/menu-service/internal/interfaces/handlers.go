package interfaces

import (
	"net/http"
	"github.com/restaurant-platform/menu-service/internal/application"
	menu "github.com/restaurant-platform/menu-service/internal/domain"

	"github.com/gin-gonic/gin"
)

type MenuHandler struct {
	menuService *application.MenuService
}

func NewMenuHandler(menuService *application.MenuService) *MenuHandler {
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