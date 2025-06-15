package infrastructure

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
)

// MovementRepositoryTestSuite tests movement repository operations
type MovementRepositoryTestSuite struct {
	suite.Suite
	repo *TestInventoryRepository
	db   *DB
	ctx  context.Context
}

func TestMovementRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(MovementRepositoryTestSuite))
}

func (suite *MovementRepositoryTestSuite) SetupTest() {
	// Create in-memory SQLite database
	db, err := NewTestDB()
	suite.Require().NoError(err)
	
	suite.db = db
	suite.repo = NewTestInventoryRepository(db)
	suite.ctx = context.Background()
	
	// Create test data
	suite.createTestItem()
}

func (suite *MovementRepositoryTestSuite) TearDownTest() {
	suite.db.Close()
}

func (suite *MovementRepositoryTestSuite) createTestItem() *inventory.InventoryItem {
	item, err := inventory.NewInventoryItem("TEST001", "Test Item", 100, inventory.UnitTypeUnits, 10.0)
	suite.Require().NoError(err)
	
	err = suite.repo.CreateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	return item
}

func (suite *MovementRepositoryTestSuite) TestCreateMovement_Success() {
	// Given
	item := suite.createTestItem()
	movement := &inventory.InventoryMovement{
		ID:         inventory.NewMovementID(),
		ItemID:     item.ID,
		Type:       inventory.MovementTypeInbound,
		Quantity:   50,
		Unit:       item.Unit,
		Cost:       500,
		Reason:     "Purchase order",
		Reference:  "PO-12345",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	
	// When
	err := suite.repo.CreateMovement(suite.ctx, movement)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify movement was created
	movements, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 10, 0)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), movements, 1)
	assert.Equal(suite.T(), movement.ID, movements[0].ID)
	assert.Equal(suite.T(), movement.Quantity, movements[0].Quantity)
}

func (suite *MovementRepositoryTestSuite) TestGetMovementByID_Success() {
	// Given
	item := suite.createTestItem()
	movement := &inventory.InventoryMovement{
		ID:         inventory.NewMovementID(),
		ItemID:     item.ID,
		Type:       inventory.MovementTypeOutbound,
		Quantity:   20,
		Unit:       item.Unit,
		Cost:       200,
		Reason:     "Order fulfillment",
		Reference:  "ORDER-789",
		PerformedBy: "user_456",
		PerformedAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	
	err := suite.repo.CreateMovement(suite.ctx, movement)
	suite.Require().NoError(err)
	
	// When
	retrieved, err := suite.repo.GetMovementByID(suite.ctx, movement.ID)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), retrieved)
	assert.Equal(suite.T(), movement.ID, retrieved.ID)
	assert.Equal(suite.T(), movement.Type, retrieved.Type)
	assert.Equal(suite.T(), movement.Quantity, retrieved.Quantity)
	assert.Equal(suite.T(), movement.Reference, retrieved.Reference)
}

func (suite *MovementRepositoryTestSuite) TestGetMovementByID_NotFound() {
	// Given
	nonExistentID := inventory.NewMovementID()
	
	// When
	movement, err := suite.repo.GetMovementByID(suite.ctx, nonExistentID)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.Contains(suite.T(), err.Error(), "not found")
}

func (suite *MovementRepositoryTestSuite) TestGetMovementsByItemID_Pagination() {
	// Given
	item := suite.createTestItem()
	
	// Create multiple movements
	for i := 0; i < 15; i++ {
		movement := &inventory.InventoryMovement{
			ID:         inventory.NewMovementID(),
			ItemID:     item.ID,
			Type:       inventory.MovementTypeAdjustment,
			Quantity:   float64(i + 1),
			Unit:       item.Unit,
			Cost:       float64((i + 1) * 10),
			Reason:     "Adjustment",
			PerformedBy: "user_123",
			PerformedAt: time.Now().Add(time.Duration(i) * time.Hour),
			CreatedAt:  time.Now().Add(time.Duration(i) * time.Hour),
		}
		err := suite.repo.CreateMovement(suite.ctx, movement)
		suite.Require().NoError(err)
	}
	
	// When - First page
	page1, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 10, 0)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), page1, 10)
	
	// When - Second page
	page2, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 10, 10)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), page2, 5)
	
	// Verify ordering (newest first)
	for i := 1; i < len(page1); i++ {
		assert.True(suite.T(), page1[i-1].PerformedAt.After(page1[i].PerformedAt))
	}
}

func (suite *MovementRepositoryTestSuite) TestGetMovementsByDateRange_Success() {
	// Given
	item := suite.createTestItem()
	now := time.Now()
	
	movements := []struct {
		daysAgo int
		qty     float64
	}{
		{10, 100}, // 10 days ago
		{5, 50},   // 5 days ago
		{2, 30},   // 2 days ago
		{0, 20},   // today
	}
	
	for _, m := range movements {
		movement := &inventory.InventoryMovement{
			ID:         inventory.NewMovementID(),
			ItemID:     item.ID,
			Type:       inventory.MovementTypeInbound,
			Quantity:   m.qty,
			Unit:       item.Unit,
			Cost:       m.qty * 10,
			Reason:     "Test",
			PerformedBy: "user_123",
			PerformedAt: now.AddDate(0, 0, -m.daysAgo),
			CreatedAt:  now.AddDate(0, 0, -m.daysAgo),
		}
		err := suite.repo.CreateMovement(suite.ctx, movement)
		suite.Require().NoError(err)
	}
	
	// When - Get movements from last week
	startDate := now.AddDate(0, 0, -7)
	endDate := now.AddDate(0, 0, 1) // Include today
	
	result, err := suite.repo.GetMovementsByDateRange(suite.ctx, startDate, endDate)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), result, 3) // Should include movements from 5, 2, and 0 days ago
	
	// Verify all movements are within date range
	for _, m := range result {
		assert.True(suite.T(), m.PerformedAt.After(startDate) || m.PerformedAt.Equal(startDate))
		assert.True(suite.T(), m.PerformedAt.Before(endDate))
	}
}

func (suite *MovementRepositoryTestSuite) TestGetMovementsByType_Success() {
	// Given
	item := suite.createTestItem()
	
	// Create movements of different types
	types := []inventory.MovementType{
		inventory.MovementTypeInbound,
		inventory.MovementTypeInbound,
		inventory.MovementTypeOutbound,
		inventory.MovementTypeAdjustment,
		inventory.MovementTypeOutbound,
	}
	
	for i, mt := range types {
		movement := &inventory.InventoryMovement{
			ID:         inventory.NewMovementID(),
			ItemID:     item.ID,
			Type:       mt,
			Quantity:   float64(i + 1) * 10,
			Unit:       item.Unit,
			Cost:       float64(i + 1) * 100,
			Reason:     "Test",
			PerformedBy: "user_123",
			PerformedAt: time.Now(),
			CreatedAt:  time.Now(),
		}
		err := suite.repo.CreateMovement(suite.ctx, movement)
		suite.Require().NoError(err)
	}
	
	// When - Get inbound movements
	inboundMovements, err := suite.repo.GetMovementsByType(suite.ctx, inventory.MovementTypeInbound)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), inboundMovements, 2)
	
	// When - Get outbound movements
	outboundMovements, err := suite.repo.GetMovementsByType(suite.ctx, inventory.MovementTypeOutbound)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), outboundMovements, 2)
	
	// When - Get adjustment movements
	adjustmentMovements, err := suite.repo.GetMovementsByType(suite.ctx, inventory.MovementTypeAdjustment)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), adjustmentMovements, 1)
	
	// Verify all movements have correct type
	for _, m := range inboundMovements {
		assert.Equal(suite.T(), inventory.MovementTypeInbound, m.Type)
	}
}

func (suite *MovementRepositoryTestSuite) TestDeleteMovement_Success() {
	// Given
	item := suite.createTestItem()
	movement := &inventory.InventoryMovement{
		ID:         inventory.NewMovementID(),
		ItemID:     item.ID,
		Type:       inventory.MovementTypeAdjustment,
		Quantity:   25,
		Unit:       item.Unit,
		Cost:       250,
		Reason:     "Test deletion",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	
	err := suite.repo.CreateMovement(suite.ctx, movement)
	suite.Require().NoError(err)
	
	// When
	err = suite.repo.DeleteMovement(suite.ctx, movement.ID)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify movement was deleted
	deleted, err := suite.repo.GetMovementByID(suite.ctx, movement.ID)
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), deleted)
}

func (suite *MovementRepositoryTestSuite) TestDeleteMovement_NotFound() {
	// Given
	nonExistentID := inventory.NewMovementID()
	
	// When
	err := suite.repo.DeleteMovement(suite.ctx, nonExistentID)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "not found")
}