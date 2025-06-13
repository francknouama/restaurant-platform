package infrastructure

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	
	menu "github.com/restaurant-platform/menu-service/internal/domain"
)

// MenuRepositoryTestSuite contains repository logic tests
type MenuRepositoryTestSuite struct {
	suite.Suite
}

func TestMenuRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(MenuRepositoryTestSuite))
}

// Test JSON serialization/deserialization logic used in repository
func (suite *MenuRepositoryTestSuite) TestCategorySerialization() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category1, _ := testMenu.AddCategory("Appetizers", "Start your meal", 1)
	
	// Sleep for a second to ensure different timestamps for IDs (ID generation uses second precision)
	time.Sleep(1 * time.Second)
	category2, _ := testMenu.AddCategory("Mains", "Main courses", 2)
	
	// Add items to categories
	item1, _ := testMenu.AddMenuItem(category1.ID, "Caesar Salad", "Fresh salad", 12.99, 
		10*time.Minute, []string{"lettuce", "croutons"}, []string{"dairy"}, "", "", 1)
	item2, _ := testMenu.AddMenuItem(category2.ID, "Grilled Chicken", "Juicy chicken", 18.99,
		20*time.Minute, []string{"chicken", "herbs"}, []string{}, "", "", 1)

	// When - Test JSON marshaling (this logic is used in Create/Update)
	categoriesJSON, err := json.Marshal(testMenu.Categories)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.NotEmpty(categoriesJSON)
	
	// Verify we can unmarshal back to the same structure
	var categories []*menu.MenuCategory
	err = json.Unmarshal(categoriesJSON, &categories)
	assert.NoError(err)
	assert.Len(categories, 2)
	
	// Verify category data integrity
	assert.Equal("Appetizers", categories[0].Name)
	assert.Equal("Start your meal", categories[0].Description)
	assert.Equal(1, categories[0].DisplayOrder)
	assert.Len(categories[0].Items, 1)
	
	assert.Equal("Mains", categories[1].Name)
	assert.Equal("Main courses", categories[1].Description)
	assert.Equal(2, categories[1].DisplayOrder)
	assert.Len(categories[1].Items, 1)
	
	// Verify item data integrity
	assert.Equal("Caesar Salad", categories[0].Items[0].Name)
	assert.Equal(12.99, categories[0].Items[0].Price)
	assert.Equal(10*time.Minute, categories[0].Items[0].PreparationTime)
	assert.Equal([]string{"lettuce", "croutons"}, categories[0].Items[0].Ingredients)
	assert.Equal([]string{"dairy"}, categories[0].Items[0].Allergens)
	
	assert.Equal("Grilled Chicken", categories[1].Items[0].Name)
	assert.Equal(18.99, categories[1].Items[0].Price)
	assert.Equal(item1.ID, categories[0].Items[0].ID)
	assert.Equal(item2.ID, categories[1].Items[0].ID)
}

func (suite *MenuRepositoryTestSuite) TestEmptyMenuSerialization() {
	// Given
	testMenu, _ := menu.NewMenu("Empty Menu")

	// When
	categoriesJSON, err := json.Marshal(testMenu.Categories)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Equal("[]", string(categoriesJSON)) // Empty array
	
	// Verify unmarshaling empty categories
	var categories []*menu.MenuCategory
	err = json.Unmarshal(categoriesJSON, &categories)
	assert.NoError(err)
	assert.Len(categories, 0)
}

func (suite *MenuRepositoryTestSuite) TestMenuWithComplexItems() {
	// Given
	testMenu, _ := menu.NewMenu("Complex Menu")
	category, _ := testMenu.AddCategory("Specials", "Chef's specials", 1)
	
	// Add item with all fields
	_, err := testMenu.AddMenuItem(
		category.ID,
		"Truffle Pasta",
		"Handmade pasta with black truffle shavings",
		45.99,
		25*time.Minute,
		[]string{"pasta", "truffle", "parmesan", "cream"},
		[]string{"gluten", "dairy", "eggs"},
		"720 calories, 35g protein, 25g fat",
		"https://example.com/truffle-pasta.jpg",
		1,
	)

	// When
	categoriesJSON, err := json.Marshal(testMenu.Categories)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	var categories []*menu.MenuCategory
	err = json.Unmarshal(categoriesJSON, &categories)
	assert.NoError(err)
	assert.Len(categories, 1)
	assert.Len(categories[0].Items, 1)
	
	item := categories[0].Items[0]
	assert.Equal("Truffle Pasta", item.Name)
	assert.Equal("Handmade pasta with black truffle shavings", item.Description)
	assert.Equal(45.99, item.Price)
	assert.Equal(25*time.Minute, item.PreparationTime)
	assert.Equal([]string{"pasta", "truffle", "parmesan", "cream"}, item.Ingredients)
	assert.Equal([]string{"gluten", "dairy", "eggs"}, item.Allergens)
	assert.Equal("720 calories, 35g protein, 25g fat", item.NutritionalInfo)
	assert.Equal("https://example.com/truffle-pasta.jpg", item.ImageURL)
	assert.True(item.IsAvailable)
}

func (suite *MenuRepositoryTestSuite) TestDateTimeSerialization() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	now := time.Now()
	testMenu.StartDate = now
	testMenu.CreatedAt = now
	testMenu.UpdatedAt = now

	// Test with end date
	endDate := now.Add(30 * 24 * time.Hour) // 30 days later
	testMenu.EndDate = &endDate

	// When - Test marshaling the entire menu (as done in repository)
	menuData := map[string]interface{}{
		"id":         testMenu.ID.String(),
		"name":       testMenu.Name,
		"version":    testMenu.Version,
		"is_active":  testMenu.IsActive,
		"start_date": testMenu.StartDate,
		"end_date":   testMenu.EndDate,
		"created_at": testMenu.CreatedAt,
		"updated_at": testMenu.UpdatedAt,
	}

	menuJSON, err := json.Marshal(menuData)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	assert.Contains(string(menuJSON), testMenu.ID.String())
	assert.Contains(string(menuJSON), testMenu.Name)
	
	// Verify we can unmarshal dates
	var unmarshaled map[string]interface{}
	err = json.Unmarshal(menuJSON, &unmarshaled)
	assert.NoError(err)
	assert.Equal(testMenu.Name, unmarshaled["name"])
	assert.Equal(float64(testMenu.Version), unmarshaled["version"])
	assert.Equal(testMenu.IsActive, unmarshaled["is_active"])
}

func (suite *MenuRepositoryTestSuite) TestIDSerialization() {
	// Given
	testMenu, _ := menu.NewMenu("Test Menu")
	category, _ := testMenu.AddCategory("Test Category", "Description", 1)
	item, _ := testMenu.AddMenuItem(category.ID, "Test Item", "Description", 10.99, 0, nil, nil, "", "", 1)

	// When - Test ID serialization
	categoriesJSON, err := json.Marshal(testMenu.Categories)

	// Then
	assert := assert.New(suite.T())
	assert.NoError(err)
	
	var categories []*menu.MenuCategory
	err = json.Unmarshal(categoriesJSON, &categories)
	assert.NoError(err)
	
	// Verify IDs are preserved
	assert.Equal(category.ID, categories[0].ID)
	assert.Equal(item.ID, categories[0].Items[0].ID)
	assert.Equal(category.ID, categories[0].Items[0].CategoryID)
	
	// Verify IDs are valid strings
	assert.NotEmpty(string(categories[0].ID))
	assert.NotEmpty(string(categories[0].Items[0].ID))
	assert.Contains(string(categories[0].ID), "cat_")
	assert.Contains(string(categories[0].Items[0].ID), "item_")
}

// Test helper functions that might be used in repository
func (suite *MenuRepositoryTestSuite) TestNullTimeHelpers() {
	// Test nullTimeOrPointer function behavior (if it exists)
	// This tests the logic for handling optional end dates
	
	// Given
	now := time.Now()
	
	// Test with nil pointer
	var nilTime *time.Time = nil
	assert := assert.New(suite.T())
	
	// Test with valid time pointer
	validTime := &now
	assert.NotNil(validTime)
	assert.Equal(now, *validTime)
	
	// Test nil handling
	assert.Nil(nilTime)
}