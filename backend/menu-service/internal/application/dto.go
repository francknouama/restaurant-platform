package application

import (
	"time"
	menu "github.com/restaurant-platform/menu-service/internal/domain"
)

type MenuResponse struct {
	ID         string                  `json:"id"`
	Name       string                  `json:"name"`
	Version    int                     `json:"version"`
	Categories []*MenuCategoryResponse `json:"categories"`
	IsActive   bool                    `json:"is_active"`
	StartDate  time.Time               `json:"start_date"`
	EndDate    *time.Time              `json:"end_date,omitempty"`
	CreatedAt  time.Time               `json:"created_at"`
	UpdatedAt  time.Time               `json:"updated_at"`
}

type MenuCategoryResponse struct {
	ID           string              `json:"id"`
	Name         string              `json:"name"`
	Description  string              `json:"description,omitempty"`
	Items        []*MenuItemResponse `json:"items"`
	DisplayOrder int                 `json:"display_order"`
	CreatedAt    time.Time           `json:"created_at"`
	UpdatedAt    time.Time           `json:"updated_at"`
}

type MenuItemResponse struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Description     string        `json:"description,omitempty"`
	Price           float64       `json:"price"`
	CategoryID      string        `json:"category_id"`
	IsAvailable     bool          `json:"is_available"`
	PreparationTime time.Duration `json:"preparation_time"`
	Ingredients     []string      `json:"ingredients,omitempty"`
	Allergens       []string      `json:"allergens,omitempty"`
	NutritionalInfo string        `json:"nutritional_info,omitempty"`
	ImageURL        string        `json:"image_url,omitempty"`
	DisplayOrder    int           `json:"display_order"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

type CreateMenuRequest struct {
	Name string `json:"name" binding:"required"`
}

type CreateCategoryRequest struct {
	Name         string `json:"name" binding:"required"`
	Description  string `json:"description"`
	DisplayOrder int    `json:"display_order"`
}

type CreateMenuItemRequest struct {
	Name            string        `json:"name" binding:"required"`
	Description     string        `json:"description"`
	Price           float64       `json:"price" binding:"required,min=0"`
	CategoryID      string        `json:"category_id" binding:"required"`
	PreparationTime time.Duration `json:"preparation_time"`
	Ingredients     []string      `json:"ingredients"`
	Allergens       []string      `json:"allergens"`
	NutritionalInfo string        `json:"nutritional_info"`
	ImageURL        string        `json:"image_url"`
	DisplayOrder    int           `json:"display_order"`
}

type UpdateItemAvailabilityRequest struct {
	IsAvailable bool `json:"is_available"`
}

func MenuToResponse(m *menu.Menu) *MenuResponse {
	if m == nil {
		return nil
	}

	response := &MenuResponse{
		ID:         m.ID.String(),
		Name:       m.Name,
		Version:    m.Version,
		Categories: make([]*MenuCategoryResponse, len(m.Categories)),
		IsActive:   m.IsActive,
		StartDate:  m.StartDate,
		CreatedAt:  m.CreatedAt,
		UpdatedAt:  m.UpdatedAt,
	}

	if m.EndDate != nil {
		response.EndDate = m.EndDate
	}

	for i, cat := range m.Categories {
		response.Categories[i] = MenuCategoryToResponse(cat)
	}

	return response
}

func MenuCategoryToResponse(c *menu.MenuCategory) *MenuCategoryResponse {
	if c == nil {
		return nil
	}

	response := &MenuCategoryResponse{
		ID:           string(c.ID),
		Name:         c.Name,
		Description:  c.Description,
		Items:        make([]*MenuItemResponse, len(c.Items)),
		DisplayOrder: c.DisplayOrder,
		CreatedAt:    c.CreatedAt,
		UpdatedAt:    c.UpdatedAt,
	}

	for i, item := range c.Items {
		response.Items[i] = MenuItemToResponse(item)
	}

	return response
}

func MenuItemToResponse(i *menu.MenuItem) *MenuItemResponse {
	if i == nil {
		return nil
	}

	return &MenuItemResponse{
		ID:              string(i.ID),
		Name:            i.Name,
		Description:     i.Description,
		Price:           i.Price,
		CategoryID:      string(i.CategoryID),
		IsAvailable:     i.IsAvailable,
		PreparationTime: i.PreparationTime,
		Ingredients:     i.Ingredients,
		Allergens:       i.Allergens,
		NutritionalInfo: i.NutritionalInfo,
		ImageURL:        i.ImageURL,
		DisplayOrder:    i.DisplayOrder,
		CreatedAt:       i.CreatedAt,
		UpdatedAt:       i.UpdatedAt,
	}
}