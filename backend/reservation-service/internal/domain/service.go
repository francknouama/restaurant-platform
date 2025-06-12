package reservation

import (
	"context"
	"time"
)

// ReservationService defines the business operations for reservations
type ReservationService interface {
	// CreateReservation creates a new reservation
	CreateReservation(ctx context.Context, customerID, tableID string, dateTime time.Time, partySize int) (*Reservation, error)

	// GetReservation retrieves a reservation by ID
	GetReservation(ctx context.Context, id ReservationID) (*Reservation, error)

	// GetReservationsByCustomer retrieves reservations for a customer
	GetReservationsByCustomer(ctx context.Context, customerID string) ([]*Reservation, error)

	// GetReservationsByDateRange retrieves reservations within a date range
	GetReservationsByDateRange(ctx context.Context, start, end time.Time) ([]*Reservation, error)

	// GetReservationsByTableAndDateRange retrieves reservations for a table within a date range
	GetReservationsByTableAndDateRange(ctx context.Context, tableID string, start, end time.Time) ([]*Reservation, error)

	// ConfirmReservation confirms a reservation
	ConfirmReservation(ctx context.Context, id ReservationID) error

	// CancelReservation cancels a reservation
	CancelReservation(ctx context.Context, id ReservationID) error

	// CompleteReservation marks a reservation as completed
	CompleteReservation(ctx context.Context, id ReservationID) error

	// MarkNoShow marks a reservation as no show
	MarkNoShow(ctx context.Context, id ReservationID) error

	// UpdateReservationPartySize updates the party size of a reservation
	UpdateReservationPartySize(ctx context.Context, id ReservationID, partySize int) error

	// UpdateReservationTable updates the table assignment of a reservation
	UpdateReservationTable(ctx context.Context, id ReservationID, tableID string) error

	// UpdateReservationDateTime updates the date and time of a reservation
	UpdateReservationDateTime(ctx context.Context, id ReservationID, dateTime time.Time) error

	// AddReservationNotes adds notes to a reservation
	AddReservationNotes(ctx context.Context, id ReservationID, notes string) error

	// FindAvailableTables finds available tables for a given date, duration, and party size
	FindAvailableTables(ctx context.Context, dateTime time.Time, duration time.Duration, partySize int) ([]string, error)

	// ListReservations retrieves reservations with pagination
	ListReservations(ctx context.Context, offset, limit int) ([]*Reservation, int, error)
}