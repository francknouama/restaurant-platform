package reservation

import (
	"context"
	"time"
)

// ReservationRepository defines the interface for reservation data access
type ReservationRepository interface {
	// Create adds a new reservation to the repository
	Create(ctx context.Context, reservation *Reservation) error

	// GetByID retrieves a reservation by its ID
	GetByID(ctx context.Context, id ReservationID) (*Reservation, error)

	// Update updates an existing reservation
	Update(ctx context.Context, reservation *Reservation) error

	// Delete removes a reservation from the repository
	Delete(ctx context.Context, id ReservationID) error

	// List retrieves reservations with pagination
	List(ctx context.Context, offset, limit int) ([]*Reservation, int, error)

	// FindByCustomer retrieves reservations for a specific customer
	FindByCustomer(ctx context.Context, customerID string) ([]*Reservation, error)

	// FindByDateRange retrieves reservations within a date range
	FindByDateRange(ctx context.Context, start, end time.Time) ([]*Reservation, error)

	// FindByTableAndDateRange retrieves reservations for a specific table within a date range
	FindByTableAndDateRange(ctx context.Context, tableID string, start, end time.Time) ([]*Reservation, error)

	// FindAvailableTables retrieves table IDs that are available for the given date and party size
	FindAvailableTables(ctx context.Context, dateTime time.Time, duration time.Duration, partySize int) ([]string, error)
}