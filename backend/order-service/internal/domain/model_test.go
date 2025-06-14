package domain

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"github.com/restaurant-platform/shared/pkg/types"
)

// OrderTestSuite contains all domain model tests
type OrderTestSuite struct {
	suite.Suite
}

func TestOrderTestSuite(t *testing.T) {
	suite.Run(t, new(OrderTestSuite))
}

// Test Order Creation
func (suite *OrderTestSuite) TestNewOrder_Success() {
	// Given
	customerID := "customer-123"
	orderType := OrderTypeDineIn

	// When
	order, err := NewOrder(customerID, orderType)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(order)
	assert.Equal(customerID, order.CustomerID)
	assert.Equal(orderType, order.Type)
	assert.Equal(OrderStatusCreated, order.Status)
	assert.NotEmpty(order.ID)
	assert.Empty(order.Items)
	assert.Equal(float64(0), order.TotalAmount)
	assert.Equal(float64(0), order.TaxAmount)
	assert.WithinDuration(time.Now(), order.CreatedAt, time.Second)
	assert.WithinDuration(time.Now(), order.UpdatedAt, time.Second)
}

func (suite *OrderTestSuite) TestNewOrder_EmptyCustomerID_ShouldFail() {
	// Given
	customerID := ""
	orderType := OrderTypeDineIn

	// When
	order, err := NewOrder(customerID, orderType)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(order)
	assert.Contains(err.Error(), "customer ID is required")
}

// Test Item Management
func (suite *OrderTestSuite) TestAddItem_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	menuItemID := "menu-item-1"
	name := "Caesar Salad"
	quantity := 2
	unitPrice := 12.99

	// When
	err := order.AddItem(menuItemID, name, quantity, unitPrice, []string{"no croutons"}, "extra dressing")

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(order.Items, 1)
	
	item := order.Items[0]
	assert.Equal(menuItemID, item.MenuItemID)
	assert.Equal(name, item.Name)
	assert.Equal(quantity, item.Quantity)
	assert.Equal(unitPrice, item.UnitPrice)
	assert.Equal([]string{"no croutons"}, item.Modifications)
	assert.Equal("extra dressing", item.Notes)
	assert.Equal(float64(quantity)*unitPrice, item.Subtotal)
	
	// Check totals are recalculated
	expectedSubtotal := float64(quantity) * unitPrice
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	assert.Equal(expectedTax, order.TaxAmount)
	assert.Equal(expectedTotal, order.TotalAmount)
}

func (suite *OrderTestSuite) TestAddItem_EmptyMenuItemID_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When
	err := order.AddItem("", "Item", 1, 10.99, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "menu item ID is required")
	assert.Empty(order.Items)
}

func (suite *OrderTestSuite) TestAddItem_ZeroQuantity_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When
	err := order.AddItem("menu-item-1", "Item", 0, 10.99, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "quantity must be positive")
	assert.Empty(order.Items)
}

func (suite *OrderTestSuite) TestAddItem_NegativePrice_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When
	err := order.AddItem("menu-item-1", "Item", 1, -5.99, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "unit price cannot be negative")
	assert.Empty(order.Items)
}

func (suite *OrderTestSuite) TestAddItem_MultipleItems_CalculatesTotalCorrectly() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	order.AddItem("item-2", "Pasta", 2, 15.00, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Len(order.Items, 2)
	
	// Total should be (10.00 + (2 * 15.00)) = 40.00 + 10% tax = 44.00
	expectedSubtotal := 40.00
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	
	assert.Equal(expectedTax, order.TaxAmount)
	assert.Equal(expectedTotal, order.TotalAmount)
}

func (suite *OrderTestSuite) TestRemoveItem_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	order.AddItem("item-2", "Pasta", 1, 15.00, nil, "")
	itemToRemove := order.Items[0].ID

	// When
	err := order.RemoveItem(itemToRemove)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(order.Items, 1)
	assert.Equal("Pasta", order.Items[0].Name)
	
	// Total should be recalculated: 15.00 + 10% tax = 16.50
	expectedSubtotal := 15.00
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	
	assert.Equal(expectedTax, order.TaxAmount)
	assert.Equal(expectedTotal, order.TotalAmount)
}

func (suite *OrderTestSuite) TestRemoveItem_NonExistentItem_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	nonExistentID := OrderItemID("non-existent")

	// When
	err := order.RemoveItem(nonExistentID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "not found")
	assert.Len(order.Items, 1)
}

func (suite *OrderTestSuite) TestUpdateItemQuantity_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	itemID := order.Items[0].ID

	// When
	err := order.UpdateItemQuantity(itemID, 3)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(3, order.Items[0].Quantity)
	assert.Equal(30.00, order.Items[0].Subtotal)
	
	// Total should be recalculated: 30.00 + 10% tax = 33.00
	expectedSubtotal := 30.00
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	
	assert.Equal(expectedTax, order.TaxAmount)
	assert.Equal(expectedTotal, order.TotalAmount)
}

func (suite *OrderTestSuite) TestUpdateItemQuantity_ZeroQuantity_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	itemID := order.Items[0].ID

	// When
	err := order.UpdateItemQuantity(itemID, 0)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "quantity must be positive")
	assert.Equal(1, order.Items[0].Quantity)
}

func (suite *OrderTestSuite) TestUpdateItemQuantity_NonExistentItem_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	nonExistentID := OrderItemID("non-existent")

	// When
	err := order.UpdateItemQuantity(nonExistentID, 2)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "not found")
}

// Test Status Transitions
func (suite *OrderTestSuite) TestUpdateStatus_ValidTransitions() {
	testCases := []struct {
		name        string
		fromStatus  OrderStatus
		toStatus    OrderStatus
		shouldError bool
	}{
		{"CREATED to PAID", OrderStatusCreated, OrderStatusPaid, false},
		{"CREATED to CANCELLED", OrderStatusCreated, OrderStatusCancelled, false},
		{"PAID to PREPARING", OrderStatusPaid, OrderStatusPreparing, false},
		{"PAID to CANCELLED", OrderStatusPaid, OrderStatusCancelled, false},
		{"PREPARING to READY", OrderStatusPreparing, OrderStatusReady, false},
		{"PREPARING to CANCELLED", OrderStatusPreparing, OrderStatusCancelled, false},
		{"READY to COMPLETED", OrderStatusReady, OrderStatusCompleted, false},
		{"READY to CANCELLED", OrderStatusReady, OrderStatusCancelled, false},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			order, _ := NewOrder("customer-123", OrderTypeDineIn)
			order.Status = tc.fromStatus

			// When
			err := order.UpdateStatus(tc.toStatus)

			// Then
			if tc.shouldError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tc.toStatus, order.Status)
			}
		})
	}
}

func (suite *OrderTestSuite) TestUpdateStatus_InvalidTransitions() {
	testCases := []struct {
		name       string
		fromStatus OrderStatus
		toStatus   OrderStatus
	}{
		{"CREATED to PREPARING", OrderStatusCreated, OrderStatusPreparing},
		{"CREATED to READY", OrderStatusCreated, OrderStatusReady},
		{"CREATED to COMPLETED", OrderStatusCreated, OrderStatusCompleted},
		{"PAID to READY", OrderStatusPaid, OrderStatusReady},
		{"PAID to COMPLETED", OrderStatusPaid, OrderStatusCompleted},
		{"PREPARING to PAID", OrderStatusPreparing, OrderStatusPaid},
		{"PREPARING to COMPLETED", OrderStatusPreparing, OrderStatusCompleted},
		{"READY to CREATED", OrderStatusReady, OrderStatusCreated},
		{"READY to PAID", OrderStatusReady, OrderStatusPaid},
		{"READY to PREPARING", OrderStatusReady, OrderStatusPreparing},
		{"COMPLETED to any", OrderStatusCompleted, OrderStatusCreated},
		{"CANCELLED to any", OrderStatusCancelled, OrderStatusCreated},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			// Given
			order, _ := NewOrder("customer-123", OrderTypeDineIn)
			order.Status = tc.fromStatus

			// When
			err := order.UpdateStatus(tc.toStatus)

			// Then
			assert.Error(t, err)
			// Error message can vary but should indicate transition is not allowed
			assert.True(t, 
				strings.Contains(err.Error(), "invalid status transition") || 
				strings.Contains(err.Error(), "cannot change status"))
			assert.Equal(t, tc.fromStatus, order.Status) // Status should remain unchanged
		})
	}
}

// Test Type-Specific Operations
func (suite *OrderTestSuite) TestSetTableID_DineInOrder_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	tableID := "table-5"

	// When
	err := order.SetTableID(tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(tableID, order.TableID)
}

func (suite *OrderTestSuite) TestSetTableID_NonDineInOrder_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeTakeout)
	tableID := "table-5"

	// When
	err := order.SetTableID(tableID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "table ID can only be set for dine-in orders")
	assert.Empty(order.TableID)
}

func (suite *OrderTestSuite) TestSetTableID_EmptyTableID_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When
	err := order.SetTableID("")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "table ID is required")
	assert.Empty(order.TableID)
}

func (suite *OrderTestSuite) TestSetDeliveryAddress_DeliveryOrder_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDelivery)
	address := "123 Main St, City"

	// When
	err := order.SetDeliveryAddress(address)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(address, order.DeliveryAddress)
}

func (suite *OrderTestSuite) TestSetDeliveryAddress_NonDeliveryOrder_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	address := "123 Main St, City"

	// When
	err := order.SetDeliveryAddress(address)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "delivery address can only be set for delivery orders")
	assert.Empty(order.DeliveryAddress)
}

func (suite *OrderTestSuite) TestSetDeliveryAddress_EmptyAddress_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDelivery)

	// When
	err := order.SetDeliveryAddress("")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "delivery address is required")
	assert.Empty(order.DeliveryAddress)
}

// Test Notes Management
func (suite *OrderTestSuite) TestAddNotes() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	notes := "Please prepare extra hot"

	// When
	order.AddNotes(notes)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(notes, order.Notes)
}

// Test Cancel Operations
func (suite *OrderTestSuite) TestCanCancel() {
	testCases := []struct {
		status      OrderStatus
		canCancel   bool
	}{
		{OrderStatusCreated, true},
		{OrderStatusPaid, true},
		{OrderStatusPreparing, true},
		{OrderStatusReady, true},
		{OrderStatusCompleted, false},
		{OrderStatusCancelled, false},
	}

	for _, tc := range testCases {
		suite.T().Run(string(tc.status), func(t *testing.T) {
			// Given
			order, _ := NewOrder("customer-123", OrderTypeDineIn)
			order.Status = tc.status

			// When
			canCancel := order.CanCancel()

			// Then
			assert.Equal(t, tc.canCancel, canCancel)
		})
	}
}

func (suite *OrderTestSuite) TestCancel_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.Status = OrderStatusPaid

	// When
	err := order.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(OrderStatusCancelled, order.Status)
}

func (suite *OrderTestSuite) TestCancel_CompletedOrder_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.Status = OrderStatusCompleted

	// When
	err := order.Cancel()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "cannot cancel")
	assert.Equal(OrderStatusCompleted, order.Status)
}

// Test Validation
func (suite *OrderTestSuite) TestValidate_ValidOrder() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	order.SetTableID("table-1")

	// When
	err := order.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
}

func (suite *OrderTestSuite) TestValidate_EmptyCustomerID_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.CustomerID = ""
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")

	// When
	err := order.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "customer ID is required")
}

func (suite *OrderTestSuite) TestValidate_NoItems_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.SetTableID("table-1")

	// When
	err := order.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "order must have at least one item")
}

func (suite *OrderTestSuite) TestValidate_DineInWithoutTableID_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")

	// When
	err := order.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "table ID is required for dine-in orders")
}

func (suite *OrderTestSuite) TestValidate_DeliveryWithoutAddress_ShouldFail() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDelivery)
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")

	// When
	err := order.Validate()

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "delivery address is required for delivery orders")
}

// Test Utility Methods
func (suite *OrderTestSuite) TestIsEmpty() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When & Then - Empty order
	assert := assert.New(suite.T())
	assert.True(order.IsEmpty())

	// When & Then - Order with items
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	assert.False(order.IsEmpty())
}

// Test Tax Calculation Edge Cases
func (suite *OrderTestSuite) TestTaxCalculation_ZeroAmount() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	
	// When (no items added)
	// Then
	assert := assert.New(suite.T())
	assert.Equal(float64(0), order.TaxAmount)
	assert.Equal(float64(0), order.TotalAmount)
}

func (suite *OrderTestSuite) TestTaxCalculation_PrecisionHandling() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)

	// When - Add item with price that results in fractional tax
	order.AddItem("item-1", "Salad", 1, 10.33, nil, "")

	// Then - Tax should be calculated correctly (allowing for floating point precision)
	assert := assert.New(suite.T())
	expectedTax := 10.33 * 0.10  // 1.033
	expectedTotal := 10.33 + expectedTax  // 11.363
	
	assert.InDelta(expectedTax, order.TaxAmount, 0.001)
	assert.InDelta(expectedTotal, order.TotalAmount, 0.001)
}

// Test ID Generation
func (suite *OrderTestSuite) TestOrderIDGeneration() {
	// Given & When
	order1, _ := NewOrder("customer-123", OrderTypeDineIn)
	order2, _ := NewOrder("customer-456", OrderTypeTakeout)
	
	// Then
	assert := assert.New(suite.T())
	assert.NotEmpty(order1.ID)
	assert.NotEmpty(order2.ID)
	assert.NotEqual(order1.ID, order2.ID)
	assert.True(strings.HasPrefix(string(order1.ID), "ord_"))
	assert.True(strings.HasPrefix(string(order2.ID), "ord_"))
}

func (suite *OrderTestSuite) TestOrderItemIDGeneration() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	
	// When
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	time.Sleep(1 * time.Millisecond) // Ensure different timestamps
	order.AddItem("item-2", "Pasta", 1, 15.00, nil, "")
	
	// Then
	assert := assert.New(suite.T())
	assert.NotEqual(order.Items[0].ID, order.Items[1].ID)
	assert.True(strings.HasPrefix(string(order.Items[0].ID), "item_"))
	assert.True(strings.HasPrefix(string(order.Items[1].ID), "item_"))
}

// Test Edge Cases for Different Order Types
func (suite *OrderTestSuite) TestTakeoutOrder_NoTableOrDeliveryRequired() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeTakeout)
	order.AddItem("item-1", "Burger", 1, 15.00, nil, "")
	
	// When
	err := order.Validate()
	
	// Then
	assert := assert.New(suite.T())
	assert.NoError(err) // Takeout doesn't require table or delivery address
	assert.Empty(order.TableID)
	assert.Empty(order.DeliveryAddress)
}

// Test Concurrent Modifications
func (suite *OrderTestSuite) TestUpdatedAtTimestamp() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	initialUpdatedAt := order.UpdatedAt
	time.Sleep(10 * time.Millisecond)
	
	// When - Various operations should update the timestamp
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	afterAddItem := order.UpdatedAt
	
	time.Sleep(10 * time.Millisecond)
	order.UpdateItemQuantity(order.Items[0].ID, 2)
	afterUpdateQuantity := order.UpdatedAt
	
	time.Sleep(10 * time.Millisecond)
	order.AddNotes("Special request")
	afterAddNotes := order.UpdatedAt
	
	// Then
	assert := assert.New(suite.T())
	assert.True(afterAddItem.After(initialUpdatedAt))
	assert.True(afterUpdateQuantity.After(afterAddItem))
	assert.True(afterAddNotes.After(afterUpdateQuantity))
}

// Test Complex Order Scenarios
func (suite *OrderTestSuite) TestComplexOrder_MultipleItemsAndModifications() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.SetTableID("table-10")
	
	// When - Build a complex order
	order.AddItem("burger-1", "Classic Burger", 2, 12.99, []string{"no onions", "extra cheese"}, "well done")
	order.AddItem("fries-1", "French Fries", 1, 4.99, []string{"extra crispy"}, "")
	order.AddItem("drink-1", "Soda", 2, 2.99, nil, "no ice")
	order.AddNotes("Birthday celebration - bring candle with dessert")
	
	// Then
	assert := assert.New(suite.T())
	assert.Len(order.Items, 3)
	
	// Check first item
	burger := order.Items[0]
	assert.Equal("Classic Burger", burger.Name)
	assert.Equal(2, burger.Quantity)
	assert.Equal(12.99, burger.UnitPrice)
	assert.Equal(25.98, burger.Subtotal)
	assert.Len(burger.Modifications, 2)
	assert.Contains(burger.Modifications, "no onions")
	assert.Contains(burger.Modifications, "extra cheese")
	assert.Equal("well done", burger.Notes)
	
	// Check totals
	expectedSubtotal := 25.98 + 4.99 + 5.98 // 36.95
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	
	assert.InDelta(expectedTax, order.TaxAmount, 0.001)
	assert.InDelta(expectedTotal, order.TotalAmount, 0.001)
	
	// Check notes
	assert.Contains(order.Notes, "Birthday celebration")
	
	// Validate the complete order
	err := order.Validate()
	assert.NoError(err)
}

// Test Error Accumulation
func (suite *OrderTestSuite) TestMultipleValidationErrors() {
	// Given
	order := &Order{
		ID:         types.NewID[OrderEntity]("ord"),
		CustomerID: "", // Invalid
		Type:       OrderTypeDineIn,
		Status:     OrderStatusCreated,
		Items:      []*OrderItem{}, // Invalid - empty
		TableID:    "", // Invalid for dine-in
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	
	// When
	err := order.Validate()
	
	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	// Should catch the first validation error
	assert.True(
		strings.Contains(err.Error(), "customer ID is required") ||
		strings.Contains(err.Error(), "order must have at least one item") ||
		strings.Contains(err.Error(), "table ID is required"))
}

// Test Order State Consistency
func (suite *OrderTestSuite) TestOrderStateConsistency_AfterCancel() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.SetTableID("table-5")
	order.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	order.UpdateStatus(OrderStatusPaid)
	
	originalTotal := order.TotalAmount
	originalItemCount := len(order.Items)
	
	// When
	err := order.Cancel()
	
	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(OrderStatusCancelled, order.Status)
	assert.Equal(originalTotal, order.TotalAmount) // Total should remain unchanged
	assert.Equal(originalItemCount, len(order.Items)) // Items should remain unchanged
	assert.False(order.CanCancel()) // Cannot cancel again
}

// Test Zero Price Items
func (suite *OrderTestSuite) TestAddItem_ZeroPrice_Success() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	
	// When - Add complimentary item
	err := order.AddItem("comp-1", "Complimentary Bread", 1, 0.00, nil, "")
	
	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(order.Items, 1)
	assert.Equal(0.00, order.Items[0].UnitPrice)
	assert.Equal(0.00, order.Items[0].Subtotal)
	assert.Equal(0.00, order.TotalAmount)
	assert.Equal(0.00, order.TaxAmount)
}

// Test Large Quantity Orders
func (suite *OrderTestSuite) TestLargeQuantityOrder() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	largeQuantity := 999
	unitPrice := 5.99
	
	// When
	err := order.AddItem("bulk-1", "Bulk Item", largeQuantity, unitPrice, nil, "")
	
	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	expectedSubtotal := float64(largeQuantity) * unitPrice
	expectedTax := expectedSubtotal * 0.10
	expectedTotal := expectedSubtotal + expectedTax
	
	assert.Equal(expectedSubtotal, order.Items[0].Subtotal)
	assert.InDelta(expectedTax, order.TaxAmount, 0.01)
	assert.InDelta(expectedTotal, order.TotalAmount, 0.01)
}

// Test Status Flow Complete Cycle
func (suite *OrderTestSuite) TestCompleteOrderLifecycle() {
	// Given
	order, _ := NewOrder("customer-123", OrderTypeDineIn)
	order.SetTableID("table-1")
	order.AddItem("item-1", "Steak", 1, 35.00, []string{"medium rare"}, "")
	
	// When & Then - Follow complete order lifecycle
	assert := assert.New(suite.T())
	
	// Initial state
	assert.Equal(OrderStatusCreated, order.Status)
	assert.NoError(order.Validate())
	
	// Payment
	assert.NoError(order.UpdateStatus(OrderStatusPaid))
	assert.Equal(OrderStatusPaid, order.Status)
	
	// Kitchen preparation
	assert.NoError(order.UpdateStatus(OrderStatusPreparing))
	assert.Equal(OrderStatusPreparing, order.Status)
	
	// Ready for service
	assert.NoError(order.UpdateStatus(OrderStatusReady))
	assert.Equal(OrderStatusReady, order.Status)
	
	// Completed
	assert.NoError(order.UpdateStatus(OrderStatusCompleted))
	assert.Equal(OrderStatusCompleted, order.Status)
	
	// Cannot modify completed order
	assert.Error(order.UpdateStatus(OrderStatusPaid))
	assert.Error(order.Cancel())
	assert.Equal(OrderStatusCompleted, order.Status)
}