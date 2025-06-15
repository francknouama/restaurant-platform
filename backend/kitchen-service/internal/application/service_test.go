package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/kitchen-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// MockKitchenOrderRepository is a mock implementation of KitchenOrderRepository
type MockKitchenOrderRepository struct {
	mock.Mock
}

func (m *MockKitchenOrderRepository) Save(ctx context.Context, order *domain.KitchenOrder) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockKitchenOrderRepository) Update(ctx context.Context, order *domain.KitchenOrder) error {
	args := m.Called(ctx, order)
	return args.Error(0)
}

func (m *MockKitchenOrderRepository) FindByID(ctx context.Context, id domain.KitchenOrderID) (*domain.KitchenOrder, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.KitchenOrder), args.Error(1)
}

func (m *MockKitchenOrderRepository) FindByOrderID(ctx context.Context, orderID string) (*domain.KitchenOrder, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.KitchenOrder), args.Error(1)
}

func (m *MockKitchenOrderRepository) FindByStatus(ctx context.Context, status domain.KitchenOrderStatus) ([]*domain.KitchenOrder, error) {
	args := m.Called(ctx, status)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.KitchenOrder), args.Error(1)
}

func (m *MockKitchenOrderRepository) FindByStation(ctx context.Context, stationID string) ([]*domain.KitchenOrder, error) {
	args := m.Called(ctx, stationID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.KitchenOrder), args.Error(1)
}

func (m *MockKitchenOrderRepository) FindActive(ctx context.Context) ([]*domain.KitchenOrder, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.KitchenOrder), args.Error(1)
}

func (m *MockKitchenOrderRepository) List(ctx context.Context, offset, limit int, filters domain.KitchenOrderFilters) ([]*domain.KitchenOrder, int, error) {
	args := m.Called(ctx, offset, limit, filters)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*domain.KitchenOrder), args.Int(1), args.Error(2)
}

func (m *MockKitchenOrderRepository) Delete(ctx context.Context, id domain.KitchenOrderID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockKitchenOrderRepository) Count(ctx context.Context, filters domain.KitchenOrderFilters) (int, error) {
	args := m.Called(ctx, filters)
	return args.Int(0), args.Error(1)
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

// KitchenOrderServiceTestSuite contains all service layer tests
type KitchenOrderServiceTestSuite struct {
	suite.Suite
	service       *KitchenOrderService
	mockRepo      *MockKitchenOrderRepository
	mockPublisher *MockEventPublisher
	ctx           context.Context
}

func (suite *KitchenOrderServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockKitchenOrderRepository)
	suite.mockPublisher = new(MockEventPublisher)
	suite.service = NewKitchenOrderService(suite.mockRepo, suite.mockPublisher)
	suite.ctx = context.Background()
}

func TestKitchenOrderServiceTestSuite(t *testing.T) {
	suite.Run(t, new(KitchenOrderServiceTestSuite))
}

// Test CreateKitchenOrder
func (suite *KitchenOrderServiceTestSuite) TestCreateKitchenOrder_Success() {
	// Given
	orderID := "order-123"
	tableID := "table-5"

	suite.mockRepo.On("Save", suite.ctx, mock.AnythingOfType("*domain.KitchenOrder")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	result, err := suite.service.CreateKitchenOrder(suite.ctx, orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(orderID, result.OrderID)
	assert.Equal(tableID, result.TableID)
	assert.Equal(domain.KitchenOrderStatusNew, result.Status)
	assert.Equal(domain.KitchenPriorityNormal, result.Priority)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestCreateKitchenOrder_EmptyOrderID_ShouldFail() {
	// Given
	orderID := ""
	tableID := "table-5"

	// When
	result, err := suite.service.CreateKitchenOrder(suite.ctx, orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "failed to create kitchen order")

	// Repository and publisher should not be called
	suite.mockRepo.AssertNotCalled(suite.T(), "Save")
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *KitchenOrderServiceTestSuite) TestCreateKitchenOrder_RepositoryError_ShouldFail() {
	// Given
	orderID := "order-123"
	tableID := "table-5"
	repoError := errors.New("database connection failed")

	suite.mockRepo.On("Save", suite.ctx, mock.AnythingOfType("*domain.KitchenOrder")).Return(repoError)

	// When
	result, err := suite.service.CreateKitchenOrder(suite.ctx, orderID, tableID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "failed to save kitchen order")

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *KitchenOrderServiceTestSuite) TestCreateKitchenOrder_EventPublishError_ShouldNotFail() {
	// Given
	orderID := "order-123"
	tableID := "table-5"
	eventError := errors.New("event publish error")

	suite.mockRepo.On("Save", suite.ctx, mock.AnythingOfType("*domain.KitchenOrder")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(eventError)

	// When
	result, err := suite.service.CreateKitchenOrder(suite.ctx, orderID, tableID)

	// Then - Event publishing errors should not fail the operation
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(orderID, result.OrderID)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test GetKitchenOrder
func (suite *KitchenOrderServiceTestSuite) TestGetKitchenOrder_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	expectedOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	expectedOrder.ID = kitchenOrderID

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(expectedOrder, nil)

	// When
	result, err := suite.service.GetKitchenOrder(suite.ctx, kitchenOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(kitchenOrderID, result.ID)
	assert.Equal(expectedOrder.OrderID, result.OrderID)

	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestGetKitchenOrder_NotFound_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("non-existent")
	repoError := errors.New("kitchen order not found")

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(nil, repoError)

	// When
	result, err := suite.service.GetKitchenOrder(suite.ctx, kitchenOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetKitchenOrderByOrderID
func (suite *KitchenOrderServiceTestSuite) TestGetKitchenOrderByOrderID_Success() {
	// Given
	orderID := "order-123"
	expectedOrder, _ := domain.NewKitchenOrder(orderID, "table-5")

	suite.mockRepo.On("FindByOrderID", suite.ctx, orderID).Return(expectedOrder, nil)

	// When
	result, err := suite.service.GetKitchenOrderByOrderID(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(orderID, result.OrderID)

	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestGetKitchenOrderByOrderID_NotFound_ShouldFail() {
	// Given
	orderID := "non-existent"
	repoError := errors.New("kitchen order not found")

	suite.mockRepo.On("FindByOrderID", suite.ctx, orderID).Return(nil, repoError)

	// When
	result, err := suite.service.GetKitchenOrderByOrderID(suite.ctx, orderID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test AddKitchenItem
func (suite *KitchenOrderServiceTestSuite) TestAddKitchenItem_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID

	menuItemID := "menu-item-1"
	name := "Caesar Salad"
	quantity := 2
	prepTime := 15 * time.Minute
	modifications := []string{"no croutons"}
	notes := "extra dressing"

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)

	// When
	err := suite.service.AddKitchenItem(suite.ctx, kitchenOrderID, menuItemID, name, quantity, prepTime, modifications, notes)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(existingOrder.Items, 1)
	assert.Equal(name, existingOrder.Items[0].Name)
	assert.Equal(quantity, existingOrder.Items[0].Quantity)

	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestAddKitchenItem_OrderNotFound_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("non-existent")
	repoError := errors.New("kitchen order not found")

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(nil, repoError)

	// When
	err := suite.service.AddKitchenItem(suite.ctx, kitchenOrderID, "item-1", "Item", 1, 10*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to get kitchen order")

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
}

// Test UpdateItemStatus
func (suite *KitchenOrderServiceTestSuite) TestUpdateItemStatus_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.AddItem("item-1", "Salad", 1, 10*time.Minute, nil, "")
	itemID := string(existingOrder.Items[0].ID)
	newStatus := domain.KitchenItemStatusPreparing

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.UpdateItemStatus(suite.ctx, kitchenOrderID, itemID, newStatus)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newStatus, existingOrder.Items[0].Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestUpdateItemStatus_InvalidTransition_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.AddItem("item-1", "Salad", 1, 10*time.Minute, nil, "")
	itemID := string(existingOrder.Items[0].ID)
	// Try to go directly from NEW to READY (invalid transition)
	invalidStatus := domain.KitchenItemStatusReady

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)

	// When
	err := suite.service.UpdateItemStatus(suite.ctx, kitchenOrderID, itemID, invalidStatus)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to update item status")
	assert.Equal(domain.KitchenItemStatusNew, existingOrder.Items[0].Status) // Status unchanged

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
}

// Test UpdateOrderStatus
func (suite *KitchenOrderServiceTestSuite) TestUpdateOrderStatus_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	newStatus := domain.KitchenOrderStatusPreparing

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.UpdateOrderStatus(suite.ctx, kitchenOrderID, newStatus)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newStatus, existingOrder.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestUpdateOrderStatus_InvalidTransition_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.Status = domain.KitchenOrderStatusCompleted // Cannot change from completed
	newStatus := domain.KitchenOrderStatusPreparing

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)

	// When
	err := suite.service.UpdateOrderStatus(suite.ctx, kitchenOrderID, newStatus)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to update order status")
	assert.Equal(domain.KitchenOrderStatusCompleted, existingOrder.Status) // Status unchanged

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

// Test AssignToStation
func (suite *KitchenOrderServiceTestSuite) TestAssignToStation_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	stationID := "grill-station-1"

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.AssignToStation(suite.ctx, kitchenOrderID, stationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(stationID, existingOrder.AssignedStation)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestAssignToStation_EmptyStationID_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	stationID := ""

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)

	// When
	err := suite.service.AssignToStation(suite.ctx, kitchenOrderID, stationID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to assign kitchen order to station")

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
}

// Test SetPriority
func (suite *KitchenOrderServiceTestSuite) TestSetPriority_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	newPriority := domain.KitchenPriorityHigh

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.SetPriority(suite.ctx, kitchenOrderID, newPriority)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newPriority, existingOrder.Priority)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test CancelKitchenOrder
func (suite *KitchenOrderServiceTestSuite) TestCancelKitchenOrder_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.Status = domain.KitchenOrderStatusPreparing

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.CancelKitchenOrder(suite.ctx, kitchenOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(domain.KitchenOrderStatusCancelled, existingOrder.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestCancelKitchenOrder_CompletedOrder_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.Status = domain.KitchenOrderStatusCompleted

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)

	// When
	err := suite.service.CancelKitchenOrder(suite.ctx, kitchenOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to cancel kitchen order")
	assert.Equal(domain.KitchenOrderStatusCompleted, existingOrder.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockRepo.AssertNotCalled(suite.T(), "Update")
}

// Test CompleteKitchenOrder
func (suite *KitchenOrderServiceTestSuite) TestCompleteKitchenOrder_Success() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	existingOrder.Status = domain.KitchenOrderStatusReady

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.CompleteKitchenOrder(suite.ctx, kitchenOrderID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(domain.KitchenOrderStatusCompleted, existingOrder.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test GetActiveOrders
func (suite *KitchenOrderServiceTestSuite) TestGetActiveOrders_Success() {
	// Given
	expectedOrders := []*domain.KitchenOrder{
		{Status: domain.KitchenOrderStatusPreparing, OrderID: "order-1"},
		{Status: domain.KitchenOrderStatusReady, OrderID: "order-2"},
	}

	suite.mockRepo.On("FindActive", suite.ctx).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetActiveOrders(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 2)
	assert.Equal("order-1", result[0].OrderID)
	assert.Equal("order-2", result[1].OrderID)

	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestGetActiveOrders_RepositoryError_ShouldFail() {
	// Given
	repoError := errors.New("database connection failed")
	suite.mockRepo.On("FindActive", suite.ctx).Return(nil, repoError)

	// When
	result, err := suite.service.GetActiveOrders(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetOrdersByStatus
func (suite *KitchenOrderServiceTestSuite) TestGetOrdersByStatus_Success() {
	// Given
	status := domain.KitchenOrderStatusPreparing
	expectedOrders := []*domain.KitchenOrder{
		{Status: status, OrderID: "order-1"},
		{Status: status, OrderID: "order-2"},
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

// Test GetOrdersByStation
func (suite *KitchenOrderServiceTestSuite) TestGetOrdersByStation_Success() {
	// Given
	stationID := "grill-station-1"
	expectedOrders := []*domain.KitchenOrder{
		{AssignedStation: stationID, OrderID: "order-1"},
	}

	suite.mockRepo.On("FindByStation", suite.ctx, stationID).Return(expectedOrders, nil)

	// When
	result, err := suite.service.GetOrdersByStation(suite.ctx, stationID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 1)
	assert.Equal(stationID, result[0].AssignedStation)

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test ListKitchenOrders
func (suite *KitchenOrderServiceTestSuite) TestListKitchenOrders_Success() {
	// Given
	offset := 0
	limit := 10
	status := domain.KitchenOrderStatusPreparing
	filters := domain.KitchenOrderFilters{
		Status: &status,
	}
	expectedOrders := []*domain.KitchenOrder{
		{Status: domain.KitchenOrderStatusPreparing, OrderID: "order-1"},
	}
	totalCount := 1

	suite.mockRepo.On("List", suite.ctx, offset, limit, filters).Return(expectedOrders, totalCount, nil)

	// When
	result, count, err := suite.service.ListKitchenOrders(suite.ctx, offset, limit, filters)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 1)
	assert.Equal(totalCount, count)
	assert.Equal(domain.KitchenOrderStatusPreparing, result[0].Status)

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test Validation Helpers
func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenOrderStatus_ValidStatuses() {
	testCases := []struct {
		input    string
		expected domain.KitchenOrderStatus
	}{
		{"NEW", domain.KitchenOrderStatusNew},
		{"PREPARING", domain.KitchenOrderStatusPreparing},
		{"READY", domain.KitchenOrderStatusReady},
		{"COMPLETED", domain.KitchenOrderStatusCompleted},
		{"CANCELLED", domain.KitchenOrderStatusCancelled},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.input, func(t *testing.T) {
			// When
			result, err := ValidateKitchenOrderStatus(tc.input)

			// Then
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenOrderStatus_InvalidStatus() {
	// When
	result, err := ValidateKitchenOrderStatus("INVALID_STATUS")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Empty(result)
	assert.Contains(err.Error(), "invalid kitchen order status")
}

func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenItemStatus_ValidStatuses() {
	testCases := []struct {
		input    string
		expected domain.KitchenItemStatus
	}{
		{"NEW", domain.KitchenItemStatusNew},
		{"PREPARING", domain.KitchenItemStatusPreparing},
		{"READY", domain.KitchenItemStatusReady},
		{"CANCELLED", domain.KitchenItemStatusCancelled},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.input, func(t *testing.T) {
			// When
			result, err := ValidateKitchenItemStatus(tc.input)

			// Then
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenItemStatus_InvalidStatus() {
	// When
	result, err := ValidateKitchenItemStatus("INVALID_STATUS")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Empty(result)
	assert.Contains(err.Error(), "invalid kitchen item status")
}

func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenPriority_ValidPriorities() {
	testCases := []struct {
		input    string
		expected domain.KitchenPriority
	}{
		{"LOW", domain.KitchenPriorityLow},
		{"NORMAL", domain.KitchenPriorityNormal},
		{"HIGH", domain.KitchenPriorityHigh},
		{"URGENT", domain.KitchenPriorityUrgent},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.input, func(t *testing.T) {
			// When
			result, err := ValidateKitchenPriority(tc.input)

			// Then
			assert.NoError(t, err)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func (suite *KitchenOrderServiceTestSuite) TestValidateKitchenPriority_InvalidPriority() {
	// When
	result, err := ValidateKitchenPriority("INVALID_PRIORITY")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Empty(result)
	assert.Contains(err.Error(), "invalid kitchen priority")
}

// Test Error Handling Edge Cases
func (suite *KitchenOrderServiceTestSuite) TestUpdateOrderStatus_EventPublishError_ShouldNotFailOperation() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	newStatus := domain.KitchenOrderStatusPreparing
	eventError := errors.New("event publish error")

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(eventError)

	// When
	err := suite.service.UpdateOrderStatus(suite.ctx, kitchenOrderID, newStatus)

	// Then - Event publishing errors should not fail the operation
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal(newStatus, existingOrder.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *KitchenOrderServiceTestSuite) TestAddKitchenItem_UpdateRepositoryError_ShouldFail() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	existingOrder, _ := domain.NewKitchenOrder("order-123", "table-5")
	existingOrder.ID = kitchenOrderID
	updateError := errors.New("database update failed")

	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(existingOrder, nil)
	suite.mockRepo.On("Update", suite.ctx, existingOrder).Return(updateError)

	// When
	err := suite.service.AddKitchenItem(suite.ctx, kitchenOrderID, "item-1", "Item", 1, 10*time.Minute, nil, "")

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "failed to update kitchen order")

	suite.mockRepo.AssertExpectations(suite.T())
}

// Test Complex Scenarios
func (suite *KitchenOrderServiceTestSuite) TestComplexWorkflow_OrderLifecycle() {
	// Given
	kitchenOrderID := domain.KitchenOrderID("ko_123")
	order, _ := domain.NewKitchenOrder("order-123", "table-5")
	order.ID = kitchenOrderID

	// Mock expectations for each step of the workflow
	suite.mockRepo.On("FindByID", suite.ctx, kitchenOrderID).Return(order, nil).Times(4)
	suite.mockRepo.On("Update", suite.ctx, order).Return(nil).Times(4)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When - Simulate a complete workflow
	// 1. Add items
	err1 := suite.service.AddKitchenItem(suite.ctx, kitchenOrderID, "item-1", "Burger", 1, 15*time.Minute, nil, "")
	// 2. Assign to station
	err2 := suite.service.AssignToStation(suite.ctx, kitchenOrderID, "grill-station-1")
	// 3. Set priority
	err3 := suite.service.SetPriority(suite.ctx, kitchenOrderID, domain.KitchenPriorityHigh)
	// 4. Update status
	err4 := suite.service.UpdateOrderStatus(suite.ctx, kitchenOrderID, domain.KitchenOrderStatusPreparing)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err1)
	assert.NoError(err2)
	assert.NoError(err3)
	assert.NoError(err4)

	assert.Len(order.Items, 1)
	assert.Equal("grill-station-1", order.AssignedStation)
	assert.Equal(domain.KitchenPriorityHigh, order.Priority)
	assert.Equal(domain.KitchenOrderStatusPreparing, order.Status)

	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}