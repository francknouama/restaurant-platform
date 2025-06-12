package application

import (
	"time"
	reservation "github.com/restaurant-platform/reservation-service/internal/domain"
)

type ReservationResponse struct {
	ID         string `json:"id"`
	CustomerID string `json:"customer_id"`
	TableID    string `json:"table_id"`
	DateTime   string `json:"date_time"`
	PartySize  int    `json:"party_size"`
	Status     string `json:"status"`
	Notes      string `json:"notes,omitempty"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

type CreateReservationRequest struct {
	CustomerID string    `json:"customer_id" binding:"required"`
	TableID    string    `json:"table_id" binding:"required"`
	DateTime   time.Time `json:"date_time" binding:"required"`
	PartySize  int       `json:"party_size" binding:"required,min=1"`
	Notes      string    `json:"notes"`
}

type UpdateReservationRequest struct {
	TableID   string    `json:"table_id"`
	DateTime  time.Time `json:"date_time"`
	PartySize int       `json:"party_size" binding:"min=1"`
	Notes     string    `json:"notes"`
}

type ReservationListResponse struct {
	Reservations []*ReservationResponse `json:"reservations"`
	Total        int                    `json:"total"`
	Offset       int                    `json:"offset"`
	Limit        int                    `json:"limit"`
}

func ReservationToResponse(r *reservation.Reservation) *ReservationResponse {
	if r == nil {
		return nil
	}

	return &ReservationResponse{
		ID:         r.ID.String(),
		CustomerID: r.CustomerID,
		TableID:    r.TableID,
		DateTime:   r.DateTime.Format(time.RFC3339),
		PartySize:  r.PartySize,
		Status:     string(r.Status),
		Notes:      r.Notes,
		CreatedAt:  r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:  r.UpdatedAt.Format(time.RFC3339),
	}
}