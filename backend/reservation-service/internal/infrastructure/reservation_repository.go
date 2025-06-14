package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"time"
	reservation "github.com/restaurant-platform/reservation-service/internal/domain"
)

type ReservationRepository struct {
	db *DB
}

func NewReservationRepository(db *DB) *ReservationRepository {
	return &ReservationRepository{db: db}
}

func (r *ReservationRepository) Create(ctx context.Context, res *reservation.Reservation) error {
	query := `
		INSERT INTO reservations (id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query,
		res.ID.String(), res.CustomerID, res.TableID, res.DateTime, res.PartySize,
		string(res.Status), res.Notes, res.CreatedAt, res.UpdatedAt)

	return err
}

func (r *ReservationRepository) GetByID(ctx context.Context, id reservation.ReservationID) (*reservation.Reservation, error) {
	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations WHERE id = ?`

	var res reservation.Reservation
	var idStr, status string

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&idStr, &res.CustomerID, &res.TableID, &res.DateTime, &res.PartySize,
		&status, &res.Notes, &res.CreatedAt, &res.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("reservation not found")
		}
		return nil, err
	}

	res.ID = reservation.ReservationID(idStr)
	res.Status = reservation.ReservationStatus(status)

	return &res, nil
}

func (r *ReservationRepository) Update(ctx context.Context, res *reservation.Reservation) error {
	query := `
		UPDATE reservations 
		SET customer_id = ?, table_id = ?, date_time = ?, party_size = ?, 
		    status = ?, notes = ?, updated_at = ?
		WHERE id = ?`

	_, err := r.db.ExecContext(ctx, query,
		res.CustomerID, res.TableID, res.DateTime, res.PartySize,
		string(res.Status), res.Notes, res.UpdatedAt, res.ID.String())

	return err
}

func (r *ReservationRepository) Delete(ctx context.Context, id reservation.ReservationID) error {
	query := `DELETE FROM reservations WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id.String())
	return err
}

func (r *ReservationRepository) List(ctx context.Context, offset, limit int) ([]*reservation.Reservation, int, error) {
	countQuery := `SELECT COUNT(*) FROM reservations`
	var total int
	err := r.db.QueryRowContext(ctx, countQuery).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations ORDER BY created_at DESC LIMIT ? OFFSET ?`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var reservations []*reservation.Reservation
	for rows.Next() {
		var res reservation.Reservation
		var idStr, status string

		err := rows.Scan(&idStr, &res.CustomerID, &res.TableID, &res.DateTime, &res.PartySize,
			&status, &res.Notes, &res.CreatedAt, &res.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}

		res.ID = reservation.ReservationID(idStr)
		res.Status = reservation.ReservationStatus(status)
		reservations = append(reservations, &res)
	}

	return reservations, total, rows.Err()
}

func (r *ReservationRepository) FindByCustomer(ctx context.Context, customerID string) ([]*reservation.Reservation, error) {
	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations WHERE customer_id = ? ORDER BY date_time DESC`

	rows, err := r.db.QueryContext(ctx, query, customerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []*reservation.Reservation
	for rows.Next() {
		var res reservation.Reservation
		var idStr, status string

		err := rows.Scan(&idStr, &res.CustomerID, &res.TableID, &res.DateTime, &res.PartySize,
			&status, &res.Notes, &res.CreatedAt, &res.UpdatedAt)
		if err != nil {
			return nil, err
		}

		res.ID = reservation.ReservationID(idStr)
		res.Status = reservation.ReservationStatus(status)
		reservations = append(reservations, &res)
	}

	return reservations, rows.Err()
}

func (r *ReservationRepository) FindByDateRange(ctx context.Context, start, end time.Time) ([]*reservation.Reservation, error) {
	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations WHERE date_time BETWEEN ? AND ? ORDER BY date_time ASC`

	rows, err := r.db.QueryContext(ctx, query, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []*reservation.Reservation
	for rows.Next() {
		var res reservation.Reservation
		var idStr, status string

		err := rows.Scan(&idStr, &res.CustomerID, &res.TableID, &res.DateTime, &res.PartySize,
			&status, &res.Notes, &res.CreatedAt, &res.UpdatedAt)
		if err != nil {
			return nil, err
		}

		res.ID = reservation.ReservationID(idStr)
		res.Status = reservation.ReservationStatus(status)
		reservations = append(reservations, &res)
	}

	return reservations, rows.Err()
}

func (r *ReservationRepository) FindByTableAndDateRange(ctx context.Context, tableID string, start, end time.Time) ([]*reservation.Reservation, error) {
	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations WHERE table_id = ? AND date_time BETWEEN ? AND ? ORDER BY date_time ASC`

	rows, err := r.db.QueryContext(ctx, query, tableID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reservations []*reservation.Reservation
	for rows.Next() {
		var res reservation.Reservation
		var idStr, status string

		err := rows.Scan(&idStr, &res.CustomerID, &res.TableID, &res.DateTime, &res.PartySize,
			&status, &res.Notes, &res.CreatedAt, &res.UpdatedAt)
		if err != nil {
			return nil, err
		}

		res.ID = reservation.ReservationID(idStr)
		res.Status = reservation.ReservationStatus(status)
		reservations = append(reservations, &res)
	}

	return reservations, rows.Err()
}

func (r *ReservationRepository) FindAvailableTables(ctx context.Context, dateTime time.Time, duration time.Duration, partySize int) ([]string, error) {
	// This is a simplified implementation
	// In a real system, you'd have a tables table and more complex availability logic
	endTime := dateTime.Add(duration)
	
	query := `
		SELECT DISTINCT table_id FROM reservations 
		WHERE status NOT IN ('CANCELLED', 'NO_SHOW') 
		AND date_time < ? AND datetime(date_time, '+2 hours') > ?`

	rows, err := r.db.QueryContext(ctx, query, endTime, dateTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	occupiedTables := make(map[string]bool)
	for rows.Next() {
		var tableID string
		if err := rows.Scan(&tableID); err != nil {
			return nil, err
		}
		occupiedTables[tableID] = true
	}

	// Return mock available tables for now
	allTables := []string{"table1", "table2", "table3", "table4", "table5"}
	var availableTables []string
	
	for _, table := range allTables {
		if !occupiedTables[table] {
			availableTables = append(availableTables, table)
		}
	}

	return availableTables, nil
}