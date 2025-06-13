package domain

import (
	"time"

	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/shared/pkg/types"
)

// Entity markers for type-safe IDs
type (
	UserEntity             struct{}
	RoleEntity             struct{}
	PermissionEntity       struct{}
	UserSessionEntity      struct{}
)

func (UserEntity) IsEntity()        {}
func (RoleEntity) IsEntity()        {}
func (PermissionEntity) IsEntity()  {}
func (UserSessionEntity) IsEntity() {}

// Type-safe IDs using enhanced Go 1.24.4 generics
type (
	UserID        = types.ID[UserEntity]
	RoleID        = types.ID[RoleEntity]
	PermissionID  = types.ID[PermissionEntity]
	UserSessionID = types.ID[UserSessionEntity]
)

// Restaurant-specific roles matching frontend RBAC
const (
	RoleAdmin       = "admin"
	RoleManager     = "manager"
	RoleKitchen     = "kitchen_staff"
	RoleWaitstaff   = "waitstaff"
	RoleHost        = "host"
	RoleCashier     = "cashier"
)

// Permission resources and actions
const (
	// Resources
	ResourceMenu        = "menu"
	ResourceOrder       = "order"
	ResourceKitchen     = "kitchen"
	ResourceReservation = "reservation"
	ResourceInventory   = "inventory"
	ResourceUser        = "user"
	ResourceReport      = "report"

	// Actions
	ActionCreate = "create"
	ActionRead   = "read"
	ActionUpdate = "update"
	ActionDelete = "delete"
	ActionManage = "manage"
	ActionView   = "view"
)

// User represents a restaurant platform user with enhanced type safety
type User struct {
	ID           UserID    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	RoleID       RoleID    `json:"roleId" db:"role_id"`
	Role         *Role     `json:"role,omitempty" db:"-"`
	IsActive     bool      `json:"isActive" db:"is_active"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty" db:"last_login_at"`
	CreatedAt    time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time `json:"updatedAt" db:"updated_at"`
}

// Role represents a restaurant staff role with permissions
type Role struct {
	ID          RoleID       `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	Description string       `json:"description" db:"description"`
	Permissions []Permission `json:"permissions" db:"-"`
	CreatedAt   time.Time    `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time    `json:"updatedAt" db:"updated_at"`
}

// Permission represents a specific permission for a resource and action
type Permission struct {
	ID          PermissionID `json:"id" db:"id"`
	Name        string       `json:"name" db:"name"`
	Resource    string       `json:"resource" db:"resource"`
	Action      string       `json:"action" db:"action"`
	Description string       `json:"description" db:"description"`
	CreatedAt   time.Time    `json:"createdAt" db:"created_at"`
}

// UserSession represents an active user session with JWT token
type UserSession struct {
	ID           UserSessionID `json:"id" db:"id"`
	UserID       UserID        `json:"userId" db:"user_id"`
	TokenHash    string        `json:"-" db:"token_hash"`
	RefreshToken string        `json:"-" db:"refresh_token_hash"`
	ExpiresAt    time.Time     `json:"expiresAt" db:"expires_at"`
	IPAddress    string        `json:"ipAddress" db:"ip_address"`
	UserAgent    string        `json:"userAgent" db:"user_agent"`
	IsActive     bool          `json:"isActive" db:"is_active"`
	CreatedAt    time.Time     `json:"createdAt" db:"created_at"`
	UpdatedAt    time.Time     `json:"updatedAt" db:"updated_at"`
}

// UserWithRole represents user data with role information included
type UserWithRole struct {
	User        *User        `json:"user"`
	Role        *Role        `json:"role"`
	Permissions []Permission `json:"permissions"`
}

// ID generation functions using shared ID system
func NewUserID() UserID {
	return types.NewID[UserEntity]("user")
}

func NewRoleID() RoleID {
	return types.NewID[RoleEntity]("role")
}

func NewPermissionID() PermissionID {
	return types.NewID[PermissionEntity]("perm")
}

func NewUserSessionID() UserSessionID {
	return types.NewID[UserSessionEntity]("session")
}

// NewValidationError creates a new validation error
func NewValidationError(message string) error {
	return errors.NewDomainError("validation", "VALIDATION_FAILED", message, errors.ErrInvalid)
}

// Domain validation methods
func (u *User) IsValid() error {
	if u.ID.IsEmpty() {
		return NewValidationError("user ID is required")
	}
	if u.Email == "" {
		return NewValidationError("email is required")
	}
	if u.RoleID.IsEmpty() {
		return NewValidationError("role ID is required")
	}
	return nil
}

func (r *Role) IsValid() error {
	if r.ID.IsEmpty() {
		return NewValidationError("role ID is required")
	}
	if r.Name == "" {
		return NewValidationError("role name is required")
	}
	return nil
}

func (p *Permission) IsValid() error {
	if p.ID.IsEmpty() {
		return NewValidationError("permission ID is required")
	}
	if p.Name == "" || p.Resource == "" || p.Action == "" {
		return NewValidationError("permission name, resource, and action are required")
	}
	return nil
}

func (s *UserSession) IsValid() error {
	if s.ID.IsEmpty() {
		return NewValidationError("session ID is required")
	}
	if s.UserID.IsEmpty() {
		return NewValidationError("user ID is required")
	}
	if s.TokenHash == "" {
		return NewValidationError("token hash is required")
	}
	if s.ExpiresAt.Before(time.Now()) {
		return NewValidationError("session has expired")
	}
	return nil
}

// Business logic methods
func (u *User) CanAccess(resource, action string) bool {
	if u.Role == nil {
		return false
	}

	for _, permission := range u.Role.Permissions {
		if permission.Resource == resource && permission.Action == action {
			return true
		}
		// Check for manage permission which grants all actions
		if permission.Resource == resource && permission.Action == ActionManage {
			return true
		}
	}
	return false
}

func (u *User) HasRole(roleName string) bool {
	return u.Role != nil && u.Role.Name == roleName
}

func (u *User) IsAdmin() bool {
	return u.HasRole(RoleAdmin)
}

func (s *UserSession) IsExpired() bool {
	return s.ExpiresAt.Before(time.Now())
}

func (s *UserSession) IsValidSession() bool {
	return s.IsActive && !s.IsExpired()
}

// Helper function to create user with role
func NewUserWithRole(email, passwordHash string, role *Role) *User {
	return &User{
		ID:           NewUserID(),
		Email:        email,
		PasswordHash: passwordHash,
		RoleID:       role.ID,
		Role:         role,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}

// Default restaurant roles and permissions for initial setup
func GetDefaultRoles() []Role {
	adminID, _ := types.ParseID[RoleEntity]("role_admin")
	managerID, _ := types.ParseID[RoleEntity]("role_manager")
	kitchenID, _ := types.ParseID[RoleEntity]("role_kitchen")
	waitstaffID, _ := types.ParseID[RoleEntity]("role_waitstaff")
	hostID, _ := types.ParseID[RoleEntity]("role_host")
	cashierID, _ := types.ParseID[RoleEntity]("role_cashier")

	return []Role{
		{
			ID:          adminID,
			Name:        RoleAdmin,
			Description: "Administrator with full system access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          managerID,
			Name:        RoleManager,
			Description: "Restaurant manager with operational access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          kitchenID,
			Name:        RoleKitchen,
			Description: "Kitchen staff with order and inventory access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          waitstaffID,
			Name:        RoleWaitstaff,
			Description: "Wait staff with order and customer access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          hostID,
			Name:        RoleHost,
			Description: "Host with reservation and seating access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          cashierID,
			Name:        RoleCashier,
			Description: "Cashier with payment and order completion access",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	}
}