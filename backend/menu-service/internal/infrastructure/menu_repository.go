package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	menu "github.com/restaurant-platform/menu-service/internal/domain"
	sharedErrors "github.com/restaurant-platform/shared/pkg/errors"
)

type MenuRepository struct {
	db *DB
}

func NewMenuRepository(db *DB) *MenuRepository {
	return &MenuRepository{db: db}
}

func (r *MenuRepository) Create(ctx context.Context, m *menu.Menu) error {
	categoriesJSON, err := json.Marshal(m.Categories)
	if err != nil {
		return fmt.Errorf("failed to marshal categories: %w", err)
	}

	query := `
		INSERT INTO menus (id, name, version, categories, is_active, start_date, end_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err = r.db.ExecContext(ctx, query,
		m.ID.String(), m.Name, m.Version, categoriesJSON, m.IsActive,
		m.StartDate, nullTimeOrPointer(m.EndDate), m.CreatedAt, m.UpdatedAt)

	return err
}

func (r *MenuRepository) GetByID(ctx context.Context, id menu.MenuID) (*menu.Menu, error) {
	query := `
		SELECT id, name, version, categories, is_active, start_date, end_date, created_at, updated_at
		FROM menus WHERE id = $1`

	var m menu.Menu
	var categoriesJSON []byte
	var endDate sql.NullTime
	var idStr string

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &m.Name, &m.Version, &categoriesJSON, &m.IsActive,
		&m.StartDate, &endDate, &m.CreatedAt, &m.UpdatedAt)

	m.ID = menu.MenuID(idStr)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, sharedErrors.WrapNotFound("MenuRepository.GetByID", "menu", id.String(), err)
		}
		return nil, fmt.Errorf("failed to query menu %s: %w", id.String(), err)
	}

	if endDate.Valid {
		m.EndDate = &endDate.Time
	}

	err = json.Unmarshal(categoriesJSON, &m.Categories)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal categories: %w", err)
	}

	return &m, nil
}

func (r *MenuRepository) GetActive(ctx context.Context) (*menu.Menu, error) {
	query := `
		SELECT id, name, version, categories, is_active, start_date, end_date, created_at, updated_at
		FROM menus WHERE is_active = true LIMIT 1`

	var m menu.Menu
	var categoriesJSON []byte
	var endDate sql.NullTime
	var idStr string

	err := r.db.QueryRowContext(ctx, query).Scan(
		&idStr, &m.Name, &m.Version, &categoriesJSON, &m.IsActive,
		&m.StartDate, &endDate, &m.CreatedAt, &m.UpdatedAt)

	m.ID = menu.MenuID(idStr)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no active menu found")
		}
		return nil, err
	}

	if endDate.Valid {
		m.EndDate = &endDate.Time
	}

	err = json.Unmarshal(categoriesJSON, &m.Categories)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal categories: %w", err)
	}

	return &m, nil
}

func (r *MenuRepository) Update(ctx context.Context, m *menu.Menu) error {
	categoriesJSON, err := json.Marshal(m.Categories)
	if err != nil {
		return fmt.Errorf("failed to marshal categories: %w", err)
	}

	query := `
		UPDATE menus 
		SET name = $2, version = $3, categories = $4, is_active = $5, 
		    start_date = $6, end_date = $7, updated_at = $8
		WHERE id = $1`

	_, err = r.db.ExecContext(ctx, query,
		m.ID.String(), m.Name, m.Version, categoriesJSON, m.IsActive,
		m.StartDate, nullTimeOrPointer(m.EndDate), m.UpdatedAt)

	return err
}

func (r *MenuRepository) Delete(ctx context.Context, id menu.MenuID) error {
	query := `DELETE FROM menus WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id.String())
	return err
}

func (r *MenuRepository) List(ctx context.Context, offset, limit int) ([]*menu.Menu, int, error) {
	countQuery := `SELECT COUNT(*) FROM menus`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, name, version, categories, is_active, start_date, end_date, created_at, updated_at
		FROM menus ORDER BY created_at DESC LIMIT $1 OFFSET $2`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var menus []*menu.Menu
	for rows.Next() {
		var m menu.Menu
		var categoriesJSON []byte
		var endDate sql.NullTime
		var idStr string

		err := rows.Scan(&idStr, &m.Name, &m.Version, &categoriesJSON, &m.IsActive,
			&m.StartDate, &endDate, &m.CreatedAt, &m.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		m.ID = menu.MenuID(idStr)

		if endDate.Valid {
			m.EndDate = &endDate.Time
		}

		err = json.Unmarshal(categoriesJSON, &m.Categories)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to unmarshal categories: %w", err)
		}

		menus = append(menus, &m)
	}

	return menus, total, rows.Err()
}

func (r *MenuRepository) GetMenuItem(ctx context.Context, id menu.ItemID) (*menu.MenuItem, error) {
	m, err := r.GetActive(ctx)
	if err != nil {
		return nil, err
	}

	return m.FindItemByID(id)
}

func (r *MenuRepository) GetCategory(ctx context.Context, id menu.CategoryID) (*menu.MenuCategory, error) {
	m, err := r.GetActive(ctx)
	if err != nil {
		return nil, err
	}

	return m.GetCategory(id)
}

func (r *MenuRepository) ListMenuItems(ctx context.Context, filters menu.MenuItemFilters) ([]*menu.MenuItem, error) {
	m, err := r.GetActive(ctx)
	if err != nil {
		return nil, err
	}

	items := m.GetAllItems()
	var filtered []*menu.MenuItem

	for _, item := range items {
		if matchesFilters(item, filters) {
			filtered = append(filtered, item)
		}
	}

	return filtered, nil
}

func (r *MenuRepository) GetItemsByCategoryID(ctx context.Context, categoryID menu.CategoryID) ([]*menu.MenuItem, error) {
	category, err := r.GetCategory(ctx, categoryID)
	if err != nil {
		return nil, err
	}

	return category.Items, nil
}

func (r *MenuRepository) GetAvailableItems(ctx context.Context) ([]*menu.MenuItem, error) {
	m, err := r.GetActive(ctx)
	if err != nil {
		return nil, err
	}

	items := m.GetAllItems()
	var available []*menu.MenuItem

	for _, item := range items {
		if item.IsAvailable {
			available = append(available, item)
		}
	}

	return available, nil
}

func matchesFilters(item *menu.MenuItem, filters menu.MenuItemFilters) bool {
	if filters.CategoryID != "" && item.CategoryID != filters.CategoryID {
		return false
	}
	if filters.IsAvailable != nil && item.IsAvailable != *filters.IsAvailable {
		return false
	}
	if filters.PriceMin != nil && item.Price < *filters.PriceMin {
		return false
	}
	if filters.PriceMax != nil && item.Price > *filters.PriceMax {
		return false
	}
	return true
}