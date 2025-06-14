package domain

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// KitchenOrderTestSuite contains all domain model tests
type KitchenOrderTestSuite struct {
	suite.Suite
}

func TestKitchenOrderTestSuite(t *testing.T) {
	suite.Run(t, new(KitchenOrderTestSuite))
}

// Test KitchenOrder Creation
func (suite *KitchenOrderTestSuite) TestNewKitchenOrder_Success() {
	// Given
	orderID := "order-123"
	tableID := "table-5"

	// When
	kitchenOrder, err := NewKitchenOrder(orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(kitchenOrder)
	assert.Equal(orderID, kitchenOrder.OrderID)
	assert.Equal(tableID, kitchenOrder.TableID)
	assert.Equal(KitchenOrderStatusNew, kitchenOrder.Status)
	assert.Equal(KitchenPriorityNormal, kitchenOrder.Priority)
	assert.NotEmpty(kitchenOrder.ID)
	assert.Empty(kitchenOrder.Items)
	assert.Equal(time.Duration(0), kitchenOrder.EstimatedTime)
	assert.WithinDuration(time.Now(), kitchenOrder.CreatedAt, time.Second)
	assert.WithinDuration(time.Now(), kitchenOrder.UpdatedAt, time.Second)
}

func (suite *KitchenOrderTestSuite) TestNewKitchenOrder_EmptyOrderID_ShouldFail() {
	// Given
	orderID := ""
	tableID := "table-5"

	// When
	kitchenOrder, err := NewKitchenOrder(orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(kitchenOrder)
	assert.Contains(err.Error(), "order ID is required")
}

func (suite *KitchenOrderTestSuite) TestNewKitchenOrder_EmptyTableID_Success() {
	// Given
	orderID := "order-123"
	tableID := "" // Takeout/delivery orders may not have table ID

	// When
	kitchenOrder, err := NewKitchenOrder(orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(kitchenOrder)
	assert.Equal(orderID, kitchenOrder.OrderID)
	assert.Equal(tableID, kitchenOrder.TableID)
}

// Test Item Management
func (suite *KitchenOrderTestSuite) TestAddItem_Success() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	menuItemID := "menu-item-1"
	name := "Caesar Salad"
	quantity := 2
	prepTime := 15 * time.Minute
	mods := []string{"no croutons"}
	notes := "extra dressing"

	// When
	err := kitchenOrder.AddItem(menuItemID, name, quantity, prepTime, mods, notes)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(kitchenOrder.Items, 1)
	
	item := kitchenOrder.Items[0]
	assert.Equal(menuItemID, item.MenuItemID)
	assert.Equal(name, item.Name)
	assert.Equal(quantity, item.Quantity)
	assert.Equal(prepTime, item.PrepTime)
	assert.Equal(mods, item.Modifications)
	assert.Equal(notes, item.Notes)
	assert.Equal(KitchenItemStatusNew, item.Status)
	assert.NotEmpty(item.ID)
	
	// Check estimated time is updated
	assert.Equal(prepTime, kitchenOrder.EstimatedTime)
}

func (suite *KitchenOrderTestSuite) TestAddItem_EmptyMenuItemID_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	err := kitchenOrder.AddItem("", "Item", 1, 10*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "menu item ID is required")
	assert.Empty(kitchenOrder.Items)
}

func (suite *KitchenOrderTestSuite) TestAddItem_ZeroQuantity_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	err := kitchenOrder.AddItem("menu-item-1", "Item", 0, 10*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "quantity must be positive")
	assert.Empty(kitchenOrder.Items)
}

func (suite *KitchenOrderTestSuite) TestAddItem_MultipleItems_EstimatedTimeCalculation() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	kitchenOrder.AddItem("item-1", "Quick Item", 1, 5*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Medium Item", 1, 15*time.Minute, nil, "")
	kitchenOrder.AddItem("item-3", "Slow Item", 1, 25*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Len(kitchenOrder.Items, 3)
	// Estimated time should be the maximum prep time (25 minutes)
	assert.Equal(25*time.Minute, kitchenOrder.EstimatedTime)
}

func (suite *KitchenOrderTestSuite) TestRemoveItem_Success() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 20*time.Minute, nil, "")
	itemToRemove := kitchenOrder.Items[0].ID

	// When
	err := kitchenOrder.RemoveItem(itemToRemove)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(kitchenOrder.Items, 1)
	assert.Equal("Item 2", kitchenOrder.Items[0].Name)
	// Estimated time should be recalculated to 20 minutes
	assert.Equal(20*time.Minute, kitchenOrder.EstimatedTime)
}

func (suite *KitchenOrderTestSuite) TestRemoveItem_NonExistentItem_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	nonExistentID := KitchenItemID("non-existent")

	// When
	err := kitchenOrder.RemoveItem(nonExistentID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "not found")
	assert.Len(kitchenOrder.Items, 1)
}

// Test Status Transitions
func (suite *KitchenOrderTestSuite) TestUpdateStatus_ValidTransitions() {
	testCases := []struct {
		name        string
		fromStatus  KitchenOrderStatus
		toStatus    KitchenOrderStatus
		shouldError bool
	}{
		{"NEW to PREPARING", KitchenOrderStatusNew, KitchenOrderStatusPreparing, false},
		{"NEW to CANCELLED", KitchenOrderStatusNew, KitchenOrderStatusCancelled, false},
		{"PREPARING to READY", KitchenOrderStatusPreparing, KitchenOrderStatusReady, false},
		{"PREPARING to CANCELLED", KitchenOrderStatusPreparing, KitchenOrderStatusCancelled, false},
		{"READY to COMPLETED", KitchenOrderStatusReady, KitchenOrderStatusCompleted, false},
		{"READY to CANCELLED", KitchenOrderStatusReady, KitchenOrderStatusCancelled, false},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.Status = tc.fromStatus

			// When
			err := kitchenOrder.UpdateStatus(tc.toStatus)

			// Then
			if tc.shouldError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.toStatus, kitchenOrder.Status)
			}
		})
	}
}

func (suite *KitchenOrderTestSuite) TestUpdateStatus_InvalidTransitions() {
	testCases := []struct {
		name       string
		fromStatus KitchenOrderStatus
		toStatus   KitchenOrderStatus
	}{
		{"NEW to READY", KitchenOrderStatusNew, KitchenOrderStatusReady},
		{"NEW to COMPLETED", KitchenOrderStatusNew, KitchenOrderStatusCompleted},
		{"PREPARING to NEW", KitchenOrderStatusPreparing, KitchenOrderStatusNew},
		{"PREPARING to COMPLETED", KitchenOrderStatusPreparing, KitchenOrderStatusCompleted},
		{"READY to NEW", KitchenOrderStatusReady, KitchenOrderStatusNew},
		{"READY to PREPARING", KitchenOrderStatusReady, KitchenOrderStatusPreparing},
		{"COMPLETED to any", KitchenOrderStatusCompleted, KitchenOrderStatusNew},
		{"CANCELLED to any", KitchenOrderStatusCancelled, KitchenOrderStatusNew},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.Status = tc.fromStatus

			// When
			err := kitchenOrder.UpdateStatus(tc.toStatus)

			// Then
			assert.Error(t, err)
			// Error message can vary but should indicate transition is not allowed
			assert.True(t, 
				strings.Contains(err.Error(), "invalid status transition") || 
				strings.Contains(err.Error(), "cannot change status"))
			assert.Equal(t, tc.fromStatus, kitchenOrder.Status) // Status should remain unchanged
		})
	}
}

func (suite *KitchenOrderTestSuite) TestUpdateStatus_PreparingSetsStartedAt() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	assert.True(suite.T(), kitchenOrder.StartedAt.IsZero())

	// When
	err := kitchenOrder.UpdateStatus(KitchenOrderStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenOrderStatusPreparing, kitchenOrder.Status)
	assert.False(kitchenOrder.StartedAt.IsZero())
	assert.WithinDuration(time.Now(), kitchenOrder.StartedAt, time.Second)
}

func (suite *KitchenOrderTestSuite) TestUpdateStatus_CompletedSetsCompletedAt() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.Status = KitchenOrderStatusReady
	assert.True(suite.T(), kitchenOrder.CompletedAt.IsZero())

	// When
	err := kitchenOrder.UpdateStatus(KitchenOrderStatusCompleted)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenOrderStatusCompleted, kitchenOrder.Status)
	assert.False(kitchenOrder.CompletedAt.IsZero())
	assert.WithinDuration(time.Now(), kitchenOrder.CompletedAt, time.Second)
}

// Test Item Status Management
func (suite *KitchenOrderTestSuite) TestUpdateItemStatus_ValidTransitions() {
	testCases := []struct {
		name       string
		fromStatus KitchenItemStatus
		toStatus   KitchenItemStatus
	}{
		{"NEW to PREPARING", KitchenItemStatusNew, KitchenItemStatusPreparing},
		{"NEW to CANCELLED", KitchenItemStatusNew, KitchenItemStatusCancelled},
		{"PREPARING to READY", KitchenItemStatusPreparing, KitchenItemStatusReady},
		{"PREPARING to CANCELLED", KitchenItemStatusPreparing, KitchenItemStatusCancelled},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.AddItem("item-1", "Test Item", 1, 10*time.Minute, nil, "")
			item := kitchenOrder.Items[0]
			item.Status = tc.fromStatus

			// When
			err := kitchenOrder.UpdateItemStatus(item.ID, tc.toStatus)

			// Then
			assert.NoError(t, err)
			assert.Equal(t, tc.toStatus, item.Status)
		})
	}
}

func (suite *KitchenOrderTestSuite) TestUpdateItemStatus_InvalidTransitions() {
	testCases := []struct {
		name       string
		fromStatus KitchenItemStatus
		toStatus   KitchenItemStatus
	}{
		{"NEW to READY", KitchenItemStatusNew, KitchenItemStatusReady},
		{"PREPARING to NEW", KitchenItemStatusPreparing, KitchenItemStatusNew},
		{"READY to any", KitchenItemStatusReady, KitchenItemStatusNew},
		{"CANCELLED to any", KitchenItemStatusCancelled, KitchenItemStatusNew},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.AddItem("item-1", "Test Item", 1, 10*time.Minute, nil, "")
			item := kitchenOrder.Items[0]
			item.Status = tc.fromStatus

			// When
			err := kitchenOrder.UpdateItemStatus(item.ID, tc.toStatus)

			// Then
			assert.Error(t, err)
			assert.True(t, 
				strings.Contains(err.Error(), "invalid status transition") || 
				strings.Contains(err.Error(), "cannot change status"))
			assert.Equal(t, tc.fromStatus, item.Status) // Status should remain unchanged
		})
	}
}

func (suite *KitchenOrderTestSuite) TestUpdateItemStatus_PreparingSetsStartedAt() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Test Item", 1, 10*time.Minute, nil, "")
	item := kitchenOrder.Items[0]
	assert.True(suite.T(), item.StartedAt.IsZero())

	// When
	err := kitchenOrder.UpdateItemStatus(item.ID, KitchenItemStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenItemStatusPreparing, item.Status)
	assert.False(item.StartedAt.IsZero())
	assert.WithinDuration(time.Now(), item.StartedAt, time.Second)
}

func (suite *KitchenOrderTestSuite) TestUpdateItemStatus_ReadySetsCompletedAt() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Test Item", 1, 10*time.Minute, nil, "")
	item := kitchenOrder.Items[0]
	item.Status = KitchenItemStatusPreparing
	assert.True(suite.T(), item.CompletedAt.IsZero())

	// When
	err := kitchenOrder.UpdateItemStatus(item.ID, KitchenItemStatusReady)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenItemStatusReady, item.Status)
	assert.False(item.CompletedAt.IsZero())
	assert.WithinDuration(time.Now(), item.CompletedAt, time.Second)
}

func (suite *KitchenOrderTestSuite) TestUpdateItemStatus_NonExistentItem_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Test Item", 1, 10*time.Minute, nil, "")
	nonExistentID := KitchenItemID("non-existent")

	// When
	err := kitchenOrder.UpdateItemStatus(nonExistentID, KitchenItemStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "not found")
}

// Test Automatic Order Status Updates
func (suite *KitchenOrderTestSuite) TestUpdateOrderStatus_AllItemsReady() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 15*time.Minute, nil, "")
	
	assert := assert.New(suite.T())
	
	// Initially NEW
	assert.Equal(KitchenOrderStatusNew, kitchenOrder.Status)
	
	// When - Transition items through proper workflow: NEW -> PREPARING -> READY
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusPreparing)
	assert.Equal(KitchenOrderStatusPreparing, kitchenOrder.Status) // Should be PREPARING now
	
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusReady)
	assert.Equal(KitchenOrderStatusPreparing, kitchenOrder.Status) // Should still be PREPARING (one item still NEW)
	
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[1].ID, KitchenItemStatusPreparing)
	assert.Equal(KitchenOrderStatusPreparing, kitchenOrder.Status) // Should still be PREPARING
	
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[1].ID, KitchenItemStatusReady)
	
	// Then - Order should automatically become ready when all items are ready
	assert.Equal(KitchenOrderStatusReady, kitchenOrder.Status)
}

func (suite *KitchenOrderTestSuite) TestUpdateOrderStatus_SomeItemsPreparing() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 15*time.Minute, nil, "")
	
	// When - Mark one item as preparing
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(KitchenOrderStatusPreparing, kitchenOrder.Status)
}

func (suite *KitchenOrderTestSuite) TestUpdateOrderStatus_AllItemsCancelled() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 15*time.Minute, nil, "")
	
	// When - Cancel all items (can go directly from NEW to CANCELLED)
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusCancelled)
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[1].ID, KitchenItemStatusCancelled)

	// Then - Order should automatically become cancelled when all items are cancelled
	assert := assert.New(suite.T())
	assert.Equal(KitchenOrderStatusCancelled, kitchenOrder.Status)
}

// Test Station Assignment
func (suite *KitchenOrderTestSuite) TestAssignToStation_Success() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	stationID := "grill-station-1"

	// When
	err := kitchenOrder.AssignToStation(stationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(stationID, kitchenOrder.AssignedStation)
}

func (suite *KitchenOrderTestSuite) TestAssignToStation_EmptyStationID_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	err := kitchenOrder.AssignToStation("")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "station ID is required")
	assert.Empty(kitchenOrder.AssignedStation)
}

// Test Priority Management
func (suite *KitchenOrderTestSuite) TestSetPriority() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	assert.Equal(suite.T(), KitchenPriorityNormal, kitchenOrder.Priority)

	// When
	kitchenOrder.SetPriority(KitchenPriorityHigh)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(KitchenPriorityHigh, kitchenOrder.Priority)
}

// Test Notes Management
func (suite *KitchenOrderTestSuite) TestAddNotes() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	notes := "Please prepare extra spicy"

	// When
	kitchenOrder.AddNotes(notes)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(notes, kitchenOrder.Notes)
}

// Test Cancel Operations
func (suite *KitchenOrderTestSuite) TestCancel_Success() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 15*time.Minute, nil, "")
	kitchenOrder.Status = KitchenOrderStatusPreparing

	// When
	err := kitchenOrder.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenOrderStatusCancelled, kitchenOrder.Status)
	
	// All items should be cancelled (except those already ready)
	for _, item := range kitchenOrder.Items {
		assert.Equal(KitchenItemStatusCancelled, item.Status)
	}
}

func (suite *KitchenOrderTestSuite) TestCancel_CompletedOrder_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.Status = KitchenOrderStatusCompleted

	// When
	err := kitchenOrder.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot cancel a completed order")
	assert.Equal(KitchenOrderStatusCompleted, kitchenOrder.Status)
}

func (suite *KitchenOrderTestSuite) TestCancel_DoesNotCancelReadyItems() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 15*time.Minute, nil, "")
	// Mark first item as ready
	kitchenOrder.Items[0].Status = KitchenItemStatusReady

	// When
	err := kitchenOrder.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(KitchenOrderStatusCancelled, kitchenOrder.Status)
	assert.Equal(KitchenItemStatusReady, kitchenOrder.Items[0].Status) // Should remain ready
	assert.Equal(KitchenItemStatusCancelled, kitchenOrder.Items[1].Status) // Should be cancelled
}

// Test Utility Methods
func (suite *KitchenOrderTestSuite) TestIsComplete() {
	testCases := []struct {
		status     KitchenOrderStatus
		isComplete bool
	}{
		{KitchenOrderStatusNew, false},
		{KitchenOrderStatusPreparing, false},
		{KitchenOrderStatusReady, false},
		{KitchenOrderStatusCompleted, true},
		{KitchenOrderStatusCancelled, false},
	}

	for _, tc := range testCases {
		suite.T().Run(string(tc.status), func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.Status = tc.status

			// When
			isComplete := kitchenOrder.IsComplete()

			// Then
			assert.Equal(t, tc.isComplete, isComplete)
		})
	}
}

func (suite *KitchenOrderTestSuite) TestIsReady() {
	testCases := []struct {
		status  KitchenOrderStatus
		isReady bool
	}{
		{KitchenOrderStatusNew, false},
		{KitchenOrderStatusPreparing, false},
		{KitchenOrderStatusReady, true},
		{KitchenOrderStatusCompleted, false},
		{KitchenOrderStatusCancelled, false},
	}

	for _, tc := range testCases {
		suite.T().Run(string(tc.status), func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.Status = tc.status

			// When
			isReady := kitchenOrder.IsReady()

			// Then
			assert.Equal(t, tc.isReady, isReady)
		})
	}
}

func (suite *KitchenOrderTestSuite) TestIsCancelled() {
	testCases := []struct {
		status      KitchenOrderStatus
		isCancelled bool
	}{
		{KitchenOrderStatusNew, false},
		{KitchenOrderStatusPreparing, false},
		{KitchenOrderStatusReady, false},
		{KitchenOrderStatusCompleted, false},
		{KitchenOrderStatusCancelled, true},
	}

	for _, tc := range testCases {
		suite.T().Run(string(tc.status), func(t *testing.T) {
			// Given
			kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
			kitchenOrder.Status = tc.status

			// When
			isCancelled := kitchenOrder.IsCancelled()

			// Then
			assert.Equal(t, tc.isCancelled, isCancelled)
		})
	}
}

// Test Time Management
func (suite *KitchenOrderTestSuite) TestTimeElapsed_NotStarted() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	elapsed := kitchenOrder.TimeElapsed()

	// Then
	assert.Equal(suite.T(), time.Duration(0), elapsed)
}

func (suite *KitchenOrderTestSuite) TestTimeElapsed_InProgress() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.StartedAt = time.Now().Add(-10 * time.Minute)

	// When
	elapsed := kitchenOrder.TimeElapsed()

	// Then
	assert := assert.New(suite.T())
	assert.True(elapsed >= 9*time.Minute) // Allow some tolerance
	assert.True(elapsed <= 11*time.Minute)
}

func (suite *KitchenOrderTestSuite) TestTimeElapsed_Completed() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	startTime := time.Now().Add(-20 * time.Minute)
	endTime := time.Now().Add(-5 * time.Minute)
	kitchenOrder.StartedAt = startTime
	kitchenOrder.CompletedAt = endTime

	// When
	elapsed := kitchenOrder.TimeElapsed()

	// Then
	expected := endTime.Sub(startTime)
	assert.Equal(suite.T(), expected, elapsed)
}

func (suite *KitchenOrderTestSuite) TestTimeRemaining_NotStarted() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 30*time.Minute, nil, "")

	// When
	remaining := kitchenOrder.TimeRemaining()

	// Then
	assert.Equal(suite.T(), 30*time.Minute, remaining)
}

func (suite *KitchenOrderTestSuite) TestTimeRemaining_InProgress() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 30*time.Minute, nil, "")
	kitchenOrder.StartedAt = time.Now().Add(-10 * time.Minute)

	// When
	remaining := kitchenOrder.TimeRemaining()

	// Then
	assert := assert.New(suite.T())
	assert.True(remaining >= 19*time.Minute) // Allow some tolerance
	assert.True(remaining <= 21*time.Minute)
}

func (suite *KitchenOrderTestSuite) TestTimeRemaining_Overdue() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 15*time.Minute, nil, "")
	kitchenOrder.StartedAt = time.Now().Add(-20 * time.Minute) // Started 20 minutes ago, estimated 15

	// When
	remaining := kitchenOrder.TimeRemaining()

	// Then
	assert.Equal(suite.T(), time.Duration(0), remaining)
}

func (suite *KitchenOrderTestSuite) TestTimeRemaining_CompletedOrder() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.Status = KitchenOrderStatusCompleted

	// When
	remaining := kitchenOrder.TimeRemaining()

	// Then
	assert.Equal(suite.T(), time.Duration(0), remaining)
}

// Test Validation
func (suite *KitchenOrderTestSuite) TestValidate_ValidOrder() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")

	// When
	err := kitchenOrder.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
}

func (suite *KitchenOrderTestSuite) TestValidate_EmptyOrderID_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.OrderID = ""
	kitchenOrder.AddItem("item-1", "Item 1", 1, 10*time.Minute, nil, "")

	// When
	err := kitchenOrder.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "order ID is required")
}

func (suite *KitchenOrderTestSuite) TestValidate_NoItems_ShouldFail() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")

	// When
	err := kitchenOrder.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "kitchen order must have at least one item")
}

// Test Estimated Time Recalculation Edge Cases
func (suite *KitchenOrderTestSuite) TestRecalculateEstimatedTime_ExcludesReadyItems() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 30*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 20*time.Minute, nil, "")
	kitchenOrder.AddItem("item-3", "Item 3", 1, 10*time.Minute, nil, "")
	
	// Initial estimated time should be 30 minutes (max of all items)
	assert.Equal(suite.T(), 30*time.Minute, kitchenOrder.EstimatedTime)
	
	// Mark item-1 (30 min) and item-3 (10 min) as ready
	// This should leave only item-2 (20 min) as active
	// First move to preparing, then to ready
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusPreparing)
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[0].ID, KitchenItemStatusReady)
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[2].ID, KitchenItemStatusPreparing)
	kitchenOrder.UpdateItemStatus(kitchenOrder.Items[2].ID, KitchenItemStatusReady)

	// Debug: Check item statuses
	assert := assert.New(suite.T())
	assert.Equal(KitchenItemStatusReady, kitchenOrder.Items[0].Status) // item-1 should be ready
	assert.Equal(KitchenItemStatusNew, kitchenOrder.Items[1].Status)   // item-2 should still be new
	assert.Equal(KitchenItemStatusReady, kitchenOrder.Items[2].Status) // item-3 should be ready
	
	// Then - Should be 20 minutes (only item-2 is active)
	assert.Equal(20*time.Minute, kitchenOrder.EstimatedTime)
}

func (suite *KitchenOrderTestSuite) TestRecalculateEstimatedTime_ExcludesCancelledItems() {
	// Given
	kitchenOrder, _ := NewKitchenOrder("order-123", "table-5")
	kitchenOrder.AddItem("item-1", "Item 1", 1, 30*time.Minute, nil, "")
	kitchenOrder.AddItem("item-2", "Item 2", 1, 20*time.Minute, nil, "")
	
	// Mark first item as cancelled
	kitchenOrder.Items[0].Status = KitchenItemStatusCancelled

	// When - Trigger recalculation by removing an item and adding back
	kitchenOrder.AddItem("item-3", "Item 3", 1, 15*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	// Should be 20 minutes (item-2), not 30 minutes (item-1 is cancelled)
	assert.Equal(20*time.Minute, kitchenOrder.EstimatedTime)
}