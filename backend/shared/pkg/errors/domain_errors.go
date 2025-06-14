package errors

import (
	"errors"
	"fmt"
)

// Domain error types using Go 1.24.4 enhanced error handling
var (
	// Base errors
	ErrNotFound      = errors.New("resource not found")
	ErrAlreadyExists = errors.New("resource already exists")
	ErrInvalid       = errors.New("invalid input")
	ErrUnauthorized  = errors.New("unauthorized access")
	ErrForbidden     = errors.New("forbidden operation")
	ErrConflict      = errors.New("operation conflict")
	ErrInternal      = errors.New("internal server error")
	
	// Menu domain errors
	ErrMenuNotFound         = fmt.Errorf("menu: %w", ErrNotFound)
	ErrMenuAlreadyExists    = fmt.Errorf("menu: %w", ErrAlreadyExists)
	ErrMenuInvalidVersion   = fmt.Errorf("menu: invalid version: %w", ErrInvalid)
	ErrCategoryNotFound     = fmt.Errorf("category: %w", ErrNotFound)
	ErrItemNotFound         = fmt.Errorf("item: %w", ErrNotFound)
	
	// Order domain errors
	ErrOrderNotFound       = fmt.Errorf("order: %w", ErrNotFound)
	ErrOrderInvalidStatus  = fmt.Errorf("order: invalid status transition: %w", ErrInvalid)
	ErrOrderAlreadyPaid    = fmt.Errorf("order: already paid: %w", ErrConflict)
	
	// Reservation domain errors
	ErrReservationNotFound    = fmt.Errorf("reservation: %w", ErrNotFound)
	ErrReservationConflict    = fmt.Errorf("reservation: time slot conflict: %w", ErrConflict)
	ErrReservationInvalidTime = fmt.Errorf("reservation: invalid time: %w", ErrInvalid)
	
	// Kitchen domain errors
	ErrKitchenOrderNotFound = fmt.Errorf("kitchen order: %w", ErrNotFound)
	ErrKitchenOrderComplete = fmt.Errorf("kitchen order: already complete: %w", ErrConflict)
	
	// Inventory domain errors
	ErrInventoryItemNotFound   = fmt.Errorf("inventory item: %w", ErrNotFound)
	ErrInsufficientStock       = fmt.Errorf("inventory: insufficient stock: %w", ErrConflict)
	ErrInventoryInvalidQuantity = fmt.Errorf("inventory: invalid quantity: %w", ErrInvalid)
)

// DomainError provides enhanced error context using Go 1.24.4 features
type DomainError struct {
	Op      string            // Operation that failed
	Code    string            // Error code for clients
	Message string            // Human-readable message
	Err     error             // Underlying error
	Context map[string]any    // Additional context
}

func (e *DomainError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %s: %v", e.Op, e.Message, e.Err)
	}
	return fmt.Sprintf("%s: %s", e.Op, e.Message)
}

func (e *DomainError) Unwrap() error {
	return e.Err
}

// NewDomainError creates a new domain error with context
func NewDomainError(op, code, message string, err error) *DomainError {
	return &DomainError{
		Op:      op,
		Code:    code,
		Message: message,
		Err:     err,
		Context: make(map[string]any),
	}
}

// WithContext adds context to the error
func (e *DomainError) WithContext(key string, value any) *DomainError {
	if e.Context == nil {
		e.Context = make(map[string]any)
	}
	e.Context[key] = value
	return e
}

// Error helper functions using Go 1.24.4 enhanced error handling

// IsNotFound checks if error is a not found error
func IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound)
}

// IsValidationError checks if error is a validation error
func IsValidationError(err error) bool {
	if errors.Is(err, ErrInvalid) {
		return true
	}
	if domainErr, ok := err.(*DomainError); ok {
		return domainErr.Code == "VALIDATION_FAILED"
	}
	return false
}

// IsConflictError checks if error is a conflict error
func IsConflictError(err error) bool {
	if errors.Is(err, ErrConflict) {
		return true
	}
	if domainErr, ok := err.(*DomainError); ok {
		return domainErr.Code == "CONFLICT"
	}
	return false
}

// IsUnauthorizedError checks if error is an unauthorized error
func IsUnauthorizedError(err error) bool {
	return errors.Is(err, ErrUnauthorized)
}

// WrapNotFound wraps an error as a not found error with context
func WrapNotFound(op, resource, id string, err error) error {
	return NewDomainError(op, "NOT_FOUND", 
		fmt.Sprintf("%s with id %s not found", resource, id), err).
		WithContext("resource", resource).
		WithContext("id", id)
}

// WrapValidation wraps an error as a validation error with context
func WrapValidation(op, field, reason string, err error) error {
	return NewDomainError(op, "VALIDATION_FAILED",
		fmt.Sprintf("validation failed for field %s: %s", field, reason), err).
		WithContext("field", field).
		WithContext("reason", reason)
}

// WrapConflict wraps an error as a conflict error with context
func WrapConflict(op, resource, reason string, err error) error {
	return NewDomainError(op, "CONFLICT",
		fmt.Sprintf("%s conflict: %s", resource, reason), err).
		WithContext("resource", resource).
		WithContext("reason", reason)
}