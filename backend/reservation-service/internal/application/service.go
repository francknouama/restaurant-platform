package application

import (
	"context"
	"log"
	"time"
	reservation "github.com/restaurant-platform/reservation-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// ReservationService provides business logic for reservation operations
type ReservationService struct {
	reservationRepo reservation.ReservationRepository
	eventPublisher  events.EventPublisher
}

// NewReservationService creates a new reservation service instance
func NewReservationService(reservationRepo reservation.ReservationRepository, eventPublisher events.EventPublisher) *ReservationService {
	return &ReservationService{
		reservationRepo: reservationRepo,
		eventPublisher:  eventPublisher,
	}
}

// CreateReservation creates a new reservation
func (s *ReservationService) CreateReservation(ctx context.Context, customerID, tableID string, dateTime time.Time, partySize int) (*reservation.Reservation, error) {
	res, err := reservation.NewReservation(customerID, tableID, dateTime, partySize)
	if err != nil {
		return nil, err
	}

	err = s.reservationRepo.Create(ctx, res)
	if err != nil {
		return nil, err
	}

	// Publish reservation created event
	eventData, err := events.ToEventData(events.ReservationCreatedData{
		ReservationID: res.ID.String(),
		CustomerID:    res.CustomerID,
		TableID:       res.TableID,
		PartySize:     res.PartySize,
		DateTime:      res.DateTime.Format(time.RFC3339),
		Status:        string(res.Status),
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return nil, err
	}
	
	event := events.NewDomainEvent(events.ReservationCreatedEvent, res.ID.String(), eventData).
		WithMetadata("service", "reservation-service")
	
	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish reservation created event: %v", err)
	}

	return res, nil
}

// GetReservation retrieves a reservation by ID
func (s *ReservationService) GetReservation(ctx context.Context, id reservation.ReservationID) (*reservation.Reservation, error) {
	return s.reservationRepo.GetByID(ctx, id)
}

// GetReservationsByCustomer retrieves reservations for a customer
func (s *ReservationService) GetReservationsByCustomer(ctx context.Context, customerID string) ([]*reservation.Reservation, error) {
	return s.reservationRepo.FindByCustomer(ctx, customerID)
}

// GetReservationsByDateRange retrieves reservations within a date range
func (s *ReservationService) GetReservationsByDateRange(ctx context.Context, start, end time.Time) ([]*reservation.Reservation, error) {
	return s.reservationRepo.FindByDateRange(ctx, start, end)
}

// GetReservationsByTableAndDateRange retrieves reservations for a table within a date range
func (s *ReservationService) GetReservationsByTableAndDateRange(ctx context.Context, tableID string, start, end time.Time) ([]*reservation.Reservation, error) {
	return s.reservationRepo.FindByTableAndDateRange(ctx, tableID, start, end)
}

// ConfirmReservation confirms a reservation
func (s *ReservationService) ConfirmReservation(ctx context.Context, id reservation.ReservationID) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	oldStatus := string(res.Status)
	err = res.Confirm()
	if err != nil {
		return err
	}

	err = s.reservationRepo.Update(ctx, res)
	if err != nil {
		return err
	}

	// Publish reservation confirmed event
	eventData, err := events.ToEventData(events.ReservationStatusChangedData{
		ReservationID: res.ID.String(),
		CustomerID:    res.CustomerID,
		TableID:       res.TableID,
		PartySize:     res.PartySize,
		DateTime:      res.DateTime.Format(time.RFC3339),
		OldStatus:     oldStatus,
		NewStatus:     string(res.Status),
	})

	if err != nil {
		log.Printf("Failed to convert event data to map: %v", err)
		return err
	}
	
	event := events.NewDomainEvent(events.ReservationConfirmedEvent, res.ID.String(), eventData).
		WithMetadata("service", "reservation-service")
	
	if err := s.eventPublisher.Publish(ctx, event); err != nil {
		log.Printf("Failed to publish reservation confirmed event: %v", err)
	}

	return nil
}

// CancelReservation cancels a reservation
func (s *ReservationService) CancelReservation(ctx context.Context, id reservation.ReservationID) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.Cancel()
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// CompleteReservation marks a reservation as completed
func (s *ReservationService) CompleteReservation(ctx context.Context, id reservation.ReservationID) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.Complete()
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// MarkNoShow marks a reservation as no show
func (s *ReservationService) MarkNoShow(ctx context.Context, id reservation.ReservationID) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.MarkNoShow()
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// UpdateReservationPartySize updates the party size of a reservation
func (s *ReservationService) UpdateReservationPartySize(ctx context.Context, id reservation.ReservationID, partySize int) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.UpdatePartySize(partySize)
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// UpdateReservationTable updates the table assignment of a reservation
func (s *ReservationService) UpdateReservationTable(ctx context.Context, id reservation.ReservationID, tableID string) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.UpdateTable(tableID)
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// UpdateReservationDateTime updates the date and time of a reservation
func (s *ReservationService) UpdateReservationDateTime(ctx context.Context, id reservation.ReservationID, dateTime time.Time) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	err = res.UpdateDateTime(dateTime)
	if err != nil {
		return err
	}

	return s.reservationRepo.Update(ctx, res)
}

// AddReservationNotes adds notes to a reservation
func (s *ReservationService) AddReservationNotes(ctx context.Context, id reservation.ReservationID, notes string) error {
	res, err := s.reservationRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	res.AddNotes(notes)

	return s.reservationRepo.Update(ctx, res)
}

// FindAvailableTables finds available tables for a given date, duration, and party size
func (s *ReservationService) FindAvailableTables(ctx context.Context, dateTime time.Time, duration time.Duration, partySize int) ([]string, error) {
	return s.reservationRepo.FindAvailableTables(ctx, dateTime, duration, partySize)
}

// ListReservations retrieves reservations with pagination
func (s *ReservationService) ListReservations(ctx context.Context, offset, limit int) ([]*reservation.Reservation, int, error) {
	return s.reservationRepo.List(ctx, offset, limit)
}