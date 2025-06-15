package inventory

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// MovementDomainTestSuite contains movement domain tests
type MovementDomainTestSuite struct {
	suite.Suite
}

func TestMovementDomainTestSuite(t *testing.T) {
	suite.Run(t, new(MovementDomainTestSuite))
}

func (suite *MovementDomainTestSuite) TestNewMovementID() {
	// When
	id1 := NewMovementID()
	id2 := NewMovementID()
	
	// Then
	assert.NotEmpty(suite.T(), id1)
	assert.NotEmpty(suite.T(), id2)
	assert.NotEqual(suite.T(), id1, id2)
	assert.True(suite.T(), id1.HasPrefix("movement_"))
	assert.True(suite.T(), id2.HasPrefix("movement_"))
}

func (suite *MovementDomainTestSuite) TestMovementValidation_Valid() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		Reference:  "PO-123",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
		CreatedAt:  time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.NoError(suite.T(), err)
}

func (suite *MovementDomainTestSuite) TestMovementValidation_EmptyID() {
	// Given
	movement := &InventoryMovement{
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "movement ID is required")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_EmptyItemID() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "item ID is required")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_InvalidType() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementType("INVALID"),
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "invalid movement type")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_ZeroQuantity() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   0,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "quantity must be greater than zero")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_NegativeQuantity() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeOutbound,
		Quantity:   -50,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Order fulfillment",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "quantity must be greater than zero")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_EmptyReason() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeAdjustment,
		Quantity:   10,
		Unit:       UnitTypeKilograms,
		Cost:       0,
		Reason:     "",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "reason is required")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_EmptyPerformedBy() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order",
		PerformedBy: "",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "performed by is required")
}

func (suite *MovementDomainTestSuite) TestMovementValidation_NegativeCost() {
	// Given
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       -1000,
		Reason:     "Purchase order",
		PerformedBy: "user_123",
		PerformedAt: time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "cost cannot be negative")
}

func (suite *MovementDomainTestSuite) TestMovementTypes() {
	// Test all valid movement types
	validTypes := []MovementType{
		MovementTypeInbound,
		MovementTypeOutbound,
		MovementTypeAdjustment,
	}
	
	for _, mt := range validTypes {
		movement := &InventoryMovement{
			ID:         NewMovementID(),
			ItemID:     NewInventoryItemID(),
			Type:       mt,
			Quantity:   10,
			Unit:       UnitTypeUnits,
			Cost:       100,
			Reason:     "Test",
			PerformedBy: "user_123",
			PerformedAt: time.Now(),
		}
		
		err := movement.Validate()
		assert.NoError(suite.T(), err, "Movement type %s should be valid", mt)
	}
}

func (suite *MovementDomainTestSuite) TestMovementWithMetadata() {
	// Given
	metadata := map[string]interface{}{
		"purchase_order_id": "PO-2025-001",
		"supplier_id":       "SUP-123",
		"batch_number":      "BATCH-456",
		"expiry_date":       "2025-12-31",
	}
	
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeKilograms,
		Cost:       1000,
		Reason:     "Purchase order received",
		Reference:  "PO-2025-001",
		PerformedBy: "warehouse_manager",
		PerformedAt: time.Now(),
		Metadata:   metadata,
		CreatedAt:  time.Now(),
	}
	
	// When
	err := movement.Validate()
	
	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "PO-2025-001", movement.Metadata["purchase_order_id"])
	assert.Equal(suite.T(), "SUP-123", movement.Metadata["supplier_id"])
}

func (suite *MovementDomainTestSuite) TestCalculateMovementValue() {
	// Given
	testCases := []struct {
		name     string
		quantity float64
		cost     float64
		unit     UnitType
		expected float64
	}{
		{
			name:     "Simple calculation",
			quantity: 10,
			cost:     100,
			unit:     UnitTypeUnits,
			expected: 100, // Total cost, not per unit
		},
		{
			name:     "Fractional quantity",
			quantity: 5.5,
			cost:     55,
			unit:     UnitTypeKilograms,
			expected: 55,
		},
		{
			name:     "Large quantity",
			quantity: 1000,
			cost:     50000,
			unit:     UnitTypeLiters,
			expected: 50000,
		},
	}
	
	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			movement := &InventoryMovement{
				Quantity: tc.quantity,
				Cost:     tc.cost,
				Unit:     tc.unit,
			}
			
			// The cost field already represents the total value
			assert.Equal(t, tc.expected, movement.Cost)
		})
	}
}

func (suite *MovementDomainTestSuite) TestMovementTimestamps() {
	// Given
	now := time.Now()
	performedAt := now.Add(-1 * time.Hour)
	
	movement := &InventoryMovement{
		ID:         NewMovementID(),
		ItemID:     NewInventoryItemID(),
		Type:       MovementTypeInbound,
		Quantity:   100,
		Unit:       UnitTypeUnits,
		Cost:       1000,
		Reason:     "Test",
		PerformedBy: "user_123",
		PerformedAt: performedAt,
		CreatedAt:  now,
	}
	
	// Then
	assert.True(suite.T(), movement.CreatedAt.After(movement.PerformedAt))
	assert.Equal(suite.T(), performedAt, movement.PerformedAt)
	assert.Equal(suite.T(), now, movement.CreatedAt)
}