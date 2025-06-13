package domain

import (
	"context"
	"time"
)

// UserRepository defines the contract for user data access
type UserRepository interface {
	// User operations
	CreateUser(ctx context.Context, user *User) error
	GetUserByID(ctx context.Context, id UserID) (*User, error)
	GetUserByEmail(ctx context.Context, email string) (*User, error)
	GetUserWithRole(ctx context.Context, id UserID) (*UserWithRole, error)
	UpdateUser(ctx context.Context, user *User) error
	UpdateUserPassword(ctx context.Context, id UserID, passwordHash string) error
	UpdateUserLastLogin(ctx context.Context, id UserID, lastLoginAt time.Time) error
	DeleteUser(ctx context.Context, id UserID) error
	ListUsers(ctx context.Context, filters UserFilters) ([]User, error)

	// Role operations
	CreateRole(ctx context.Context, role *Role) error
	GetRoleByID(ctx context.Context, id RoleID) (*Role, error)
	GetRoleByName(ctx context.Context, name string) (*Role, error)
	GetRoleWithPermissions(ctx context.Context, id RoleID) (*Role, error)
	UpdateRole(ctx context.Context, role *Role) error
	DeleteRole(ctx context.Context, id RoleID) error
	ListRoles(ctx context.Context) ([]Role, error)

	// Permission operations
	CreatePermission(ctx context.Context, permission *Permission) error
	GetPermissionByID(ctx context.Context, id PermissionID) (*Permission, error)
	UpdatePermission(ctx context.Context, permission *Permission) error
	DeletePermission(ctx context.Context, id PermissionID) error
	ListPermissions(ctx context.Context) ([]Permission, error)
	GetPermissionsByRoleID(ctx context.Context, roleID RoleID) ([]Permission, error)

	// Role-Permission associations
	AssignPermissionToRole(ctx context.Context, roleID RoleID, permissionID PermissionID) error
	RemovePermissionFromRole(ctx context.Context, roleID RoleID, permissionID PermissionID) error
	SetRolePermissions(ctx context.Context, roleID RoleID, permissionIDs []PermissionID) error

	// Session operations
	CreateSession(ctx context.Context, session *UserSession) error
	GetSessionByID(ctx context.Context, id UserSessionID) (*UserSession, error)
	GetSessionByTokenHash(ctx context.Context, tokenHash string) (*UserSession, error)
	GetActiveSessionsByUserID(ctx context.Context, userID UserID) ([]UserSession, error)
	UpdateSession(ctx context.Context, session *UserSession) error
	InvalidateSession(ctx context.Context, id UserSessionID) error
	InvalidateUserSessions(ctx context.Context, userID UserID) error
	CleanupExpiredSessions(ctx context.Context) error

	// Transaction support
	WithTx(ctx context.Context, fn func(UserRepository) error) error
}

// UserFilters represents filters for listing users
type UserFilters struct {
	RoleID   *RoleID `json:"roleId,omitempty"`
	IsActive *bool   `json:"isActive,omitempty"`
	Email    string  `json:"email,omitempty"`
	Limit    int     `json:"limit,omitempty"`
	Offset   int     `json:"offset,omitempty"`
}

// AuthenticationService defines the contract for authentication operations
type AuthenticationService interface {
	// Authentication operations
	Register(ctx context.Context, email, password string, roleID RoleID) (*UserWithRole, error)
	Login(ctx context.Context, email, password string, ipAddress, userAgent string) (*AuthResult, error)
	Logout(ctx context.Context, sessionID UserSessionID) error
	RefreshToken(ctx context.Context, refreshToken string) (*AuthResult, error)
	ValidateToken(ctx context.Context, tokenString string) (*UserWithRole, error)
	ChangePassword(ctx context.Context, userID UserID, oldPassword, newPassword string) error

	// Session management
	GetUserSessions(ctx context.Context, userID UserID) ([]UserSession, error)
	InvalidateUserSessions(ctx context.Context, userID UserID) error
	CleanupExpiredSessions(ctx context.Context) error

	// User management
	GetUser(ctx context.Context, userID UserID) (*UserWithRole, error)
	UpdateUser(ctx context.Context, userID UserID, updates UserUpdates) (*UserWithRole, error)
	ActivateUser(ctx context.Context, userID UserID) error
	DeactivateUser(ctx context.Context, userID UserID) error

	// Role and permission management
	GetRoles(ctx context.Context) ([]Role, error)
	GetPermissions(ctx context.Context) ([]Permission, error)
	AssignRole(ctx context.Context, userID UserID, roleID RoleID) error
}

// AuthResult represents the result of authentication operations
type AuthResult struct {
	User         *UserWithRole `json:"user"`
	Token        string        `json:"token"`
	RefreshToken string        `json:"refreshToken"`
	ExpiresAt    time.Time     `json:"expiresAt"`
	SessionID    UserSessionID `json:"sessionId"`
}

// UserUpdates represents allowed user update fields
type UserUpdates struct {
	Email    *string `json:"email,omitempty"`
	RoleID   *RoleID `json:"roleId,omitempty"`
	IsActive *bool   `json:"isActive,omitempty"`
}

// TokenClaims represents JWT token claims
type TokenClaims struct {
	UserID    UserID    `json:"userId"`
	SessionID UserSessionID `json:"sessionId"`
	RoleID    RoleID    `json:"roleId"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expiresAt"`
}

// JWTService defines the contract for JWT token operations
type JWTService interface {
	GenerateToken(user *User, sessionID UserSessionID) (string, time.Time, error)
	GenerateRefreshToken(user *User, sessionID UserSessionID) (string, time.Time, error)
	ValidateToken(tokenString string) (*TokenClaims, error)
	ExtractClaims(tokenString string) (*TokenClaims, error)
	IsTokenExpired(tokenString string) bool
}

// PasswordService defines the contract for password operations
type PasswordService interface {
	HashPassword(password string) (string, error)
	ComparePassword(password, hash string) bool
	ValidatePassword(password string) error
}

// PermissionChecker provides permission checking utilities
type PermissionChecker interface {
	HasPermission(user *User, resource, action string) bool
	CanAccessMFE(user *User, mfeName string) bool
	CanAccessRoute(user *User, route string) bool
	GetMFEPermissions(user *User) map[string][]string
}