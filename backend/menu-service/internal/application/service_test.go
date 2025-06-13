package application

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	
	menu "github.com/restaurant-platform/menu-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
)

// MockMenuRepository is a mock implementation of MenuRepository
type MockMenuRepository struct {
	mock.Mock
}

func (m *MockMenuRepository) Create(ctx context.Context, menu *menu.Menu) error {
	args := m.Called(ctx, menu)
	return args.Error(0)
}

func (m *MockMenuRepository) GetByID(ctx context.Context, id menu.MenuID) (*menu.Menu, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menu.Menu), args.Error(1)
}

func (m *MockMenuRepository) GetActive(ctx context.Context) (*menu.Menu, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menu.Menu), args.Error(1)
}

func (m *MockMenuRepository) Update(ctx context.Context, menu *menu.Menu) error {
	args := m.Called(ctx, menu)
	return args.Error(0)
}

func (m *MockMenuRepository) Delete(ctx context.Context, id menu.MenuID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockMenuRepository) List(ctx context.Context, offset, limit int) ([]*menu.Menu, int, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*menu.Menu), args.Int(1), args.Error(2)
}

func (m *MockMenuRepository) GetMenuItem(ctx context.Context, id menu.ItemID) (*menu.MenuItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menu.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) GetCategory(ctx context.Context, id menu.CategoryID) (*menu.MenuCategory, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*menu.MenuCategory), args.Error(1)
}

func (m *MockMenuRepository) ListMenuItems(ctx context.Context, filters menu.MenuItemFilters) ([]*menu.MenuItem, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menu.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) GetItemsByCategoryID(ctx context.Context, categoryID menu.CategoryID) ([]*menu.MenuItem, error) {
	args := m.Called(ctx, categoryID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menu.MenuItem), args.Error(1)
}

func (m *MockMenuRepository) GetAvailableItems(ctx context.Context) ([]*menu.MenuItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*menu.MenuItem), args.Error(1)
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

// MenuServiceTestSuite contains all application service tests
type MenuServiceTestSuite struct {
	suite.Suite
	service        *MenuService
	mockRepo       *MockMenuRepository
	mockPublisher  *MockEventPublisher
	ctx            context.Context
}

func (suite *MenuServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockMenuRepository)
	suite.mockPublisher = new(MockEventPublisher)
	suite.service = NewMenuService(suite.mockRepo, suite.mockPublisher)
	suite.ctx = context.Background()
}

func TestMenuServiceTestSuite(t *testing.T) {
	suite.Run(t, new(MenuServiceTestSuite))
}

// Test CreateMenu
func (suite *MenuServiceTestSuite) TestCreateMenu_Success() {
	// Given
	menuName := "Summer Menu"
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*menu.Menu")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	result, err := suite.service.CreateMenu(suite.ctx, menuName)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(menuName, result.Name)
	assert.Equal(1, result.Version)
	assert.True(result.IsActive)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *MenuServiceTestSuite) TestCreateMenu_EmptyName_ShouldFail() {
	// Given
	menuName := ""

	// When
	result, err := suite.service.CreateMenu(suite.ctx, menuName)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Contains(err.Error(), "name is required")
	
	suite.mockRepo.AssertNotCalled(suite.T(), "Create")
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *MenuServiceTestSuite) TestCreateMenu_RepositoryError_ShouldFail() {
	// Given
	menuName := "Summer Menu"
	repoError := errors.New("database error")
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*menu.Menu")).Return(repoError)

	// When
	result, err := suite.service.CreateMenu(suite.ctx, menuName)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Equal(repoError, err)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

func (suite *MenuServiceTestSuite) TestCreateMenu_EventPublishError_ShouldNotFail() {
	// Given
	menuName := "Summer Menu"
	eventError := errors.New("event publish error")
	
	suite.mockRepo.On("Create", suite.ctx, mock.AnythingOfType("*menu.Menu")).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(eventError)

	// When
	result, err := suite.service.CreateMenu(suite.ctx, menuName)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err) // Should not fail even if event publishing fails
	assert.NotNil(result)
	assert.Equal(menuName, result.Name)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test GetActiveMenu
func (suite *MenuServiceTestSuite) TestGetActiveMenu_Success() {
	// Given
	expectedMenu, _ := menu.NewMenu("Active Menu")
	
	suite.mockRepo.On("GetActive", suite.ctx).Return(expectedMenu, nil)

	// When
	result, err := suite.service.GetActiveMenu(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(expectedMenu, result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *MenuServiceTestSuite) TestGetActiveMenu_NotFound_ShouldFail() {
	// Given
	repoError := errors.New("no active menu found")
	
	suite.mockRepo.On("GetActive", suite.ctx).Return(nil, repoError)

	// When
	result, err := suite.service.GetActiveMenu(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Equal(repoError, err)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetMenuByID
func (suite *MenuServiceTestSuite) TestGetMenuByID_Success() {
	// Given
	expectedMenu, _ := menu.NewMenu("Test Menu")
	menuID := expectedMenu.ID

	suite.mockRepo.On("GetByID", suite.ctx, menuID).Return(expectedMenu, nil)

	// When
	result, err := suite.service.GetMenuByID(suite.ctx, string(menuID))

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(expectedMenu, result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *MenuServiceTestSuite) TestGetMenuByID_NotFound_ShouldFail() {
	// Given
	menuID := menu.MenuID("nonexistent")
	repoError := errors.New("menu not found")

	suite.mockRepo.On("GetByID", suite.ctx, menuID).Return(nil, repoError)

	// When
	result, err := suite.service.GetMenuByID(suite.ctx, string(menuID))

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Equal(repoError, err)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetMenus
func (suite *MenuServiceTestSuite) TestGetMenus_Success() {
	// Given
	menu1, _ := menu.NewMenu("Menu 1")
	menu2, _ := menu.NewMenu("Menu 2")
	expectedMenus := []*menu.Menu{menu1, menu2}
	totalCount := 2
	offset, limit := 0, 10

	suite.mockRepo.On("List", suite.ctx, offset, limit).Return(expectedMenus, totalCount, nil)

	// When
	result, count, err := suite.service.GetMenus(suite.ctx, offset, limit)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 2)
	assert.Equal(totalCount, count)
	assert.Equal(expectedMenus, result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetAvailableItems
func (suite *MenuServiceTestSuite) TestGetAvailableItems_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category, _ := testMenu.AddCategory("Appetizers", "Description", 1)
	item, _ := testMenu.AddMenuItem(category.ID, "Salad", "Fresh salad", 10.99, 0, nil, nil, "", "", 1)
	expectedItems := []*menu.MenuItem{item}

	suite.mockRepo.On("GetAvailableItems", suite.ctx).Return(expectedItems, nil)

	// When
	result, err := suite.service.GetAvailableItems(suite.ctx)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Len(result, 1)
	assert.Equal(expectedItems, result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test GetMenuItem
func (suite *MenuServiceTestSuite) TestGetMenuItem_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category, _ := testMenu.AddCategory("Appetizers", "Description", 1)
	expectedItem, _ := testMenu.AddMenuItem(category.ID, "Salad", "Fresh salad", 10.99, 0, nil, nil, "", "", 1)

	suite.mockRepo.On("GetMenuItem", suite.ctx, expectedItem.ID).Return(expectedItem, nil)

	// When
	result, err := suite.service.GetMenuItem(suite.ctx, expectedItem.ID)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(expectedItem, result)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test AddCategoryToMenu
func (suite *MenuServiceTestSuite) TestAddCategoryToMenu_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	categoryName := "Appetizers"
	description := "Start your meal right"
	displayOrder := 1

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)
	suite.mockRepo.On("Update", suite.ctx, testMenu).Return(nil)

	// When
	result, err := suite.service.AddCategoryToMenu(suite.ctx, string(testMenu.ID), categoryName, description, displayOrder)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(categoryName, result.Name)
	assert.Equal(description, result.Description)
	assert.Equal(displayOrder, result.DisplayOrder)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

func (suite *MenuServiceTestSuite) TestAddCategoryToMenu_MenuNotFound_ShouldFail() {
	// Given
	menuID := "nonexistent"
	repoError := errors.New("menu not found")

	suite.mockRepo.On("GetByID", suite.ctx, menu.MenuID(menuID)).Return(nil, repoError)

	// When
	result, err := suite.service.AddCategoryToMenu(suite.ctx, menuID, "Appetizers", "Description", 1)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Nil(result)
	assert.Equal(repoError, err)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test AddItemToCategory
func (suite *MenuServiceTestSuite) TestAddItemToCategory_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category, _ := testMenu.AddCategory("Appetizers", "Description", 1)
	itemName := "Caesar Salad"
	description := "Fresh salad"
	price := 12.99

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)
	suite.mockRepo.On("Update", suite.ctx, testMenu).Return(nil)

	// When
	result, err := suite.service.AddItemToCategory(suite.ctx, string(testMenu.ID), category.ID, itemName, description, price)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotNil(result)
	assert.Equal(itemName, result.Name)
	assert.Equal(description, result.Description)
	assert.Equal(price, result.Price)
	assert.Equal(category.ID, result.CategoryID)
	
	suite.mockRepo.AssertExpectations(suite.T())
}

// Test SetItemAvailability
func (suite *MenuServiceTestSuite) TestSetItemAvailability_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category, _ := testMenu.AddCategory("Appetizers", "Description", 1)
	item, _ := testMenu.AddMenuItem(category.ID, "Salad", "Fresh salad", 10.99, 0, nil, nil, "", "", 1)

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)
	suite.mockRepo.On("Update", suite.ctx, testMenu).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.SetItemAvailability(suite.ctx, string(testMenu.ID), item.ID, false)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.False(item.IsAvailable)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

func (suite *MenuServiceTestSuite) TestSetItemAvailability_ItemNotFound_ShouldFail() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	nonExistentItemID := menu.ItemID("nonexistent")

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)

	// When
	err := suite.service.SetItemAvailability(suite.ctx, string(testMenu.ID), nonExistentItemID, false)

	// Then
	assert := assert.New(suite.T())
	assert.Error(err)
	assert.Contains(err.Error(), "business error")
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertNotCalled(suite.T(), "Publish")
}

// Test ActivateMenu
func (suite *MenuServiceTestSuite) TestActivateMenu_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	testMenu.Deactivate() // Start inactive

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)
	suite.mockRepo.On("Update", suite.ctx, testMenu).Return(nil)
	suite.mockPublisher.On("Publish", suite.ctx, mock.AnythingOfType("*events.DomainEvent")).Return(nil)

	// When
	err := suite.service.ActivateMenu(suite.ctx, string(testMenu.ID))

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.True(testMenu.IsActive)
	assert.Nil(testMenu.EndDate)
	
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockPublisher.AssertExpectations(suite.T())
}

// Test DeactivateMenu
func (suite *MenuServiceTestSuite) TestDeactivateMenu_Success() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")

	suite.mockRepo.On("GetByID", suite.ctx, testMenu.ID).Return(testMenu, nil)
	suite.mockRepo.On("Update", suite.ctx, testMenu).Return(nil)

	// When
	err := suite.service.DeactivateMenu(suite.ctx, string(testMenu.ID))

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.False(testMenu.IsActive)
	assert.NotNil(testMenu.EndDate)
	
	suite.mockRepo.AssertExpectations(suite.T())
}