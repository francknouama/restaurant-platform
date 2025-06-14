package reservation

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// ReservationTestSuite contains all domain model tests
type ReservationTestSuite struct {
	suite.Suite
}

func TestReservationTestSuite(t *testing.T) {
	suite.Run(t, new(ReservationTestSuite))
}

// Test Reservation Creation
func (suite *ReservationTestSuite) TestNewReservation_Success() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(reservation)
	assert.Equal(customerID, reservation.CustomerID)
	assert.Equal(tableID, reservation.TableID)
	assert.Equal(futureTime, reservation.DateTime)
	assert.Equal(partySize, reservation.PartySize)
	assert.Equal(StatusPending, reservation.Status)
	assert.NotEmpty(reservation.ID)
	assert.WithinDuration(time.Now(), reservation.CreatedAt, time.Second)
	assert.WithinDuration(time.Now(), reservation.UpdatedAt, time.Second)
}

func (suite *ReservationTestSuite) TestNewReservation_EmptyCustomerID_ShouldFail() {
	// Given
	customerID := ""
	tableID := "table-5"
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(reservation)
	assert.Contains(err.Error(), "customer ID is required")
}

func (suite *ReservationTestSuite) TestNewReservation_EmptyTableID_ShouldFail() {
	// Given
	customerID := "customer-123"
	tableID := ""
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := 4

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(reservation)
	assert.Contains(err.Error(), "table ID is required")
}

func (suite *ReservationTestSuite) TestNewReservation_PastDateTime_ShouldFail() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	pastTime := time.Now().Add(-2 * time.Hour)
	partySize := 4

	// When
	reservation, err := NewReservation(customerID, tableID, pastTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(reservation)
	assert.Contains(err.Error(), "reservation date must be in the future")
}

func (suite *ReservationTestSuite) TestNewReservation_ZeroPartySize_ShouldFail() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := 0

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(reservation)
	assert.Contains(err.Error(), "party size must be positive")
}

func (suite *ReservationTestSuite) TestNewReservation_NegativePartySize_ShouldFail() {
	// Given
	customerID := "customer-123"
	tableID := "table-5"
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := -1

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(reservation)
	assert.Contains(err.Error(), "party size must be positive")
}

// Test Status Transitions
func (suite *ReservationTestSuite) TestConfirm_FromPending_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	assert.Equal(suite.T(), StatusPending, reservation.Status)
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.Confirm()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusConfirmed, reservation.Status)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestConfirm_FromCancelled_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusCancelled

	// When
	err := reservation.Confirm()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot confirm a cancelled reservation")
	assert.Equal(StatusCancelled, reservation.Status)
}

func (suite *ReservationTestSuite) TestCancel_FromPending_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	assert.Equal(suite.T(), StatusPending, reservation.Status)
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusCancelled, reservation.Status)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestCancel_FromConfirmed_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusConfirmed

	// When
	err := reservation.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusCancelled, reservation.Status)
}

func (suite *ReservationTestSuite) TestCancel_FromCompleted_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusCompleted

	// When
	err := reservation.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot cancel a completed reservation")
	assert.Equal(StatusCompleted, reservation.Status)
}

func (suite *ReservationTestSuite) TestComplete_FromConfirmed_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusConfirmed
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.Complete()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusCompleted, reservation.Status)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestComplete_FromPending_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	assert.Equal(suite.T(), StatusPending, reservation.Status)

	// When
	err := reservation.Complete()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "only confirmed reservations can be completed")
	assert.Equal(StatusPending, reservation.Status)
}

func (suite *ReservationTestSuite) TestComplete_FromCancelled_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusCancelled

	// When
	err := reservation.Complete()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "only confirmed reservations can be completed")
	assert.Equal(StatusCancelled, reservation.Status)
}

func (suite *ReservationTestSuite) TestMarkNoShow_FromConfirmed_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusConfirmed
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.MarkNoShow()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusNoShow, reservation.Status)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestMarkNoShow_FromPending_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	assert.Equal(suite.T(), StatusPending, reservation.Status)

	// When
	err := reservation.MarkNoShow()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(StatusNoShow, reservation.Status)
}

func (suite *ReservationTestSuite) TestMarkNoShow_FromCompleted_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusCompleted

	// When
	err := reservation.MarkNoShow()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "only confirmed or pending reservations can be marked as no show")
	assert.Equal(StatusCompleted, reservation.Status)
}

func (suite *ReservationTestSuite) TestMarkNoShow_FromCancelled_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	reservation.Status = StatusCancelled

	// When
	err := reservation.MarkNoShow()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "only confirmed or pending reservations can be marked as no show")
	assert.Equal(StatusCancelled, reservation.Status)
}

// Test Update Operations
func (suite *ReservationTestSuite) TestUpdatePartySize_ValidSize_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	newPartySize := 6
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.UpdatePartySize(newPartySize)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newPartySize, reservation.PartySize)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestUpdatePartySize_ZeroSize_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	originalPartySize := reservation.PartySize

	// When
	err := reservation.UpdatePartySize(0)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "party size must be positive")
	assert.Equal(originalPartySize, reservation.PartySize)
}

func (suite *ReservationTestSuite) TestUpdatePartySize_NegativeSize_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	originalPartySize := reservation.PartySize

	// When
	err := reservation.UpdatePartySize(-1)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "party size must be positive")
	assert.Equal(originalPartySize, reservation.PartySize)
}

func (suite *ReservationTestSuite) TestUpdateTable_ValidTableID_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	newTableID := "table-10"
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.UpdateTable(newTableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newTableID, reservation.TableID)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestUpdateTable_EmptyTableID_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	originalTableID := reservation.TableID

	// When
	err := reservation.UpdateTable("")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "table ID is required")
	assert.Equal(originalTableID, reservation.TableID)
}

func (suite *ReservationTestSuite) TestUpdateDateTime_FutureDateTime_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	newDateTime := time.Now().Add(4 * time.Hour)
	oldUpdatedAt := reservation.UpdatedAt

	// When
	err := reservation.UpdateDateTime(newDateTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newDateTime, reservation.DateTime)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestUpdateDateTime_PastDateTime_ShouldFail() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	originalDateTime := reservation.DateTime
	pastDateTime := time.Now().Add(-1 * time.Hour)

	// When
	err := reservation.UpdateDateTime(pastDateTime)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "reservation date must be in the future")
	assert.Equal(originalDateTime, reservation.DateTime)
}

func (suite *ReservationTestSuite) TestAddNotes_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	notes := "Customer has food allergies"
	oldUpdatedAt := reservation.UpdatedAt

	// When
	reservation.AddNotes(notes)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(notes, reservation.Notes)
	assert.True(reservation.UpdatedAt.After(oldUpdatedAt))
}

func (suite *ReservationTestSuite) TestAddNotes_EmptyNotes_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	notes := ""

	// When
	reservation.AddNotes(notes)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(notes, reservation.Notes)
}

// Test Status Transition Validation
func (suite *ReservationTestSuite) TestStatusTransitions_CompleteWorkflow() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	
	// Test complete workflow: PENDING -> CONFIRMED -> COMPLETED
	assert.Equal(suite.T(), StatusPending, reservation.Status)

	// When/Then - Confirm reservation
	err := reservation.Confirm()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusConfirmed, reservation.Status)

	// When/Then - Complete reservation
	err = reservation.Complete()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusCompleted, reservation.Status)
}

func (suite *ReservationTestSuite) TestStatusTransitions_CancelWorkflow() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	
	// Test cancel workflow: PENDING -> CONFIRMED -> CANCELLED
	assert.Equal(suite.T(), StatusPending, reservation.Status)

	// When/Then - Confirm reservation
	err := reservation.Confirm()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusConfirmed, reservation.Status)

	// When/Then - Cancel reservation
	err = reservation.Cancel()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusCancelled, reservation.Status)
}

func (suite *ReservationTestSuite) TestStatusTransitions_NoShowWorkflow() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	
	// Test no-show workflow: PENDING -> CONFIRMED -> NO_SHOW
	assert.Equal(suite.T(), StatusPending, reservation.Status)

	// When/Then - Confirm reservation
	err := reservation.Confirm()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusConfirmed, reservation.Status)

	// When/Then - Mark as no-show
	err = reservation.MarkNoShow()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), StatusNoShow, reservation.Status)
}

// Test Edge Cases and Complex Scenarios
func (suite *ReservationTestSuite) TestMultipleUpdates_Success() {
	// Given
	reservation, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	
	// When - Perform multiple updates
	err := reservation.UpdatePartySize(6)
	assert.NoError(suite.T(), err)
	
	err = reservation.UpdateTable("table-10")
	assert.NoError(suite.T(), err)
	
	newDateTime := time.Now().Add(3 * time.Hour)
	err = reservation.UpdateDateTime(newDateTime)
	assert.NoError(suite.T(), err)
	
	reservation.AddNotes("VIP customer")

	// Then
	assert := assert.New(suite.T())
	assert.Equal(6, reservation.PartySize)
	assert.Equal("table-10", reservation.TableID)
	assert.Equal(newDateTime, reservation.DateTime)
	assert.Equal("VIP customer", reservation.Notes)
}

func (suite *ReservationTestSuite) TestStatusConstants() {
	// Test that all status constants are defined correctly
	assert := assert.New(suite.T())
	assert.Equal(ReservationStatus("PENDING"), StatusPending)
	assert.Equal(ReservationStatus("CONFIRMED"), StatusConfirmed)
	assert.Equal(ReservationStatus("CANCELLED"), StatusCancelled)
	assert.Equal(ReservationStatus("COMPLETED"), StatusCompleted)
	assert.Equal(ReservationStatus("NO_SHOW"), StatusNoShow)
}

func (suite *ReservationTestSuite) TestReservationIDGeneration() {
	// Given/When
	reservation1, _ := NewReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	time.Sleep(1 * time.Millisecond) // Ensure different timestamps
	reservation2, _ := NewReservation("customer-456", "table-6", time.Now().Add(3*time.Hour), 2)

	// Then
	assert := assert.New(suite.T())
	assert.NotEqual(reservation1.ID, reservation2.ID)
	assert.True(strings.HasPrefix(string(reservation1.ID), "res_"))
	assert.True(strings.HasPrefix(string(reservation2.ID), "res_"))
}

// Test Business Rule Validations
func (suite *ReservationTestSuite) TestBusinessRules_LargePartySize() {
	// Given - Test with very large party size
	customerID := "customer-123"
	tableID := "table-5"
	futureTime := time.Now().Add(2 * time.Hour)
	partySize := 100

	// When
	reservation, err := NewReservation(customerID, tableID, futureTime, partySize)

	// Then - Should succeed (business rules about max party size would be in service layer)
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(reservation)
	assert.Equal(partySize, reservation.PartySize)
}

func (suite *ReservationTestSuite) TestBusinessRules_FarFutureDateTime() {
	// Given - Test with reservation far in the future
	customerID := "customer-123"
	tableID := "table-5"
	farFutureTime := time.Now().Add(365 * 24 * time.Hour) // 1 year from now
	partySize := 4

	// When
	reservation, err := NewReservation(customerID, tableID, farFutureTime, partySize)

	// Then - Should succeed (business rules about max advance booking would be in service layer)
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(reservation)
	assert.Equal(farFutureTime, reservation.DateTime)
}