package infrastructure

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/kitchen-service/internal/domain"

	_ "github.com/mattn/go-sqlite3"
)

// KitchenOrderRepositoryTestSuite contains all repository tests
type KitchenOrderRepositoryTestSuite struct {
	suite.Suite
	db   *sql.DB
	repo *KitchenOrderRepository
	ctx  context.Context
}

func TestKitchenOrderRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(KitchenOrderRepositoryTestSuite))
}

func (suite *KitchenOrderRepositoryTestSuite) SetupSuite() {
	// Create in-memory SQLite database for testing
	db, err := sql.Open("sqlite3", ":memory:")
	suite.Require().NoError(err)

	suite.db = db
	suite.repo = NewKitchenOrderRepository(db)
	suite.ctx = context.Background()

	// Create table schema
	suite.createSchema()
}

func (suite *KitchenOrderRepositoryTestSuite) TearDownSuite() {
	if suite.db != nil {
		suite.db.Close()
	}
}

func (suite *KitchenOrderRepositoryTestSuite) SetupTest() {
	// Clean up data before each test
	suite.db.Exec("DELETE FROM kitchen_orders")
}

func (suite *KitchenOrderRepositoryTestSuite) createSchema() {
	// Create kitchen_orders table using SQLite syntax
	schema := `
		CREATE TABLE kitchen_orders (
			id TEXT PRIMARY KEY,
			order_id TEXT NOT NULL,
			table_id TEXT,
			status TEXT NOT NULL,
			items TEXT NOT NULL, -- JSON text for SQLite
			priority TEXT NOT NULL,
			assigned_station TEXT,
			estimated_time INTEGER NOT NULL, -- seconds
			started_at DATETIME,
			completed_at DATETIME,
			notes TEXT,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL
		)`

	_, err := suite.db.Exec(schema)
	suite.Require().NoError(err)
}

// Test Save operation
func (suite *KitchenOrderRepositoryTestSuite) TestSave_Success() {
	// Given
	order, err := domain.NewKitchenOrder("order-123", "table-5")
	suite.Require().NoError(err)
	order.AddItem("item-1", "Caesar Salad", 2, 15*time.Minute, []string{"no croutons"}, "extra dressing")

	// When
	err = suite.repo.Save(suite.ctx, order)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify the order was saved
	savedOrder, err := suite.repo.FindByID(suite.ctx, order.ID)
	assert.NoError(err)
	assert.NotNil(savedOrder)
	assert.Equal(order.OrderID, savedOrder.OrderID)
	assert.Equal(order.TableID, savedOrder.TableID)
	assert.Equal(order.Status, savedOrder.Status)
	assert.Len(savedOrder.Items, 1)
	assert.Equal("Caesar Salad", savedOrder.Items[0].Name)
}

func (suite *KitchenOrderRepositoryTestSuite) TestSave_DuplicateID_ShouldFail() {
	// Given
	order1, _ := domain.NewKitchenOrder("order-123", "table-5")
	order2, _ := domain.NewKitchenOrder("order-456", "table-6")
	order2.ID = order1.ID // Force duplicate ID

	// When - Save first order
	err1 := suite.repo.Save(suite.ctx, order1)
	// Then - Save second order with same ID should fail
	err2 := suite.repo.Save(suite.ctx, order2)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err1)
	assert.Error(err2)
}

// Test FindByID operation
func (suite *KitchenOrderRepositoryTestSuite) TestFindByID_Success() {
	// Given
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	order.SetPriority(domain.KitchenPriorityHigh)
	order.AddItem("item-1", "Burger", 1, 20*time.Minute, nil, "")
	suite.repo.Save(suite.ctx, order)

	// When
	foundOrder, err := suite.repo.FindByID(suite.ctx, order.ID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(foundOrder)
	assert.Equal(order.ID, foundOrder.ID)
	assert.Equal(order.OrderID, foundOrder.OrderID)
	assert.Equal(order.Priority, foundOrder.Priority)
	assert.Len(foundOrder.Items, 1)
	assert.Equal("Burger", foundOrder.Items[0].Name)
}

func (suite *KitchenOrderRepositoryTestSuite) TestFindByID_NotFound_ShouldFail() {
	// Given
	nonExistentID := domain.KitchenOrderID("non-existent")

	// When
	foundOrder, err := suite.repo.FindByID(suite.ctx, nonExistentID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(foundOrder)
}

// Test FindByOrderID operation
func (suite *KitchenOrderRepositoryTestSuite) TestFindByOrderID_Success() {
	// Given
	orderID := "order-123"
	order, _ := domain.NewKitchenOrder(orderID, "table-5")
	suite.repo.Save(suite.ctx, order)

	// When
	foundOrder, err := suite.repo.FindByOrderID(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(foundOrder)
	assert.Equal(orderID, foundOrder.OrderID)
	assert.Equal(order.ID, foundOrder.ID)
}

func (suite *KitchenOrderRepositoryTestSuite) TestFindByOrderID_NotFound_ShouldFail() {
	// Given
	nonExistentOrderID := "non-existent-order"

	// When
	foundOrder, err := suite.repo.FindByOrderID(suite.ctx, nonExistentOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(foundOrder)
}

// Test Update operation
func (suite *KitchenOrderRepositoryTestSuite) TestUpdate_Success() {
	// Given
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	order.AddItem("item-1", "Pizza", 1, 25*time.Minute, nil, "")
	err := suite.repo.Save(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Verify the order was saved and can be found
	savedOrder, err := suite.repo.FindByID(suite.ctx, order.ID)
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), savedOrder)

	// Modify the saved order (not the original)
	savedOrder.SetPriority(domain.KitchenPriorityUrgent)
	savedOrder.AssignToStation("pizza-station")
	err = savedOrder.UpdateStatus(domain.KitchenOrderStatusPreparing)
	assert.NoError(suite.T(), err)


	// When
	err = suite.repo.Update(suite.ctx, savedOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify the changes were persisted
	updatedOrder, err := suite.repo.FindByID(suite.ctx, savedOrder.ID)
	assert.NoError(err)
	assert.Equal(domain.KitchenPriorityUrgent, updatedOrder.Priority)
	assert.Equal("pizza-station", updatedOrder.AssignedStation)
	assert.Equal(domain.KitchenOrderStatusPreparing, updatedOrder.Status)
	assert.False(updatedOrder.StartedAt.IsZero())
}

func (suite *KitchenOrderRepositoryTestSuite) TestUpdate_NotFound_ShouldFail() {
	// Given
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	// Don't save the order, so it won't exist

	// When
	err := suite.repo.Update(suite.ctx, order)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
}

// Test Delete operation
func (suite *KitchenOrderRepositoryTestSuite) TestDelete_Success() {
	// Given
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	suite.repo.Save(suite.ctx, order)

	// When
	err := suite.repo.Delete(suite.ctx, order.ID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify the order was deleted
	_, err = suite.repo.FindByID(suite.ctx, order.ID)
	assert.Error(err)
}

func (suite *KitchenOrderRepositoryTestSuite) TestDelete_NotFound_ShouldFail() {
	// Given
	nonExistentID := domain.KitchenOrderID("non-existent")

	// When
	err := suite.repo.Delete(suite.ctx, nonExistentID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
}

// Test FindByStatus operation
func (suite *KitchenOrderRepositoryTestSuite) TestFindByStatus_Success() {
	// Given - Create orders with different statuses
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.UpdateStatus(domain.KitchenOrderStatusPreparing)
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.UpdateStatus(domain.KitchenOrderStatusPreparing)
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	// Keep as NEW status

	suite.repo.Save(suite.ctx, order1)
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)

	// When
	preparingOrders, err := suite.repo.FindByStatus(suite.ctx, domain.KitchenOrderStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(preparingOrders, 2)
	
	// Verify orders are sorted by created_at ASC
	assert.Equal("order-1", preparingOrders[0].OrderID)
	assert.Equal("order-2", preparingOrders[1].OrderID)
}

func (suite *KitchenOrderRepositoryTestSuite) TestFindByStatus_NoResults() {
	// Given - Create orders with different statuses
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	suite.repo.Save(suite.ctx, order1)

	// When - Search for status that doesn't exist
	completedOrders, err := suite.repo.FindByStatus(suite.ctx, domain.KitchenOrderStatusCompleted)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(completedOrders, 0)
}

// Test FindByStation operation
func (suite *KitchenOrderRepositoryTestSuite) TestFindByStation_Success() {
	// Given - Create orders assigned to different stations
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.SetPriority(domain.KitchenPriorityHigh)
	order1.AssignToStation("grill-station")
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.SetPriority(domain.KitchenPriorityUrgent)
	order2.AssignToStation("grill-station")
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	order3.AssignToStation("salad-station")

	suite.repo.Save(suite.ctx, order1)
	time.Sleep(time.Millisecond) // Ensure different created_at times
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)

	// When
	grillOrders, err := suite.repo.FindByStation(suite.ctx, "grill-station")

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(grillOrders, 2)
	
	// Verify orders are sorted by priority DESC, created_at ASC
	assert.Equal(domain.KitchenPriorityUrgent, grillOrders[0].Priority) // order-2 (urgent)
	assert.Equal(domain.KitchenPriorityHigh, grillOrders[1].Priority)   // order-1 (high)
}

// Test FindActive operation
func (suite *KitchenOrderRepositoryTestSuite) TestFindActive_Success() {
	// Given - Create orders with various statuses
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.SetPriority(domain.KitchenPriorityNormal)
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.SetPriority(domain.KitchenPriorityHigh)
	order2.UpdateStatus(domain.KitchenOrderStatusPreparing)
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	order3.UpdateStatus(domain.KitchenOrderStatusPreparing)
	order3.UpdateStatus(domain.KitchenOrderStatusReady)
	order3.UpdateStatus(domain.KitchenOrderStatusCompleted)
	
	order4, _ := domain.NewKitchenOrder("order-4", "table-4")
	order4.Cancel()

	suite.repo.Save(suite.ctx, order1)
	time.Sleep(time.Millisecond)
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)
	suite.repo.Save(suite.ctx, order4)

	// When
	activeOrders, err := suite.repo.FindActive(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(activeOrders, 2) // Only order1 (NEW) and order2 (PREPARING)
	
	// Verify orders are sorted by priority DESC, created_at ASC
	assert.Equal(domain.KitchenPriorityHigh, activeOrders[0].Priority)   // order-2 (high priority)
	assert.Equal(domain.KitchenPriorityNormal, activeOrders[1].Priority) // order-1 (normal priority)
}

// Test List operation with pagination and filters
func (suite *KitchenOrderRepositoryTestSuite) TestList_WithFilters() {
	// Given - Create multiple orders
	now := time.Now()
	
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.SetPriority(domain.KitchenPriorityHigh)
	order1.AssignToStation("grill-station")
	order1.CreatedAt = now.Add(-2 * time.Hour)
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.SetPriority(domain.KitchenPriorityHigh)
	order2.UpdateStatus(domain.KitchenOrderStatusPreparing)
	order2.CreatedAt = now.Add(-1 * time.Hour)
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	order3.SetPriority(domain.KitchenPriorityNormal)
	order3.CreatedAt = now

	suite.repo.Save(suite.ctx, order1)
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)

	// When - Filter by priority
	priority := domain.KitchenPriorityHigh
	filters := domain.KitchenOrderFilters{
		Priority: &priority,
	}
	
	orders, totalCount, err := suite.repo.List(suite.ctx, 0, 10, filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(orders, 2)
	assert.Equal(2, totalCount)
	assert.Equal(domain.KitchenPriorityHigh, orders[0].Priority)
	assert.Equal(domain.KitchenPriorityHigh, orders[1].Priority)
}

func (suite *KitchenOrderRepositoryTestSuite) TestList_WithPagination() {
	// Given - Create multiple orders
	for i := 1; i <= 5; i++ {
		order, _ := domain.NewKitchenOrder(fmt.Sprintf("order-%d", i), fmt.Sprintf("table-%d", i))
		suite.repo.Save(suite.ctx, order)
		time.Sleep(time.Millisecond) // Ensure different created_at times
	}

	// When - Get page 2 with limit 2
	orders, totalCount, err := suite.repo.List(suite.ctx, 2, 2, domain.KitchenOrderFilters{})

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(orders, 2)
	assert.Equal(5, totalCount)
	assert.Equal("order-3", orders[0].OrderID) // Third order
	assert.Equal("order-4", orders[1].OrderID) // Fourth order
}

func (suite *KitchenOrderRepositoryTestSuite) TestList_WithDateFilters() {
	// Given - Create orders at different times
	now := time.Now()
	
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.CreatedAt = now.Add(-3 * time.Hour)
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.CreatedAt = now.Add(-1 * time.Hour)
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	order3.CreatedAt = now

	suite.repo.Save(suite.ctx, order1)
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)

	// When - Filter by date range (last 2 hours)
	dateFrom := now.Add(-2 * time.Hour)
	filters := domain.KitchenOrderFilters{
		DateFrom: &dateFrom,
	}
	
	orders, totalCount, err := suite.repo.List(suite.ctx, 0, 10, filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(orders, 2) // Only order2 and order3
	assert.Equal(2, totalCount)
	assert.Equal("order-2", orders[0].OrderID)
	assert.Equal("order-3", orders[1].OrderID)
}

// Test Count operation
func (suite *KitchenOrderRepositoryTestSuite) TestCount_WithFilters() {
	// Given - Create orders with different statuses
	order1, _ := domain.NewKitchenOrder("order-1", "table-1")
	order1.UpdateStatus(domain.KitchenOrderStatusPreparing)
	
	order2, _ := domain.NewKitchenOrder("order-2", "table-2")
	order2.UpdateStatus(domain.KitchenOrderStatusPreparing)
	
	order3, _ := domain.NewKitchenOrder("order-3", "table-3")
	// Keep as NEW status

	suite.repo.Save(suite.ctx, order1)
	suite.repo.Save(suite.ctx, order2)
	suite.repo.Save(suite.ctx, order3)

	// When
	status := domain.KitchenOrderStatusPreparing
	filters := domain.KitchenOrderFilters{
		Status: &status,
	}
	
	count, err := suite.repo.Count(suite.ctx, filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(2, count)
}

func (suite *KitchenOrderRepositoryTestSuite) TestCount_NoFilters() {
	// Given - Create multiple orders
	for i := 1; i <= 3; i++ {
		order, _ := domain.NewKitchenOrder(fmt.Sprintf("order-%d", i), fmt.Sprintf("table-%d", i))
		suite.repo.Save(suite.ctx, order)
	}

	// When
	count, err := suite.repo.Count(suite.ctx, domain.KitchenOrderFilters{})

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(3, count)
}

// Test Complex Scenarios
func (suite *KitchenOrderRepositoryTestSuite) TestComplexWorkflow_FullOrderLifecycle() {
	// Given - Create an order and walk through its complete lifecycle
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	order.AddItem("item-1", "Burger", 1, 20*time.Minute, nil, "")
	order.AddItem("item-2", "Fries", 1, 10*time.Minute, nil, "")

	// When - Save order
	err := suite.repo.Save(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Update order - assign to station and priority
	order.AssignToStation("grill-station")
	order.SetPriority(domain.KitchenPriorityHigh)
	err = suite.repo.Update(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Update order - start preparation
	err = order.UpdateStatus(domain.KitchenOrderStatusPreparing)
	assert.NoError(suite.T(), err)
	err = suite.repo.Update(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Update order - mark as ready
	err = order.UpdateStatus(domain.KitchenOrderStatusReady)
	assert.NoError(suite.T(), err)
	err = suite.repo.Update(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Update order - complete
	err = order.UpdateStatus(domain.KitchenOrderStatusCompleted)
	assert.NoError(suite.T(), err)
	err = suite.repo.Update(suite.ctx, order)
	assert.NoError(suite.T(), err)

	// Then - Verify final state
	finalOrder, err := suite.repo.FindByID(suite.ctx, order.ID)
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(finalOrder)
	assert.Equal(domain.KitchenOrderStatusCompleted, finalOrder.Status)
	assert.Equal(domain.KitchenPriorityHigh, finalOrder.Priority)
	assert.Equal("grill-station", finalOrder.AssignedStation)
	assert.False(finalOrder.StartedAt.IsZero())
	assert.False(finalOrder.CompletedAt.IsZero())
	assert.Len(finalOrder.Items, 2)
}

func (suite *KitchenOrderRepositoryTestSuite) TestComplexItems_WithModificationsAndNotes() {
	// Given - Create order with complex items
	order, _ := domain.NewKitchenOrder("order-456", "table-7")
	order.AddItem("item-1", "Custom Pizza", 2, 30*time.Minute, 
		[]string{"extra cheese", "no mushrooms", "thin crust"}, 
		"Customer is allergic to mushrooms")
	order.AddItem("item-2", "Caesar Salad", 1, 10*time.Minute,
		[]string{"dressing on side", "no croutons"},
		"Light on the dressing")

	// When
	err := suite.repo.Save(suite.ctx, order)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)

	// Verify complex items are persisted correctly
	savedOrder, err := suite.repo.FindByID(suite.ctx, order.ID)
	assert.NoError(err)
	assert.Len(savedOrder.Items, 2)

	// Check first item
	item1 := savedOrder.Items[0]
	assert.Equal("Custom Pizza", item1.Name)
	assert.Equal(2, item1.Quantity)
	assert.Len(item1.Modifications, 3)
	assert.Contains(item1.Modifications, "extra cheese")
	assert.Contains(item1.Modifications, "no mushrooms")
	assert.Contains(item1.Modifications, "thin crust")
	assert.Equal("Customer is allergic to mushrooms", item1.Notes)

	// Check second item
	item2 := savedOrder.Items[1]
	assert.Equal("Caesar Salad", item2.Name)
	assert.Len(item2.Modifications, 2)
	assert.Contains(item2.Modifications, "dressing on side")
	assert.Contains(item2.Modifications, "no croutons")
	assert.Equal("Light on the dressing", item2.Notes)
}

// Test Error Handling Edge Cases
func (suite *KitchenOrderRepositoryTestSuite) TestSerialization_ErrorHandling() {
	// This test would be more relevant with a corrupted database state
	// For now, we verify that normal serialization works correctly
	order, _ := domain.NewKitchenOrder("order-789", "table-9")
	order.AddItem("item-1", "Test Item", 1, 15*time.Minute, nil, "")

	err := suite.repo.Save(suite.ctx, order)
	assert.NoError(suite.T(), err)

	savedOrder, err := suite.repo.FindByID(suite.ctx, order.ID)
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(savedOrder)
	assert.Equal(order.ID, savedOrder.ID)
}