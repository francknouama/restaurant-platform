package menu

import (
	"fmt"
	"time"
	"github.com/restaurant-platform/shared/pkg/types"
)

// Menu domain entity markers for type-safe IDs
type (
	MenuEntity     struct{}
	CategoryEntity struct{}
	ItemEntity     struct{}
)

// Implement EntityMarker interface for Go 1.24.4 type safety
func (MenuEntity) IsEntity()     {}
func (CategoryEntity) IsEntity() {}
func (ItemEntity) IsEntity()     {}

// Type-safe ID types using generics
type (
	MenuID     = types.ID[MenuEntity]
	CategoryID = types.ID[CategoryEntity]
	ItemID     = types.ID[ItemEntity]
)

// Menu is the aggregate root for the menu domain
type Menu struct {
	ID         MenuID          `json:"id"`
	Name       string          `json:"name"`
	Version    int             `json:"version"`
	Categories []*MenuCategory `json:"categories"`
	IsActive   bool            `json:"is_active"`
	StartDate  time.Time       `json:"start_date"`
	EndDate    *time.Time      `json:"end_date,omitempty"` // Use pointer for optional fields
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

// MenuCategory represents a category of menu items
type MenuCategory struct {
	ID           CategoryID  `json:"id"`
	Name         string      `json:"name"`
	Description  string      `json:"description,omitempty"`
	Items        []*MenuItem `json:"items"`
	DisplayOrder int         `json:"display_order"`
	CreatedAt    time.Time   `json:"created_at"`
	UpdatedAt    time.Time   `json:"updated_at"`
}

// MenuItem represents an item on the menu
type MenuItem struct {
	ID              ItemID        `json:"id"`
	Name            string        `json:"name"`
	Description     string        `json:"description,omitempty"`
	Price           float64       `json:"price"`
	CategoryID      CategoryID    `json:"category_id"`
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

// NewMenu creates a new menu with validated fields using modern error handling
func NewMenu(name string) (*Menu, error) {
	if name == "" {
		return nil, fmt.Errorf("menu name is required")
	}

	now := time.Now()
	return &Menu{
		ID:         types.NewID[MenuEntity]("menu"),
		Name:       name,
		Version:    1,
		Categories: make([]*MenuCategory, 0),
		IsActive:   true,
		StartDate:  now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

// AddCategory adds a category to the menu
func (m *Menu) AddCategory(name, description string, displayOrder int) (*MenuCategory, error) {
	if name == "" {
		return nil, fmt.Errorf("validation error")
	}

	// Check for duplicate category name
	for _, cat := range m.Categories {
		if cat.Name == name {
			return nil, fmt.Errorf("business error")
		}
	}

	now := time.Now()
	category := &MenuCategory{
		ID:           types.NewID[CategoryEntity]("cat"),
		Name:         name,
		Description:  description,
		Items:        make([]*MenuItem, 0),
		DisplayOrder: displayOrder,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	m.Categories = append(m.Categories, category)
	m.UpdatedAt = now

	return category, nil
}

// UpdateCategory updates a menu category
func (m *Menu) UpdateCategory(id CategoryID, name, description string, displayOrder int) error {
	for _, cat := range m.Categories {
		if cat.ID == id {
			// Check for duplicate name with other categories
			for _, c := range m.Categories {
				if c.ID != id && c.Name == name {
					return fmt.Errorf("business error")
				}
			}

			cat.Name = name
			cat.Description = description
			cat.DisplayOrder = displayOrder
			cat.UpdatedAt = time.Now()
			m.UpdatedAt = time.Now()
			return nil
		}
	}
	return fmt.Errorf("business error")
}

// RemoveCategory removes a category from the menu
func (m *Menu) RemoveCategory(id CategoryID) error {
	for i, cat := range m.Categories {
		if cat.ID == id {
			// Check if category has items
			if len(cat.Items) > 0 {
				return fmt.Errorf("business error")
			}

			m.Categories = append(m.Categories[:i], m.Categories[i+1:]...)
			m.UpdatedAt = time.Now()
			return nil
		}
	}
	return fmt.Errorf("business error")
}

// GetCategory retrieves a category by ID
func (m *Menu) GetCategory(id CategoryID) (*MenuCategory, error) {
	for _, cat := range m.Categories {
		if cat.ID == id {
			return cat, nil
		}
	}
	return nil, fmt.Errorf("business error")
}

// AddMenuItem adds an item to a category
func (m *Menu) AddMenuItem(
	categoryID CategoryID,
	name, description string,
	price float64,
	preparationTime time.Duration,
	ingredients, allergens []string,
	nutritionalInfo, imageURL string,
	displayOrder int,
) (*MenuItem, error) {
	// Validate inputs
	if name == "" {
		return nil, fmt.Errorf("validation error")
	}
	if price < 0 {
		return nil, fmt.Errorf("validation error")
	}

	// Find the category
	category, err := m.GetCategory(categoryID)
	if err != nil {
		return nil, err
	}

	// Check for duplicate item name in the category
	for _, item := range category.Items {
		if item.Name == name {
			return nil, fmt.Errorf("business error")
		}
	}

	now := time.Now()
	item := &MenuItem{
		ID:              types.NewID[ItemEntity]("item"),
		Name:            name,
		Description:     description,
		Price:           price,
		CategoryID:      categoryID,
		IsAvailable:     true,
		PreparationTime: preparationTime,
		Ingredients:     ingredients,
		Allergens:       allergens,
		NutritionalInfo: nutritionalInfo,
		ImageURL:        imageURL,
		DisplayOrder:    displayOrder,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	category.Items = append(category.Items, item)
	category.UpdatedAt = now
	m.UpdatedAt = now

	return item, nil
}

// UpdateMenuItem updates a menu item
func (m *Menu) UpdateMenuItem(
	id ItemID,
	name, description string,
	price float64,
	preparationTime time.Duration,
	ingredients, allergens []string,
	nutritionalInfo, imageURL string,
	displayOrder int,
	isAvailable bool,
) error {
	// Validate inputs
	if name == "" {
		return fmt.Errorf("validation error")
	}
	if price < 0 {
		return fmt.Errorf("validation error")
	}

	// Find the item
	for _, cat := range m.Categories {
		for i, item := range cat.Items {
			if item.ID == id {
				// Check for duplicate name with other items in the same category
				for _, it := range cat.Items {
					if it.ID != id && it.Name == name {
						return fmt.Errorf("business error")
					}
				}

				// Update the item
				cat.Items[i].Name = name
				cat.Items[i].Description = description
				cat.Items[i].Price = price
				cat.Items[i].PreparationTime = preparationTime
				cat.Items[i].Ingredients = ingredients
				cat.Items[i].Allergens = allergens
				cat.Items[i].NutritionalInfo = nutritionalInfo
				cat.Items[i].ImageURL = imageURL
				cat.Items[i].DisplayOrder = displayOrder
				cat.Items[i].IsAvailable = isAvailable
				cat.Items[i].UpdatedAt = time.Now()

				cat.UpdatedAt = time.Now()
				m.UpdatedAt = time.Now()
				return nil
			}
		}
	}

	return fmt.Errorf("business error")
}

// RemoveMenuItem removes a menu item
func (m *Menu) RemoveMenuItem(id ItemID) error {
	for _, cat := range m.Categories {
		for i, item := range cat.Items {
			if item.ID == id {
				cat.Items = append(cat.Items[:i], cat.Items[i+1:]...)
				cat.UpdatedAt = time.Now()
				m.UpdatedAt = time.Now()
				return nil
			}
		}
	}
	return fmt.Errorf("business error")
}

// SetItemAvailability sets the availability of a menu item
func (m *Menu) SetItemAvailability(id ItemID, isAvailable bool) error {
	for _, cat := range m.Categories {
		for i, item := range cat.Items {
			if item.ID == id {
				cat.Items[i].IsAvailable = isAvailable
				cat.Items[i].UpdatedAt = time.Now()
				cat.UpdatedAt = time.Now()
				m.UpdatedAt = time.Now()
				return nil
			}
		}
	}
	return fmt.Errorf("business error")
}

// FindItemByID finds a menu item by ID
func (m *Menu) FindItemByID(id ItemID) (*MenuItem, error) {
	for _, cat := range m.Categories {
		for _, item := range cat.Items {
			if item.ID == id {
				return item, nil
			}
		}
	}
	return nil, fmt.Errorf("business error")
}

// GetAllItems returns all menu items
func (m *Menu) GetAllItems() []*MenuItem {
	var items []*MenuItem
	for _, cat := range m.Categories {
		items = append(items, cat.Items...)
	}
	return items
}

// GetAllCategories returns all menu categories
func (m *Menu) GetAllCategories() []*MenuCategory {
	return m.Categories
}

// Deactivate deactivates the menu
func (m *Menu) Deactivate() {
	m.IsActive = false
	now := time.Now()
	m.EndDate = &now
	m.UpdatedAt = time.Now()
}

// Activate activates the menu
func (m *Menu) Activate() {
	m.IsActive = true
	m.EndDate = nil
	m.UpdatedAt = time.Now()
}

// Clone creates a new version of the menu
func (m *Menu) Clone(newName string) (*Menu, error) {
	if newName == "" {
		newName = m.Name + " (Copy)"
	}

	now := time.Now()
	newMenu := &Menu{
		ID:         types.NewID[MenuEntity]("menu"),
		Name:       newName,
		Version:    m.Version + 1,
		Categories: make([]*MenuCategory, 0),
		IsActive:   false, // New menu version starts as inactive
		StartDate:  now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	// Clone categories and items
	for _, cat := range m.Categories {
		newCat, err := newMenu.AddCategory(cat.Name, cat.Description, cat.DisplayOrder)
		if err != nil {
			return nil, err
		}

		for _, item := range cat.Items {
			_, err := newMenu.AddMenuItem(
				newCat.ID,
				item.Name,
				item.Description,
				item.Price,
				item.PreparationTime,
				item.Ingredients,
				item.Allergens,
				item.NutritionalInfo,
				item.ImageURL,
				item.DisplayOrder,
			)
			if err != nil {
				return nil, err
			}
		}
	}

	return newMenu, nil
}