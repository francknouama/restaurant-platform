package application

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
	"github.com/restaurant-platform/inventory-service/internal/infrastructure"
)


// InventoryServiceIntegrationTestSuite tests the complete inventory service with real repository
type InventoryServiceIntegrationTestSuite struct {
	suite.Suite
	service  *InventoryService
	repo     *infrastructure.TestInventoryRepository
	db       *infrastructure.DB
	ctx      context.Context
}

func TestInventoryServiceIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(InventoryServiceIntegrationTestSuite))
}

func (suite *InventoryServiceIntegrationTestSuite) SetupTest() {
	// Create in-memory SQLite database
	db, err := infrastructure.NewTestDB()
	suite.Require().NoError(err)
	
	suite.db = db
	suite.repo = infrastructure.NewTestInventoryRepository(db)
	
	// Create mock event publisher
	mockPublisher := &MockEventPublisher{}
	mockPublisher.On("PublishInventoryEvent", mock.Anything, mock.Anything).Return(nil)
	
	suite.service = NewInventoryService(suite.repo, mockPublisher)
	suite.ctx = context.Background()
}

func (suite *InventoryServiceIntegrationTestSuite) TearDownTest() {
	suite.db.Close()
}

func (suite *InventoryServiceIntegrationTestSuite) TestCompleteInventoryWorkflow() {
	// 1. Create a supplier
	supplier := &inventory.Supplier{
		ID:          inventory.NewSupplierID(),
		Code:        "WORKFLOW_SUP001",
		Name:        "Workflow Supplier",
		ContactInfo: inventory.ContactInfo{
			Email:       "workflow@supplier.com",
			Phone:       "+1234567890",
			Address:     "123 Supplier St",
			ContactName: "John Supplier",
		},
		IsActive:  true,
		Rating:    4.5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	err := suite.repo.CreateSupplier(suite.ctx, supplier)
	suite.Require().NoError(err)
	
	// 2. Create an inventory item linked to the supplier
	createCmd := CreateInventoryItemCommand{
		SKU:          "WORKFLOW001",
		Name:         "Workflow Test Item",
		InitialStock: 100,
		Unit:         string(inventory.UnitTypeUnits),
		Cost:         25.50,
		Category:     "Test Category",
		MinThreshold: 20,
		MaxThreshold: 200,
		ReorderPoint: 50,
	}
	
	item, err := suite.service.CreateInventoryItem(suite.ctx, createCmd)
	suite.Require().NoError(err)
	suite.Require().NotNil(item)
	
	// 3. Link item to supplier
	item.SupplierID = supplier.ID
	err = suite.repo.UpdateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	// 4. Record an inbound movement (receiving stock)
	inboundMovement := &inventory.StockMovement{
		ID:              inventory.NewMovementID(),
		InventoryItemID: item.ID,
		ItemID:          item.ID, // Alias for compatibility
		Type:            inventory.MovementTypeInbound,
		Quantity:        50,
		PreviousStock:   item.CurrentStock,
		NewStock:        item.CurrentStock + 50,
		Unit:            item.Unit,
		Cost:            1275, // 50 * 25.50
		Reason:          "Purchase order received",
		Reference:       "PO-2025-001",
		PerformedBy:     "warehouse_user",
		PerformedAt:     time.Now(),
		CreatedAt:       time.Now(),
	}
	
	err = suite.repo.CreateMovement(suite.ctx, inboundMovement)
	suite.Require().NoError(err)
	
	// Update stock level
	item.CurrentStock = inboundMovement.NewStock
	err = suite.repo.UpdateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	// 5. Verify item stock was updated
	updatedItem, err := suite.service.GetInventoryItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 150.0, updatedItem.CurrentStock) // 100 + 50
	
	// 6. Record an outbound movement (fulfilling order)
	outboundMovement := &inventory.StockMovement{
		ID:              inventory.NewMovementID(),
		InventoryItemID: item.ID,
		ItemID:          item.ID, // Alias for compatibility
		Type:            inventory.MovementTypeOutbound,
		Quantity:        30,
		PreviousStock:   item.CurrentStock,
		NewStock:        item.CurrentStock - 30,
		Unit:            item.Unit,
		Cost:            765, // 30 * 25.50
		Reason:          "Order fulfillment",
		Reference:       "ORDER-2025-001",
		PerformedBy:     "warehouse_user",
		PerformedAt:     time.Now(),
		CreatedAt:       time.Now(),
	}
	
	err = suite.repo.CreateMovement(suite.ctx, outboundMovement)
	suite.Require().NoError(err)
	
	// Update stock level
	item.CurrentStock = outboundMovement.NewStock
	err = suite.repo.UpdateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	// 7. Check final stock level
	finalItem, err := suite.service.GetInventoryItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 120.0, finalItem.CurrentStock) // 150 - 30
	
	// 8. Get movements history
	movements, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 10, 0)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), movements, 2)
	
	// 9. Verify supplier linkage
	suppliers, err := suite.repo.GetSuppliersByItem(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), suppliers, 1)
	assert.Equal(suite.T(), supplier.ID, suppliers[0].ID)
}

func (suite *InventoryServiceIntegrationTestSuite) TestLowStockDetection() {
	// Given - Item with low stock threshold
	createCmd := CreateInventoryItemCommand{
		SKU:          "LOWSTOCK001",
		Name:         "Low Stock Item",
		InitialStock: 25,
		Unit:         string(inventory.UnitTypeUnits),
		Cost:         10.0,
		MinThreshold: 15, // Low stock threshold
		MaxThreshold: 100,
		ReorderPoint: 20, // Reorder point is between min and max
	}
	
	item, err := suite.service.CreateInventoryItem(suite.ctx, createCmd)
	suite.Require().NoError(err)
	
	// When - Consume stock to go below threshold
	outboundMovement := &inventory.StockMovement{
		ID:              inventory.NewMovementID(),
		InventoryItemID: item.ID,
		ItemID:          item.ID, // Alias for compatibility
		Type:            inventory.MovementTypeOutbound,
		Quantity:        10, // This will bring stock to 15, below threshold of 20
		PreviousStock:   item.CurrentStock,
		NewStock:        item.CurrentStock - 10,
		Unit:            item.Unit,
		Cost:            100,
		Reason:          "Order fulfillment",
		Reference:       "ORDER-LOW-001",
		PerformedBy:     "system",
		PerformedAt:     time.Now(),
		CreatedAt:       time.Now(),
	}
	
	err = suite.repo.CreateMovement(suite.ctx, outboundMovement)
	suite.Require().NoError(err)
	
	// Update stock
	item.CurrentStock = outboundMovement.NewStock
	err = suite.repo.UpdateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	// Then - Verify low stock condition
	updatedItem, err := suite.service.GetInventoryItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 15.0, updatedItem.CurrentStock)
	assert.True(suite.T(), updatedItem.IsLowStock())
}

func (suite *InventoryServiceIntegrationTestSuite) TestStockAdjustmentWorkflow() {
	// Given - Item with some stock
	createCmd := CreateInventoryItemCommand{
		SKU:          "ADJUST001",
		Name:         "Adjustment Test Item",
		InitialStock: 100,
		Unit:         string(inventory.UnitTypeKilograms),
		Cost:         5.0,
	}
	
	item, err := suite.service.CreateInventoryItem(suite.ctx, createCmd)
	suite.Require().NoError(err)
	
	// When - Physical count shows different quantity (stock adjustment needed)
	actualCount := 95.5 // Lost 4.5 kg
	adjustmentQty := actualCount - item.CurrentStock
	
	adjustmentMovement := &inventory.StockMovement{
		ID:              inventory.NewMovementID(),
		InventoryItemID: item.ID,
		ItemID:          item.ID, // Alias for compatibility
		Type:            inventory.MovementTypeAdjustment,
		Quantity:        adjustmentQty, // Negative value for loss
		PreviousStock:   item.CurrentStock,
		NewStock:        actualCount,
		Unit:            item.Unit,
		Cost:            0, // No cost impact for adjustments
		Reason:          "Physical inventory count - spoilage",
		Reference:       "ADJUST-2025-001",
		PerformedBy:     "inventory_manager",
		PerformedAt:     time.Now(),
		CreatedAt:       time.Now(),
	}
	
	err = suite.repo.CreateMovement(suite.ctx, adjustmentMovement)
	suite.Require().NoError(err)
	
	// Update stock
	item.CurrentStock = actualCount
	err = suite.repo.UpdateItem(suite.ctx, item)
	suite.Require().NoError(err)
	
	// Then - Verify adjustment
	updatedItem, err := suite.service.GetInventoryItemByID(suite.ctx, item.ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 95.5, updatedItem.CurrentStock)
	
	// Verify movement history includes adjustment
	movements, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 10, 0)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), movements, 1)
	assert.Equal(suite.T(), inventory.MovementTypeAdjustment, movements[0].Type)
	assert.Equal(suite.T(), adjustmentQty, movements[0].Quantity)
}

func (suite *InventoryServiceIntegrationTestSuite) TestSupplierManagementWorkflow() {
	// 1. Create multiple suppliers
	suppliers := []*inventory.Supplier{
		{
			ID:          inventory.NewSupplierID(),
			Code:        "MULTI_SUP001",
			Name:        "Primary Supplier",
			ContactInfo: inventory.ContactInfo{
				Email: "primary@supplier.com",
				Phone: "+1111111111",
			},
			IsActive: true,
			Rating:   4.8,
		},
		{
			ID:          inventory.NewSupplierID(),
			Code:        "MULTI_SUP002",
			Name:        "Secondary Supplier",
			ContactInfo: inventory.ContactInfo{
				Email: "secondary@supplier.com",
				Phone: "+2222222222",
			},
			IsActive: true,
			Rating:   4.2,
		},
		{
			ID:          inventory.NewSupplierID(),
			Code:        "MULTI_SUP003",
			Name:        "Backup Supplier",
			ContactInfo: inventory.ContactInfo{
				Email: "backup@supplier.com",
				Phone: "+3333333333",
			},
			IsActive: false, // Inactive
			Rating:   3.5,
		},
	}
	
	for _, s := range suppliers {
		s.CreatedAt = time.Now()
		s.UpdatedAt = time.Now()
		err := suite.repo.CreateSupplier(suite.ctx, s)
		suite.Require().NoError(err)
	}
	
	// 2. List active suppliers
	activeSuppliers, err := suite.repo.ListSuppliers(suite.ctx, true)
	assert.NoError(suite.T(), err)
	assert.GreaterOrEqual(suite.T(), len(activeSuppliers), 2)
	
	// 3. Update supplier rating based on performance
	suppliers[1].Rating = 4.6 // Improved rating
	suppliers[1].Notes = "Improved delivery times in Q4 2024"
	err = suite.repo.UpdateSupplier(suite.ctx, suppliers[1])
	assert.NoError(suite.T(), err)
	
	// 4. Deactivate poor performing supplier
	suppliers[0].IsActive = false
	suppliers[0].Notes = "Consistent delivery delays, moved to inactive status"
	err = suite.repo.UpdateSupplier(suite.ctx, suppliers[0])
	assert.NoError(suite.T(), err)
	
	// 5. Verify changes
	updatedSupplier, err := suite.repo.GetSupplierByID(suite.ctx, suppliers[1].ID)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 4.6, updatedSupplier.Rating)
	assert.Contains(suite.T(), updatedSupplier.Notes, "Improved delivery")
}

func (suite *InventoryServiceIntegrationTestSuite) TestMovementReporting() {
	// Setup - Create item and movements over time
	item, err := suite.service.CreateInventoryItem(suite.ctx, CreateInventoryItemCommand{
		SKU:          "REPORT001",
		Name:         "Reporting Test Item",
		InitialStock: 1000,
		Unit:         string(inventory.UnitTypeUnits),
		Cost:         15.0,
	})
	suite.Require().NoError(err)
	
	// Create movements over different dates
	now := time.Now()
	movements := []struct {
		daysAgo  int
		movType  inventory.MovementType
		quantity float64
	}{
		{14, inventory.MovementTypeInbound, 200},
		{10, inventory.MovementTypeOutbound, 50},
		{7, inventory.MovementTypeOutbound, 100},
		{5, inventory.MovementTypeInbound, 150},
		{3, inventory.MovementTypeAdjustment, -25},
		{1, inventory.MovementTypeOutbound, 75},
		{0, inventory.MovementTypeOutbound, 50},
	}
	
	for _, m := range movements {
		movement := &inventory.StockMovement{
			ID:              inventory.NewMovementID(),
			InventoryItemID: item.ID,
			ItemID:          item.ID, // Alias for compatibility
			Type:            m.movType,
			Quantity:        m.quantity,
			PreviousStock:   0, // For test purposes
			NewStock:        0, // For test purposes
			Unit:            item.Unit,
			Cost:            m.quantity * 15.0,
			Reason:          "Test movement",
			PerformedBy:     "test_user",
			PerformedAt:     now.AddDate(0, 0, -m.daysAgo),
			CreatedAt:       now.AddDate(0, 0, -m.daysAgo),
		}
		err := suite.repo.CreateMovement(suite.ctx, movement)
		suite.Require().NoError(err)
	}
	
	// Test 1: Get movements for last week
	weekAgo := now.AddDate(0, 0, -7)
	tomorrow := now.AddDate(0, 0, 1)
	
	weekMovements, err := suite.repo.GetMovementsByDateRange(suite.ctx, weekAgo, tomorrow)
	assert.NoError(suite.T(), err)
	assert.Len(suite.T(), weekMovements, 5) // Should get movements from last 7 days
	
	// Test 2: Get movements by type
	outboundMovements, err := suite.repo.GetMovementsByType(suite.ctx, inventory.MovementTypeOutbound)
	assert.NoError(suite.T(), err)
	
	totalOutbound := 0.0
	for _, m := range outboundMovements {
		if m.ItemID == item.ID {
			totalOutbound += m.Quantity
		}
	}
	assert.Equal(suite.T(), 275.0, totalOutbound) // 50 + 100 + 75 + 50
	
	// Test 3: Calculate net change
	allMovements, err := suite.repo.GetMovementsByItemID(suite.ctx, item.ID, 100, 0)
	assert.NoError(suite.T(), err)
	
	netChange := 0.0
	for _, m := range allMovements {
		if m.Type == inventory.MovementTypeInbound {
			netChange += m.Quantity
		} else if m.Type == inventory.MovementTypeAdjustment {
			netChange += m.Quantity // Adjustment quantity can be positive or negative
		} else {
			netChange -= m.Quantity // Outbound movements
		}
	}
	
	expectedNetChange := 200.0 + 150.0 - 50.0 - 100.0 - 75.0 - 50.0 - 25.0
	assert.Equal(suite.T(), expectedNetChange, netChange)
}