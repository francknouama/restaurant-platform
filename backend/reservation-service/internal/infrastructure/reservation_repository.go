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
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.db.ExecContext(ctx, query,
		res.ID.String(), res.CustomerID, res.TableID, res.DateTime, res.PartySize,
		string(res.Status), res.Notes, res.CreatedAt, res.UpdatedAt)

	return err
}

func (r *ReservationRepository) GetByID(ctx context.Context, id reservation.ReservationID) (*reservation.Reservation, error) {
	query := `
		SELECT id, customer_id, table_id, date_time, party_size, status, notes, created_at, updated_at
		FROM reservations WHERE id = $1`

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
		SET customer_id = $2, table_id = $3, date_time = $4, party_size = $5, 
		    status = $6, notes = $7, updated_at = $8
		WHERE id = $1`

	_, err := r.db.ExecContext(ctx, query,
		res.ID.String(), res.CustomerID, res.TableID, res.DateTime, res.PartySize,
		string(res.Status), res.Notes, res.UpdatedAt)

	return err
}

func (r *ReservationRepository) Delete(ctx context.Context, id reservation.ReservationID) error {
	query := `DELETE FROM reservations WHERE id = $1`
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
		FROM reservations ORDER BY created_at DESC LIMIT $1 OFFSET $2`

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
		FROM reservations WHERE customer_id = $1 ORDER BY date_time DESC`

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
		FROM reservations WHERE date_time BETWEEN $1 AND $2 ORDER BY date_time ASC`

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
		FROM reservations WHERE table_id = $1 AND date_time BETWEEN $2 AND $3 ORDER BY date_time ASC`

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
		AND date_time < $2 AND date_time + INTERVAL '2 hours' > $1`

	rows, err := r.db.QueryContext(ctx, query, dateTime, endTime)
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