package inventory

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	sharederrors "github.com/restaurant-platform/shared/pkg/errors"
)

// InventoryDomainTestSuite contains all domain model tests
type InventoryDomainTestSuite struct {
	suite.Suite
}

func TestInventoryDomainTestSuite(t *testing.T) {
	suite.Run(t, new(InventoryDomainTestSuite))
}

// Test InventoryItem creation
func (suite *InventoryDomainTestSuite) TestNewInventoryItem_Success() {
	// Given
	sku := "INV001"
	name := "Test Item"
	initialStock := 100.0
	unit := UnitTypeKilograms
	cost := 5.50

	// When
	item, err := NewInventoryItem(sku, name, initialStock, unit, cost)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), item)
	assert.NotEmpty(suite.T(), item.ID)
	assert.Equal(suite.T(), sku, item.SKU)
	assert.Equal(suite.T(), name, item.Name)
	assert.Equal(suite.T(), initialStock, item.CurrentStock)
	assert.Equal(suite.T(), unit, item.Unit)
	assert.Equal(suite.T(), cost, item.Cost)
	assert.NotZero(suite.T(), item.CreatedAt)
	assert.NotZero(suite.T(), item.UpdatedAt)
	assert.NotNil(suite.T(), item.Movements)
	assert.Len(suite.T(), item.Movements, 0)
}

func (suite *InventoryDomainTestSuite) TestNewInventoryItem_EmptySKU() {
	// When
	item, err := NewInventoryItem("", "Test Item", 100.0, UnitTypeKilograms, 5.50)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "SKU is required")
}

func (suite *InventoryDomainTestSuite) TestNewInventoryItem_EmptyName() {
	// When
	item, err := NewInventoryItem("INV001", "", 100.0, UnitTypeKilograms, 5.50)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "name is required")
}

func (suite *InventoryDomainTestSuite) TestNewInventoryItem_NegativeStock() {
	// When
	item, err := NewInventoryItem("INV001", "Test Item", -10.0, UnitTypeKilograms, 5.50)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "initial stock cannot be negative")
}

func (suite *InventoryDomainTestSuite) TestNewInventoryItem_NegativeCost() {
	// When
	item, err := NewInventoryItem("INV001", "Test Item", 100.0, UnitTypeKilograms, -5.50)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), item)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "cost cannot be negative")
}

func (suite *InventoryDomainTestSuite) TestNewInventoryItem_ZeroValues() {
	// When
	item, err := NewInventoryItem("INV001", "Test Item", 0.0, UnitTypeKilograms, 0.0)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), item)
	assert.Equal(suite.T(), 0.0, item.CurrentStock)
	assert.Equal(suite.T(), 0.0, item.Cost)
}

// Test Supplier creation
func (suite *InventoryDomainTestSuite) TestNewSupplier_Success() {
	// Given
	name := "Test Supplier"

	// When
	supplier, err := NewSupplier(name)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), supplier)
	assert.NotEmpty(suite.T(), supplier.ID)
	assert.Equal(suite.T(), name, supplier.Name)
	assert.True(suite.T(), supplier.IsActive)
	assert.NotZero(suite.T(), supplier.CreatedAt)
	assert.NotZero(suite.T(), supplier.UpdatedAt)
}

func (suite *InventoryDomainTestSuite) TestNewSupplier_EmptyName() {
	// When
	supplier, err := NewSupplier("")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "supplier name is required")
}

// Test AddMovement - RECEIVED type
func (suite *InventoryDomainTestSuite) TestAddMovement_Received_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 25.0
	notes := "Received from supplier"
	reference := "PO123"
	performedBy := "user123"

	// When
	movement, err := item.AddMovement(MovementTypeReceived, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.NotEmpty(suite.T(), movement.ID)
	assert.Equal(suite.T(), item.ID, movement.InventoryItemID)
	assert.Equal(suite.T(), MovementTypeReceived, movement.Type)
	assert.Equal(suite.T(), quantity, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 75.0, movement.NewStock)
	assert.Equal(suite.T(), notes, movement.Notes)
	assert.Equal(suite.T(), reference, movement.Reference)
	assert.Equal(suite.T(), performedBy, movement.PerformedBy)
	assert.NotZero(suite.T(), movement.CreatedAt)

	// Verify item state
	assert.Equal(suite.T(), 75.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 1)
	assert.Equal(suite.T(), movement, item.Movements[0])
}

// Test AddMovement - USED type
func (suite *InventoryDomainTestSuite) TestAddMovement_Used_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 15.0
	notes := "Used for order"
	reference := "ORD456"
	performedBy := "kitchen123"

	// When
	movement, err := item.AddMovement(MovementTypeUsed, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.Equal(suite.T(), MovementTypeUsed, movement.Type)
	assert.Equal(suite.T(), quantity, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 35.0, movement.NewStock)

	// Verify item state
	assert.Equal(suite.T(), 35.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 1)
}

func (suite *InventoryDomainTestSuite) TestAddMovement_Used_InsufficientStock() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 10.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 15.0 // More than available

	// When
	movement, err := item.AddMovement(MovementTypeUsed, quantity, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
	assert.Contains(suite.T(), err.Error(), "insufficient stock")

	// Verify item state unchanged
	assert.Equal(suite.T(), 10.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 0)
}

// Test AddMovement - ADJUSTED type
func (suite *InventoryDomainTestSuite) TestAddMovement_Adjusted_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	newStockLevel := 45.0 // Adjustment to new level
	notes := "Stock count adjustment"
	reference := "ADJ789"
	performedBy := "manager123"

	// When
	movement, err := item.AddMovement(MovementTypeAdjusted, newStockLevel, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.Equal(suite.T(), MovementTypeAdjusted, movement.Type)
	assert.Equal(suite.T(), newStockLevel, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 45.0, movement.NewStock)

	// Verify item state
	assert.Equal(suite.T(), 45.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 1)
}

// Test AddMovement - WASTED type
func (suite *InventoryDomainTestSuite) TestAddMovement_Wasted_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 5.0
	notes := "Expired items"
	reference := "WASTE001"
	performedBy := "staff123"

	// When
	movement, err := item.AddMovement(MovementTypeWasted, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.Equal(suite.T(), MovementTypeWasted, movement.Type)
	assert.Equal(suite.T(), quantity, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 45.0, movement.NewStock)

	// Verify item state
	assert.Equal(suite.T(), 45.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 1)
}

// Test AddMovement - RETURNED type
func (suite *InventoryDomainTestSuite) TestAddMovement_Returned_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 3.0
	notes := "Customer return"
	reference := "RET001"
	performedBy := "cashier123"

	// When
	movement, err := item.AddMovement(MovementTypeReturned, quantity, notes, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.Equal(suite.T(), MovementTypeReturned, movement.Type)
	assert.Equal(suite.T(), quantity, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 47.0, movement.NewStock)

	// Verify item state
	assert.Equal(suite.T(), 47.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 1)
}

func (suite *InventoryDomainTestSuite) TestAddMovement_InvalidType() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	movement, err := item.AddMovement("INVALID_TYPE", 10.0, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "invalid movement type")
}

func (suite *InventoryDomainTestSuite) TestAddMovement_ZeroQuantity() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	movement, err := item.AddMovement(MovementTypeReceived, 0.0, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "quantity must be positive")
}

func (suite *InventoryDomainTestSuite) TestAddMovement_NegativeQuantity() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	movement, err := item.AddMovement(MovementTypeReceived, -10.0, "notes", "ref", "user")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "quantity must be positive")
}

// Test UpdateThresholds
func (suite *InventoryDomainTestSuite) TestUpdateThresholds_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	min := 10.0
	max := 100.0
	reorderPoint := 20.0

	// When
	err = item.UpdateThresholds(min, max, reorderPoint)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), min, item.MinThreshold)
	assert.Equal(suite.T(), max, item.MaxThreshold)
	assert.Equal(suite.T(), reorderPoint, item.ReorderPoint)
}

func (suite *InventoryDomainTestSuite) TestUpdateThresholds_NegativeValues() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	err = item.UpdateThresholds(-10.0, 100.0, 20.0)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "thresholds cannot be negative")
}

func (suite *InventoryDomainTestSuite) TestUpdateThresholds_MaxLessThanMin() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	err = item.UpdateThresholds(50.0, 30.0, 40.0)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
	assert.Contains(suite.T(), err.Error(), "maximum threshold cannot be less than minimum threshold")
}

func (suite *InventoryDomainTestSuite) TestUpdateThresholds_ReorderPointOutOfRange() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When - reorder point below minimum
	err = item.UpdateThresholds(20.0, 100.0, 10.0)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
	assert.Contains(suite.T(), err.Error(), "reorder point must be between minimum and maximum thresholds")

	// When - reorder point above maximum
	err = item.UpdateThresholds(20.0, 100.0, 110.0)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsConflictError(err))
	assert.Contains(suite.T(), err.Error(), "reorder point must be between minimum and maximum thresholds")
}

// Test stock checking methods
func (suite *InventoryDomainTestSuite) TestIsLowStock() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 15.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	err = item.UpdateThresholds(10.0, 100.0, 20.0)
	assert.NoError(suite.T(), err)

	// When & Then - Stock (15) is below reorder point (20)
	assert.True(suite.T(), item.IsLowStock())

	// When - Increase stock above reorder point
	_, err = item.AddMovement(MovementTypeReceived, 10.0, "restock", "PO001", "user")
	assert.NoError(suite.T(), err)

	// Then - Should not be low stock anymore
	assert.False(suite.T(), item.IsLowStock())
}

func (suite *InventoryDomainTestSuite) TestIsOutOfStock() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 5.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When & Then - Stock is above 0
	assert.False(suite.T(), item.IsOutOfStock())

	// When - Use all stock
	_, err = item.AddMovement(MovementTypeUsed, 5.0, "used all", "ORD001", "user")
	assert.NoError(suite.T(), err)

	// Then - Should be out of stock
	assert.True(suite.T(), item.IsOutOfStock())

	// When - Adjust to negative (waste more than available)
	_, err = item.AddMovement(MovementTypeAdjusted, -1.0, "negative adjustment", "ADJ001", "user")
	assert.NoError(suite.T(), err)

	// Then - Should still be out of stock
	assert.True(suite.T(), item.IsOutOfStock())
}

func (suite *InventoryDomainTestSuite) TestCanFulfillOrder() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When & Then - Can fulfill order within stock
	assert.True(suite.T(), item.CanFulfillOrder(30.0))
	assert.True(suite.T(), item.CanFulfillOrder(50.0)) // Exact amount
	
	// When & Then - Cannot fulfill order exceeding stock
	assert.False(suite.T(), item.CanFulfillOrder(60.0))
	assert.False(suite.T(), item.CanFulfillOrder(100.0))
}

// Test ReserveStock
func (suite *InventoryDomainTestSuite) TestReserveStock_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 20.0
	reference := "ORD123"
	performedBy := "system"

	// When
	movement, err := item.ReserveStock(quantity, reference, performedBy)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), movement)
	assert.Equal(suite.T(), MovementTypeUsed, movement.Type)
	assert.Equal(suite.T(), quantity, movement.Quantity)
	assert.Equal(suite.T(), 50.0, movement.PreviousStock)
	assert.Equal(suite.T(), 30.0, movement.NewStock)
	assert.Contains(suite.T(), movement.Notes, "Stock reserved for order")
	assert.Equal(suite.T(), reference, movement.Reference)
	assert.Equal(suite.T(), performedBy, movement.PerformedBy)

	// Verify item state
	assert.Equal(suite.T(), 30.0, item.CurrentStock)
}

func (suite *InventoryDomainTestSuite) TestReserveStock_InsufficientStock() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 10.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	quantity := 15.0 // More than available
	reference := "ORD123"
	performedBy := "system"

	// When
	movement, err := item.ReserveStock(quantity, reference, performedBy)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), movement)
	assert.Equal(suite.T(), sharederrors.ErrInsufficientStock, err)

	// Verify item state unchanged
	assert.Equal(suite.T(), 10.0, item.CurrentStock)
	assert.Len(suite.T(), item.Movements, 0)
}

// Test SetSupplier
func (suite *InventoryDomainTestSuite) TestSetSupplier() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	supplier, err := NewSupplier("Test Supplier")
	assert.NoError(suite.T(), err)
	
	originalUpdatedAt := item.UpdatedAt

	// Sleep to ensure different timestamp
	time.Sleep(1 * time.Millisecond)

	// When
	item.SetSupplier(supplier.ID)

	// Then
	assert.Equal(suite.T(), supplier.ID, item.SupplierID)
	assert.True(suite.T(), item.UpdatedAt.After(originalUpdatedAt))
}

// Test UpdateDetails
func (suite *InventoryDomainTestSuite) TestUpdateDetails_Success() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)
	
	newName := "Updated Test Item"
	newDescription := "Updated description"
	newCategory := "Category A"
	newLocation := "Warehouse A"
	newCost := 6.75

	// When
	err = item.UpdateDetails(newName, newDescription, newCategory, newLocation, newCost)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), newName, item.Name)
	assert.Equal(suite.T(), newDescription, item.Description)
	assert.Equal(suite.T(), newCategory, item.Category)
	assert.Equal(suite.T(), newLocation, item.Location)
	assert.Equal(suite.T(), newCost, item.Cost)
}

func (suite *InventoryDomainTestSuite) TestUpdateDetails_EmptyName() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	err = item.UpdateDetails("", "description", "category", "location", 6.75)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "name is required")
}

func (suite *InventoryDomainTestSuite) TestUpdateDetails_NegativeCost() {
	// Given
	item, err := NewInventoryItem("INV001", "Test Item", 50.0, UnitTypeKilograms, 5.50)
	assert.NoError(suite.T(), err)

	// When
	err = item.UpdateDetails("Updated Name", "description", "category", "location", -6.75)

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "cost cannot be negative")
}

// Test Supplier methods
func (suite *InventoryDomainTestSuite) TestSupplier_UpdateDetails_Success() {
	// Given
	supplier, err := NewSupplier("Original Supplier")
	assert.NoError(suite.T(), err)
	
	newName := "Updated Supplier"
	newContactName := "John Doe"
	newEmail := "john@supplier.com"
	newPhone := "+1234567890"
	newAddress := "123 Main St"
	newWebsite := "https://supplier.com"
	newNotes := "Premium supplier"

	// When
	err = supplier.UpdateDetails(newName, newContactName, newEmail, newPhone, newAddress, newWebsite, newNotes)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), newName, supplier.Name)
	assert.Equal(suite.T(), newContactName, supplier.ContactName)
	assert.Equal(suite.T(), newEmail, supplier.Email)
	assert.Equal(suite.T(), newPhone, supplier.Phone)
	assert.Equal(suite.T(), newAddress, supplier.Address)
	assert.Equal(suite.T(), newWebsite, supplier.Website)
	assert.Equal(suite.T(), newNotes, supplier.Notes)
}

func (suite *InventoryDomainTestSuite) TestSupplier_UpdateDetails_EmptyName() {
	// Given
	supplier, err := NewSupplier("Original Supplier")
	assert.NoError(suite.T(), err)

	// When
	err = supplier.UpdateDetails("", "contact", "email", "phone", "address", "website", "notes")

	// Then
	assert.Error(suite.T(), err)
	assert.True(suite.T(), sharederrors.IsValidationError(err))
	assert.Contains(suite.T(), err.Error(), "name is required")
}

func (suite *InventoryDomainTestSuite) TestSupplier_Activate() {
	// Given
	supplier, err := NewSupplier("Test Supplier")
	assert.NoError(suite.T(), err)
	
	supplier.IsActive = false
	originalUpdatedAt := supplier.UpdatedAt

	// Sleep to ensure different timestamp
	time.Sleep(1 * time.Millisecond)

	// When
	supplier.Activate()

	// Then
	assert.True(suite.T(), supplier.IsActive)
	assert.True(suite.T(), supplier.UpdatedAt.After(originalUpdatedAt))
}

func (suite *InventoryDomainTestSuite) TestSupplier_Deactivate() {
	// Given
	supplier, err := NewSupplier("Test Supplier")
	assert.NoError(suite.T(), err)
	
	originalUpdatedAt := supplier.UpdatedAt

	// Sleep to ensure different timestamp
	time.Sleep(1 * time.Millisecond)

	// When
	supplier.Deactivate()

	// Then
	assert.False(suite.T(), supplier.IsActive)
	assert.True(suite.T(), supplier.UpdatedAt.After(originalUpdatedAt))
}

// Test Movement Type constants
func (suite *InventoryDomainTestSuite) TestMovementTypeConstants() {
	assert.Equal(suite.T(), MovementType("RECEIVED"), MovementTypeReceived)
	assert.Equal(suite.T(), MovementType("USED"), MovementTypeUsed)
	assert.Equal(suite.T(), MovementType("WASTED"), MovementTypeWasted)
	assert.Equal(suite.T(), MovementType("ADJUSTED"), MovementTypeAdjusted)
	assert.Equal(suite.T(), MovementType("RETURNED"), MovementTypeReturned)
}

// Test Unit Type constants
func (suite *InventoryDomainTestSuite) TestUnitTypeConstants() {
	assert.Equal(suite.T(), UnitType("KG"), UnitTypeKilograms)
	assert.Equal(suite.T(), UnitType("L"), UnitTypeLiters)
	assert.Equal(suite.T(), UnitType("UNITS"), UnitTypeUnits)
	assert.Equal(suite.T(), UnitType("G"), UnitTypeGrams)
	assert.Equal(suite.T(), UnitType("ML"), UnitTypeMilliliters)
}

// Test complex scenarios
func (suite *InventoryDomainTestSuite) TestComplexInventoryWorkflow() {
	// Given - Create an inventory item
	item, err := NewInventoryItem("INV001", "Tomatoes", 0.0, UnitTypeKilograms, 2.50)
	assert.NoError(suite.T(), err)

	// Set up thresholds
	err = item.UpdateThresholds(5.0, 50.0, 10.0)
	assert.NoError(suite.T(), err)

	// Step 1: Receive initial stock
	movement1, err := item.AddMovement(MovementTypeReceived, 30.0, "Initial delivery", "PO001", "manager")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 30.0, item.CurrentStock)
	assert.False(suite.T(), item.IsLowStock())
	assert.False(suite.T(), item.IsOutOfStock())

	// Step 2: Use some stock for orders
	movement2, err := item.AddMovement(MovementTypeUsed, 15.0, "Order fulfillment", "ORD001", "kitchen")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 15.0, item.CurrentStock)
	assert.False(suite.T(), item.IsLowStock()) // Still above reorder point (10)

	// Step 3: Use more stock - triggers low stock
	movement3, err := item.AddMovement(MovementTypeUsed, 8.0, "Order fulfillment", "ORD002", "kitchen")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 7.0, item.CurrentStock)
	assert.True(suite.T(), item.IsLowStock()) // Below reorder point (10)

	// Step 4: Some waste
	movement4, err := item.AddMovement(MovementTypeWasted, 2.0, "Spoiled items", "WASTE001", "staff")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 5.0, item.CurrentStock)
	assert.True(suite.T(), item.IsLowStock())

	// Step 5: Receive more stock
	movement5, err := item.AddMovement(MovementTypeReceived, 20.0, "Restock delivery", "PO002", "manager")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 25.0, item.CurrentStock)
	assert.False(suite.T(), item.IsLowStock()) // Above reorder point again

	// Step 6: Stock adjustment after count
	movement6, err := item.AddMovement(MovementTypeAdjusted, 23.0, "Physical count adjustment", "ADJ001", "manager")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 23.0, item.CurrentStock)

	// Verify all movements were recorded
	assert.Len(suite.T(), item.Movements, 6)
	assert.Equal(suite.T(), movement1, item.Movements[0])
	assert.Equal(suite.T(), movement2, item.Movements[1])
	assert.Equal(suite.T(), movement3, item.Movements[2])
	assert.Equal(suite.T(), movement4, item.Movements[3])
	assert.Equal(suite.T(), movement5, item.Movements[4])
	assert.Equal(suite.T(), movement6, item.Movements[5])

	// Verify all movements have correct item reference
	for _, movement := range item.Movements {
		assert.Equal(suite.T(), item.ID, movement.InventoryItemID)
		assert.NotEmpty(suite.T(), movement.ID)
		assert.NotZero(suite.T(), movement.CreatedAt)
	}
}

func (suite *InventoryDomainTestSuite) TestMultipleItemsWithDifferentUnits() {
	// Given - Create items with different units
	flour, err := NewInventoryItem("FLOUR001", "All-purpose Flour", 25.0, UnitTypeKilograms, 1.20)
	assert.NoError(suite.T(), err)

	milk, err := NewInventoryItem("MILK001", "Whole Milk", 50.0, UnitTypeLiters, 0.85)
	assert.NoError(suite.T(), err)

	plates, err := NewInventoryItem("PLATE001", "Dinner Plates", 100.0, UnitTypeUnits, 8.50)
	assert.NoError(suite.T(), err)

	salt, err := NewInventoryItem("SALT001", "Sea Salt", 500.0, UnitTypeGrams, 0.05)
	assert.NoError(suite.T(), err)

	oil, err := NewInventoryItem("OIL001", "Olive Oil", 2000.0, UnitTypeMilliliters, 0.01)
	assert.NoError(suite.T(), err)

	// Test operations on each item
	items := []*InventoryItem{flour, milk, plates, salt, oil}
	quantities := []float64{5.0, 10.0, 20.0, 100.0, 500.0}

	for i, item := range items {
		// Test using stock
		movement, err := item.AddMovement(MovementTypeUsed, quantities[i], "Test usage", "TEST001", "test")
		assert.NoError(suite.T(), err)
		assert.NotNil(suite.T(), movement)

		// Test receiving stock
		movement, err = item.AddMovement(MovementTypeReceived, quantities[i]*2, "Test restock", "TEST002", "test")
		assert.NoError(suite.T(), err)
		assert.NotNil(suite.T(), movement)

		// Verify final stock
		expectedStock := item.Movements[0].PreviousStock - quantities[i] + (quantities[i] * 2)
		assert.Equal(suite.T(), expectedStock, item.CurrentStock)
	}
}

func (suite *InventoryDomainTestSuite) TestEdgeCases() {
	// Test with very small quantities
	item, err := NewInventoryItem("SPICE001", "Black Pepper", 0.1, UnitTypeGrams, 0.01)
	assert.NoError(suite.T(), err)

	// Use tiny amount
	_, err = item.AddMovement(MovementTypeUsed, 0.05, "Small usage", "TEST001", "test")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0.05, item.CurrentStock)

	// Test with large quantities
	bulk, err := NewInventoryItem("RICE001", "Rice Bulk", 1000.0, UnitTypeKilograms, 0.75)
	assert.NoError(suite.T(), err)

	// Large usage
	_, err = bulk.AddMovement(MovementTypeUsed, 999.99, "Large order", "BULK001", "manager")
	assert.NoError(suite.T(), err)
	assert.InDelta(suite.T(), 0.01, bulk.CurrentStock, 0.001)

	// Test exact stock usage
	exact, err := NewInventoryItem("EXACT001", "Exact Test Item", 100.0, UnitTypeUnits, 1.0)
	assert.NoError(suite.T(), err)

	// Use exact amount
	_, err = exact.AddMovement(MovementTypeUsed, 100.0, "Use all", "EXACT001", "test")
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 0.0, exact.CurrentStock)
	assert.True(suite.T(), exact.IsOutOfStock())
}