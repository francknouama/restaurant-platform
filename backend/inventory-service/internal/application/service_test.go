package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
	sharederrors "github.com/restaurant-platform/shared/pkg/errors"
)

// Mock implementations for testing
type MockInventoryRepository struct {
	mock.Mock
}

func (m *MockInventoryRepository) CreateItem(ctx context.Context, item *inventory.InventoryItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockInventoryRepository) GetItemByID(ctx context.Context, id inventory.InventoryItemID) (*inventory.InventoryItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) GetItemBySKU(ctx context.Context, sku string) (*inventory.InventoryItem, error) {
	args := m.Called(ctx, sku)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) UpdateItem(ctx context.Context, item *inventory.InventoryItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *MockInventoryRepository) DeleteItem(ctx context.Context, id inventory.InventoryItemID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInventoryRepository) ListItems(ctx context.Context, offset, limit int) ([]*inventory.InventoryItem, int, error) {
	args := m.Called(ctx, offset, limit)
	return args.Get(0).([]*inventory.InventoryItem), args.Int(1), args.Error(2)
}

func (m *MockInventoryRepository) GetLowStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) GetOutOfStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) GetItemsByCategory(ctx context.Context, category string) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, category)
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) SearchItems(ctx context.Context, query string) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, query)
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *MockInventoryRepository) CheckStockAvailability(ctx context.Context, sku string, quantity float64) (bool, error) {
	args := m.Called(ctx, sku, quantity)
	return args.Bool(0), args.Error(1)
}

func (m *MockInventoryRepository) CreateMovement(ctx context.Context, movement *inventory.StockMovement) error {
	args := m.Called(ctx, movement)
	return args.Error(0)
}

func (m *MockInventoryRepository) GetMovementsByItemID(ctx context.Context, itemID inventory.InventoryItemID, limit int) ([]*inventory.StockMovement, error) {
	args := m.Called(ctx, itemID, limit)
	return args.Get(0).([]*inventory.StockMovement), args.Error(1)
}

func (m *MockInventoryRepository) GetMovementsByDateRange(ctx context.Context, start, end time.Time) ([]*inventory.StockMovement, error) {
	args := m.Called(ctx, start, end)
	return args.Get(0).([]*inventory.StockMovement), args.Error(1)
}

func (m *MockInventoryRepository) CreateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *MockInventoryRepository) GetSupplierByID(ctx context.Context, id inventory.SupplierID) (*inventory.Supplier, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.Supplier), args.Error(1)
}

func (m *MockInventoryRepository) UpdateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *MockInventoryRepository) DeleteSupplier(ctx context.Context, id inventory.SupplierID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockInventoryRepository) ListSuppliers(ctx context.Context, offset, limit int) ([]*inventory.Supplier, int, error) {
	args := m.Called(ctx, offset, limit)
	return args.Get(0).([]*inventory.Supplier), args.Int(1), args.Error(2)
}

func (m *MockInventoryRepository) GetActiveSuppliers(ctx context.Context) ([]*inventory.Supplier, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*inventory.Supplier), args.Error(1)
}

func (m *MockInventoryRepository) GetItemsBySupplier(ctx context.Context, supplierID inventory.SupplierID) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, supplierID)
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

// Mock Event Publisher
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

// Test Suite
type InventoryServiceTestSuite struct {
	suite.Suite
	service         *InventoryService
	mockRepo        *MockInventoryRepository
	mockPublisher   *MockEventPublisher
	ctx             context.Context
}

func TestInventoryServiceTestSuite(t *testing.T) {
	suite.Run(t, new(InventoryServiceTestSuite))
}

func (suite *InventoryServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockInventoryRepository)
	suite.mockPublisher = new(MockEventPublisher)
	suite.ctx = context.Background()

	suite.service = NewInventoryService(suite.mockRepo, suite.mockPublisher)
}

func (suite *InventoryServiceTestSuite) TearDownTest() {
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test CreateItem
func (suite *InventoryServiceTestSuite) TestCreateItem_Success() {
	// Given
	sku := "INV001"
	name := "Test Item"
	initialStock := 100.0
	unit := inventory.UnitTypeKilograms
	cost := 5.50

	// Setup mocks
	suite.mockRepo.On("CreateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	item, err := suite.service.CreateItem(suite.ctx, sku, name, initialStock, unit, cost)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), item)
	assert.Equal(suite.T(), sku, item.SKU)
	assert.Equal(suite.T(), name, item.Name)
	assert.Equal(suite.T(), initialStock, item.CurrentStock)
	assert.Equal(suite.T(), unit, item.Unit)
	assert.Equal(suite.T(), cost, item.Cost)
}

func (suite *InventoryServiceTestSuite) TestCreateItem_InvalidInput() {
	// When
	item, err := suite.service.CreateItem(suite.ctx, "", "Test Item", 100.0, inventory.UnitTypeKilograms, 5.50)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
}

func (suite *InventoryServiceTestSuite) TestCreateItem_RepositoryError() {
	// Given
	sku := "INV001"
	name := "Test Item"
	initialStock := 100.0
	unit := inventory.UnitTypeKilograms
	cost := 5.50
	
	repositoryError := errors.New("database connection failed")

	// Setup mocks
	suite.mockRepo.On("CreateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(repositoryError)

	// When
	item, err := suite.service.CreateItem(suite.ctx, sku, name, initialStock, unit, cost)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.Equal(suite.T(), repositoryError, err)
}

// Test GetItem
func (suite *InventoryServiceTestSuite) TestGetItem_Success() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	expectedItem := &inventory.InventoryItem{
		ID:   itemID,
		SKU:  "INV001",
		Name: "Test Item",
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(expectedItem, nil)

	// When
	item, err := suite.service.GetItem(suite.ctx, itemID)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedItem, item)
}

func (suite *InventoryServiceTestSuite) TestGetItem_NotFound() {
	// Given
	itemID := inventory.InventoryItemID("nonexistent")
	notFoundError := sharederrors.WrapNotFound("GetItemByID", "item", itemID.String(), nil)

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(nil, notFoundError)

	// When
	item, err := suite.service.GetItem(suite.ctx, itemID)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsNotFound(err))
}

// Test GetItemBySKU
func (suite *InventoryServiceTestSuite) TestGetItemBySKU_Success() {
	// Given
	sku := "INV001"
	expectedItem := &inventory.InventoryItem{
		ID:   inventory.InventoryItemID("inv_123"),
		SKU:  sku,
		Name: "Test Item",
	}

	// Setup mocks
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(expectedItem, nil)

	// When
	item, err := suite.service.GetItemBySKU(suite.ctx, sku)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedItem, item)
}

// Test AddStock
func (suite *InventoryServiceTestSuite) TestAddStock_Success() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	quantity := 50.0
	notes := "Restock delivery"
	reference := "PO001"
	performedBy := "manager"

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Test Item",
		CurrentStock: 25.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.AddStock(suite.ctx, itemID, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 75.0, item.CurrentStock) // 25 + 50
	assert.Len(suite.T(), item.Movements, 1)
	assert.Equal(suite.T(), inventory.MovementTypeReceived, item.Movements[0].Type)
	assert.Equal(suite.T(), quantity, item.Movements[0].Quantity)
}

func (suite *InventoryServiceTestSuite) TestAddStock_ItemNotFound() {
	// Given
	itemID := inventory.InventoryItemID("nonexistent")
	notFoundError := sharederrors.WrapNotFound("GetItemByID", "item", itemID.String(), nil)

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(nil, notFoundError)

	// When
	err := suite.service.AddStock(suite.ctx, itemID, 50.0, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsNotFound(err))
}

// Test UseStock
func (suite *InventoryServiceTestSuite) TestUseStock_Success() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	quantity := 20.0
	notes := "Used for order"
	reference := "ORD001"
	performedBy := "kitchen"

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Test Item",
		CurrentStock: 50.0,
		ReorderPoint: 10.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.UseStock(suite.ctx, itemID, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 30.0, item.CurrentStock) // 50 - 20
	assert.Len(suite.T(), item.Movements, 1)
	assert.Equal(suite.T(), inventory.MovementTypeUsed, item.Movements[0].Type)
	assert.Equal(suite.T(), quantity, item.Movements[0].Quantity)
}

func (suite *InventoryServiceTestSuite) TestUseStock_InsufficientStock() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	quantity := 60.0 // More than available

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Test Item",
		CurrentStock: 50.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)

	// When
	err := suite.service.UseStock(suite.ctx, itemID, quantity, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
	assert.Equal(suite.T(), 50.0, item.CurrentStock) // Unchanged
	assert.Len(suite.T(), item.Movements, 0) // No movement added
}

func (suite *InventoryServiceTestSuite) TestUseStock_TriggersLowStockAlert() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	quantity := 35.0

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Test Item",
		CurrentStock: 40.0,
		ReorderPoint: 10.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	
	// Expect two events: stock used + low stock alert
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil).Twice()

	// When
	err := suite.service.UseStock(suite.ctx, itemID, quantity, "notes", "ref", "user")

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5.0, item.CurrentStock) // 40 - 35
	assert.True(suite.T(), item.IsLowStock()) // Below reorder point
}

func (suite *InventoryServiceTestSuite) TestUseStock_TriggersOutOfStockAlert() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	quantity := 40.0

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Test Item",
		CurrentStock: 40.0,
		ReorderPoint: 10.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	
	// Expect two events: stock used + out of stock alert
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil).Twice()

	// When
	err := suite.service.UseStock(suite.ctx, itemID, quantity, "notes", "ref", "user")

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0.0, item.CurrentStock)
	assert.True(suite.T(), item.IsOutOfStock())
}

// Test ReserveStock
func (suite *InventoryServiceTestSuite) TestReserveStock_Success() {
	// Given
	sku := "INV001"
	quantity := 25.0
	reference := "ORD001"
	performedBy := "system"

	item := &inventory.InventoryItem{
		ID:           inventory.InventoryItemID("inv_123"),
		SKU:          sku,
		Name:         "Test Item",
		CurrentStock: 50.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.ReserveStock(suite.ctx, sku, quantity, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 25.0, item.CurrentStock) // 50 - 25
	assert.Len(suite.T(), item.Movements, 1)
	assert.Equal(suite.T(), inventory.MovementTypeUsed, item.Movements[0].Type)
	assert.Contains(suite.T(), item.Movements[0].Notes, "Stock reserved for order")
}

func (suite *InventoryServiceTestSuite) TestReserveStock_InsufficientStock() {
	// Given
	sku := "INV001"
	quantity := 60.0 // More than available
	reference := "ORD001"
	performedBy := "system"

	item := &inventory.InventoryItem{
		ID:           inventory.InventoryItemID("inv_123"),
		SKU:          sku,
		Name:         "Test Item",
		CurrentStock: 50.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Setup mocks
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(item, nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil) // Out of stock alert

	// When
	err := suite.service.ReserveStock(suite.ctx, sku, quantity, reference, performedBy)

	// Then
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), sharederrors.ErrInsufficientStock, err)
	assert.Equal(suite.T(), 50.0, item.CurrentStock) // Unchanged
	assert.Len(suite.T(), item.Movements, 0) // No reservation made
}

// Test CheckAvailability
func (suite *InventoryServiceTestSuite) TestCheckAvailability_Success() {
	// Given
	sku := "INV001"
	quantity := 25.0

	// Setup mocks
	suite.mockRepo.On("CheckStockAvailability", suite.ctx, sku, quantity).Return(true, nil)

	// When
	available, err := suite.service.CheckAvailability(suite.ctx, sku, quantity)

	// Then
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), available)
}

func (suite *InventoryServiceTestSuite) TestCheckAvailability_NotAvailable() {
	// Given
	sku := "INV001"
	quantity := 100.0

	// Setup mocks
	suite.mockRepo.On("CheckStockAvailability", suite.ctx, sku, quantity).Return(false, nil)

	// When
	available, err := suite.service.CheckAvailability(suite.ctx, sku, quantity)

	// Then
	assert.NoError(suite.T(), err)
	assert.False(suite.T(), available)
}

// Test GetStockLevel
func (suite *InventoryServiceTestSuite) TestGetStockLevel_Success() {
	// Given
	sku := "INV001"
	expectedStock := 45.5

	item := &inventory.InventoryItem{
		ID:           inventory.InventoryItemID("inv_123"),
		SKU:          sku,
		CurrentStock: expectedStock,
	}

	// Setup mocks
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(item, nil)

	// When
	stockLevel, err := suite.service.GetStockLevel(suite.ctx, sku)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedStock, stockLevel)
}

func (suite *InventoryServiceTestSuite) TestGetStockLevel_ItemNotFound() {
	// Given
	sku := "NONEXISTENT"
	notFoundError := sharederrors.WrapNotFound("GetItemBySKU", "item", sku, nil)

	// Setup mocks
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(nil, notFoundError)

	// When
	stockLevel, err := suite.service.GetStockLevel(suite.ctx, sku)

	// Then
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), 0.0, stockLevel)
	assert.True(suite.T(), sharederrors.IsNotFound(err))
}

// Test UpdateThresholds
func (suite *InventoryServiceTestSuite) TestUpdateThresholds_Success() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	min := 5.0
	max := 100.0
	reorderPoint := 15.0

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		CurrentStock: 50.0,
		Unit:         inventory.UnitTypeKilograms,
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)

	// When
	err := suite.service.UpdateThresholds(suite.ctx, itemID, min, max, reorderPoint)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), min, item.MinThreshold)
	assert.Equal(suite.T(), max, item.MaxThreshold)
	assert.Equal(suite.T(), reorderPoint, item.ReorderPoint)
}

func (suite *InventoryServiceTestSuite) TestUpdateThresholds_InvalidValues() {
	// Given
	itemID := inventory.InventoryItemID("inv_123")
	min := 50.0
	max := 30.0 // Invalid: max < min
	reorderPoint := 40.0

	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		CurrentStock: 50.0,
		Unit:         inventory.UnitTypeKilograms,
	}

	// Setup mocks
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)

	// When
	err := suite.service.UpdateThresholds(suite.ctx, itemID, min, max, reorderPoint)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
}

// Test GetLowStockItems
func (suite *InventoryServiceTestSuite) TestGetLowStockItems_Success() {
	// Given
	expectedItems := []*inventory.InventoryItem{
		{
			ID:           inventory.InventoryItemID("inv_123"),
			SKU:          "INV001",
			Name:         "Low Stock Item",
			CurrentStock: 5.0,
			ReorderPoint: 10.0,
		},
	}

	// Setup mocks
	suite.mockRepo.On("GetLowStockItems", suite.ctx).Return(expectedItems, nil)

	// When
	items, err := suite.service.GetLowStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedItems, items)
}

// Test GetOutOfStockItems
func (suite *InventoryServiceTestSuite) TestGetOutOfStockItems_Success() {
	// Given
	expectedItems := []*inventory.InventoryItem{
		{
			ID:           inventory.InventoryItemID("inv_123"),
			SKU:          "INV001",
			Name:         "Out of Stock Item",
			CurrentStock: 0.0,
		},
	}

	// Setup mocks
	suite.mockRepo.On("GetOutOfStockItems", suite.ctx).Return(expectedItems, nil)

	// When
	items, err := suite.service.GetOutOfStockItems(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedItems, items)
}

// Test ListItems
func (suite *InventoryServiceTestSuite) TestListItems_Success() {
	// Given
	offset := 0
	limit := 10
	filters := inventory.InventoryFilters{}
	
	expectedItems := []*inventory.InventoryItem{
		{
			ID:   inventory.InventoryItemID("inv_123"),
			SKU:  "INV001",
			Name: "Item 1",
		},
		{
			ID:   inventory.InventoryItemID("inv_456"),
			SKU:  "INV002",
			Name: "Item 2",
		},
	}
	expectedTotal := 2

	// Setup mocks
	suite.mockRepo.On("ListItems", suite.ctx, offset, limit).Return(expectedItems, expectedTotal, nil)

	// When
	items, total, err := suite.service.ListItems(suite.ctx, offset, limit, filters)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), expectedItems, items)
	assert.Equal(suite.T(), expectedTotal, total)
}

// Test CreateSupplier
func (suite *InventoryServiceTestSuite) TestCreateSupplier_Success() {
	// Given
	name := "Test Supplier"

	// Setup mocks
	suite.mockRepo.On("CreateSupplier", suite.ctx, mock.AnythingOfType("*inventory.Supplier")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	supplier, err := suite.service.CreateSupplier(suite.ctx, name)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), supplier)
	assert.Equal(suite.T(), name, supplier.Name)
	assert.True(suite.T(), supplier.IsActive)
}

func (suite *InventoryServiceTestSuite) TestCreateSupplier_EmptyName() {
	// When
	supplier, err := suite.service.CreateSupplier(suite.ctx, "")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
}

func (suite *InventoryServiceTestSuite) TestCreateSupplier_RepositoryError() {
	// Given
	name := "Test Supplier"
	repositoryError := errors.New("database error")

	// Setup mocks
	suite.mockRepo.On("CreateSupplier", suite.ctx, mock.AnythingOfType("*inventory.Supplier")).Return(repositoryError)

	// When
	supplier, err := suite.service.CreateSupplier(suite.ctx, name)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.Equal(suite.T(), repositoryError, err)
}

// Test event publishing scenarios
func (suite *InventoryServiceTestSuite) TestCreateItem_EventPublishingFails() {
	// Given
	sku := "INV001"
	name := "Test Item"
	initialStock := 100.0
	unit := inventory.UnitTypeKilograms
	cost := 5.50
	
	eventError := errors.New("event publishing failed")

	// Setup mocks
	suite.mockRepo.On("CreateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(eventError)

	// When - Should still succeed even if event publishing fails
	item, err := suite.service.CreateItem(suite.ctx, sku, name, initialStock, unit, cost)

	// Then
	assert.NoError(suite.T(), err) // Service should not fail due to event publishing error
	assert.NotNil(suite.T(), item)
}

// Test complex workflow scenarios
func (suite *InventoryServiceTestSuite) TestComplexWorkflow_ItemLifecycle() {
	// Given
	sku := "INV001"
	name := "Test Item"
	initialStock := 100.0
	unit := inventory.UnitTypeKilograms
	cost := 5.50

	// Step 1: Create item
	suite.mockRepo.On("CreateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	item, err := suite.service.CreateItem(suite.ctx, sku, name, initialStock, unit, cost)
	assert.NoError(suite.T(), err)
	itemID := item.ID

	// Step 2: Add stock
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	err = suite.service.AddStock(suite.ctx, itemID, 50.0, "Restock", "PO001", "manager")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 150.0, item.CurrentStock)

	// Step 3: Use stock
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	err = suite.service.UseStock(suite.ctx, itemID, 75.0, "Order fulfillment", "ORD001", "kitchen")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 75.0, item.CurrentStock)

	// Step 4: Update thresholds
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)

	err = suite.service.UpdateThresholds(suite.ctx, itemID, 10.0, 200.0, 25.0)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 10.0, item.MinThreshold)
	assert.Equal(suite.T(), 200.0, item.MaxThreshold)
	assert.Equal(suite.T(), 25.0, item.ReorderPoint)

	// Step 5: Reserve stock for order
	suite.mockRepo.On("GetItemBySKU", suite.ctx, sku).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	err = suite.service.ReserveStock(suite.ctx, sku, 30.0, "ORD002", "system")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 45.0, item.CurrentStock)

	// Verify all movements were recorded
	assert.Len(suite.T(), item.Movements, 3) // Add stock + Use stock + Reserve stock
}

func (suite *InventoryServiceTestSuite) TestStockAlertScenarios() {
	// Given - Item that will trigger alerts
	itemID := inventory.InventoryItemID("inv_123")
	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "INV001",
		Name:         "Alert Test Item",
		CurrentStock: 20.0,
		ReorderPoint: 15.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Scenario 1: Use stock that triggers low stock alert
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil).Twice() // Stock used + Low stock alert

	err := suite.service.UseStock(suite.ctx, itemID, 8.0, "Order", "ORD001", "kitchen")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 12.0, item.CurrentStock)
	assert.True(suite.T(), item.IsLowStock())

	// Scenario 2: Use remaining stock that triggers out of stock alert
	suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
	suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil).Twice() // Stock used + Out of stock alert

	err = suite.service.UseStock(suite.ctx, itemID, 12.0, "Order", "ORD002", "kitchen")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0.0, item.CurrentStock)
	assert.True(suite.T(), item.IsOutOfStock())
}

func (suite *InventoryServiceTestSuite) TestMultipleStockOperations() {
	// Given - Multiple items
	items := []*inventory.InventoryItem{
		{
			ID:           inventory.InventoryItemID("inv_001"),
			SKU:          "FLOUR001",
			Name:         "Flour",
			CurrentStock: 25.0,
			Unit:         inventory.UnitTypeKilograms,
			Movements:    make([]*inventory.StockMovement, 0),
		},
		{
			ID:           inventory.InventoryItemID("inv_002"),
			SKU:          "SUGAR001",
			Name:         "Sugar",
			CurrentStock: 10.0,
			Unit:         inventory.UnitTypeKilograms,
			Movements:    make([]*inventory.StockMovement, 0),
		},
	}

	// Test operations on multiple items
	for i, item := range items {
		suite.mockRepo.On("GetItemByID", suite.ctx, item.ID).Return(item, nil)
		suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
		suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

		err := suite.service.AddStock(suite.ctx, item.ID, float64(10+i*5), "Delivery", "PO00"+string(rune(49+i)), "manager")
		assert.NoError(suite.T(), err)
	}

	// Verify final states
	assert.Equal(suite.T(), 35.0, items[0].CurrentStock) // 25 + 10
	assert.Equal(suite.T(), 25.0, items[1].CurrentStock) // 10 + 15
}

func (suite *InventoryServiceTestSuite) TestConcurrentOperationsSimulation() {
	// Given - Single item with concurrent operations simulation
	itemID := inventory.InventoryItemID("inv_123")
	item := &inventory.InventoryItem{
		ID:           itemID,
		SKU:          "CONCURRENT001",
		Name:         "Concurrent Test Item",
		CurrentStock: 100.0,
		Unit:         inventory.UnitTypeKilograms,
		Movements:    make([]*inventory.StockMovement, 0),
	}

	// Simulate multiple operations in sequence (in real scenario, these would be concurrent)
	operations := []struct {
		action   string
		quantity float64
	}{
		{"use", 20.0},
		{"add", 30.0},
		{"use", 15.0},
		{"add", 10.0},
		{"use", 25.0},
	}

	expectedStock := 100.0
	for _, op := range operations {
		if op.action == "use" {
			suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
			suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
			suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

			err := suite.service.UseStock(suite.ctx, itemID, op.quantity, "Operation", "REF001", "user")
			assert.NoError(suite.T(), err)
			expectedStock -= op.quantity
		} else {
			suite.mockRepo.On("GetItemByID", suite.ctx, itemID).Return(item, nil)
			suite.mockRepo.On("UpdateItem", suite.ctx, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
			suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

			err := suite.service.AddStock(suite.ctx, itemID, op.quantity, "Operation", "REF001", "user")
			assert.NoError(suite.T(), err)
			expectedStock += op.quantity
		}
	}

	assert.Equal(suite.T(), expectedStock, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, len(operations))
}