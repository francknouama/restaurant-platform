package menu

import (
	"context"
)

// MenuRepository defines the interface for menu data access
type MenuRepository interface {
	// Create adds a new menu to the repository
	Create(ctx context.Context, menu *Menu) error

	// GetByID retrieves a menu by its ID
	GetByID(ctx context.Context, id MenuID) (*Menu, error)

	// GetActive retrieves the currently active menu
	GetActive(ctx context.Context) (*Menu, error)

	// Update updates an existing menu
	Update(ctx context.Context, menu *Menu) error

	// Delete removes a menu from the repository
	Delete(ctx context.Context, id MenuID) error

	// List retrieves menus with pagination
	List(ctx context.Context, offset, limit int) ([]*Menu, int, error)

	// GetMenuItem retrieves a menu item by its ID
	GetMenuItem(ctx context.Context, id ItemID) (*MenuItem, error)

	// GetCategory retrieves a menu category by its ID
	GetCategory(ctx context.Context, id CategoryID) (*MenuCategory, error)

	// ListMenuItems retrieves menu items with filters
	ListMenuItems(ctx context.Context, filters MenuItemFilters) ([]*MenuItem, error)

	// GetItemsByCategoryID retrieves menu items for a specific category
	GetItemsByCategoryID(ctx context.Context, categoryID CategoryID) ([]*MenuItem, error)

	// GetAvailableItems retrieves all available menu items
	GetAvailableItems(ctx context.Context) ([]*MenuItem, error)
}

// MenuItemFilters defines filtering options for menu item queries
type MenuItemFilters struct {
	CategoryID   CategoryID
	IsAvailable  *bool
	PriceMin     *float64
	PriceMax     *float64
	NameContains string
	Allergens    []string
	Ingredients  []string
}