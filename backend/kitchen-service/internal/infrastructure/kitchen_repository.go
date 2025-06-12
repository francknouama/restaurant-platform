package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"kitchen-service/internal/domain"
	"restaurant-platform/shared/pkg/errors"
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
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
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
		WHERE id = $1`

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
		WHERE order_id = $1`

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
			order_id = $2,
			table_id = $3,
			status = $4,
			items = $5,
			priority = $6,
			assigned_station = $7,
			estimated_time = $8,
			started_at = $9,
			completed_at = $10,
			notes = $11,
			updated_at = $12
		WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query,
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
		order.UpdatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to update kitchen order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapBusinessError("KITCHEN_ORDER_NOT_FOUND", "kitchen order not found", errors.ErrNotFound)
	}

	return nil
}

// Delete deletes a kitchen order
func (r *KitchenOrderRepository) Delete(ctx context.Context, id domain.KitchenOrderID) error {
	query := `DELETE FROM kitchen_orders WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, string(id))
	if err != nil {
		return fmt.Errorf("failed to delete kitchen order: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.WrapBusinessError("KITCHEN_ORDER_NOT_FOUND", "kitchen order not found", errors.ErrNotFound)
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
		WHERE status = $1
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
		WHERE assigned_station = $1
		ORDER BY priority DESC, created_at ASC`

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
		ORDER BY priority DESC, created_at ASC`

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
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, string(*filters.Status))
	}

	if filters.Priority != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("priority = $%d", argCount))
		args = append(args, string(*filters.Priority))
	}

	if filters.Station != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("assigned_station = $%d", argCount))
		args = append(args, *filters.Station)
	}

	if filters.OrderID != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("order_id = $%d", argCount))
		args = append(args, *filters.OrderID)
	}

	if filters.DateFrom != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("created_at >= $%d", argCount))
		args = append(args, *filters.DateFrom)
	}

	if filters.DateTo != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("created_at <= $%d", argCount))
		args = append(args, *filters.DateTo)
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
	argCount++
	limitArg := argCount
	argCount++
	offsetArg := argCount

	query := fmt.Sprintf(`
		SELECT id, order_id, table_id, status, items, priority, 
		       assigned_station, estimated_time, started_at, 
		       completed_at, notes, created_at, updated_at
		FROM kitchen_orders 
		%s
		ORDER BY priority DESC, created_at ASC
		LIMIT $%d OFFSET $%d`, whereClause, limitArg, offsetArg)

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
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("status = $%d", argCount))
		args = append(args, string(*filters.Status))
	}

	if filters.Priority != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("priority = $%d", argCount))
		args = append(args, string(*filters.Priority))
	}

	if filters.Station != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("assigned_station = $%d", argCount))
		args = append(args, *filters.Station)
	}

	if filters.OrderID != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("order_id = $%d", argCount))
		args = append(args, *filters.OrderID)
	}

	if filters.DateFrom != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("created_at >= $%d", argCount))
		args = append(args, *filters.DateFrom)
	}

	if filters.DateTo != nil {
		argCount++
		whereClauses = append(whereClauses, fmt.Sprintf("created_at <= $%d", argCount))
		args = append(args, *filters.DateTo)
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
	var itemsJSON []byte
	var estimatedTimeSeconds int64
	var startedAt, completedAt sql.NullTime

	err := row.Scan(
		&order.ID,
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
			return nil, errors.WrapBusinessError("KITCHEN_ORDER_NOT_FOUND", "kitchen order not found", errors.ErrNotFound)
		}
		return nil, fmt.Errorf("failed to scan kitchen order: %w", err)
	}

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
		var itemsJSON []byte
		var estimatedTimeSeconds int64
		var startedAt, completedAt sql.NullTime

		err := rows.Scan(
			&order.ID,
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

// nullTimeOrValue returns sql.NullTime or the time value based on whether it's zero
func nullTimeOrValue(t time.Time) interface{} {
	if t.IsZero() {
		return sql.NullTime{Valid: false}
	}
	return t
}