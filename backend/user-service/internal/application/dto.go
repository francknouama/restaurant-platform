package application

import (
	"time"
	"github.com/restaurant-platform/user-service/internal/domain"
)

// Request DTOs
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	RoleID   string `json:"roleId" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"oldPassword" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required,min=8"`
}

type UpdateUserRequest struct {
	Email    *string `json:"email,omitempty" binding:"omitempty,email"`
	RoleID   *string `json:"roleId,omitempty"`
	IsActive *bool   `json:"isActive,omitempty"`
}

type AssignRoleRequest struct {
	RoleID string `json:"roleId" binding:"required"`
}

// Response DTOs
type UserResponse struct {
	ID          string    `json:"id"`
	Email       string    `json:"email"`
	RoleID      string    `json:"roleId"`
	Role        *RoleResponse `json:"role,omitempty"`
	IsActive    bool      `json:"isActive"`
	LastLoginAt *time.Time `json:"lastLoginAt,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type RoleResponse struct {
	ID          string               `json:"id"`
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Permissions []PermissionResponse `json:"permissions,omitempty"`
	CreatedAt   time.Time            `json:"createdAt"`
	UpdatedAt   time.Time            `json:"updatedAt"`
}

type PermissionResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type UserWithRoleResponse struct {
	User        UserResponse         `json:"user"`
	Role        RoleResponse         `json:"role"`
	Permissions []PermissionResponse `json:"permissions"`
}

type AuthResponse struct {
	User         UserWithRoleResponse `json:"user"`
	Token        string               `json:"token"`
	RefreshToken string               `json:"refreshToken"`
	ExpiresAt    time.Time            `json:"expiresAt"`
	SessionID    string               `json:"sessionId"`
}

type SessionResponse struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	ExpiresAt time.Time `json:"expiresAt"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
}

type TokenValidationResponse struct {
	Valid bool                 `json:"valid"`
	User  *UserWithRoleResponse `json:"user,omitempty"`
}

// API Response wrapper
type APIResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data,omitempty"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Helper functions for converting domain models to DTOs
func UserToResponse(user *domain.User) UserResponse {
	resp := UserResponse{
		ID:        user.ID.String(),
		Email:     user.Email,
		RoleID:    user.RoleID.String(),
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	if user.LastLoginAt != nil {
		resp.LastLoginAt = user.LastLoginAt
	}

	if user.Role != nil {
		role := RoleToResponse(user.Role)
		resp.Role = &role
	}

	return resp
}

func RoleToResponse(role *domain.Role) RoleResponse {
	resp := RoleResponse{
		ID:          role.ID.String(),
		Name:        role.Name,
		Description: role.Description,
		CreatedAt:   role.CreatedAt,
		UpdatedAt:   role.UpdatedAt,
	}

	if role.Permissions != nil {
		resp.Permissions = make([]PermissionResponse, len(role.Permissions))
		for i, perm := range role.Permissions {
			resp.Permissions[i] = PermissionToResponse(&perm)
		}
	}

	return resp
}

func PermissionToResponse(permission *domain.Permission) PermissionResponse {
	return PermissionResponse{
		ID:          permission.ID.String(),
		Name:        permission.Name,
		Resource:    permission.Resource,
		Action:      permission.Action,
		Description: permission.Description,
		CreatedAt:   permission.CreatedAt,
	}
}

func UserWithRoleToResponse(userWithRole *domain.UserWithRole) UserWithRoleResponse {
	return UserWithRoleResponse{
		User:        UserToResponse(userWithRole.User),
		Role:        RoleToResponse(userWithRole.Role),
		Permissions: PermissionsToResponse(userWithRole.Permissions),
	}
}

func AuthResultToResponse(authResult *domain.AuthResult) AuthResponse {
	return AuthResponse{
		User:         UserWithRoleToResponse(authResult.User),
		Token:        authResult.Token,
		RefreshToken: authResult.RefreshToken,
		ExpiresAt:    authResult.ExpiresAt,
		SessionID:    authResult.SessionID.String(),
	}
}

func SessionToResponse(session *domain.UserSession) SessionResponse {
	return SessionResponse{
		ID:        session.ID.String(),
		UserID:    session.UserID.String(),
		ExpiresAt: session.ExpiresAt,
		IPAddress: session.IPAddress,
		UserAgent: session.UserAgent,
		IsActive:  session.IsActive,
		CreatedAt: session.CreatedAt,
	}
}

func permissionsToResponse(permissions []domain.Permission) []PermissionResponse {
	resp := make([]PermissionResponse, len(permissions))
	for i, perm := range permissions {
		resp[i] = PermissionToResponse(&perm)
	}
	return resp
}

func RolesToResponse(roles []domain.Role) []RoleResponse {
	resp := make([]RoleResponse, len(roles))
	for i, role := range roles {
		resp[i] = RoleToResponse(&role)
	}
	return resp
}

func SessionsToResponse(sessions []domain.UserSession) []SessionResponse {
	resp := make([]SessionResponse, len(sessions))
	for i, session := range sessions {
		resp[i] = SessionToResponse(&session)
	}
	return resp
}

func PermissionsToResponse(permissions []domain.Permission) []PermissionResponse {
	resp := make([]PermissionResponse, len(permissions))
	for i, perm := range permissions {
		resp[i] = PermissionToResponse(&perm)
	}
	return resp
}

// Success response helpers
func SuccessResponse[T any](data T) APIResponse[T] {
	return APIResponse[T]{
		Success: true,
		Data:    data,
	}
}

func SuccessMessageResponse[T any](data T, message string) APIResponse[T] {
	return APIResponse[T]{
		Success: true,
		Data:    data,
		Message: message,
	}
}

// Non-generic helper for common cases
func SuccessMessage(data interface{}, message string) APIResponse[interface{}] {
	return APIResponse[interface{}]{
		Success: true,
		Data:    data,
		Message: message,
	}
}

func ErrorResponse(message string) APIResponse[any] {
	return APIResponse[any]{
		Success: false,
		Error:   message,
	}
}

// Helper to convert request role ID to domain type
func ParseRoleID(roleIDStr string) (domain.RoleID, error) {
	return domain.RoleID(roleIDStr), nil // Simplified - should use proper parsing
}

func ParseUserID(userIDStr string) (domain.UserID, error) {
	return domain.UserID(userIDStr), nil // Simplified - should use proper parsing
}

func ParseUserSessionID(sessionIDStr string) (domain.UserSessionID, error) {
	return domain.UserSessionID(sessionIDStr), nil // Simplified - should use proper parsing
}