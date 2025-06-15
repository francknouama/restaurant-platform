package infrastructure

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
)

// SupplierRepositoryTestSuite tests supplier repository operations
type SupplierRepositoryTestSuite struct {
	suite.Suite
	repo *TestInventoryRepository
	db   *DB
	ctx  context.Context
}

func TestSupplierRepositoryTestSuite(t *testing.T) {
	suite.Run(t, new(SupplierRepositoryTestSuite))
}

func (suite *SupplierRepositoryTestSuite) SetupTest() {
	// Create in-memory SQLite database
	db, err := NewTestDB()
	suite.Require().NoError(err)
	
	suite.db = db
	suite.repo = NewTestInventoryRepository(db)
	suite.ctx = context.Background()
}

func (suite *SupplierRepositoryTestSuite) TearDownTest() {
	suite.db.Close()
}

func (suite *SupplierRepositoryTestSuite) TestCreateSupplier_Success() {
	// Given
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "SUP001",
		Name:        "Test Supplier",
		ContactInfo: inventory.ContactInfo{
			Email:       "supplier@test.com",
			Phone:       "+1234567890",
			Address:     "123 Test St",
			ContactName: "John Doe",
		},
		IsActive:  true,
		Rating:    4.5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	// When
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify supplier was created
	retrieved, err := suite.repo.GetSupplierByID(suite.ctx, supplier.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), supplier.Code, retrieved.Code)
	assert.Equal(suite.T(), supplier.Name, retrieved.Name)
	assert.Equal(suite.T(), supplier.ContactInfo.Email, retrieved.ContactInfo.Email)
}

func (suite *SupplierRepositoryTestSuite) TestGetSupplierByID_Success() {
	// Given
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "SUP002",
		Name:        "Another Supplier",
		ContactInfo: inventory.ContactInfo{
			Email:       "another@test.com",
			Phone:       "+0987654321",
			Address:     "456 Test Ave",
			ContactName: "Jane Smith",
		},
		IsActive:  true,
		Rating:    3.8,
		Notes:     "Reliable supplier for vegetables",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	suite.Require().NoError(err)
	
	// When
	retrieved, err := suite.repo.GetSupplierByID(suite.ctx, supplier.ID)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), retrieved)
	assert.Equal(suite.T(), supplier.ID, retrieved.ID)
	assert.Equal(suite.T(), supplier.Code, retrieved.Code)
	assert.Equal(suite.T(), supplier.Name, retrieved.Name)
	assert.Equal(suite.T(), supplier.Notes, retrieved.Notes)
	assert.Equal(suite.T(), supplier.Rating, retrieved.Rating)
}

func (suite *SupplierRepositoryTestSuite) TestGetSupplierByID_NotFound() {
	// Given
	nonExistentID := inventory.NewSupplierID()
	
	// When
	supplier, err := suite.repo.GetSupplierByID(suite.ctx, nonExistentID)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.Contains(suite.T(), err.Error(), "not found")
}

func (suite *SupplierRepositoryTestSuite) TestGetSupplierByCode_Success() {
	// Given
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "UNIQUE001",
		Name:        "Unique Supplier",
		ContactInfo: inventory.ContactInfo{
			Email: "unique@test.com",
			Phone: "+1111111111",
		},
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	suite.Require().NoError(err)
	
	// When
	retrieved, err := suite.repo.GetSupplierByCode(suite.ctx, supplier.Code)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), retrieved)
	assert.Equal(suite.T(), supplier.ID, retrieved.ID)
	assert.Equal(suite.T(), supplier.Code, retrieved.Code)
}

func (suite *SupplierRepositoryTestSuite) TestUpdateSupplier_Success() {
	// Given
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "UPDATE001",
		Name:        "Original Name",
		ContactInfo: inventory.ContactInfo{
			Email: "original@test.com",
			Phone: "+1000000000",
		},
		IsActive:  true,
		Rating:    3.0,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	suite.Require().NoError(err)
	
	// When - Update supplier
	supplier.Name = "Updated Name"
	supplier.ContactInfo.Email = "updated@test.com"
	supplier.Rating = 4.2
	supplier.Notes = "Updated notes"
	supplier.UpdatedAt = time.Now()
	
	err = suite.repo.UpdateSupplier(suite.ctx, supplier)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify updates
	retrieved, err := suite.repo.GetSupplierByID(suite.ctx, supplier.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "Updated Name", retrieved.Name)
	assert.Equal(suite.T(), "updated@test.com", retrieved.ContactInfo.Email)
	assert.Equal(suite.T(), 4.2, retrieved.Rating)
	assert.Equal(suite.T(), "Updated notes", retrieved.Notes)
}

func (suite *SupplierRepositoryTestSuite) TestDeleteSupplier_Success() {
	// Given
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "DELETE001",
		Name:        "To Be Deleted",
		ContactInfo: inventory.ContactInfo{
			Email: "delete@test.com",
		},
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	suite.Require().NoError(err)
	
	// When
	err = suite.repo.DeleteSupplier(suite.ctx, supplier.ID)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify supplier was deleted
	deleted, err := suite.repo.GetSupplierByID(suite.ctx, supplier.ID)
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), deleted)
}

func (suite *SupplierRepositoryTestSuite) TestListSuppliers_All() {
	// Given - Create multiple suppliers
	suppliers := []*inventory.Supplier{
		{
			ID:          inventory.NewSupplierID(),
			Code:        "LIST001",
			Name:        "Supplier A",
			ContactInfo: inventory.ContactInfo{Email: "a@test.com"},
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          inventory.NewSupplierID(),
			Code:        "LIST002",
			Name:        "Supplier B",
			ContactInfo: inventory.ContactInfo{Email: "b@test.com"},
			IsActive:    false,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          inventory.NewSupplierID(),
			Code:        "LIST003",
			Name:        "Supplier C",
			ContactInfo: inventory.ContactInfo{Email: "c@test.com"},
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}
	
	for _, s := range suppliers {
		err := suite.repo.CreateSupplier(suite.ctx, s)
		suite.Require().NoError(err)
	}
	
	// When - List all suppliers
	allSuppliers, err := suite.repo.ListSuppliers(suite.ctx, false)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.GreaterOrEqual(suite.T(), len(allSuppliers), 3)
}

func (suite *SupplierRepositoryTestSuite) TestListSuppliers_ActiveOnly() {
	// Given - Create suppliers with different active states
	activeSupplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "ACTIVE001",
		Name:        "Active Supplier",
		ContactInfo: inventory.ContactInfo{Email: "active@test.com"},
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	inactiveSupplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "INACTIVE001",
		Name:        "Inactive Supplier",
		ContactInfo: inventory.ContactInfo{Email: "inactive@test.com"},
		IsActive:    false,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, activeSupplier)
	suite.Require().NoError(err)
	err = suite.repo.CreateSupplier(suite.ctx, inactiveSupplier)
	suite.Require().NoError(err)
	
	// When - List active suppliers only
	activeSuppliers, err := suite.repo.ListSuppliers(suite.ctx, true)
	
	// Then
	assert.NoError(suite.T(), err)
	
	// Verify only active suppliers are returned
	for _, s := range activeSuppliers {
		assert.True(suite.T(), s.IsActive)
	}
	
	// Check that our active supplier is in the list
	found := false
	for _, s := range activeSuppliers {
		if s.ID == activeSupplier.ID {
			found = true
			break
		}
	}
	assert.True(suite.T(), found, "Active supplier should be in the list")
}

func (suite *SupplierRepositoryTestSuite) TestGetSuppliersByItem_Success() {
	// Given
	// Create suppliers
	supplier1 := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "ITEM_SUP001",
		Name:        "Item Supplier 1",
		ContactInfo: inventory.ContactInfo{Email: "sup1@test.com"},
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	supplier2 := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "ITEM_SUP002",
		Name:        "Item Supplier 2",
		ContactInfo: inventory.ContactInfo{Email: "sup2@test.com"},
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier1)
	suite.Require().NoError(err)
	err = suite.repo.CreateSupplier(suite.ctx, supplier2)
	suite.Require().NoError(err)
	
	// Create items linked to suppliers
	item1, err := inventory.NewInventoryItem("ITEM001", "Item 1", 100, inventory.UnitTypeUnits, 10.0)
	suite.Require().NoError(err)
	item1.SupplierID = supplier1.ID
	
	item2, err := inventory.NewInventoryItem("ITEM002", "Item 2", 200, inventory.UnitTypeUnits, 20.0)
	suite.Require().NoError(err)
	item2.SupplierID = supplier2.ID
	
	err = suite.repo.CreateItem(suite.ctx, item1)
	suite.Require().NoError(err)
	err = suite.repo.CreateItem(suite.ctx, item2)
	suite.Require().NoError(err)
	
	// When - Get suppliers for item1
	suppliers, err := suite.repo.GetSuppliersByItem(suite.ctx, item1.ID)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), suppliers, 1)
	assert.Equal(suite.T(), supplier1.ID, suppliers[0].ID)
}

func (suite *SupplierRepositoryTestSuite) TestCreateSupplier_DuplicateCode() {
	// Given
	supplier1 := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "DUPLICATE001",
		Name:        "First Supplier",
		ContactInfo: inventory.ContactInfo{Email: "first@test.com"},
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	supplier2 := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "DUPLICATE001", // Same code
		Name:        "Second Supplier",
		ContactInfo: inventory.ContactInfo{Email: "second@test.com"},
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// When
	err := suite.repo.CreateSupplier(suite.ctx, supplier1)
	assert.NoError(suite.T(), err)
	
	err = suite.repo.CreateSupplier(suite.ctx, supplier2)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "duplicate")
}