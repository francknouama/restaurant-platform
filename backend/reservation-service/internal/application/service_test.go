package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	reservation "github.com/restaurant-platform/reservation-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// MockReservationRepository is a mock implementation of ReservationRepository
type MockReservationRepository struct {
	mock.Mock
}

func (m *MockReservationRepository) Create(ctx context.Context, res *reservation.Reservation) error {
	args := m.Called(ctx, res)
	return args.Error(0)
}

func (m *MockReservationRepository) GetByID(ctx context.Context, id reservation.ReservationID) (*reservation.Reservation, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*reservation.Reservation), args.Error(1)
}

func (m *MockReservationRepository) Update(ctx context.Context, res *reservation.Reservation) error {
	args := m.Called(ctx, res)
	return args.Error(0)
}

func (m *MockReservationRepository) Delete(ctx context.Context, id reservation.ReservationID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockReservationRepository) List(ctx context.Context, offset, limit int) ([]*reservation.Reservation, int, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*reservation.Reservation), args.Int(1), args.Error(2)
}

func (m *MockReservationRepository) FindByCustomer(ctx context.Context, customerID string) ([]*reservation.Reservation, error) {
	args := m.Called(ctx, customerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*reservation.Reservation), args.Error(1)
}

func (m *MockReservationRepository) FindByDateRange(ctx context.Context, start, end time.Time) ([]*reservation.Reservation, error) {
	args := m.Called(ctx, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*reservation.Reservation), args.Error(1)
}

func (m *MockReservationRepository) FindByTableAndDateRange(ctx context.Context, tableID string, start, end time.Time) ([]*reservation.Reservation, error) {
	args := m.Called(ctx, tableID, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*reservation.Reservation), args.Error(1)
}

func (m *MockReservationRepository) FindAvailableTables(ctx context.Context, dateTime time.Time, duration time.Duration, partySize int) ([]string, error) {
	args := m.Called(ctx, dateTime, duration, partySize)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]string), args.Error(1)
}

// MockEventPublisher is a mock implementation of EventPublisher
type MockEventPublisher struct {
	mock.Mock
}

func (m *MockEventPublisher) Publish(ctx context.Context, event *events.DomainEvent) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockEventPublisher) Close() error {
	args := m.Called()
	return args.Error(0)
}

// ReservationServiceTestSuite contains all application service tests
type ReservationServiceTestSuite struct {
	suite.Suite
	service    *ReservationService
	mockRepo   *MockReservationRepository
	mockEvents *MockEventPublisher
	ctx        context.Context
}

func TestReservationServiceTestSuite(t *testing.T) {
	suite.Run(t, new(ReservationServiceTestSuite))
}

func (suite *ReservationServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockReservationRepository)
	suite.mockEvents = new(MockEventPublisher)
	suite.service = NewReservationService(suite.mockRepo, suite.mockEvents)
	suite.ctx = context.Background()
}

func (suite *ReservationServiceTestSuite) TearDownTest() {
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockEvents.AssertExpectations(suite.T())
}

// Test CreateReservation
func (suite *ReservationServiceTestSuite) TestCreateReservation_Success() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	dateTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	suite.mockRepo.On("Create", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.CustomerID == customerID && res.TableID == tableID
	})).Return(nil)

	suite.mockEvents.On("Publish", suite.ctx, mock.MatchedBy(func(event *events.DomainEvent) bool {
		return event.Type == events.ReservationCreatedEvent
	})).Return(nil)

	// When
	result, err := suite.service.CreateReservation(suite.ctx, customerID, tableID, dateTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(customerID, result.CustomerID)
	assert.Equal(tableID, result.TableID)
	assert.Equal(dateTime, result.DateTime)
	assert.Equal(partySize, result.PartySize)
	assert.Equal(reservation.StatusPending, result.Status)
}

func (suite *ReservationServiceTestSuite) TestCreateReservation_InvalidData_ShouldFail() {
	// Given - empty customer ID
	customerID := ""
	tableID := "table-5"
	dateTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	// When
	result, err := suite.service.CreateReservation(suite.ctx, customerID, tableID, dateTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "customer ID is required")
}

func (suite *ReservationServiceTestSuite) TestCreateReservation_RepositoryError_ShouldFail() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	dateTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(errors.New("repository error"))

	// When
	result, err := suite.service.CreateReservation(suite.ctx, customerID, tableID, dateTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "repository error")
}

func (suite *ReservationServiceTestSuite) TestCreateReservation_EventPublishingFailure_ShouldStillSucceed() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	dateTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(nil)
	suite.mockEvents.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(errors.New("event error"))

	// When
	result, err := suite.service.CreateReservation(suite.ctx, customerID, tableID, dateTime, partySize)

	// Then - Should succeed even if event publishing fails (logged but not blocking)
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
}

// Test GetReservation
func (suite *ReservationServiceTestSuite) TestGetReservation_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	expectedReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusConfirmed,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(expectedReservation, nil)

	// When
	result, err := suite.service.GetReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservation, result)
}

func (suite *ReservationServiceTestSuite) TestGetReservation_NotFound_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_nonexistent")

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(nil, errors.New("not found"))

	// When
	result, err := suite.service.GetReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
}

// Test GetReservationsByCustomer
func (suite *ReservationServiceTestSuite) TestGetReservationsByCustomer_Success() {
	// Given
	customerID := "customer-123"
	expectedReservations := []*reservation.Reservation{
		{ID: reservation.ReservationID("res_1"), CustomerID: customerID},
		{ID: reservation.ReservationID("res_2"), CustomerID: customerID},
	}

	suite.mockRepo.On("FindByCustomer", suite.ctx, customerID).Return(expectedReservations, nil)

	// When
	result, err := suite.service.GetReservationsByCustomer(suite.ctx, customerID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, result)
}

func (suite *ReservationServiceTestSuite) TestGetReservationsByCustomer_EmptyResult_Success() {
	// Given
	customerID := "customer-123"
	expectedReservations := []*reservation.Reservation{}

	suite.mockRepo.On("FindByCustomer", suite.ctx, customerID).Return(expectedReservations, nil)

	// When
	result, err := suite.service.GetReservationsByCustomer(suite.ctx, customerID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, result)
}

// Test GetReservationsByDateRange
func (suite *ReservationServiceTestSuite) TestGetReservationsByDateRange_Success() {
	// Given
	startTime := time.Now()
	endTime := startTime.Add(24 * time.Hour)
	expectedReservations := []*reservation.Reservation{
		{ID: reservation.ReservationID("res_1"), DateTime: startTime.Add(2 * time.Hour)},
		{ID: reservation.ReservationID("res_2"), DateTime: startTime.Add(4 * time.Hour)},
	}

	suite.mockRepo.On("FindByDateRange", suite.ctx, startTime, endTime).Return(expectedReservations, nil)

	// When
	result, err := suite.service.GetReservationsByDateRange(suite.ctx, startTime, endTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, result)
}

// Test GetReservationsByTableAndDateRange
func (suite *ReservationServiceTestSuite) TestGetReservationsByTableAndDateRange_Success() {
	// Given
	tableID := "table-5"
	startTime := time.Now()
	endTime := startTime.Add(24 * time.Hour)
	expectedReservations := []*reservation.Reservation{
		{ID: reservation.ReservationID("res_1"), TableID: tableID, DateTime: startTime.Add(2 * time.Hour)},
	}

	suite.mockRepo.On("FindByTableAndDateRange", suite.ctx, tableID, startTime, endTime).Return(expectedReservations, nil)

	// When
	result, err := suite.service.GetReservationsByTableAndDateRange(suite.ctx, tableID, startTime, endTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, result)
}

// Test ConfirmReservation
func (suite *ReservationServiceTestSuite) TestConfirmReservation_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		DateTime:   time.Now().Add(2 * time.Hour),
		PartySize:  4,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.Status == reservation.StatusConfirmed
	})).Return(nil)
	suite.mockEvents.On("Publish", suite.ctx, mock.MatchedBy(func(event *events.DomainEvent) bool {
		return event.Type == events.ReservationConfirmedEvent
	})).Return(nil)

	// When
	err := suite.service.ConfirmReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(reservation.StatusConfirmed, existingReservation.Status)
}

func (suite *ReservationServiceTestSuite) TestConfirmReservation_ReservationNotFound_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_nonexistent")

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(nil, errors.New("not found"))

	// When
	err := suite.service.ConfirmReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
}

func (suite *ReservationServiceTestSuite) TestConfirmReservation_AlreadyCancelled_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusCancelled,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)

	// When
	err := suite.service.ConfirmReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot confirm a cancelled reservation")
}

// Test CancelReservation
func (suite *ReservationServiceTestSuite) TestCancelReservation_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusConfirmed,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.Status == reservation.StatusCancelled
	})).Return(nil)

	// When
	err := suite.service.CancelReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(reservation.StatusCancelled, existingReservation.Status)
}

func (suite *ReservationServiceTestSuite) TestCancelReservation_AlreadyCompleted_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusCompleted,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)

	// When
	err := suite.service.CancelReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot cancel a completed reservation")
}

// Test CompleteReservation
func (suite *ReservationServiceTestSuite) TestCompleteReservation_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusConfirmed,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.Status == reservation.StatusCompleted
	})).Return(nil)

	// When
	err := suite.service.CompleteReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(reservation.StatusCompleted, existingReservation.Status)
}

func (suite *ReservationServiceTestSuite) TestCompleteReservation_NotConfirmed_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)

	// When
	err := suite.service.CompleteReservation(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "only confirmed reservations can be completed")
}

// Test MarkNoShow
func (suite *ReservationServiceTestSuite) TestMarkNoShow_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusConfirmed,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.Status == reservation.StatusNoShow
	})).Return(nil)

	// When
	err := suite.service.MarkNoShow(suite.ctx, reservationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(reservation.StatusNoShow, existingReservation.Status)
}

// Test Update Operations
func (suite *ReservationServiceTestSuite) TestUpdateReservationPartySize_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	newPartySize := 6
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		PartySize:  4,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.PartySize == newPartySize
	})).Return(nil)

	// When
	err := suite.service.UpdateReservationPartySize(suite.ctx, reservationID, newPartySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newPartySize, existingReservation.PartySize)
}

func (suite *ReservationServiceTestSuite) TestUpdateReservationPartySize_InvalidSize_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	invalidPartySize := 0
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		PartySize:  4,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)

	// When
	err := suite.service.UpdateReservationPartySize(suite.ctx, reservationID, invalidPartySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "party size must be positive")
	assert.Equal(4, existingReservation.PartySize) // Should remain unchanged
}

func (suite *ReservationServiceTestSuite) TestUpdateReservationTable_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	newTableID := "table-10"
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.TableID == newTableID
	})).Return(nil)

	// When
	err := suite.service.UpdateReservationTable(suite.ctx, reservationID, newTableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newTableID, existingReservation.TableID)
}

func (suite *ReservationServiceTestSuite) TestUpdateReservationDateTime_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	newDateTime := time.Now().Add(4 * time.Hour)
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		DateTime:   time.Now().Add(2 * time.Hour),
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.DateTime.Equal(newDateTime)
	})).Return(nil)

	// When
	err := suite.service.UpdateReservationDateTime(suite.ctx, reservationID, newDateTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newDateTime, existingReservation.DateTime)
}

func (suite *ReservationServiceTestSuite) TestUpdateReservationDateTime_PastDate_ShouldFail() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	pastDateTime := time.Now().Add(-1 * time.Hour)
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		DateTime:   time.Now().Add(2 * time.Hour),
	}
	originalDateTime := existingReservation.DateTime

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)

	// When
	err := suite.service.UpdateReservationDateTime(suite.ctx, reservationID, pastDateTime)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "reservation date must be in the future")
	assert.Equal(originalDateTime, existingReservation.DateTime) // Should remain unchanged
}

func (suite *ReservationServiceTestSuite) TestAddReservationNotes_Success() {
	// Given
	reservationID := reservation.ReservationID("res_123")
	notes := "Customer has food allergies"
	existingReservation := &reservation.Reservation{
		ID:         reservationID,
		CustomerID: "customer-123",
		TableID:    "table-5",
		Status:     reservation.StatusPending,
		Notes:      "",
	}

	suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.MatchedBy(func(res *reservation.Reservation) bool {
		return res.Notes == notes
	})).Return(nil)

	// When
	err := suite.service.AddReservationNotes(suite.ctx, reservationID, notes)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(notes, existingReservation.Notes)
}

// Test FindAvailableTables
func (suite *ReservationServiceTestSuite) TestFindAvailableTables_Success() {
	// Given
	dateTime := time.Now().Add(2 * time.Hour)
	duration := 2 * time.Hour
	partySize := 4
	expectedTables := []string{"table-1", "table-3", "table-7"}

	suite.mockRepo.On("FindAvailableTables", suite.ctx, dateTime, duration, partySize).Return(expectedTables, nil)

	// When
	result, err := suite.service.FindAvailableTables(suite.ctx, dateTime, duration, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedTables, result)
}

func (suite *ReservationServiceTestSuite) TestFindAvailableTables_NoTablesAvailable() {
	// Given
	dateTime := time.Now().Add(2 * time.Hour)
	duration := 2 * time.Hour
	partySize := 4
	expectedTables := []string{}

	suite.mockRepo.On("FindAvailableTables", suite.ctx, dateTime, duration, partySize).Return(expectedTables, nil)

	// When
	result, err := suite.service.FindAvailableTables(suite.ctx, dateTime, duration, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedTables, result)
	assert.Empty(result)
}

// Test ListReservations
func (suite *ReservationServiceTestSuite) TestListReservations_Success() {
	// Given
	offset, limit := 0, 10
	expectedReservations := []*reservation.Reservation{
		{ID: reservation.ReservationID("res_1"), CustomerID: "customer-1"},
		{ID: reservation.ReservationID("res_2"), CustomerID: "customer-2"},
	}
	expectedTotal := 15

	suite.mockRepo.On("List", suite.ctx, offset, limit).Return(expectedReservations, expectedTotal, nil)

	// When
	reservations, total, err := suite.service.ListReservations(suite.ctx, offset, limit)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, reservations)
	assert.Equal(expectedTotal, total)
}

func (suite *ReservationServiceTestSuite) TestListReservations_EmptyResult() {
	// Given
	offset, limit := 0, 10
	expectedReservations := []*reservation.Reservation{}
	expectedTotal := 0

	suite.mockRepo.On("List", suite.ctx, offset, limit).Return(expectedReservations, expectedTotal, nil)

	// When
	reservations, total, err := suite.service.ListReservations(suite.ctx, offset, limit)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(expectedReservations, reservations)
	assert.Equal(expectedTotal, total)
	assert.Empty(reservations)
}

// Test Error Scenarios
func (suite *ReservationServiceTestSuite) TestRepositoryErrors_ShouldPropagate() {
	// Test various repository error scenarios
	reservationID := reservation.ReservationID("res_123")

	testCases := []struct {
		name     string
		method   func() error
		mockCall func()
	}{
		{
			name: "GetReservation repository error",
			method: func() error {
				_, err := suite.service.GetReservation(suite.ctx, reservationID)
				return err
			},
			mockCall: func() {
				suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(nil, errors.New("not found"))
			},
		},
		{
			name: "ConfirmReservation update error",
			method: func() error {
				return suite.service.ConfirmReservation(suite.ctx, reservationID)
			},
			mockCall: func() {
				existingReservation := &reservation.Reservation{
					ID:         reservationID,
					CustomerID: "customer-123",
					Status:     reservation.StatusPending,
				}
				suite.mockRepo.On("GetByID", suite.ctx, reservationID).Return(existingReservation, nil)
				suite.mockRepo.On("Update", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(errors.New("update error"))
			},
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Setup fresh mocks for each test case
			suite.mockRepo = new(MockReservationRepository)
			suite.mockEvents = new(MockEventPublisher)
			suite.service = NewReservationService(suite.mockRepo, suite.mockEvents)

			tc.mockCall()

			err := tc.method()
			assert.Error(t, err)
		})
	}
}

// Test Complex Workflows
func (suite *ReservationServiceTestSuite) TestCompleteReservationWorkflow() {
	// Test a complete workflow: Create -> Confirm -> Complete
	customerID := "customer-123"
	tableID := "table-5"
	dateTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	// Step 1: Create reservation
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(nil)
	suite.mockEvents.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	createdReservation, err := suite.service.CreateReservation(suite.ctx, customerID, tableID, dateTime, partySize)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), reservation.StatusPending, createdReservation.Status)

	// Step 2: Confirm reservation
	suite.mockRepo.On("GetByID", suite.ctx, createdReservation.ID).Return(createdReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(nil)

	err = suite.service.ConfirmReservation(suite.ctx, createdReservation.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), reservation.StatusConfirmed, createdReservation.Status)

	// Step 3: Complete reservation
	suite.mockRepo.On("GetByID", suite.ctx, createdReservation.ID).Return(createdReservation, nil)
	suite.mockRepo.On("Update", suite.ctx, mock.AnythingOfType("*reservation.Reservation")).Return(nil)

	err = suite.service.CompleteReservation(suite.ctx, createdReservation.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), reservation.StatusCompleted, createdReservation.Status)
}