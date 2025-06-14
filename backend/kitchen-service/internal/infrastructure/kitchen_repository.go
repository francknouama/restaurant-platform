package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"github.com/restaurant-platform/shared/pkg/errors"
)

// KitchenOrderRepository implements the domain repository interface
type KitchenOrderRepository struct {
	db *sql.DB
}

// NewKitchenOrderRepository creates a new kitchen order repository
func NewKitchenOrderRepository(db *sql.DB) *KitchenOrderRepository {
	return &KitchenOrderRepository{
		db: db,
	}
}

// Save saves a kitchen order to the database
func (r *KitchenOrderRepository) Save(ctx context.Context, order *domain.KitchenOrder) error {
	// Serialize items to JSONB
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return fmt.Errorf("failed to marshal items: %w", err)
	}

	query := `
		INSERT INTO kitchen_orders (
			id, order_id, table_id, status, items, priority, 
			assigned_station, estimated_time, started_at, 
			completed_at, notes, created_at, updated_at
		) VALUES (
			?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
		)`

	_, err = r.db.ExecContext(ctx, query,
		string(order.ID),
		order.OrderID,
		order.TableID,
		string(order.Status),
		itemsJSON,
		string(order.Priority),
		order.AssignedStation,
		int64(order.EstimatedTime.Seconds()),
		nullTimeOrValue(order.StartedAt),
		nullTimeOrValue(order.CompletedAt),
		order.Notes,
		order.CreatedAt,
		order.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to save kitchen order: %w", err)
	}

	return nil
}

// FindByID retrieves a kitchen order by its ID
func (r *KitchenOrderRepository) FindByID(ctx context.Context, id domain.KitchenOrderID) (*domain.KitchenOrder, error) {
	query := `
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		WHERE id = ?`

	row := r.db.QueryRowContext(ctx, query, string(id))
	return r.scanKitchenOrder(row)
}

// FindByOrderID retrieves a kitchen order by its corresponding order ID
func (r *KitchenOrderRepository) FindByOrderID(ctx context.Context, orderID string) (*domain.KitchenOrder, error) {
	query := `
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		WHERE order_id = ?`

	row := r.db.QueryRowContext(ctx, query, orderID)
	return r.scanKitchenOrder(row)
}

// Update updates an existing kitchen order
func (r *KitchenOrderRepository) Update(ctx context.Context, order *domain.KitchenOrder) error {
	// Serialize items to JSONB
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return fmt.Errorf("failed to marshal items: %w", err)
	}

	query := `
		UPDATE kitchen_orders SET
			order_id = ?,
			table_id = ?,
			status = ?,
			items = ?,
			priority = ?,
			assigned_station = ?,
			estimated_time = ?,
			started_at = ?,
			completed_at = ?,
			notes = ?,
			updated_at = ?
		WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query,
		order.OrderID,
		order.TableID,
		string(order.Status),
		itemsJSON,
		string(order.Priority),
		order.AssignedStation,
		int64(order.EstimatedTime.Seconds()),
		nullTimeOrValue(order.StartedAt),
		nullTimeOrValue(order.CompletedAt),
		order.Notes,
		order.UpdatedAt,
		string(order.ID), // ID is now the last parameter for WHERE clause
	)

	if err != nil {
		return fmt.Errorf("failed to update kitchen order %s: %w", string(order.ID), err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("UpdateKitchenOrder", "kitchen_order", string(order.ID), errors.ErrNotFound)
	}

	return nil
}

// Delete deletes a kitchen order
func (r *KitchenOrderRepository) Delete(ctx context.Context, id domain.KitchenOrderID) error {
	query := `DELETE FROM kitchen_orders WHERE id = ?`

	result, err := r.db.ExecContext(ctx, query, string(id))
	if err != nil {
		return fmt.Errorf("failed to delete kitchen order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapNotFound("DeleteKitchenOrder", "kitchen_order", string(id), errors.ErrNotFound)
	}

	return nil
}

// FindByStatus retrieves kitchen orders with a specific status
func (r *KitchenOrderRepository) FindByStatus(ctx context.Context, status domain.KitchenOrderStatus) ([]*domain.KitchenOrder, error) {
	query := `
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		WHERE status = ?
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, string(status))
	if err != nil {
		return nil, fmt.Errorf("failed to query kitchen orders by status: %w", err)
	}
	defer rows.Close()

	return r.scanKitchenOrders(rows)
}

// FindByStation retrieves kitchen orders assigned to a specific station
func (r *KitchenOrderRepository) FindByStation(ctx context.Context, stationID string) ([]*domain.KitchenOrder, error) {
	query := `
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		WHERE assigned_station = ?
		ORDER BY 
			CASE priority 
				WHEN 'URGENT' THEN 1 
				WHEN 'HIGH' THEN 2 
				WHEN 'NORMAL' THEN 3 
				WHEN 'LOW' THEN 4 
				ELSE 5 
			END ASC, 
			created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, stationID)
	if err != nil {
		return nil, fmt.Errorf("failed to query kitchen orders by station: %w", err)
	}
	defer rows.Close()

	return r.scanKitchenOrders(rows)
}

// FindActive retrieves all active kitchen orders (not completed or cancelled)
func (r *KitchenOrderRepository) FindActive(ctx context.Context) ([]*domain.KitchenOrder, error) {
	query := `
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		WHERE status NOT IN ('COMPLETED', 'CANCELLED')
		ORDER BY 
			CASE priority 
				WHEN 'URGENT' THEN 1 
				WHEN 'HIGH' THEN 2 
				WHEN 'NORMAL' THEN 3 
				WHEN 'LOW' THEN 4 
				ELSE 5 
			END ASC, 
			created_at ASC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active kitchen orders: %w", err)
	}
	defer rows.Close()

	return r.scanKitchenOrders(rows)
}

// List retrieves kitchen orders with pagination and filters
func (r *KitchenOrderRepository) List(ctx context.Context, offset, limit int, filters domain.KitchenOrderFilters) ([]*domain.KitchenOrder, int, error) {
	// Build WHERE clause based on filters
	whereClauses := []string{}
	args := []interface{}{}
	argCount := 0

	if filters.Status != nil {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, string(*filters.Status))
		argCount++
	}

	if filters.Priority != nil {
		whereClauses = append(whereClauses, "priority = ?")
		args = append(args, string(*filters.Priority))
		argCount++
	}

	if filters.Station != nil {
		whereClauses = append(whereClauses, "assigned_station = ?")
		args = append(args, *filters.Station)
		argCount++
	}

	if filters.OrderID != nil {
		whereClauses = append(whereClauses, "order_id = ?")
		args = append(args, *filters.OrderID)
		argCount++
	}

	if filters.DateFrom != nil {
		whereClauses = append(whereClauses, "created_at >= ?")
		args = append(args, *filters.DateFrom)
		argCount++
	}

	if filters.DateTo != nil {
		whereClauses = append(whereClauses, "created_at <= ?")
		args = append(args, *filters.DateTo)
		argCount++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM kitchen_orders %s", whereClause)
	var totalCount int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count kitchen orders: %w", err)
	}

	// Get paginated results
	query := fmt.Sprintf(`
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		%s
		ORDER BY 
			CASE priority 
				WHEN 'URGENT' THEN 1 
				WHEN 'HIGH' THEN 2 
				WHEN 'NORMAL' THEN 3 
				WHEN 'LOW' THEN 4 
				ELSE 5 
			END ASC, 
			created_at ASC
		LIMIT ? OFFSET ?`, whereClause)

	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query kitchen orders: %w", err)
	}
	defer rows.Close()

	orders, err := r.scanKitchenOrders(rows)
	if err != nil {
		return nil, 0, err
	}

	return orders, totalCount, nil
}

// Count returns the total number of kitchen orders matching the filters
func (r *KitchenOrderRepository) Count(ctx context.Context, filters domain.KitchenOrderFilters) (int, error) {
	// Build WHERE clause based on filters
	whereClauses := []string{}
	args := []interface{}{}
	argCount := 0

	if filters.Status != nil {
		whereClauses = append(whereClauses, "status = ?")
		args = append(args, string(*filters.Status))
		argCount++
	}

	if filters.Priority != nil {
		whereClauses = append(whereClauses, "priority = ?")
		args = append(args, string(*filters.Priority))
		argCount++
	}

	if filters.Station != nil {
		whereClauses = append(whereClauses, "assigned_station = ?")
		args = append(args, *filters.Station)
		argCount++
	}

	if filters.OrderID != nil {
		whereClauses = append(whereClauses, "order_id = ?")
		args = append(args, *filters.OrderID)
		argCount++
	}

	if filters.DateFrom != nil {
		whereClauses = append(whereClauses, "created_at >= ?")
		args = append(args, *filters.DateFrom)
		argCount++
	}

	if filters.DateTo != nil {
		whereClauses = append(whereClauses, "created_at <= ?")
		args = append(args, *filters.DateTo)
		argCount++
	}

	whereClause := ""
	if len(whereClauses) > 0 {
		whereClause = "WHERE " + strings.Join(whereClauses, " AND ")
	}

	query := fmt.Sprintf("SELECT COUNT(*) FROM kitchen_orders %s", whereClause)

	var count int
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count kitchen orders: %w", err)
	}

	return count, nil
}

// Helper functions

func (r *KitchenOrderRepository) scanKitchenOrder(row *sql.Row) (*domain.KitchenOrder, error) {
	var order domain.KitchenOrder
	var idStr string
	var itemsJSON []byte
	var estimatedTimeSeconds int64
	var startedAt, completedAt sql.NullTime

	err := row.Scan(
		&idStr,
		&order.OrderID,
		&order.TableID,
		&order.Status,
		&itemsJSON,
		&order.Priority,
		&order.AssignedStation,
		&estimatedTimeSeconds,
		&startedAt,
		&completedAt,
		&order.Notes,
		&order.CreatedAt,
		&order.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.WrapNotFound("FindKitchenOrder", "kitchen_order", "unknown", errors.ErrNotFound)
		}
		return nil, fmt.Errorf("failed to scan kitchen order: %w", err)
	}

	// Convert string ID to domain.KitchenOrderID
	order.ID = domain.KitchenOrderID(idStr)

	// Deserialize items from JSONB
	if err := json.Unmarshal(itemsJSON, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal items: %w", err)
	}

	// Convert time fields
	order.EstimatedTime = time.Duration(estimatedTimeSeconds) * time.Second
	if startedAt.Valid {
		order.StartedAt = startedAt.Time
	}
	if completedAt.Valid {
		order.CompletedAt = completedAt.Time
	}

	return &order, nil
}

func (r *KitchenOrderRepository) scanKitchenOrders(rows *sql.Rows) ([]*domain.KitchenOrder, error) {
	var orders []*domain.KitchenOrder

	for rows.Next() {
		var order domain.KitchenOrder
		var idStr string
		var itemsJSON []byte
		var estimatedTimeSeconds int64
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&idStr,
			&order.OrderID,
			&order.TableID,
			&order.Status,
			&itemsJSON,
			&order.Priority,
			&order.AssignedStation,
			&estimatedTimeSeconds,
			&startedAt,
			&completedAt,
			&order.Notes,
			&order.CreatedAt,
			&order.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan kitchen order: %w", err)
		}

		// Convert string ID to domain.KitchenOrderID
		order.ID = domain.KitchenOrderID(idStr)

		// Deserialize items from JSONB
		if err := json.Unmarshal(itemsJSON, &order.Items); err != nil {
			return nil, fmt.Errorf("failed to unmarshal items: %w", err)
		}

		// Convert time fields
		order.EstimatedTime = time.Duration(estimatedTimeSeconds) * time.Second
		if startedAt.Valid {
			order.StartedAt = startedAt.Time
		}
		if completedAt.Valid {
			order.CompletedAt = completedAt.Time
		}

		orders = append(orders, &order)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over kitchen orders: %w", err)
	}

	return orders, nil
}

// nullTimeOrValue returns sql.NullTime for SQLite compatibility
func nullTimeOrValue(t time.Time) sql.NullTime {
	if t.IsZero() {
		return sql.NullTime{Valid: false}
	}
	return sql.NullTime{Time: t, Valid: true}
}