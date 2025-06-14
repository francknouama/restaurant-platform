package application

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// PasswordServiceTestSuite contains all password service tests
type PasswordServiceTestSuite struct {
	suite.Suite
	passwordService *PasswordService
}

func TestPasswordServiceTestSuite(t *testing.T) {
	suite.Run(t, new(PasswordServiceTestSuite))
}

func (suite *PasswordServiceTestSuite) SetupTest() {
	suite.passwordService = &PasswordService{
		cost: 4, // Use lower cost for faster tests
	}
}

// Test Password Hashing
func (suite *PasswordServiceTestSuite) TestHashPassword_Success() {
	// Given
	password := "ValidPassword123!"

	// When
	hash, err := suite.passwordService.HashPassword(password)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), hash)
	assert.NotEqual(suite.T(), password, hash)
	assert.True(suite.T(), len(hash) > 50) // bcrypt hashes are typically 60+ characters
}

func (suite *PasswordServiceTestSuite) TestHashPassword_DifferentHashesForSamePassword() {
	// Given
	password := "ValidPassword123!"

	// When
	hash1, err1 := suite.passwordService.HashPassword(password)
	hash2, err2 := suite.passwordService.HashPassword(password)

	// Then
	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.NotEmpty(suite.T(), hash1)
	assert.NotEmpty(suite.T(), hash2)
	assert.NotEqual(suite.T(), hash1, hash2) // Different salts should produce different hashes
}

func (suite *PasswordServiceTestSuite) TestHashPassword_InvalidPassword() {
	// Given
	invalidPassword := "weak" // Too short

	// When
	hash, err := suite.passwordService.HashPassword(invalidPassword)

	// Then
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), hash)
	assert.Contains(suite.T(), err.Error(), "invalid password")
}

// Test Password Comparison
func (suite *PasswordServiceTestSuite) TestComparePassword_Success() {
	// Given
	password := "ValidPassword123!"
	hash, err := suite.passwordService.HashPassword(password)
	assert.NoError(suite.T(), err)

	// When
	isValid := suite.passwordService.ComparePassword(password, hash)

	// Then
	assert.True(suite.T(), isValid)
}

func (suite *PasswordServiceTestSuite) TestComparePassword_WrongPassword() {
	// Given
	password := "ValidPassword123!"
	wrongPassword := "WrongPassword123!"
	hash, err := suite.passwordService.HashPassword(password)
	assert.NoError(suite.T(), err)

	// When
	isValid := suite.passwordService.ComparePassword(wrongPassword, hash)

	// Then
	assert.False(suite.T(), isValid)
}

func (suite *PasswordServiceTestSuite) TestComparePassword_InvalidHash() {
	// Given
	password := "ValidPassword123!"
	invalidHash := "not_a_valid_bcrypt_hash"

	// When
	isValid := suite.passwordService.ComparePassword(password, invalidHash)

	// Then
	assert.False(suite.T(), isValid)
}

func (suite *PasswordServiceTestSuite) TestComparePassword_EmptyPassword() {
	// Given
	password := "ValidPassword123!"
	hash, err := suite.passwordService.HashPassword(password)
	assert.NoError(suite.T(), err)

	// When
	isValid := suite.passwordService.ComparePassword("", hash)

	// Then
	assert.False(suite.T(), isValid)
}

func (suite *PasswordServiceTestSuite) TestComparePassword_EmptyHash() {
	// Given
	password := "ValidPassword123!"

	// When
	isValid := suite.passwordService.ComparePassword(password, "")

	// Then
	assert.False(suite.T(), isValid)
}

// Test Password Validation
func (suite *PasswordServiceTestSuite) TestValidatePassword_Success() {
	// Given
	validPasswords := []string{
		"ValidPassword123!",
		"AnotherGood1@",
		"StrongPass1#",
		"MySecure2$",
		"Complex9%",
	}

	// When & Then
	for _, password := range validPasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.NoError(suite.T(), err, "Password should be valid: %s", password)
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_TooShort() {
	// Given
	shortPasswords := []string{
		"Short1!",
		"A1!",
		"1234567", // 7 characters
		"",
	}

	// When & Then
	for _, password := range shortPasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "at least 8 characters")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_TooLong() {
	// Given
	longPassword := strings.Repeat("ValidPassword123!", 10) // 170 characters

	// When
	err := suite.passwordService.ValidatePassword(longPassword)

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "must not exceed 128 characters")
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_NoUppercase() {
	// Given
	passwords := []string{
		"validpassword123!",
		"lowercase1@",
		"no_upper_case2#",
	}

	// When & Then
	for _, password := range passwords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "at least one uppercase letter")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_NoLowercase() {
	// Given
	passwords := []string{
		"VALIDPASSWORD123!",
		"UPPERCASE1@",
		"NO_LOWER_CASE2#",
	}

	// When & Then
	for _, password := range passwords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "at least one lowercase letter")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_NoNumber() {
	// Given
	passwords := []string{
		"ValidPassword!",
		"NoNumbers@",
		"OnlyLetters#",
	}

	// When & Then
	for _, password := range passwords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "at least one number")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_NoSpecialCharacter() {
	// Given
	passwords := []string{
		"ValidPassword123",
		"NoSpecial123",
		"OnlyAlphaNum1",
	}

	// When & Then
	for _, password := range passwords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "at least one special character")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_CommonPasswords() {
	// Given
	commonPasswords := []string{
		"password",
		"password123",
		"123456",
		"12345678",
		"qwerty",
		"admin",
		"administrator",
		"root",
		"guest",
		"user",
		"welcome",
		"login",
		"restaurant",
		"kitchen",
		"waiter",
	}

	// When & Then
	for _, password := range commonPasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "too common")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_SimplePatterns() {
	// Given
	patternPasswords := []string{
		"aaaaaaaa",      // All same character
		"12345678",      // All numbers
		"abcdefgh",      // All letters
		"password123",   // password + numbers
		"1234567890",    // Long consecutive numbers
	}

	// When & Then
	for _, password := range patternPasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "too common")
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_SequentialCharacters() {
	// Given
	sequentialPasswords := []string{
		"Abcdefg1!",   // abc sequence
		"Valid123!",   // 123 sequence
		"Password987!", // 987 descending sequence
		"MyPass321!",  // 321 descending sequence
	}

	// When & Then
	for _, password := range sequentialPasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.Error(suite.T(), err)
		assert.Contains(suite.T(), err.Error(), "sequential characters")
	}
}

// Test Password Strength Estimation
func (suite *PasswordServiceTestSuite) TestEstimatePasswordStrength_WeakPassword() {
	// Given
	weakPasswords := []string{
		"password",    // Common password
		"12345678",    // All numbers
		"abcdefgh",    // All letters
	}

	// When & Then
	for _, password := range weakPasswords {
		strength := suite.passwordService.EstimatePasswordStrength(password)
		assert.True(suite.T(), strength < 30, "Password should be weak: %s (strength: %d)", password, strength)
	}
}

func (suite *PasswordServiceTestSuite) TestEstimatePasswordStrength_MediumPassword() {
	// Given
	mediumPasswords := []string{
		"Password123",  // Missing special char
		"password123!", // Missing uppercase
		"PASSWORD123!", // Missing lowercase
	}

	// When & Then
	for _, password := range mediumPasswords {
		strength := suite.passwordService.EstimatePasswordStrength(password)
		assert.True(suite.T(), strength >= 30 && strength < 70, "Password should be medium: %s (strength: %d)", password, strength)
	}
}

func (suite *PasswordServiceTestSuite) TestEstimatePasswordStrength_StrongPassword() {
	// Given
	strongPasswords := []string{
		"StrongPassword123!",
		"MySecurePass987@",
		"ComplexPassword456#",
		"VeryLongAndComplexPassword789$",
	}

	// When & Then
	for _, password := range strongPasswords {
		strength := suite.passwordService.EstimatePasswordStrength(password)
		assert.True(suite.T(), strength >= 70, "Password should be strong: %s (strength: %d)", password, strength)
	}
}

func (suite *PasswordServiceTestSuite) TestEstimatePasswordStrength_VeryStrongPassword() {
	// Given
	veryStrongPasswords := []string{
		"VeryLongAndComplexPassword123!@#",
		"SuperSecurePasswordWithManyCharacters789$%^",
	}

	// When & Then
	for _, password := range veryStrongPasswords {
		strength := suite.passwordService.EstimatePasswordStrength(password)
		assert.True(suite.T(), strength >= 85, "Password should be very strong: %s (strength: %d)", password, strength)
	}
}

func (suite *PasswordServiceTestSuite) TestEstimatePasswordStrength_LengthBonus() {
	// Given
	shortPassword := "Short1!"    // 7 chars
	mediumPassword := "Medium123!" // 10 chars
	longPassword := "VeryLongPassword123!" // 19 chars

	// When
	shortStrength := suite.passwordService.EstimatePasswordStrength(shortPassword)
	mediumStrength := suite.passwordService.EstimatePasswordStrength(mediumPassword)
	longStrength := suite.passwordService.EstimatePasswordStrength(longPassword)

	// Then
	assert.True(suite.T(), longStrength > mediumStrength)
	assert.True(suite.T(), mediumStrength > shortStrength)
}

// Test helper functions
func (suite *PasswordServiceTestSuite) TestIsCommonPassword() {
	// Test common passwords
	commonPasswords := []string{
		"password", "123456", "qwerty", "admin",
	}
	
	for _, password := range commonPasswords {
		assert.True(suite.T(), isCommonPassword(password))
	}

	// Test non-common passwords
	uniquePasswords := []string{
		"UniquePassword123!", "MySpecialSecret456@",
	}
	
	for _, password := range uniquePasswords {
		assert.False(suite.T(), isCommonPassword(password))
	}
}

func (suite *PasswordServiceTestSuite) TestHasSequentialChars() {
	// Test passwords with sequential characters
	sequentialPasswords := []string{
		"abc123", "xyz789", "123456", "987654",
	}
	
	for _, password := range sequentialPasswords {
		assert.True(suite.T(), hasSequentialChars(password))
	}

	// Test passwords without sequential characters
	nonSequentialPasswords := []string{
		"afc123", "xzw789", "132456", "987643",
	}
	
	for _, password := range nonSequentialPasswords {
		assert.False(suite.T(), hasSequentialChars(password))
	}
}

func (suite *PasswordServiceTestSuite) TestHasSequentialChars_EdgeCases() {
	// Test short passwords
	assert.False(suite.T(), hasSequentialChars("ab"))
	assert.False(suite.T(), hasSequentialChars(""))
	
	// Test exactly 3 characters
	assert.True(suite.T(), hasSequentialChars("abc"))
	assert.True(suite.T(), hasSequentialChars("321"))
	assert.False(suite.T(), hasSequentialChars("acb"))
}

// Test character type detection
func (suite *PasswordServiceTestSuite) TestValidatePassword_CharacterTypeDetection() {
	// Test various special characters
	specialChars := []string{
		"ValidPass1!", "ValidPass1@", "ValidPass1#", "ValidPass1$",
		"ValidPass1%", "ValidPass1^", "ValidPass1&", "ValidPass1*",
		"ValidPass1(", "ValidPass1)", "ValidPass1-", "ValidPass1_",
		"ValidPass1+", "ValidPass1=", "ValidPass1[", "ValidPass1]",
		"ValidPass1{", "ValidPass1}", "ValidPass1|", "ValidPass1\\",
		"ValidPass1:", "ValidPass1;", "ValidPass1\"", "ValidPass1'",
		"ValidPass1<", "ValidPass1>", "ValidPass1,", "ValidPass1.",
		"ValidPass1?", "ValidPass1/", "ValidPass1~", "ValidPass1`",
	}

	for _, password := range specialChars {
		err := suite.passwordService.ValidatePassword(password)
		assert.NoError(suite.T(), err, "Password with special char should be valid: %s", password)
	}
}

func (suite *PasswordServiceTestSuite) TestValidatePassword_Unicode() {
	// Test with unicode characters
	unicodePasswords := []string{
		"ValidPass1é",  // Accented character
		"ValidPass1ñ",  // Spanish character
		"ValidPass1€",  // Currency symbol
		"ValidPass1™",  // Trademark symbol
	}

	for _, password := range unicodePasswords {
		err := suite.passwordService.ValidatePassword(password)
		assert.NoError(suite.T(), err, "Password with unicode should be valid: %s", password)
	}
}

// Test comprehensive password scenarios
func (suite *PasswordServiceTestSuite) TestCompletePasswordWorkflow() {
	// Given
	plainPassword := "MySecurePassword123!"

	// Test validation
	err := suite.passwordService.ValidatePassword(plainPassword)
	assert.NoError(suite.T(), err)

	// Test hashing
	hash, err := suite.passwordService.HashPassword(plainPassword)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), hash)

	// Test comparison with correct password
	isValid := suite.passwordService.ComparePassword(plainPassword, hash)
	assert.True(suite.T(), isValid)

	// Test comparison with wrong password
	isValid = suite.passwordService.ComparePassword("WrongPassword123!", hash)
	assert.False(suite.T(), isValid)

	// Test strength estimation
	strength := suite.passwordService.EstimatePasswordStrength(plainPassword)
	assert.True(suite.T(), strength >= 70, "Strong password should have high strength score")
}

func (suite *PasswordServiceTestSuite) TestConcurrentPasswordOperations() {
	// Test concurrent hashing and comparison
	password := "ConcurrentTest123!"
	numGoroutines := 50

	// Channels to collect results
	hashes := make(chan string, numGoroutines)
	errors := make(chan error, numGoroutines)

	// Concurrently hash the same password
	for i := 0; i < numGoroutines; i++ {
		go func() {
			hash, err := suite.passwordService.HashPassword(password)
			if err != nil {
				errors <- err
			} else {
				hashes <- hash
			}
		}()
	}

	// Collect results
	var generatedHashes []string
	var hashErrors []error

	for i := 0; i < numGoroutines; i++ {
		select {
		case hash := <-hashes:
			generatedHashes = append(generatedHashes, hash)
		case err := <-errors:
			hashErrors = append(hashErrors, err)
		}
	}

	// Verify results
	assert.Empty(suite.T(), hashErrors)
	assert.Len(suite.T(), generatedHashes, numGoroutines)

	// All hashes should be different (due to different salts)
	hashSet := make(map[string]bool)
	for _, hash := range generatedHashes {
		assert.False(suite.T(), hashSet[hash], "Duplicate hash found")
		hashSet[hash] = true

		// Each hash should validate correctly
		isValid := suite.passwordService.ComparePassword(password, hash)
		assert.True(suite.T(), isValid)
	}
}