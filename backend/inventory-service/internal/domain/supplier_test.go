package inventory

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// SupplierDomainTestSuite contains supplier domain tests
type SupplierDomainTestSuite struct {
	suite.Suite
}

func TestSupplierDomainTestSuite(t *testing.T) {
	suite.Run(t, new(SupplierDomainTestSuite))
}

func (suite *SupplierDomainTestSuite) TestNewSupplierID() {
	// When
	id1 := NewSupplierID()
	id2 := NewSupplierID()
	
	// Then
	assert.NotEmpty(suite.T(), id1)
	assert.NotEmpty(suite.T(), id2)
	assert.NotEqual(suite.T(), id1, id2)
	assert.True(suite.T(), id1.HasPrefix("supplier_"))
	assert.True(suite.T(), id2.HasPrefix("supplier_"))
}

func (suite *SupplierDomainTestSuite) TestNewSupplier_Success() {
	// Given
	code := "SUP001"
	name := "Test Supplier Inc."
	contactInfo := ContactInfo{
		Email:       "contact@testsupplier.com",
		Phone:       "+1234567890",
		Address:     "123 Business St, Commerce City, CC 12345",
		ContactName: "John Business",
	}
	
	// When
	supplier, err := NewSupplier(code, name, contactInfo)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), supplier)
	assert.NotEmpty(suite.T(), supplier.ID)
	assert.Equal(suite.T(), code, supplier.Code)
	assert.Equal(suite.T(), name, supplier.Name)
	assert.Equal(suite.T(), contactInfo, supplier.ContactInfo)
	assert.True(suite.T(), supplier.IsActive)
	assert.Equal(suite.T(), 0.0, supplier.Rating)
	assert.NotZero(suite.T(), supplier.CreatedAt)
	assert.NotZero(suite.T(), supplier.UpdatedAt)
}

func (suite *SupplierDomainTestSuite) TestNewSupplier_EmptyCode() {
	// Given
	contactInfo := ContactInfo{
		Email: "test@test.com",
		Phone: "+1234567890",
	}
	
	// When
	supplier, err := NewSupplier("", "Test Supplier", contactInfo)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.Contains(suite.T(), err.Error(), "supplier code is required")
}

func (suite *SupplierDomainTestSuite) TestNewSupplier_EmptyName() {
	// Given
	contactInfo := ContactInfo{
		Email: "test@test.com",
		Phone: "+1234567890",
	}
	
	// When
	supplier, err := NewSupplier("SUP001", "", contactInfo)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), supplier)
	assert.Contains(suite.T(), err.Error(), "supplier name is required")
}

func (suite *SupplierDomainTestSuite) TestSupplierValidation_Valid() {
	// Given
	supplier := &Supplier{
		ID:   NewSupplierID(),
		Code: "SUP001",
		Name: "Valid Supplier",
		ContactInfo: ContactInfo{
			Email: "valid@supplier.com",
			Phone: "+1234567890",
		},
		IsActive:  true,
		Rating:    4.5,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	// When
	err := supplier.Validate()
	
	// Then
	assert.NoError(suite.T(), err)
}

func (suite *SupplierDomainTestSuite) TestSupplierValidation_InvalidEmail() {
	// Given
	supplier := &Supplier{
		ID:   NewSupplierID(),
		Code: "SUP001",
		Name: "Test Supplier",
		ContactInfo: ContactInfo{
			Email: "invalid-email",
			Phone: "+1234567890",
		},
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	
	// When
	err := supplier.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "invalid email format")
}

func (suite *SupplierDomainTestSuite) TestSupplierValidation_EmptyContactInfo() {
	// Given
	supplier := &Supplier{
		ID:          NewSupplierID(),
		Code:        "SUP001",
		Name:        "Test Supplier",
		ContactInfo: ContactInfo{}, // Empty contact info
		IsActive:    true,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	// When
	err := supplier.Validate()
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "at least email or phone is required")
}

func (suite *SupplierDomainTestSuite) TestSupplierValidation_InvalidRating() {
	// Test cases for invalid ratings
	invalidRatings := []float64{-1, 5.1, 10}
	
	for _, rating := range invalidRatings {
		supplier := &Supplier{
			ID:   NewSupplierID(),
			Code: "SUP001",
			Name: "Test Supplier",
			ContactInfo: ContactInfo{
				Email: "test@supplier.com",
			},
			IsActive:  true,
			Rating:    rating,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		
		err := supplier.Validate()
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "rating must be between 0 and 5")
	}
	
	// Test valid ratings
	validRatings := []float64{0, 1, 2.5, 3.7, 4.9, 5}
	
	for _, rating := range validRatings {
		supplier := &Supplier{
			ID:   NewSupplierID(),
			Code: "SUP001",
			Name: "Test Supplier",
			ContactInfo: ContactInfo{
				Email: "test@supplier.com",
			},
			IsActive:  true,
			Rating:    rating,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		
		err := supplier.Validate()
		assert.NoError(suite.T(), err)
	}
}

func (suite *SupplierDomainTestSuite) TestSupplierUpdateRating() {
	// Given
	supplier, err := NewSupplier("SUP001", "Test Supplier", ContactInfo{
		Email: "test@supplier.com",
	})
	suite.Require().NoError(err)
	
	// When - Update with valid rating
	err = supplier.UpdateRating(4.5)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), 4.5, supplier.Rating)
	
	// When - Update with invalid rating
	err = supplier.UpdateRating(6.0)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "invalid rating")
	assert.Equal(suite.T(), 4.5, supplier.Rating) // Rating unchanged
}

func (suite *SupplierDomainTestSuite) TestSupplierActivateDeactivate() {
	// Given
	supplier, err := NewSupplier("SUP001", "Test Supplier", ContactInfo{
		Email: "test@supplier.com",
	})
	suite.Require().NoError(err)
	suite.Require().True(supplier.IsActive)
	
	// When - Deactivate
	supplier.Deactivate()
	
	// Then
	assert.False(suite.T(), supplier.IsActive)
	
	// When - Activate
	supplier.Activate()
	
	// Then
	assert.True(suite.T(), supplier.IsActive)
}

func (suite *SupplierDomainTestSuite) TestSupplierUpdateContactInfo() {
	// Given
	supplier, err := NewSupplier("SUP001", "Test Supplier", ContactInfo{
		Email: "old@supplier.com",
		Phone: "+1111111111",
	})
	suite.Require().NoError(err)
	originalUpdatedAt := supplier.UpdatedAt
	
	// Wait a bit to ensure timestamp difference
	time.Sleep(10 * time.Millisecond)
	
	// When
	newContactInfo := ContactInfo{
		Email:       "new@supplier.com",
		Phone:       "+2222222222",
		Address:     "456 New St",
		ContactName: "Jane New",
	}
	
	err = supplier.UpdateContactInfo(newContactInfo)
	
	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), newContactInfo, supplier.ContactInfo)
	assert.True(suite.T(), supplier.UpdatedAt.After(originalUpdatedAt))
}

func (suite *SupplierDomainTestSuite) TestSupplierUpdateContactInfo_Invalid() {
	// Given
	supplier, err := NewSupplier("SUP001", "Test Supplier", ContactInfo{
		Email: "test@supplier.com",
	})
	suite.Require().NoError(err)
	
	// When - Update with invalid contact info
	invalidContactInfo := ContactInfo{} // Empty
	
	err = supplier.UpdateContactInfo(invalidContactInfo)
	
	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "at least email or phone is required")
	assert.Equal(suite.T(), "test@supplier.com", supplier.ContactInfo.Email) // Unchanged
}

func (suite *SupplierDomainTestSuite) TestContactInfoValidation() {
	// Test valid contact info
	validCases := []ContactInfo{
		{Email: "valid@email.com"},
		{Phone: "+1234567890"},
		{Email: "valid@email.com", Phone: "+1234567890"},
		{Email: "valid@email.com", Phone: "+1234567890", Address: "123 St", ContactName: "John"},
	}
	
	for _, contact := range validCases {
		err := contact.Validate()
		assert.NoError(suite.T(), err)
	}
	
	// Test invalid contact info
	invalidCases := []struct {
		contact ContactInfo
		errMsg  string
	}{
		{
			contact: ContactInfo{},
			errMsg:  "at least email or phone is required",
		},
		{
			contact: ContactInfo{Email: "invalid-email"},
			errMsg:  "invalid email format",
		},
		{
			contact: ContactInfo{Email: "@invalid.com"},
			errMsg:  "invalid email format",
		},
		{
			contact: ContactInfo{Email: "no-at-sign.com"},
			errMsg:  "invalid email format",
		},
	}
	
	for _, tc := range invalidCases {
		err := tc.contact.Validate()
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), tc.errMsg)
	}
}

func (suite *SupplierDomainTestSuite) TestSupplierWithNotes() {
	// Given
	supplier, err := NewSupplier("SUP001", "Test Supplier", ContactInfo{
		Email: "test@supplier.com",
	})
	suite.Require().NoError(err)
	
	// When
	notes := "This supplier has excellent delivery times and quality products. Preferred for vegetables."
	supplier.Notes = notes
	
	// Then
	err = supplier.Validate()
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), notes, supplier.Notes)
}

func (suite *SupplierDomainTestSuite) TestSupplierEquality() {
	// Given
	id := NewSupplierID()
	supplier1 := &Supplier{
		ID:   id,
		Code: "SUP001",
		Name: "Test Supplier",
	}
	
	supplier2 := &Supplier{
		ID:   id,
		Code: "SUP002", // Different code
		Name: "Different Name",
	}
	
	supplier3 := &Supplier{
		ID:   NewSupplierID(), // Different ID
		Code: "SUP001",
		Name: "Test Supplier",
	}
	
	// Then
	assert.Equal(suite.T(), supplier1.ID, supplier2.ID) // Same ID
	assert.NotEqual(suite.T(), supplier1.ID, supplier3.ID) // Different ID
}