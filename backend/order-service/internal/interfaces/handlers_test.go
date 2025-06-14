package interfaces

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/order-service/internal/application"
	"github.com/restaurant-platform/order-service/internal/domain"
)

// MockOrderService is a mock implementation of the OrderService interface
type MockOrderService struct {
	mock.Mock
}

func (m *MockOrderService) CreateOrder(ctx context.Context, customerID string, orderType domain.OrderType) (*domain.Order, error) {
	args := m.Called(ctx, customerID, orderType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Order), args.Error(1)
}

func (m *MockOrderService) GetOrderByID(ctx context.Context, id domain.OrderID) (*domain.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Order), args.Error(1)
}

func (m *MockOrderService) AddItemToOrder(ctx context.Context, orderID domain.OrderID, menuItemID, name string, quantity int, unitPrice float64, modifications []string, notes string) error {
	args := m.Called(ctx, orderID, menuItemID, name, quantity, unitPrice, modifications, notes)
	return args.Error(0)
}

func (m *MockOrderService) RemoveItemFromOrder(ctx context.Context, orderID domain.OrderID, itemID domain.OrderItemID) error {
	args := m.Called(ctx, orderID, itemID)
	return args.Error(0)
}

func (m *MockOrderService) UpdateItemQuantity(ctx context.Context, orderID domain.OrderID, itemID domain.OrderItemID, quantity int) error {
	args := m.Called(ctx, orderID, itemID, quantity)
	return args.Error(0)
}

func (m *MockOrderService) UpdateOrderStatus(ctx context.Context, orderID domain.OrderID, status domain.OrderStatus) error {
	args := m.Called(ctx, orderID, status)
	return args.Error(0)
}

func (m *MockOrderService) SetTableForOrder(ctx context.Context, orderID domain.OrderID, tableID string) error {
	args := m.Called(ctx, orderID, tableID)
	return args.Error(0)
}

func (m *MockOrderService) SetDeliveryAddress(ctx context.Context, orderID domain.OrderID, address string) error {
	args := m.Called(ctx, orderID, address)
	return args.Error(0)
}

func (m *MockOrderService) AddOrderNotes(ctx context.Context, orderID domain.OrderID, notes string) error {
	args := m.Called(ctx, orderID, notes)
	return args.Error(0)
}

func (m *MockOrderService) CancelOrder(ctx context.Context, orderID domain.OrderID) error {
	args := m.Called(ctx, orderID)
	return args.Error(0)
}

func (m *MockOrderService) PayOrder(ctx context.Context, orderID domain.OrderID) error {
	args := m.Called(ctx, orderID)
	return args.Error(0)
}

func (m *MockOrderService) GetOrdersByCustomer(ctx context.Context, customerID string) ([]*domain.Order, error) {
	args := m.Called(ctx, customerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderService) GetOrdersByStatus(ctx context.Context, status domain.OrderStatus) ([]*domain.Order, error) {
	args := m.Called(ctx, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderService) GetOrdersByTable(ctx context.Context, tableID string) ([]*domain.Order, error) {
	args := m.Called(ctx, tableID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderService) GetActiveOrders(ctx context.Context) ([]*domain.Order, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderService) ListOrders(ctx context.Context, offset, limit int, filters domain.OrderFilters) ([]*domain.Order, int, error) {
	args := m.Called(ctx, offset, limit, filters)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*domain.Order), args.Int(1), args.Error(2)
}

// OrderHandlerTestSuite contains all HTTP handler tests
type OrderHandlerTestSuite struct {
	suite.Suite
	handler     *OrderHandler
	mockService *MockOrderService
	router      *gin.Engine
}

func (suite *OrderHandlerTestSuite) SetupTest() {
	gin.SetMode(gin.TestMode)
	suite.mockService = new(MockOrderService)
	
	// Create handler with mock service
	suite.handler = NewOrderHandler(suite.mockService)
	
	suite.router = gin.New()
	suite.setupRoutes()
}

func (suite *OrderHandlerTestSuite) setupRoutes() {
	api := suite.router.Group("/api/v1")
	{
		api.POST("/orders", suite.handler.CreateOrder)
		api.GET("/orders/active", suite.handler.GetActiveOrders)
		api.GET("/orders", suite.handler.ListOrders)
		api.GET("/orders/:id", func(c *gin.Context) {
			// Simplified handler for testing
			c.JSON(http.StatusOK, gin.H{"message": "order details"})
		})
		api.PUT("/orders/:id/status", suite.handler.UpdateOrderStatus)
		api.POST("/orders/:id/items", suite.handler.AddItemToOrder)
		api.PUT("/orders/:id/table", suite.handler.SetTable)
		api.PUT("/orders/:id/delivery-address", suite.handler.SetDeliveryAddress)
		api.PUT("/orders/:id/cancel", suite.handler.CancelOrder)
		api.PUT("/orders/:id/pay", suite.handler.PayOrder)
	}
}

func TestOrderHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(OrderHandlerTestSuite))
}

// Test CreateOrder Handler
func (suite *OrderHandlerTestSuite) TestCreateOrder_Success() {
	// Given
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "DINE_IN",
		TableID:    "table-5",
	}
	requestJSON, _ := json.Marshal(request)
	
	expectedOrder, _ := domain.NewOrder(request.CustomerID, domain.OrderTypeDineIn)
	suite.mockService.On("CreateOrder", mock.Anything, request.CustomerID, domain.OrderTypeDineIn).Return(expectedOrder, nil)
	suite.mockService.On("SetTableForOrder", mock.Anything, expectedOrder.ID, request.TableID).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusCreated, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestCreateOrder_InvalidJSON_ShouldReturnBadRequest() {
	// Given
	invalidJSON := `{"customer_id": }`

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBufferString(invalidJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

func (suite *OrderHandlerTestSuite) TestCreateOrder_EmptyCustomerID_ShouldReturnBadRequest() {
	// Given
	request := application.CreateOrderRequest{
		CustomerID: "",
		Type:       "DINE_IN",
	}
	requestJSON, _ := json.Marshal(request)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

func (suite *OrderHandlerTestSuite) TestCreateOrder_InvalidOrderType_ShouldReturnBadRequest() {
	// Given
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "INVALID_TYPE",
	}
	requestJSON, _ := json.Marshal(request)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

func (suite *OrderHandlerTestSuite) TestCreateOrder_ServiceError_ShouldReturnInternalServerError() {
	// Given
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "DINE_IN",
	}
	requestJSON, _ := json.Marshal(request)
	
	serviceError := errors.New("database connection failed")
	suite.mockService.On("CreateOrder", mock.Anything, request.CustomerID, domain.OrderTypeDineIn).Return(nil, serviceError)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusInternalServerError, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test UpdateOrderStatus Handler
func (suite *OrderHandlerTestSuite) TestUpdateOrderStatus_Success() {
	// Given
	orderID := "ord_123"
	request := application.UpdateOrderStatusRequest{
		Status: "PAID",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("UpdateOrderStatus", mock.Anything, domain.OrderID(orderID), domain.OrderStatusPaid).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/status", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestUpdateOrderStatus_InvalidStatus_ShouldReturnBadRequest() {
	// Given
	orderID := "ord_123"
	request := application.UpdateOrderStatusRequest{
		Status: "INVALID_STATUS",
	}
	requestJSON, _ := json.Marshal(request)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/status", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

// Test AddItemToOrder Handler
func (suite *OrderHandlerTestSuite) TestAddItemToOrder_Success() {
	// Given
	orderID := "ord_123"
	request := application.AddItemRequest{
		MenuItemID:    "menu-item-1",
		Name:          "Caesar Salad",
		Quantity:      2,
		UnitPrice:     12.99,
		Modifications: []string{"no croutons"},
		Notes:         "extra dressing",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("AddItemToOrder", mock.Anything, domain.OrderID(orderID), 
		request.MenuItemID, request.Name, request.Quantity, request.UnitPrice, 
		request.Modifications, request.Notes).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/items", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestAddItemToOrder_InvalidQuantity_ShouldReturnBadRequest() {
	// Given
	orderID := "ord_123"
	request := application.AddItemRequest{
		MenuItemID: "menu-item-1",
		Name:       "Caesar Salad",
		Quantity:   0, // Invalid quantity
		UnitPrice:  12.99,
	}
	requestJSON, _ := json.Marshal(request)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders/"+orderID+"/items", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

// Test SetTableForOrder Handler
func (suite *OrderHandlerTestSuite) TestSetTableForOrder_Success() {
	// Given
	orderID := "ord_123"
	request := application.SetTableRequest{
		TableID: "table-5",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("SetTableForOrder", mock.Anything, domain.OrderID(orderID), request.TableID).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/table", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test SetDeliveryAddress Handler
func (suite *OrderHandlerTestSuite) TestSetDeliveryAddress_Success() {
	// Given
	orderID := "ord_123"
	request := application.SetDeliveryAddressRequest{
		Address: "123 Main St, City",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("SetDeliveryAddress", mock.Anything, domain.OrderID(orderID), request.Address).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/delivery-address", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test CancelOrder Handler
func (suite *OrderHandlerTestSuite) TestCancelOrder_Success() {
	// Given
	orderID := "ord_123"
	
	suite.mockService.On("CancelOrder", mock.Anything, domain.OrderID(orderID)).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/cancel", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test PayOrder Handler
func (suite *OrderHandlerTestSuite) TestPayOrder_Success() {
	// Given
	orderID := "ord_123"
	
	suite.mockService.On("PayOrder", mock.Anything, domain.OrderID(orderID)).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/pay", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test GetActiveOrders Handler
func (suite *OrderHandlerTestSuite) TestGetActiveOrders_Success() {
	// Given
	expectedOrders := []*domain.Order{
		{Status: domain.OrderStatusPaid, CustomerID: "customer-1"},
		{Status: domain.OrderStatusPreparing, CustomerID: "customer-2"},
	}
	
	suite.mockService.On("GetActiveOrders", mock.Anything).Return(expectedOrders, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/active", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestGetActiveOrders_ServiceError_ShouldReturnInternalServerError() {
	// Given
	serviceError := errors.New("database connection failed")
	suite.mockService.On("GetActiveOrders", mock.Anything).Return(nil, serviceError)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/active", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusInternalServerError, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test GetOrders Handler (List with pagination)
func (suite *OrderHandlerTestSuite) TestGetOrders_Success() {
	// Given
	order1, _ := domain.NewOrder("customer-1", domain.OrderTypeDineIn)
	order2, _ := domain.NewOrder("customer-2", domain.OrderTypeTakeout)
	expectedOrders := []*domain.Order{order1, order2}
	totalCount := 2
	
	suite.mockService.On("ListOrders", mock.Anything, 0, 10, mock.AnythingOfType("domain.OrderFilters")).Return(expectedOrders, totalCount, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestGetOrders_WithFilters_Success() {
	// Given
	expectedOrders := []*domain.Order{}
	totalCount := 0
	
	suite.mockService.On("ListOrders", mock.Anything, 0, 10, mock.AnythingOfType("domain.OrderFilters")).Return(expectedOrders, totalCount, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders?customer_id=customer-123&status=PAID", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test Error Handling Helper Functions
func (suite *OrderHandlerTestSuite) TestErrorHandling_ValidationError() {
	// Test validation error handling by sending invalid request
	invalidRequest := `{"customer_id": "", "type": "DINE_IN"}`

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBufferString(invalidRequest))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

func (suite *OrderHandlerTestSuite) TestErrorHandling_ServiceError() {
	// Test service error handling
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "DINE_IN",
	}
	requestJSON, _ := json.Marshal(request)
	
	serviceError := errors.New("internal service error")
	suite.mockService.On("CreateOrder", mock.Anything, request.CustomerID, domain.OrderTypeDineIn).Return(nil, serviceError)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert := assert.New(suite.T())
	assert.Equal(http.StatusInternalServerError, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test Success Response Helpers
func (suite *OrderHandlerTestSuite) TestSuccessResponse_Created() {
	// Test successful order creation response
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "DINE_IN",
	}
	requestJSON, _ := json.Marshal(request)
	
	expectedOrder, _ := domain.NewOrder(request.CustomerID, domain.OrderTypeDineIn)
	suite.mockService.On("CreateOrder", mock.Anything, request.CustomerID, domain.OrderTypeDineIn).Return(expectedOrder, nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert := assert.New(suite.T())
	assert.Equal(http.StatusCreated, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestSuccessResponse_OK() {
	// Test successful status update response
	orderID := "ord_123"
	request := application.UpdateOrderStatusRequest{
		Status: "PAID",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("UpdateOrderStatus", mock.Anything, domain.OrderID(orderID), domain.OrderStatusPaid).Return(nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/orders/"+orderID+"/status", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Integration-style HTTP tests
func (suite *OrderHandlerTestSuite) TestIntegration_CreateAndManageOrder() {
	// Skip integration tests unless specifically running them
	suite.T().Skip("Integration test - requires full application setup")

	// This would test the full flow:
	// 1. Create an order via POST /api/v1/orders
	// 2. Add items via POST /api/v1/orders/{id}/items
	// 3. Update status via PUT /api/v1/orders/{id}/status
	// 4. Verify the order state
}

func (suite *OrderHandlerTestSuite) TestIntegration_OrderWorkflow() {
	// Skip integration tests
	suite.T().Skip("Integration test - requires full application setup")

	// This would test a complete order workflow:
	// 1. Create order
	// 2. Add multiple items
	// 3. Set table/delivery address
	// 4. Update status through lifecycle
	// 5. Verify all operations and final state
}

// Helper function to create test Gin context
func createTestContext() *gin.Context {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c
}

// Benchmark tests
func (suite *OrderHandlerTestSuite) TestBenchmark_CreateOrderHandler() {
	// Skip benchmarks in regular test runs
	suite.T().Skip("Benchmark test")

	// Example benchmark structure:
	// b.ResetTimer()
	// for i := 0; i < b.N; i++ {
	//     // Run the handler
	// }
}

// Test concurrent requests
func (suite *OrderHandlerTestSuite) TestConcurrency_MultipleRequests() {
	// Skip concurrency tests
	suite.T().Skip("Concurrency test")

	// This would test multiple concurrent requests to ensure
	// thread safety and proper handling
}

// Additional comprehensive tests

// Test GetOrder Handler
func (suite *OrderHandlerTestSuite) TestGetOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	expectedOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	expectedOrder.ID = orderID
	
	suite.mockService.On("GetOrderByID", mock.Anything, orderID).Return(expectedOrder, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/ord_123", nil)
	
	// Create a new route for this test
	router := gin.New()
	router.GET("/api/v1/orders/:id", suite.handler.GetOrder)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response application.OrderResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Equal(string(orderID), response.ID)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestGetOrder_NotFound() {
	// Given
	orderID := domain.OrderID("non-existent")
	notFoundError := errors.New("order not found")
	
	suite.mockService.On("GetOrderByID", mock.Anything, orderID).Return(nil, notFoundError)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/non-existent", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/:id", suite.handler.GetOrder)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusInternalServerError, w.Code) // handleError treats regular errors as 500
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test RemoveItemFromOrder Handler
func (suite *OrderHandlerTestSuite) TestRemoveItemFromOrder_Success() {
	// Given
	orderID := "ord_123"
	itemID := "item_456"
	
	suite.mockService.On("RemoveItemFromOrder", mock.Anything, domain.OrderID(orderID), domain.OrderItemID(itemID)).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("DELETE", "/api/v1/orders/ord_123/items/item_456", nil)
	
	router := gin.New()
	router.DELETE("/api/v1/orders/:id/items/:itemId", suite.handler.RemoveItemFromOrder)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Equal("Item removed successfully", response["message"])
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test UpdateItemQuantity Handler
func (suite *OrderHandlerTestSuite) TestUpdateItemQuantity_Success() {
	// Given
	orderID := "ord_123"
	itemID := "item_456"
	request := application.UpdateItemQuantityRequest{
		Quantity: 3,
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("UpdateItemQuantity", mock.Anything, domain.OrderID(orderID), domain.OrderItemID(itemID), request.Quantity).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/api/v1/orders/ord_123/items/item_456/quantity", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	
	router := gin.New()
	router.PATCH("/api/v1/orders/:id/items/:itemId/quantity", suite.handler.UpdateItemQuantity)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test AddNotes Handler
func (suite *OrderHandlerTestSuite) TestAddNotes_Success() {
	// Given
	orderID := "ord_123"
	request := application.AddNotesRequest{
		Notes: "Please prepare extra hot",
	}
	requestJSON, _ := json.Marshal(request)
	
	suite.mockService.On("AddOrderNotes", mock.Anything, domain.OrderID(orderID), request.Notes).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PATCH", "/api/v1/orders/ord_123/notes", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	
	router := gin.New()
	router.PATCH("/api/v1/orders/:id/notes", suite.handler.AddNotes)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test GetOrdersByCustomer Handler
func (suite *OrderHandlerTestSuite) TestGetOrdersByCustomer_Success() {
	// Given
	customerID := "customer-123"
	expectedOrders := []*domain.Order{
		{CustomerID: customerID, Type: domain.OrderTypeDineIn},
		{CustomerID: customerID, Type: domain.OrderTypeTakeout},
	}
	
	suite.mockService.On("GetOrdersByCustomer", mock.Anything, customerID).Return(expectedOrders, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/customer/customer-123", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/customer/:customerId", suite.handler.GetOrdersByCustomer)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Contains(response, "orders")
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test GetOrdersByStatus Handler
func (suite *OrderHandlerTestSuite) TestGetOrdersByStatus_Success() {
	// Given
	status := domain.OrderStatusPreparing
	expectedOrders := []*domain.Order{
		{Status: status, CustomerID: "customer-1"},
		{Status: status, CustomerID: "customer-2"},
	}
	
	suite.mockService.On("GetOrdersByStatus", mock.Anything, status).Return(expectedOrders, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/status/PREPARING", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/status/:status", suite.handler.GetOrdersByStatus)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestGetOrdersByStatus_InvalidStatus() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/status/INVALID", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/status/:status", suite.handler.GetOrdersByStatus)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
}

// Test GetOrdersByTable Handler
func (suite *OrderHandlerTestSuite) TestGetOrdersByTable_Success() {
	// Given
	tableID := "table-5"
	expectedOrders := []*domain.Order{
		{TableID: tableID, Type: domain.OrderTypeDineIn},
	}
	
	suite.mockService.On("GetOrdersByTable", mock.Anything, tableID).Return(expectedOrders, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/table/table-5", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/table/:tableId", suite.handler.GetOrdersByTable)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test ListOrders with complex filters
func (suite *OrderHandlerTestSuite) TestListOrders_ComplexFilters() {
	// Given
	expectedOrders := []*domain.Order{
		{Status: domain.OrderStatusCompleted, Type: domain.OrderTypeDelivery, CustomerID: "customer-123"},
	}
	totalCount := 1
	
	suite.mockService.On("ListOrders", mock.Anything, 10, 20, mock.MatchedBy(func(filters domain.OrderFilters) bool {
		return filters.CustomerID == "customer-123" &&
			*filters.Status == domain.OrderStatusCompleted &&
			*filters.Type == domain.OrderTypeDelivery &&
			*filters.MinAmount == 50.00 &&
			*filters.MaxAmount == 200.00
	})).Return(expectedOrders, totalCount, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders?offset=10&limit=20&customer_id=customer-123&status=COMPLETED&type=DELIVERY&min_amount=50&max_amount=200", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response application.OrderListResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Equal(totalCount, response.Total)
	
	suite.mockService.AssertExpectations(suite.T())
}

func (suite *OrderHandlerTestSuite) TestListOrders_InvalidDateFormat() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders?date_from=invalid-date", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusBadRequest, w.Code)
	
	var response application.ErrorResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Contains(response.Error, "Invalid date_from format")
}

// Test Health endpoint
func (suite *OrderHandlerTestSuite) TestHealth_Success() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/health", nil)
	
	router := gin.New()
	router.GET("/health", suite.handler.Health)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response application.HealthResponse
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Equal("healthy", response.Status)
	assert.Equal("order-service", response.Service)
}

// Test CreateOrder with delivery order
func (suite *OrderHandlerTestSuite) TestCreateOrder_DeliveryOrder_Success() {
	// Given
	request := application.CreateOrderRequest{
		CustomerID: "customer-123",
		Type:       "DELIVERY",
		Address:    "123 Main St, City",
		Notes:      "Leave at door",
	}
	requestJSON, _ := json.Marshal(request)
	
	expectedOrder, _ := domain.NewOrder(request.CustomerID, domain.OrderTypeDelivery)
	suite.mockService.On("CreateOrder", mock.Anything, request.CustomerID, domain.OrderTypeDelivery).Return(expectedOrder, nil)
	suite.mockService.On("SetDeliveryAddress", mock.Anything, expectedOrder.ID, request.Address).Return(nil)
	suite.mockService.On("AddOrderNotes", mock.Anything, expectedOrder.ID, request.Notes).Return(nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(requestJSON))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusCreated, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test validation helper functions
func (suite *OrderHandlerTestSuite) TestValidateOrderType_AllValidTypes() {
	testCases := []struct {
		input    string
		expected domain.OrderType
	}{
		{"DINE_IN", domain.OrderTypeDineIn},
		{"TAKEOUT", domain.OrderTypeTakeout},
		{"DELIVERY", domain.OrderTypeDelivery},
	}

	for _, tc := range testCases {
		result, err := validateOrderType(tc.input)
		assert.NoError(suite.T(), err)
		assert.Equal(suite.T(), tc.expected, result)
	}
}

func (suite *OrderHandlerTestSuite) TestValidateOrderType_Invalid() {
	result, err := validateOrderType("INVALID_TYPE")
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid order type")
}

func (suite *OrderHandlerTestSuite) TestValidateOrderStatus_AllValidStatuses() {
	testCases := []struct {
		input    string
		expected domain.OrderStatus
	}{
		{"CREATED", domain.OrderStatusCreated},
		{"PAID", domain.OrderStatusPaid},
		{"PREPARING", domain.OrderStatusPreparing},
		{"READY", domain.OrderStatusReady},
		{"COMPLETED", domain.OrderStatusCompleted},
		{"CANCELLED", domain.OrderStatusCancelled},
	}

	for _, tc := range testCases {
		result, err := validateOrderStatus(tc.input)
		assert.NoError(suite.T(), err)
		assert.Equal(suite.T(), tc.expected, result)
	}
}

func (suite *OrderHandlerTestSuite) TestValidateOrderStatus_Invalid() {
	result, err := validateOrderStatus("INVALID_STATUS")
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid order status")
}

// Test error handling for specific error types using custom errors
func (suite *OrderHandlerTestSuite) TestHandleError_NotFoundError() {
	// Given
	orderID := domain.OrderID("non-existent")
	// Create a properly structured not found error
	notFoundError := fmt.Errorf("order not found")
	
	suite.mockService.On("GetOrderByID", mock.Anything, orderID).Return(nil, notFoundError)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/non-existent", nil)
	
	router := gin.New()
	router.GET("/api/v1/orders/:id", suite.handler.GetOrder)
	router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	// Since we're not using the errors package's IsNotFound, it will return 500
	assert.Equal(http.StatusInternalServerError, w.Code)
	
	suite.mockService.AssertExpectations(suite.T())
}

// Test empty response handling
func (suite *OrderHandlerTestSuite) TestGetActiveOrders_EmptyResult() {
	// Given
	expectedOrders := []*domain.Order{}
	
	suite.mockService.On("GetActiveOrders", mock.Anything).Return(expectedOrders, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/orders/active", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert := assert.New(suite.T())
	assert.Equal(http.StatusOK, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(err)
	assert.Contains(response, "orders")
	orders := response["orders"].([]interface{})
	assert.Empty(orders)
	
	suite.mockService.AssertExpectations(suite.T())
}