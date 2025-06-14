package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	_ "github.com/mattn/go-sqlite3"

	reservation "github.com/restaurant-platform/reservation-service/internal/domain"
)

// ReservationRepositoryTestSuite contains all repository tests
type ReservationRepositoryTestSuite struct {
	suite.Suite
	db     *DB
	repo   *ReservationRepository
	ctx    context.Context
}

func TestReservationRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(ReservationRepositoryTestSuite))
}

func (suite *ReservationRepositoryTestSuite) SetupTest() {
	// Create in-memory SQLite database
	sqlDB, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		suite.T().Fatalf("Failed to open SQLite database: %v", err)
	}

	// Create DB wrapper
	suite.db = &DB{sqlDB}
	suite.repo = NewReservationRepository(suite.db)
	suite.ctx = context.Background()

	// Create table schema
	suite.createSchema()
}

func (suite *ReservationRepositoryTestSuite) TearDownTest() {
	if suite.db != nil && suite.db.DB != nil {
		suite.db.Close()
	}
}

func (suite *ReservationRepositoryTestSuite) createSchema() {
	schema := `
	CREATE TABLE reservations (
		id TEXT PRIMARY KEY,
		customer_id TEXT NOT NULL,
		table_id TEXT NOT NULL,
		date_time DATETIME NOT NULL,
		party_size INTEGER NOT NULL,
		status TEXT NOT NULL,
		notes TEXT DEFAULT '',
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL
	);
	`
	_, err := suite.db.Exec(schema)
	if err != nil {
		suite.T().Fatalf("Failed to create schema: %v", err)
	}
}

func (suite *ReservationRepositoryTestSuite) createTestReservation(customerID, tableID string, dateTime time.Time, partySize int) *reservation.Reservation {
	res, err := reservation.NewReservation(customerID, tableID, dateTime, partySize)
	if err != nil {
		suite.T().Fatalf("Failed to create test reservation: %v", err)
	}
	// Sleep to ensure unique IDs
	time.Sleep(1 * time.Millisecond)
	return res
}

// Test Create
func (suite *ReservationRepositoryTestSuite) TestCreate_Success() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)

	// When
	err := suite.repo.Create(suite.ctx, res)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify it was created
	retrieved, err := suite.repo.GetByID(suite.ctx, res.ID)
	assert.NoError(err)
	assert.Equal(res.ID, retrieved.ID)
	assert.Equal(res.CustomerID, retrieved.CustomerID)
	assert.Equal(res.TableID, retrieved.TableID)
	assert.Equal(res.PartySize, retrieved.PartySize)
	assert.Equal(res.Status, retrieved.Status)
}

func (suite *ReservationRepositoryTestSuite) TestCreate_DuplicateID_ShouldFail() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)

	// When - Create first time
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// When - Create second time with same ID
	err = suite.repo.Create(suite.ctx, res)

	// Then
	assert.Error(suite.T(), err)
}

// Test GetByID
func (suite *ReservationRepositoryTestSuite) TestGetByID_Success() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// When
	retrieved, err := suite.repo.GetByID(suite.ctx, res.ID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(retrieved)
	assert.Equal(res.ID, retrieved.ID)
	assert.Equal(res.CustomerID, retrieved.CustomerID)
	assert.Equal(res.TableID, retrieved.TableID)
	assert.Equal(res.PartySize, retrieved.PartySize)
	assert.Equal(res.Status, retrieved.Status)
	assert.Equal(res.Notes, retrieved.Notes)
}

func (suite *ReservationRepositoryTestSuite) TestGetByID_NotFound_ShouldFail() {
	// Given
	nonExistentID := reservation.ReservationID("res_nonexistent")

	// When
	retrieved, err := suite.repo.GetByID(suite.ctx, nonExistentID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(retrieved)
	assert.Contains(err.Error(), "reservation not found")
}

// Test Update
func (suite *ReservationRepositoryTestSuite) TestUpdate_Success() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// Modify the reservation
	originalUpdatedAt := res.UpdatedAt
	res.PartySize = 6
	res.TableID = "table-10"
	res.Status = reservation.StatusConfirmed
	res.Notes = "VIP customer"
	res.UpdatedAt = time.Now()

	// When
	err = suite.repo.Update(suite.ctx, res)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify the update
	retrieved, err := suite.repo.GetByID(suite.ctx, res.ID)
	assert.NoError(err)
	assert.Equal(6, retrieved.PartySize)
	assert.Equal("table-10", retrieved.TableID)
	assert.Equal(reservation.StatusConfirmed, retrieved.Status)
	assert.Equal("VIP customer", retrieved.Notes)
	assert.True(retrieved.UpdatedAt.After(originalUpdatedAt))
}

func (suite *ReservationRepositoryTestSuite) TestUpdate_NonExistent_ShouldSucceed() {
	// Given - non-existent reservation
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)

	// When - Try to update without creating first
	err := suite.repo.Update(suite.ctx, res)

	// Then - Should succeed but affect 0 rows (SQLite behavior)
	assert.NoError(suite.T(), err)
}

// Test Delete
func (suite *ReservationRepositoryTestSuite) TestDelete_Success() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// When
	err = suite.repo.Delete(suite.ctx, res.ID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify it was deleted
	retrieved, err := suite.repo.GetByID(suite.ctx, res.ID)
	assert.Error(err)
	assert.Nil(retrieved)
}

func (suite *ReservationRepositoryTestSuite) TestDelete_NonExistent_ShouldSucceed() {
	// Given
	nonExistentID := reservation.ReservationID("res_nonexistent")

	// When
	err := suite.repo.Delete(suite.ctx, nonExistentID)

	// Then - Should succeed but affect 0 rows
	assert.NoError(suite.T(), err)
}

// Test List
func (suite *ReservationRepositoryTestSuite) TestList_Success() {
	// Given - Create multiple reservations
	res1 := suite.createTestReservation("customer-1", "table-1", time.Now().Add(1*time.Hour), 2)
	res2 := suite.createTestReservation("customer-2", "table-2", time.Now().Add(2*time.Hour), 4)
	res3 := suite.createTestReservation("customer-3", "table-3", time.Now().Add(3*time.Hour), 6)

	err := suite.repo.Create(suite.ctx, res1)
	assert.NoError(suite.T(), err)
	time.Sleep(1 * time.Millisecond) // Ensure different created_at times
	err = suite.repo.Create(suite.ctx, res2)
	assert.NoError(suite.T(), err)
	time.Sleep(1 * time.Millisecond)
	err = suite.repo.Create(suite.ctx, res3)
	assert.NoError(suite.T(), err)

	// When
	reservations, total, err := suite.repo.List(suite.ctx, 0, 10)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(3, total)
	assert.Len(reservations, 3)
	// Should be ordered by created_at DESC, so res3 should be first
	assert.Equal(res3.ID, reservations[0].ID)
	assert.Equal(res2.ID, reservations[1].ID)
	assert.Equal(res1.ID, reservations[2].ID)
}

func (suite *ReservationRepositoryTestSuite) TestList_WithPagination() {
	// Given - Create multiple reservations
	reservations := make([]*reservation.Reservation, 5)
	for i := 0; i < 5; i++ {
		res := suite.createTestReservation(
			fmt.Sprintf("customer-%d", i),
			fmt.Sprintf("table-%d", i),
			time.Now().Add(time.Duration(i+1)*time.Hour), // Ensure future time
			2,
		)
		err := suite.repo.Create(suite.ctx, res)
		assert.NoError(suite.T(), err)
		reservations[i] = res
		time.Sleep(1 * time.Millisecond) // Ensure different created_at times
	}

	// When - Get first page
	firstPage, total, err := suite.repo.List(suite.ctx, 0, 2)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(5, total)
	assert.Len(firstPage, 2)

	// When - Get second page
	secondPage, total, err := suite.repo.List(suite.ctx, 2, 2)

	// Then
	assert.NoError(err)
	assert.Equal(5, total)
	assert.Len(secondPage, 2)

	// When - Get third page
	thirdPage, total, err := suite.repo.List(suite.ctx, 4, 2)

	// Then
	assert.NoError(err)
	assert.Equal(5, total)
	assert.Len(thirdPage, 1) // Only one remaining
}

func (suite *ReservationRepositoryTestSuite) TestList_EmptyResult() {
	// When - No reservations exist
	reservations, total, err := suite.repo.List(suite.ctx, 0, 10)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(0, total)
	assert.Len(reservations, 0)
}

// Test FindByCustomer
func (suite *ReservationRepositoryTestSuite) TestFindByCustomer_Success() {
	// Given
	customerID := "customer-123"
	res1 := suite.createTestReservation(customerID, "table-1", time.Now().Add(1*time.Hour), 2)
	res2 := suite.createTestReservation(customerID, "table-2", time.Now().Add(2*time.Hour), 4)
	res3 := suite.createTestReservation("other-customer", "table-3", time.Now().Add(3*time.Hour), 6)

	err := suite.repo.Create(suite.ctx, res1)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res2)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res3)
	assert.NoError(suite.T(), err)

	// When
	reservations, err := suite.repo.FindByCustomer(suite.ctx, customerID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(reservations, 2)
	// Should be ordered by date_time DESC
	assert.Equal(res2.ID, reservations[0].ID) // Later date first
	assert.Equal(res1.ID, reservations[1].ID)
}

func (suite *ReservationRepositoryTestSuite) TestFindByCustomer_NoResults() {
	// Given
	res := suite.createTestReservation("customer-123", "table-1", time.Now().Add(1*time.Hour), 2)
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// When
	reservations, err := suite.repo.FindByCustomer(suite.ctx, "nonexistent-customer")

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(reservations, 0)
}

// Test FindByDateRange
func (suite *ReservationRepositoryTestSuite) TestFindByDateRange_Success() {
	// Given
	baseTime := time.Now().Add(24 * time.Hour).Truncate(time.Hour) // Tomorrow at hour boundary
	res1 := suite.createTestReservation("customer-1", "table-1", baseTime.Add(1*time.Hour), 2)    // In range
	res2 := suite.createTestReservation("customer-2", "table-2", baseTime.Add(2*time.Hour), 4)    // In range
	res3 := suite.createTestReservation("customer-3", "table-3", baseTime.Add(10*time.Hour), 6)   // Out of range

	err := suite.repo.Create(suite.ctx, res1)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res2)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res3)
	assert.NoError(suite.T(), err)

	// When
	startTime := baseTime
	endTime := baseTime.Add(5 * time.Hour)
	reservations, err := suite.repo.FindByDateRange(suite.ctx, startTime, endTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(reservations, 2)
	// Should be ordered by date_time ASC
	assert.Equal(res1.ID, reservations[0].ID)
	assert.Equal(res2.ID, reservations[1].ID)
}

func (suite *ReservationRepositoryTestSuite) TestFindByDateRange_NoResults() {
	// Given
	res := suite.createTestReservation("customer-123", "table-1", time.Now().Add(1*time.Hour), 2)
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// When - Search in different time range
	startTime := time.Now().Add(10 * time.Hour)
	endTime := time.Now().Add(15 * time.Hour)
	reservations, err := suite.repo.FindByDateRange(suite.ctx, startTime, endTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(reservations, 0)
}

// Test FindByTableAndDateRange
func (suite *ReservationRepositoryTestSuite) TestFindByTableAndDateRange_Success() {
	// Given
	tableID := "table-5"
	baseTime := time.Now().Add(24 * time.Hour).Truncate(time.Hour)
	res1 := suite.createTestReservation("customer-1", tableID, baseTime.Add(1*time.Hour), 2)        // Match
	res2 := suite.createTestReservation("customer-2", tableID, baseTime.Add(2*time.Hour), 4)        // Match
	res3 := suite.createTestReservation("customer-3", "other-table", baseTime.Add(1*time.Hour), 6)  // Different table
	res4 := suite.createTestReservation("customer-4", tableID, baseTime.Add(10*time.Hour), 2)       // Out of range

	err := suite.repo.Create(suite.ctx, res1)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res2)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res3)
	assert.NoError(suite.T(), err)
	err = suite.repo.Create(suite.ctx, res4)
	assert.NoError(suite.T(), err)

	// When
	startTime := baseTime
	endTime := baseTime.Add(5 * time.Hour)
	reservations, err := suite.repo.FindByTableAndDateRange(suite.ctx, tableID, startTime, endTime)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(reservations, 2)
	// Should be ordered by date_time ASC
	assert.Equal(res1.ID, reservations[0].ID)
	assert.Equal(res2.ID, reservations[1].ID)
}

// Test FindAvailableTables
func (suite *ReservationRepositoryTestSuite) TestFindAvailableTables_Success() {
	// Given
	requestTime := time.Now().Add(24 * time.Hour).Truncate(time.Hour)
	duration := 2 * time.Hour

	// Create reservation that overlaps with requested time
	conflictRes := suite.createTestReservation("customer-1", "table1", requestTime.Add(30*time.Minute), 4)
	err := suite.repo.Create(suite.ctx, conflictRes)
	assert.NoError(suite.T(), err)
	// Update to confirmed status
	conflictRes.Status = reservation.StatusConfirmed
	err = suite.repo.Update(suite.ctx, conflictRes)
	assert.NoError(suite.T(), err)

	// Create cancelled reservation (should not conflict)
	cancelledRes := suite.createTestReservation("customer-2", "table2", requestTime.Add(30*time.Minute), 4)
	err = suite.repo.Create(suite.ctx, cancelledRes)
	assert.NoError(suite.T(), err)
	// Update to cancelled status
	cancelledRes.Status = reservation.StatusCancelled
	err = suite.repo.Update(suite.ctx, cancelledRes)
	assert.NoError(suite.T(), err)

	// When
	availableTables, err := suite.repo.FindAvailableTables(suite.ctx, requestTime, duration, 4)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(availableTables)
	
	
	// table1 should be occupied, table2 should be available (cancelled reservation)
	assert.NotContains(availableTables, "table1")
	assert.Contains(availableTables, "table2")
}

func (suite *ReservationRepositoryTestSuite) TestFindAvailableTables_AllAvailable() {
	// Given - No conflicting reservations
	requestTime := time.Now().Add(24 * time.Hour)
	duration := 2 * time.Hour

	// When
	availableTables, err := suite.repo.FindAvailableTables(suite.ctx, requestTime, duration, 4)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(availableTables)
	// All mock tables should be available
	expectedTables := []string{"table1", "table2", "table3", "table4", "table5"}
	assert.ElementsMatch(expectedTables, availableTables)
}

// Test Complex Scenarios
func (suite *ReservationRepositoryTestSuite) TestComplexWorkflow_CreateUpdateDelete() {
	// Given
	res := suite.createTestReservation("customer-123", "table-5", time.Now().Add(2*time.Hour), 4)

	// Step 1: Create
	err := suite.repo.Create(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// Step 2: Update
	res.Status = reservation.StatusConfirmed
	res.PartySize = 6
	res.UpdatedAt = time.Now()
	err = suite.repo.Update(suite.ctx, res)
	assert.NoError(suite.T(), err)

	// Verify update
	retrieved, err := suite.repo.GetByID(suite.ctx, res.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), reservation.StatusConfirmed, retrieved.Status)
	assert.Equal(suite.T(), 6, retrieved.PartySize)

	// Step 3: Delete
	err = suite.repo.Delete(suite.ctx, res.ID)
	assert.NoError(suite.T(), err)

	// Verify deletion
	retrieved, err = suite.repo.GetByID(suite.ctx, res.ID)
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), retrieved)
}

func (suite *ReservationRepositoryTestSuite) TestMultipleCustomersAndTables() {
	// Given - Create reservations for multiple customers and tables
	customers := []string{"customer-1", "customer-2", "customer-3"}
	tables := []string{"table-1", "table-2", "table-3"}
	baseTime := time.Now().Add(24 * time.Hour)

	var allReservations []*reservation.Reservation
	for i, customer := range customers {
		for j, table := range tables {
			res := suite.createTestReservation(
				customer,
				table,
				baseTime.Add(time.Duration(i*3+j)*time.Hour),
				2+i,
			)
			err := suite.repo.Create(suite.ctx, res)
			assert.NoError(suite.T(), err)
			allReservations = append(allReservations, res)
		}
	}

	// Test FindByCustomer for each customer
	for _, customer := range customers {
		reservations, err := suite.repo.FindByCustomer(suite.ctx, customer)
		assert.NoError(suite.T(), err)
		assert.Len(suite.T(), reservations, 3) // Each customer has 3 reservations
		
		// Verify all reservations belong to this customer
		for _, res := range reservations {
			assert.Equal(suite.T(), customer, res.CustomerID)
		}
	}

	// Test FindByTableAndDateRange for each table
	for _, table := range tables {
		reservations, err := suite.repo.FindByTableAndDateRange(
			suite.ctx,
			table,
			baseTime,
			baseTime.Add(24*time.Hour),
		)
		assert.NoError(suite.T(), err)
		assert.Len(suite.T(), reservations, 3) // Each table has 3 reservations
		
		// Verify all reservations belong to this table
		for _, res := range reservations {
			assert.Equal(suite.T(), table, res.TableID)
		}
	}

	// Test List with all reservations
	allFromRepo, total, err := suite.repo.List(suite.ctx, 0, 20)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 9, total) // 3 customers × 3 tables = 9 reservations
	assert.Len(suite.T(), allFromRepo, 9)
}

