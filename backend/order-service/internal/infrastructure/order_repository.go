package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/restaurant-platform/order-service/internal/domain"
)

type OrderRepository struct {
	db *DB
}

func NewOrderRepository(db *DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(ctx context.Context, order *domain.Order) error {
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return fmt.Errorf("failed to marshal order items: %w", err)
	}

	query := `
		INSERT INTO orders (
			id, customer_id, type, status, items, total_amount, tax_amount,
			table_id, delivery_address, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

	_, err = r.db.ExecContext(ctx, query,
		order.ID.String(), order.CustomerID, string(order.Type), string(order.Status),
		itemsJSON, order.TotalAmount, order.TaxAmount,
		nullString(order.TableID), nullString(order.DeliveryAddress), nullString(order.Notes),
		order.CreatedAt, order.UpdatedAt)

	return err
}

func (r *OrderRepository) GetByID(ctx context.Context, id domain.OrderID) (*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE id = $1`

	var order domain.Order
	var idStr, orderType, status string
	var itemsJSON []byte
	var tableID, deliveryAddress, notes sql.NullString

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &order.CustomerID, &orderType, &status, &itemsJSON,
		&order.TotalAmount, &order.TaxAmount, &tableID, &deliveryAddress, &notes,
		&order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("order not found")
		}
		return nil, err
	}

	order.ID = domain.OrderID(idStr)
	order.Type = domain.OrderType(orderType)
	order.Status = domain.OrderStatus(status)

	if tableID.Valid {
		order.TableID = tableID.String
	}
	if deliveryAddress.Valid {
		order.DeliveryAddress = deliveryAddress.String
	}
	if notes.Valid {
		order.Notes = notes.String
	}

	// Unmarshal items
	if err := json.Unmarshal(itemsJSON, &order.Items); err != nil {
		return nil, fmt.Errorf("failed to unmarshal order items: %w", err)
	}

	return &order, nil
}

func (r *OrderRepository) Update(ctx context.Context, order *domain.Order) error {
	itemsJSON, err := json.Marshal(order.Items)
	if err != nil {
		return fmt.Errorf("failed to marshal order items: %w", err)
	}

	query := `
		UPDATE orders 
		SET customer_id = $2, type = $3, status = $4, items = $5,
		    total_amount = $6, tax_amount = $7, table_id = $8,
		    delivery_address = $9, notes = $10, updated_at = $11
		WHERE id = $1`

	_, err = r.db.ExecContext(ctx, query,
		order.ID.String(), order.CustomerID, string(order.Type), string(order.Status),
		itemsJSON, order.TotalAmount, order.TaxAmount,
		nullString(order.TableID), nullString(order.DeliveryAddress), nullString(order.Notes),
		order.UpdatedAt)

	return err
}

func (r *OrderRepository) Delete(ctx context.Context, id domain.OrderID) error {
	query := `DELETE FROM orders WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id.String())
	return err
}

func (r *OrderRepository) List(ctx context.Context, offset, limit int, filters domain.OrderFilters) ([]*domain.Order, int, error) {
	// Build where clause and args
	whereClause, args := r.buildWhereClause(filters)
	
	// Count query
	countQuery := "SELECT COUNT(*) FROM orders" + whereClause
	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Main query with pagination
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders` + whereClause + `
		ORDER BY created_at DESC 
		LIMIT $` + fmt.Sprintf("%d", len(args)+1) + ` OFFSET $` + fmt.Sprintf("%d", len(args)+2)

	args = append(args, limit, offset)
	orders, err := r.queryOrders(ctx, query, args...)
	return orders, total, err
}

func (r *OrderRepository) FindByCustomer(ctx context.Context, customerID string) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE customer_id = $1
		ORDER BY created_at DESC`

	return r.queryOrders(ctx, query, customerID)
}

func (r *OrderRepository) FindByStatus(ctx context.Context, status domain.OrderStatus) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE status = $1
		ORDER BY created_at DESC`

	return r.queryOrders(ctx, query, string(status))
}

func (r *OrderRepository) FindByDateRange(ctx context.Context, start, end time.Time) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE created_at >= $1 AND created_at <= $2
		ORDER BY created_at DESC`

	return r.queryOrders(ctx, query, start, end)
}

func (r *OrderRepository) FindByTable(ctx context.Context, tableID string) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE table_id = $1
		ORDER BY created_at DESC`

	return r.queryOrders(ctx, query, tableID)
}

func (r *OrderRepository) FindByType(ctx context.Context, orderType domain.OrderType) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders WHERE type = $1
		ORDER BY created_at DESC`

	return r.queryOrders(ctx, query, string(orderType))
}

func (r *OrderRepository) GetTotalsByDateRange(ctx context.Context, start, end time.Time) (float64, error) {
	query := `
		SELECT COALESCE(SUM(total_amount), 0) 
		FROM orders 
		WHERE created_at >= $1 AND created_at <= $2 
		AND status NOT IN ('CANCELLED')`

	var total float64
	err := r.db.QueryRowContext(ctx, query, start, end).Scan(&total)
	return total, err
}

func (r *OrderRepository) GetActiveOrders(ctx context.Context) ([]*domain.Order, error) {
	query := `
		SELECT id, customer_id, type, status, items, total_amount, tax_amount,
		       table_id, delivery_address, notes, created_at, updated_at
		FROM orders 
		WHERE status NOT IN ('COMPLETED', 'CANCELLED')
		ORDER BY created_at ASC`

	return r.queryOrders(ctx, query)
}

// Helper methods

func (r *OrderRepository) queryOrders(ctx context.Context, query string, args ...interface{}) ([]*domain.Order, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []*domain.Order
	for rows.Next() {
		var order domain.Order
		var idStr, orderType, status string
		var itemsJSON []byte
		var tableID, deliveryAddress, notes sql.NullString

		err := rows.Scan(
			&idStr, &order.CustomerID, &orderType, &status, &itemsJSON,
			&order.TotalAmount, &order.TaxAmount, &tableID, &deliveryAddress, &notes,
			&order.CreatedAt, &order.UpdatedAt)
		if err != nil {
			return nil, err
		}

		order.ID = domain.OrderID(idStr)
		order.Type = domain.OrderType(orderType)
		order.Status = domain.OrderStatus(status)

		if tableID.Valid {
			order.TableID = tableID.String
		}
		if deliveryAddress.Valid {
			order.DeliveryAddress = deliveryAddress.String
		}
		if notes.Valid {
			order.Notes = notes.String
		}

		// Unmarshal items
		if err := json.Unmarshal(itemsJSON, &order.Items); err != nil {
			return nil, fmt.Errorf("failed to unmarshal order items: %w", err)
		}

		orders = append(orders, &order)
	}

	return orders, rows.Err()
}

func (r *OrderRepository) buildWhereClause(filters domain.OrderFilters) (string, []interface{}) {
	var conditions []string
	var args []interface{}
	argCount := 0

	if filters.CustomerID != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("customer_id = $%d", argCount))
		args = append(args, filters.CustomerID)
	}

	if filters.Status != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("status = $%d", argCount))
		args = append(args, string(*filters.Status))
	}

	if filters.Type != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("type = $%d", argCount))
		args = append(args, string(*filters.Type))
	}

	if filters.TableID != "" {
		argCount++
		conditions = append(conditions, fmt.Sprintf("table_id = $%d", argCount))
		args = append(args, filters.TableID)
	}

	if filters.StartDate != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("created_at >= $%d", argCount))
		args = append(args, *filters.StartDate)
	}

	if filters.EndDate != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("created_at <= $%d", argCount))
		args = append(args, *filters.EndDate)
	}

	if filters.MinAmount != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("total_amount >= $%d", argCount))
		args = append(args, *filters.MinAmount)
	}

	if filters.MaxAmount != nil {
		argCount++
		conditions = append(conditions, fmt.Sprintf("total_amount <= $%d", argCount))
		args = append(args, *filters.MaxAmount)
	}

	if len(conditions) == 0 {
		return "", args
	}

	whereClause := " WHERE " + conditions[0]
	for i := 1; i < len(conditions); i++ {
		whereClause += " AND " + conditions[i]
	}

	return whereClause, args
}

// Helper functions
func nullString(s string) sql.NullString {
	if s == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: s, Valid: true}
}