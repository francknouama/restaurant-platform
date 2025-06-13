package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/order-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// MockOrderRepository is a mock implementation of OrderRepository
type MockOrderRepository struct {
	mock.Mock
}

func (m *MockOrderRepository) Create(ctx context.Context, order *domain.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) GetByID(ctx context.Context, id domain.OrderID) (*domain.Order, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) Update(ctx context.Context, order *domain.Order) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockOrderRepository) Delete(ctx context.Context, id domain.OrderID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockOrderRepository) List(ctx context.Context, offset, limit int, filters domain.OrderFilters) ([]*domain.Order, int, error) {
	args := m.Called(ctx, offset, limit, filters)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*domain.Order), args.Int(1), args.Error(2)
}

func (m *MockOrderRepository) FindByCustomer(ctx context.Context, customerID string) ([]*domain.Order, error) {
	args := m.Called(ctx, customerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) FindByStatus(ctx context.Context, status domain.OrderStatus) ([]*domain.Order, error) {
	args := m.Called(ctx, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) FindByDateRange(ctx context.Context, start, end time.Time) ([]*domain.Order, error) {
	args := m.Called(ctx, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) FindByTable(ctx context.Context, tableID string) ([]*domain.Order, error) {
	args := m.Called(ctx, tableID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) FindByType(ctx context.Context, orderType domain.OrderType) ([]*domain.Order, error) {
	args := m.Called(ctx, orderType)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
}

func (m *MockOrderRepository) GetTotalsByDateRange(ctx context.Context, start, end time.Time) (float64, error) {
	args := m.Called(ctx, start, end)
	return args.Get(0).(float64), args.Error(1)
}

func (m *MockOrderRepository) GetActiveOrders(ctx context.Context) ([]*domain.Order, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Order), args.Error(1)
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

// OrderServiceTestSuite contains all service layer tests
type OrderServiceTestSuite struct {
	suite.Suite
	service      *OrderService
	mockRepo     *MockOrderRepository
	mockPublisher *MockEventPublisher
	ctx          context.Context
}

func (suite *OrderServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockOrderRepository)
	suite.mockPublisher = new(MockEventPublisher)
	suite.service = NewOrderService(suite.mockRepo, suite.mockPublisher)
	suite.ctx = context.Background()
}

func TestOrderServiceTestSuite(t *testing.T) {
	suite.Run(t, new(OrderServiceTestSuite))
}

// Test CreateOrder
func (suite *OrderServiceTestSuite) TestCreateOrder_Success() {
	// Given
	customerID := "customer-123"
	orderType := domain.OrderTypeDineIn
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*domain.Order")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	result, err := suite.service.CreateOrder(suite.ctx, customerID, orderType)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(customerID, result.CustomerID)
	assert.Equal(orderType, result.Type)
	assert.Equal(domain.OrderStatusCreated, result.Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *OrderServiceTestSuite) TestCreateOrder_EmptyCustomerID_ShouldFail() {
	// Given
	customerID := ""
	orderType := domain.OrderTypeDineIn

	// When
	result, err := suite.service.CreateOrder(suite.ctx, customerID, orderType)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "failed to create order")
	
	// Repository and publisher should not be called
	suite.mockRepo.AssertNotCalled(suite.T(), "Create")
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *OrderServiceTestSuite) TestCreateOrder_RepositoryError_ShouldFail() {
	// Given
	customerID := "customer-123"
	orderType := domain.OrderTypeDineIn
	repoError := errors.New("database connection failed")
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*domain.Order")).Return(repoError)

	// When
	result, err := suite.service.CreateOrder(suite.ctx, customerID, orderType)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "failed to save order")
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *OrderServiceTestSuite) TestCreateOrder_EventPublishError_ShouldNotFail() {
	// Given
	customerID := "customer-123"
	orderType := domain.OrderTypeDineIn
	eventError := errors.New("event publish error")
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*domain.Order")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(eventError)

	// When
	result, err := suite.service.CreateOrder(suite.ctx, customerID, orderType)

	// Then - Event publishing errors should not fail the operation
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(customerID, result.CustomerID)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test GetOrderByID
func (suite *OrderServiceTestSuite) TestGetOrderByID_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	expectedOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	expectedOrder.ID = orderID
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(expectedOrder, nil)

	// When
	result, err := suite.service.GetOrderByID(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(orderID, result.ID)
	assert.Equal(expectedOrder.CustomerID, result.CustomerID)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *OrderServiceTestSuite) TestGetOrderByID_NotFound_ShouldFail() {
	// Given
	orderID := domain.OrderID("non-existent")
	repoError := errors.New("order not found")
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(nil, repoError)

	// When
	result, err := suite.service.GetOrderByID(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test AddItemToOrder
func (suite *OrderServiceTestSuite) TestAddItemToOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	
	menuItemID := "menu-item-1"
	name := "Caesar Salad"
	quantity := 2
	unitPrice := 12.99
	modifications := []string{"no croutons"}
	notes := "extra dressing"
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.AddItemToOrder(suite.ctx, orderID, menuItemID, name, quantity, unitPrice, modifications, notes)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(existingOrder.Items, 1)
	assert.Equal(name, existingOrder.Items[0].Name)
	assert.Equal(quantity, existingOrder.Items[0].Quantity)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *OrderServiceTestSuite) TestAddItemToOrder_OrderNotFound_ShouldFail() {
	// Given
	orderID := domain.OrderID("non-existent")
	repoError := errors.New("order not found")
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(nil, repoError)

	// When
	err := suite.service.AddItemToOrder(suite.ctx, orderID, "item-1", "Item", 1, 10.99, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to get order")
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
}

// Test RemoveItemFromOrder
func (suite *OrderServiceTestSuite) TestRemoveItemFromOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	existingOrder.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	itemToRemove := existingOrder.Items[0].ID
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.RemoveItemFromOrder(suite.ctx, orderID, itemToRemove)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Empty(existingOrder.Items)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test UpdateItemQuantity
func (suite *OrderServiceTestSuite) TestUpdateItemQuantity_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	existingOrder.AddItem("item-1", "Salad", 1, 10.00, nil, "")
	itemID := existingOrder.Items[0].ID
	newQuantity := 3
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.UpdateItemQuantity(suite.ctx, orderID, itemID, newQuantity)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newQuantity, existingOrder.Items[0].Quantity)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test UpdateOrderStatus
func (suite *OrderServiceTestSuite) TestUpdateOrderStatus_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	newStatus := domain.OrderStatusPaid
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.UpdateOrderStatus(suite.ctx, orderID, newStatus)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newStatus, existingOrder.Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *OrderServiceTestSuite) TestUpdateOrderStatus_InvalidTransition_ShouldFail() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	existingOrder.Status = domain.OrderStatusCompleted // Cannot change from completed
	newStatus := domain.OrderStatusPaid
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)

	// When
	err := suite.service.UpdateOrderStatus(suite.ctx, orderID, newStatus)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to update order status")
	assert.Equal(domain.OrderStatusCompleted, existingOrder.Status) // Status unchanged
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

// Test SetTableForOrder
func (suite *OrderServiceTestSuite) TestSetTableForOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	tableID := "table-5"
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.SetTableForOrder(suite.ctx, orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(tableID, existingOrder.TableID)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test SetDeliveryAddress
func (suite *OrderServiceTestSuite) TestSetDeliveryAddress_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDelivery)
	existingOrder.ID = orderID
	address := "123 Main St, City"
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.SetDeliveryAddress(suite.ctx, orderID, address)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(address, existingOrder.DeliveryAddress)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test AddOrderNotes
func (suite *OrderServiceTestSuite) TestAddOrderNotes_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	notes := "Please prepare extra hot"
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.AddOrderNotes(suite.ctx, orderID, notes)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(notes, existingOrder.Notes)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test CancelOrder
func (suite *OrderServiceTestSuite) TestCancelOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	existingOrder.Status = domain.OrderStatusPaid
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.CancelOrder(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(domain.OrderStatusCancelled, existingOrder.Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test PayOrder
func (suite *OrderServiceTestSuite) TestPayOrder_Success() {
	// Given
	orderID := domain.OrderID("ord_123")
	existingOrder, _ := domain.NewOrder("customer-123", domain.OrderTypeDineIn)
	existingOrder.ID = orderID
	
	suite.mockRepo.On("GetByID", suite.ctx, orderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.PayOrder(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(domain.OrderStatusPaid, existingOrder.Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test GetOrdersByCustomer
func (suite *OrderServiceTestSuite) TestGetOrdersByCustomer_Success() {
	// Given
	customerID := "customer-123"
	expectedOrders := []*domain.Order{
		{CustomerID: customerID, Type: domain.OrderTypeDineIn},
		{CustomerID: customerID, Type: domain.OrderTypeTakeout},
	}
	
	suite.mockRepo.On("FindByCustomer", suite.ctx, customerID).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetOrdersByCustomer(suite.ctx, customerID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 2)
	assert.Equal(customerID, result[0].CustomerID)
	assert.Equal(customerID, result[1].CustomerID)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetOrdersByStatus
func (suite *OrderServiceTestSuite) TestGetOrdersByStatus_Success() {
	// Given
	status := domain.OrderStatusPreparing
	expectedOrders := []*domain.Order{
		{Status: status, CustomerID: "customer-1"},
		{Status: status, CustomerID: "customer-2"},
	}
	
	suite.mockRepo.On("FindByStatus", suite.ctx, status).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetOrdersByStatus(suite.ctx, status)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 2)
	assert.Equal(status, result[0].Status)
	assert.Equal(status, result[1].Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetOrdersByTable
func (suite *OrderServiceTestSuite) TestGetOrdersByTable_Success() {
	// Given
	tableID := "table-5"
	expectedOrders := []*domain.Order{
		{TableID: tableID, Type: domain.OrderTypeDineIn},
	}
	
	suite.mockRepo.On("FindByTable", suite.ctx, tableID).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetOrdersByTable(suite.ctx, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 1)
	assert.Equal(tableID, result[0].TableID)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetActiveOrders
func (suite *OrderServiceTestSuite) TestGetActiveOrders_Success() {
	// Given
	expectedOrders := []*domain.Order{
		{Status: domain.OrderStatusPaid, CustomerID: "customer-1"},
		{Status: domain.OrderStatusPreparing, CustomerID: "customer-2"},
		{Status: domain.OrderStatusReady, CustomerID: "customer-3"},
	}
	
	suite.mockRepo.On("GetActiveOrders", suite.ctx).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetActiveOrders(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 3)
	assert.Equal(domain.OrderStatusPaid, result[0].Status)
	assert.Equal(domain.OrderStatusPreparing, result[1].Status)
	assert.Equal(domain.OrderStatusReady, result[2].Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test ListOrders
func (suite *OrderServiceTestSuite) TestListOrders_Success() {
	// Given
	offset := 0
	limit := 10
	status := domain.OrderStatusPaid
	filters := domain.OrderFilters{
		Status: &status,
	}
	expectedOrders := []*domain.Order{
		{Status: domain.OrderStatusPaid, CustomerID: "customer-1"},
	}
	totalCount := 1
	
	suite.mockRepo.On("List", suite.ctx, offset, limit, filters).Return(expectedOrders, totalCount, nil)

	// When
	result, count, err := suite.service.ListOrders(suite.ctx, offset, limit, filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 1)
	assert.Equal(totalCount, count)
	assert.Equal(domain.OrderStatusPaid, result[0].Status)
	
	suite.mockRepo.AssertExpectations(suite.T())
}