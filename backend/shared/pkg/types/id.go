package types

import (
	"fmt"
	"strings"
	"sync/atomic"
	"time"
)

// EntityMarker is a marker interface for entity types
type EntityMarker interface {
	IsEntity()
}

// ID represents a type-safe identifier using Go 1.24.4 enhanced generics
type ID[T EntityMarker] string

// String returns the string representation of the ID
func (id ID[T]) String() string {
	return string(id)
}

// IsEmpty checks if the ID is empty
func (id ID[T]) IsEmpty() bool {
	return string(id) == ""
}

// IsValid checks if the ID has a valid format
func (id ID[T]) IsValid() bool {
	s := string(id)
	return s != "" && len(s) > 0 && !strings.Contains(s, " ")
}

// MarshalText implements encoding.TextMarshaler
func (id ID[T]) MarshalText() ([]byte, error) {
	return []byte(id), nil
}

// UnmarshalText implements encoding.TextUnmarshaler
func (id *ID[T]) UnmarshalText(text []byte) error {
	*id = ID[T](text)
	return nil
}

// Global atomic counter for unique ID generation
var globalIDCounter uint64

// NewID creates a new type-safe ID with atomic counter to prevent collisions
func NewID[T EntityMarker](prefix string) ID[T] {
	now := time.Now()
	counter := atomic.AddUint64(&globalIDCounter, 1)
	id := fmt.Sprintf("%s_%d_%d", prefix, now.UnixNano(), counter)
	return ID[T](id)
}

// ParseID parses a string into a type-safe ID
func ParseID[T EntityMarker](s string) (ID[T], error) {
	id := ID[T](s)
	if !id.IsValid() {
		return ID[T](""), fmt.Errorf("invalid ID format: %s", s)
	}
	return id, nil
}

// IDSlice represents a slice of type-safe IDs with utility methods
type IDSlice[T EntityMarker] []ID[T]

// Contains checks if the slice contains the given ID
func (ids IDSlice[T]) Contains(id ID[T]) bool {
	for _, existingID := range ids {
		if existingID == id {
			return true
		}
	}
	return false
}

// Strings converts the ID slice to a string slice
func (ids IDSlice[T]) Strings() []string {
	result := make([]string, len(ids))
	for i, id := range ids {
		result[i] = id.String()
	}
	return result
}

// Filter returns a new slice containing only IDs that match the predicate
func (ids IDSlice[T]) Filter(predicate func(ID[T]) bool) IDSlice[T] {
	var result IDSlice[T]
	for _, id := range ids {
		if predicate(id) {
			result = append(result, id)
		}
	}
	return result
}

// Map transforms the ID slice using the provided function
func (ids IDSlice[T]) Map(transform func(ID[T]) ID[T]) IDSlice[T] {
	result := make(IDSlice[T], len(ids))
	for i, id := range ids {
		result[i] = transform(id)
	}
	return result
}

// IDConstraint defines the constraint for ID types with enhanced Go 1.24.4 features
type IDConstraint[T EntityMarker] interface {
	~string
	fmt.Stringer
	IsValid() bool
	IsEmpty() bool
}

// Type assertion to ensure ID satisfies the constraint (commented out for build compatibility)
// var _ IDConstraint[EntityMarker] = ID[EntityMarker]("")