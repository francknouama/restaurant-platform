package infrastructure

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	
	"github.com/restaurant-platform/order-service/internal/domain"
)

// OrderRepositoryTestSuite contains repository logic tests
type OrderRepositoryTestSuite struct {
	suite.Suite
}

func TestOrderRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(OrderRepositoryTestSuite))
}

// Test JSON serialization/deserialization logic used in repository
func (suite *OrderRepositoryTestSuite) TestOrderSerialization() {
	// Given
	testOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	testOrder.SetTableID("table-5")
	testOrder.AddItem("menu-item-1", "Caesar Salad", 2, 12.99, []string{"no croutons"}, "extra dressing")
	testOrder.AddItem("menu-item-2", "Grilled Chicken", 1, 24.99, []string{"medium-rare"}, "no sauce")
	testOrder.AddNotes("Customer has allergies")

	// When - Test JSON marshaling (this logic is used in Create/Update)
	orderJSON, err := json.Marshal(testOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(orderJSON)
	
	// Verify we can unmarshal back to the same structure
	var unmarshaledOrder domain.Order
	err = json.Unmarshal(orderJSON, &unmarshaledOrder)
	assert.NoError(err)
	
	// Verify order data integrity
	assert.Equal(testOrder.ID, unmarshaledOrder.ID)
	assert.Equal(testOrder.CustomerID, unmarshaledOrder.CustomerID)
	assert.Equal(testOrder.Type, unmarshaledOrder.Type)
	assert.Equal(testOrder.Status, unmarshaledOrder.Status)
	assert.Equal(testOrder.TableID, unmarshaledOrder.TableID)
	assert.Equal(testOrder.TotalAmount, unmarshaledOrder.TotalAmount)
	assert.Equal(testOrder.TaxAmount, unmarshaledOrder.TaxAmount)
	assert.Equal(testOrder.Notes, unmarshaledOrder.Notes)
	assert.Len(unmarshaledOrder.Items, 2)
	
	// Verify item data integrity
	assert.Equal("Caesar Salad", unmarshaledOrder.Items[0].Name)
	assert.Equal(2, unmarshaledOrder.Items[0].Quantity)
	assert.Equal(12.99, unmarshaledOrder.Items[0].UnitPrice)
	assert.Equal([]string{"no croutons"}, unmarshaledOrder.Items[0].Modifications)
	assert.Equal("extra dressing", unmarshaledOrder.Items[0].Notes)
	
	assert.Equal("Grilled Chicken", unmarshaledOrder.Items[1].Name)
	assert.Equal(1, unmarshaledOrder.Items[1].Quantity)
	assert.Equal(24.99, unmarshaledOrder.Items[1].UnitPrice)
	assert.Equal([]string{"medium-rare"}, unmarshaledOrder.Items[1].Modifications)
	assert.Equal("no sauce", unmarshaledOrder.Items[1].Notes)
}

func (suite *OrderRepositoryTestSuite) TestEmptyOrderSerialization() {
	// Given
	testOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeTakeout)

	// When
	orderJSON, err := json.Marshal(testOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(orderJSON)
	
	// Verify unmarshaling empty order
	var unmarshaledOrder domain.Order
	err = json.Unmarshal(orderJSON, &unmarshaledOrder)
	assert.NoError(err)
	assert.Equal(testOrder.CustomerID, unmarshaledOrder.CustomerID)
	assert.Equal(testOrder.Type, unmarshaledOrder.Type)
	assert.Equal(domain.OrderStatusCreated, unmarshaledOrder.Status)
	assert.Empty(unmarshaledOrder.Items)
	assert.Equal(float64(0), unmarshaledOrder.TotalAmount)
	assert.Equal(float64(0), unmarshaledOrder.TaxAmount)
}

func (suite *OrderRepositoryTestSuite) TestOrderWithComplexItems() {
	// Given
	testOrder, _ := domain.NewOrder("customer-456", domain.OrderTypeDelivery)
	testOrder.SetDeliveryAddress("123 Main St, Apt 4B, City, State 12345")
	
	// Add item with all optional fields
	testOrder.AddItem(
		"menu-item-premium",
		"Wagyu Beef Steak",
		1,
		89.99,
		[]string{"rare", "no seasoning", "extra truffle oil", "side of asparagus"},
		"Customer is VIP - priority preparation. Allergic to shellfish.",
	)

	// When
	orderJSON, err := json.Marshal(testOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	var unmarshaledOrder domain.Order
	err = json.Unmarshal(orderJSON, &unmarshaledOrder)
	assert.NoError(err)
	assert.Len(unmarshaledOrder.Items, 1)
	assert.Equal(domain.OrderTypeDelivery, unmarshaledOrder.Type)
	assert.Equal("123 Main St, Apt 4B, City, State 12345", unmarshaledOrder.DeliveryAddress)
	
	item := unmarshaledOrder.Items[0]
	assert.Equal("Wagyu Beef Steak", item.Name)
	assert.Equal(89.99, item.UnitPrice)
	assert.Equal(4, len(item.Modifications))
	assert.Contains(item.Modifications, "rare")
	assert.Contains(item.Modifications, "extra truffle oil")
	assert.Contains(item.Notes, "VIP")
	assert.Contains(item.Notes, "shellfish")
}

func (suite *OrderRepositoryTestSuite) TestDateTimeSerialization() {
	// Given
	testOrder, _ := domain.NewOrder("customer-789", domain.OrderTypeDineIn)
	now := time.Now()
	testOrder.CreatedAt = now
	testOrder.UpdatedAt = now

	// When - Test marshaling the entire order (as done in repository)
	orderData := map[string]interface{}{
		"id":           testOrder.ID.String(),
		"customer_id":  testOrder.CustomerID,
		"type":         testOrder.Type,
		"status":       testOrder.Status,
		"total_amount": testOrder.TotalAmount,
		"tax_amount":   testOrder.TaxAmount,
		"created_at":   testOrder.CreatedAt,
		"updated_at":   testOrder.UpdatedAt,
	}

	orderJSON, err := json.Marshal(orderData)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Contains(string(orderJSON), testOrder.ID.String())
	assert.Contains(string(orderJSON), testOrder.CustomerID)
	
	// Verify we can unmarshal dates
	var unmarshaledData map[string]interface{}
	err = json.Unmarshal(orderJSON, &unmarshaledData)
	assert.NoError(err)
	assert.Equal(testOrder.CustomerID, unmarshaledData["customer_id"])
	assert.Equal(string(testOrder.Type), unmarshaledData["type"])
	assert.Equal(string(testOrder.Status), unmarshaledData["status"])
}

func (suite *OrderRepositoryTestSuite) TestIDSerialization() {
	// Given
	testOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	testOrder.AddItem("menu-item-1", "Test Item", 1, 10.99, nil, "")

	// When - Test ID serialization
	orderJSON, err := json.Marshal(testOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	var unmarshaledOrder domain.Order
	err = json.Unmarshal(orderJSON, &unmarshaledOrder)
	assert.NoError(err)
	
	// Verify IDs are preserved
	assert.Equal(testOrder.ID, unmarshaledOrder.ID)
	assert.Equal(testOrder.Items[0].ID, unmarshaledOrder.Items[0].ID)
	assert.Equal(testOrder.Items[0].MenuItemID, unmarshaledOrder.Items[0].MenuItemID)
	
	// Verify IDs are valid strings
	assert.NotEmpty(string(unmarshaledOrder.ID))
	assert.NotEmpty(string(unmarshaledOrder.Items[0].ID))
	assert.Contains(string(unmarshaledOrder.ID), "ord_")
	assert.Contains(string(unmarshaledOrder.Items[0].ID), "item_")
}

func (suite *OrderRepositoryTestSuite) TestOrderStatusSerialization() {
	// Test all order status values
	statuses := []domain.OrderStatus{
		domain.OrderStatusCreated,
		domain.OrderStatusPaid,
		domain.OrderStatusPreparing,
		domain.OrderStatusReady,
		domain.OrderStatusCompleted,
		domain.OrderStatusCancelled,
	}

	for _, status := range statuses {
		suite.T().Run(string(status), func(t *testing.T) {
			// Given
			testOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
			testOrder.Status = status

			// When
			orderJSON, err := json.Marshal(testOrder)

			// Then
			assert.NoError(t, err)
			
			var unmarshaledOrder domain.Order
			err = json.Unmarshal(orderJSON, &unmarshaledOrder)
			assert.NoError(t, err)
			assert.Equal(t, status, unmarshaledOrder.Status)
		})
	}
}

func (suite *OrderRepositoryTestSuite) TestOrderTypeSerialization() {
	// Test all order type values
	orderTypes := []domain.OrderType{
		domain.OrderTypeDineIn,
		domain.OrderTypeTakeout,
		domain.OrderTypeDelivery,
	}

	for _, orderType := range orderTypes {
		suite.T().Run(string(orderType), func(t *testing.T) {
			// Given
			testOrder, _ := domain.NewOrder("customer-123", orderType)

			// When
			orderJSON, err := json.Marshal(testOrder)

			// Then
			assert.NoError(t, err)
			
			var unmarshaledOrder domain.Order
			err = json.Unmarshal(orderJSON, &unmarshaledOrder)
			assert.NoError(t, err)
			assert.Equal(t, orderType, unmarshaledOrder.Type)
		})
	}
}

func (suite *OrderRepositoryTestSuite) TestOrderFiltersSerialization() {
	// Given
	startDate := time.Now().Add(-24 * time.Hour)
	endDate := time.Now()
	status := domain.OrderStatusPaid
	orderType := domain.OrderTypeDineIn
	minAmount := 50.0
	maxAmount := 200.0

	filters := domain.OrderFilters{
		CustomerID: "customer-123",
		Status:     &status,
		Type:       &orderType,
		StartDate:  &startDate,
		EndDate:    &endDate,
		TableID:    "table-5",
		MinAmount:  &minAmount,
		MaxAmount:  &maxAmount,
	}

	// When
	filtersJSON, err := json.Marshal(filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(filtersJSON)
	
	var unmarshaledFilters domain.OrderFilters
	err = json.Unmarshal(filtersJSON, &unmarshaledFilters)
	assert.NoError(err)
	
	assert.Equal(filters.CustomerID, unmarshaledFilters.CustomerID)
	assert.Equal(*filters.Status, *unmarshaledFilters.Status)
	assert.Equal(*filters.Type, *unmarshaledFilters.Type)
	assert.Equal(filters.TableID, unmarshaledFilters.TableID)
	assert.Equal(*filters.MinAmount, *unmarshaledFilters.MinAmount)
	assert.Equal(*filters.MaxAmount, *unmarshaledFilters.MaxAmount)
}

func (suite *OrderRepositoryTestSuite) TestTaxCalculationPersistence() {
	// Given
	testOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	testOrder.AddItem("item-1", "Item 1", 2, 10.50, nil, "")  // 21.00
	testOrder.AddItem("item-2", "Item 2", 1, 8.75, nil, "")   // 8.75
	// Total: 29.75, Tax: 2.975, Grand Total: 32.725

	// When
	orderJSON, err := json.Marshal(testOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	var unmarshaledOrder domain.Order
	err = json.Unmarshal(orderJSON, &unmarshaledOrder)
	assert.NoError(err)
	
	// Verify tax calculation is preserved correctly
	expectedSubtotal := 29.75
	expectedTax := expectedSubtotal * 0.10  // 2.975
	expectedTotal := expectedSubtotal + expectedTax  // 32.725
	
	assert.Equal(expectedTax, unmarshaledOrder.TaxAmount)
	assert.Equal(expectedTotal, unmarshaledOrder.TotalAmount)
}

// Test database query parameter serialization
func (suite *OrderRepositoryTestSuite) TestQueryParameterSerialization() {
	// Given - simulate preparing query parameters for database operations
	orderID := domain.OrderID("ord_20250613123456")
	customerID := "customer-123"
	status := domain.OrderStatusPaid
	orderType := domain.OrderTypeDineIn

	queryParams := map[string]interface{}{
		"order_id":    orderID.String(),
		"customer_id": customerID,
		"status":      string(status),
		"type":        string(orderType),
		"limit":       10,
		"offset":      0,
	}

	// When
	paramsJSON, err := json.Marshal(queryParams)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Contains(string(paramsJSON), string(orderID))
	assert.Contains(string(paramsJSON), customerID)
	assert.Contains(string(paramsJSON), string(status))
	assert.Contains(string(paramsJSON), string(orderType))
	
	var unmarshaledParams map[string]interface{}
	err = json.Unmarshal(paramsJSON, &unmarshaledParams)
	assert.NoError(err)
	assert.Equal(string(orderID), unmarshaledParams["order_id"])
	assert.Equal(customerID, unmarshaledParams["customer_id"])
	assert.Equal(string(status), unmarshaledParams["status"])
	assert.Equal(string(orderType), unmarshaledParams["type"])
}