package menu

import (
	"context"
	"time"
)

// MenuService defines the business operations for menus
type MenuService interface {
	// CreateMenu creates a new menu
	CreateMenu(ctx context.Context, name string) (*Menu, error)

	// GetMenu retrieves a menu by ID
	GetMenu(ctx context.Context, id string) (*Menu, error)

	// GetActiveMenu retrieves the currently active menu
	GetActiveMenu(ctx context.Context) (*Menu, error)

	// UpdateMenu updates menu details
	UpdateMenu(ctx context.Context, id, name string, isActive bool) (*Menu, error)

	// DeleteMenu removes a menu
	DeleteMenu(ctx context.Context, id string) error

	// ListMenus retrieves menus with pagination
	ListMenus(ctx context.Context, offset, limit int) ([]*Menu, int, error)

	// AddCategory adds a category to a menu
	AddCategory(ctx context.Context, menuID, name, description string, displayOrder int) (*MenuCategory, error)

	// UpdateCategory updates a menu category
	UpdateCategory(ctx context.Context, menuID string, categoryID CategoryID, name, description string, displayOrder int) error

	// RemoveCategory removes a category from a menu
	RemoveCategory(ctx context.Context, menuID string, categoryID CategoryID) error

	// GetCategory retrieves a menu category
	GetCategory(ctx context.Context, categoryID CategoryID) (*MenuCategory, error)

	// AddMenuItem adds an item to a menu category
	AddMenuItem(
		ctx context.Context,
		menuID string,
		categoryID CategoryID,
		name, description string,
		price float64,
		preparationTime time.Duration,
		ingredients, allergens []string,
		nutritionalInfo, imageURL string,
		displayOrder int,
	) (*MenuItem, error)

	// UpdateMenuItem updates a menu item
	UpdateMenuItem(
		ctx context.Context,
		menuID string,
		itemID ItemID,
		name, description string,
		price float64,
		preparationTime time.Duration,
		ingredients, allergens []string,
		nutritionalInfo, imageURL string,
		displayOrder int,
		isAvailable bool,
	) error

	// RemoveMenuItem removes a menu item
	RemoveMenuItem(ctx context.Context, menuID string, itemID ItemID) error

	// GetMenuItem retrieves a menu item
	GetMenuItem(ctx context.Context, itemID ItemID) (*MenuItem, error)

	// SetItemAvailability sets the availability of a menu item
	SetItemAvailability(ctx context.Context, menuID string, itemID ItemID, isAvailable bool) error

	// ListMenuItems retrieves menu items with filters
	ListMenuItems(ctx context.Context, filters MenuItemFilters) ([]*MenuItem, error)

	// GetItemsByCategoryID retrieves menu items for a specific category
	GetItemsByCategoryID(ctx context.Context, categoryID CategoryID) ([]*MenuItem, error)

	// GetAvailableItems retrieves all available menu items
	GetAvailableItems(ctx context.Context) ([]*MenuItem, error)

	// CloneMenu creates a new version of a menu
	CloneMenu(ctx context.Context, menuID, newName string) (*Menu, error)

	// ActivateMenu activates a menu and deactivates all others
	ActivateMenu(ctx context.Context, menuID string) error
}