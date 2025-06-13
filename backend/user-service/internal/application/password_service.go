package application

import (
	"fmt"
	"regexp"
	"unicode"

	"golang.org/x/crypto/bcrypt"
	"github.com/restaurant-platform/user-service/internal/domain"
)

type PasswordService struct {
	cost int
}

func NewPasswordService() domain.PasswordService {
	return &PasswordService{
		cost: bcrypt.DefaultCost, // bcrypt cost factor (10)
	}
}

func (p *PasswordService) HashPassword(password string) (string, error) {
	if err := p.ValidatePassword(password); err != nil {
		return "", fmt.Errorf("invalid password: %w", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), p.cost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

func (p *PasswordService) ComparePassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func (p *PasswordService) ValidatePassword(password string) error {
	if len(password) < 8 {
		return domain.NewValidationError("password must be at least 8 characters long")
	}

	if len(password) > 128 {
		return domain.NewValidationError("password must not exceed 128 characters")
	}

	var (
		hasUpper   = false
		hasLower   = false
		hasNumber  = false
		hasSpecial = false
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return domain.NewValidationError("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return domain.NewValidationError("password must contain at least one lowercase letter")
	}
	if !hasNumber {
		return domain.NewValidationError("password must contain at least one number")
	}
	if !hasSpecial {
		return domain.NewValidationError("password must contain at least one special character")
	}

	// Check for common patterns
	if isCommonPassword(password) {
		return domain.NewValidationError("password is too common, please choose a different one")
	}

	// Check for sequential characters
	if hasSequentialChars(password) {
		return domain.NewValidationError("password cannot contain sequential characters (e.g., '123', 'abc')")
	}

	return nil
}

// Check for common passwords
func isCommonPassword(password string) bool {
	commonPasswords := []string{
		"password", "password123", "123456", "12345678", "qwerty",
		"admin", "administrator", "root", "guest", "user",
		"welcome", "login", "restaurant", "kitchen", "waiter",
	}

	for _, common := range commonPasswords {
		if password == common {
			return true
		}
	}

	// Check for simple patterns
	patterns := []string{
		`^(.)\1+$`,        // All same character
		`^\d+$`,           // All numbers
		`^[a-zA-Z]+$`,     // All letters
		`^password\d*$`,   // password followed by numbers
		`^\d{4,}$`,        // 4+ consecutive numbers
	}

	for _, pattern := range patterns {
		if matched, _ := regexp.MatchString(pattern, password); matched {
			return true
		}
	}

	return false
}

// Check for sequential characters
func hasSequentialChars(password string) bool {
	if len(password) < 3 {
		return false
	}

	for i := 0; i < len(password)-2; i++ {
		// Check for ascending sequence
		if password[i]+1 == password[i+1] && password[i+1]+1 == password[i+2] {
			return true
		}
		// Check for descending sequence
		if password[i]-1 == password[i+1] && password[i+1]-1 == password[i+2] {
			return true
		}
	}

	return false
}

// EstimatePasswordStrength returns a score from 0-100
func (p *PasswordService) EstimatePasswordStrength(password string) int {
	score := 0

	// Length scoring
	length := len(password)
	if length >= 8 {
		score += 20
	}
	if length >= 12 {
		score += 10
	}
	if length >= 16 {
		score += 10
	}

	// Character variety scoring
	var hasUpper, hasLower, hasNumber, hasSpecial bool
	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	if hasUpper {
		score += 15
	}
	if hasLower {
		score += 15
	}
	if hasNumber {
		score += 15
	}
	if hasSpecial {
		score += 15
	}

	// Penalties
	if isCommonPassword(password) {
		score -= 30
	}
	if hasSequentialChars(password) {
		score -= 20
	}

	// Ensure score is between 0-100
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}

	return score
}