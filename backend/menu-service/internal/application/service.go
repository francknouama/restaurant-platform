package application

import (
	"context"
	"log"
	menu "github.com/restaurant-platform/menu-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

type MenuService struct {
	menuRepo      menu.MenuRepository
	eventPublisher events.EventPublisher
}

func NewMenuService(menuRepo menu.MenuRepository, eventPublisher events.EventPublisher) *MenuService {
	return &MenuService{
		menuRepo:      menuRepo,
		eventPublisher: eventPublisher,
	}
}

func (s *MenuService) CreateMenu(ctx context.Context, name string) (*menu.Menu, error) {
	m, err := menu.NewMenu(name)
	if err != nil {
		return nil, err
	}

	err = s.menuRepo.Create(ctx, m)
	if err != nil {
		return nil, err
	}

	// Publish menu created event
	eventData := events.ToEventData(events.MenuCreatedData{
		MenuID:   m.ID.String(),
		Name:     m.Name,
		Version:  m.Version,
		IsActive: m.IsActive,
	})
	
	event := events.NewDomainEvent(events.MenuCreatedEvent, m.ID.String(), eventData).
		WithMetadata("service", "menu-service")
	
	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish menu created event: %v", err)
		// Don't fail the operation if event publishing fails
	}

	return m, nil
}

func (s *MenuService) GetActiveMenu(ctx context.Context) (*menu.Menu, error) {
	return s.menuRepo.GetActive(ctx)
}

func (s *MenuService) GetMenuByID(ctx context.Context, id string) (*menu.Menu, error) {
	return s.menuRepo.GetByID(ctx, menu.MenuID(id))
}

func (s *MenuService) GetAvailableItems(ctx context.Context) ([]*menu.MenuItem, error) {
	return s.menuRepo.GetAvailableItems(ctx)
}

func (s *MenuService) GetMenuItem(ctx context.Context, id menu.ItemID) (*menu.MenuItem, error) {
	return s.menuRepo.GetMenuItem(ctx, id)
}

func (s *MenuService) AddCategoryToMenu(ctx context.Context, menuID, name, description string, displayOrder int) (*menu.MenuCategory, error) {
	m, err := s.menuRepo.GetByID(ctx, menu.MenuID(menuID))
	if err != nil {
		return nil, err
	}

	category, err := m.AddCategory(name, description, displayOrder)
	if err != nil {
		return nil, err
	}

	err = s.menuRepo.Update(ctx, m)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (s *MenuService) AddItemToCategory(ctx context.Context, menuID string, categoryID menu.CategoryID, name, description string, price float64) (*menu.MenuItem, error) {
	m, err := s.menuRepo.GetByID(ctx, menu.MenuID(menuID))
	if err != nil {
		return nil, err
	}

	item, err := m.AddMenuItem(categoryID, name, description, price, 0, nil, nil, "", "", 0)
	if err != nil {
		return nil, err
	}

	err = s.menuRepo.Update(ctx, m)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (s *MenuService) SetItemAvailability(ctx context.Context, menuID string, itemID menu.ItemID, isAvailable bool) error {
	m, err := s.menuRepo.GetByID(ctx, menu.MenuID(menuID))
	if err != nil {
		return err
	}

	// Get the item before updating to have the item name and category
	item, err := m.FindItemByID(itemID)
	if err != nil {
		return err
	}

	err = m.SetItemAvailability(itemID, isAvailable)
	if err != nil {
		return err
	}

	err = s.menuRepo.Update(ctx, m)
	if err != nil {
		return err
	}

	// Publish item availability changed event
	eventData := events.ToEventData(events.ItemAvailabilityChangedData{
		MenuID:      m.ID.String(),
		ItemID:      string(itemID),
		ItemName:    item.Name,
		IsAvailable: isAvailable,
		CategoryID:  string(item.CategoryID),
	})
	
	event := events.NewDomainEvent(events.ItemAvailabilityChangedEvent, m.ID.String(), eventData).
		WithMetadata("service", "menu-service").
		WithMetadata("item_id", string(itemID))
	
	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish item availability changed event: %v", err)
	}

	return nil
}

func (s *MenuService) ActivateMenu(ctx context.Context, menuID string) error {
	m, err := s.menuRepo.GetByID(ctx, menu.MenuID(menuID))
	if err != nil {
		return err
	}

	m.Activate()
	err = s.menuRepo.Update(ctx, m)
	if err != nil {
		return err
	}

	// Publish menu activated event
	eventData := events.ToEventData(events.MenuActivatedData{
		MenuID:  m.ID.String(),
		Name:    m.Name,
		Version: m.Version,
	})
	
	event := events.NewDomainEvent(events.MenuActivatedEvent, m.ID.String(), eventData).
		WithMetadata("service", "menu-service")
	
	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish menu activated event: %v", err)
	}

	return nil
}

func (s *MenuService) DeactivateMenu(ctx context.Context, menuID string) error {
	m, err := s.menuRepo.GetByID(ctx, menu.MenuID(menuID))
	if err != nil {
		return err
	}

	m.Deactivate()
	return s.menuRepo.Update(ctx, m)
}