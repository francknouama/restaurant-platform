package reservation

import (
	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/shared/pkg/types"
	"time"
)

// ReservationStatus represents the possible states of a reservation
type ReservationStatus string

const (
	StatusPending   ReservationStatus = "PENDING"
	StatusConfirmed ReservationStatus = "CONFIRMED"
	StatusCancelled ReservationStatus = "CANCELLED"
	StatusCompleted ReservationStatus = "COMPLETED"
	StatusNoShow    ReservationStatus = "NO_SHOW"
)

// Reservation domain entity markers for type-safe IDs
type (
	ReservationEntity struct{}
)

// Implement EntityMarker interface
func (ReservationEntity) IsEntity() {}

// Type-safe ID types using generics
type (
	ReservationID = types.ID[ReservationEntity]
)

// Reservation is the aggregate root for the reservation domain
type Reservation struct {
	ID         ReservationID     `json:"id"`
	CustomerID string            `json:"customer_id"`
	TableID    string            `json:"table_id"`
	DateTime   time.Time         `json:"date_time"`
	PartySize  int               `json:"party_size"`
	Status     ReservationStatus `json:"status"`
	Notes      string            `json:"notes,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

// NewReservation creates a new reservation with validated fields
func NewReservation(customerID, tableID string, dateTime time.Time, partySize int) (*Reservation, error) {
	// Basic validation
	if customerID == "" {
		return nil, errors.WrapValidation("NewReservation", "customer_id", "customer ID is required", nil)
	}
	if tableID == "" {
		return nil, errors.WrapValidation("NewReservation", "table_id", "table ID is required", nil)
	}
	if dateTime.Before(time.Now()) {
		return nil, errors.WrapValidation("NewReservation", "date_time", "reservation date must be in the future", nil)
	}
	if partySize <= 0 {
		return nil, errors.WrapValidation("NewReservation", "party_size", "party size must be positive", nil)
	}

	now := time.Now()
	return &Reservation{
		ID:         types.NewID[ReservationEntity]("res"),
		CustomerID: customerID,
		TableID:    tableID,
		DateTime:   dateTime,
		PartySize:  partySize,
		Status:     StatusPending,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}

// Confirm changes the reservation status to confirmed
func (r *Reservation) Confirm() error {
	if r.Status == StatusCancelled {
		return errors.WrapConflict("Confirm", "reservation", "cannot confirm a cancelled reservation", nil)
	}
	r.Status = StatusConfirmed
	r.UpdatedAt = time.Now()
	return nil
}

// Cancel changes the reservation status to cancelled
func (r *Reservation) Cancel() error {
	if r.Status == StatusCompleted {
		return errors.WrapConflict("Cancel", "reservation", "cannot cancel a completed reservation", nil)
	}
	r.Status = StatusCancelled
	r.UpdatedAt = time.Now()
	return nil
}

// Complete changes the reservation status to completed
func (r *Reservation) Complete() error {
	if r.Status != StatusConfirmed {
		return errors.WrapConflict("Complete", "reservation", "only confirmed reservations can be completed", nil)
	}
	r.Status = StatusCompleted
	r.UpdatedAt = time.Now()
	return nil
}

// MarkNoShow changes the reservation status to no show
func (r *Reservation) MarkNoShow() error {
	if r.Status != StatusConfirmed && r.Status != StatusPending {
		return errors.WrapConflict("MarkNoShow", "reservation", "only confirmed or pending reservations can be marked as no show", nil)
	}
	r.Status = StatusNoShow
	r.UpdatedAt = time.Now()
	return nil
}

// UpdatePartySize updates the party size if it's valid
func (r *Reservation) UpdatePartySize(size int) error {
	if size <= 0 {
		return errors.WrapValidation("UpdatePartySize", "party_size", "party size must be positive", nil)
	}
	r.PartySize = size
	r.UpdatedAt = time.Now()
	return nil
}

// UpdateTable changes the assigned table
func (r *Reservation) UpdateTable(tableID string) error {
	if tableID == "" {
		return errors.WrapValidation("UpdateTable", "table_id", "table ID is required", nil)
	}
	r.TableID = tableID
	r.UpdatedAt = time.Now()
	return nil
}

// UpdateDateTime changes the reservation date and time
func (r *Reservation) UpdateDateTime(dateTime time.Time) error {
	if dateTime.Before(time.Now()) {
		return errors.WrapValidation("UpdateDateTime", "date_time", "reservation date must be in the future", nil)
	}
	r.DateTime = dateTime
	r.UpdatedAt = time.Now()
	return nil
}

// AddNotes adds notes to the reservation
func (r *Reservation) AddNotes(notes string) {
	r.Notes = notes
	r.UpdatedAt = time.Now()
}