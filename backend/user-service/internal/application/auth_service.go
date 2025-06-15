package application

import (
	"context"
	"crypto/sha256"
	"fmt"
	"time"

	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/user-service/internal/domain"
)

type AuthenticationServiceImpl struct {
	userRepo        domain.UserRepository
	jwtService      domain.JWTService
	passwordService domain.PasswordService
}

func NewAuthenticationService(
	userRepo domain.UserRepository,
	jwtService domain.JWTService,
	passwordService domain.PasswordService,
) domain.AuthenticationService {
	return &AuthenticationServiceImpl{
		userRepo:        userRepo,
		jwtService:      jwtService,
		passwordService: passwordService,
	}
}

// Authentication operations
func (a *AuthenticationServiceImpl) Register(ctx context.Context, email, password string, roleID domain.RoleID) (*domain.UserWithRole, error) {
	// Validate input
	if email == "" {
		return nil, domain.NewValidationError("email is required")
	}
	if password == "" {
		return nil, domain.NewValidationError("password is required")
	}
	if roleID.IsEmpty() {
		return nil, domain.NewValidationError("role ID is required")
	}

	// Check if user already exists
	existingUser, err := a.userRepo.GetUserByEmail(ctx, email)
	if err != nil && !errors.IsNotFound(err) {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingUser != nil {
		return nil, errors.WrapConflict("Register", "user", "user with this email already exists", nil)
	}

	// Validate role exists
	role, err := a.userRepo.GetRoleWithPermissions(ctx, roleID)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil, domain.NewValidationError("invalid role ID")
		}
		return nil, fmt.Errorf("failed to get role: %w", err)
	}

	// Hash password
	passwordHash, err := a.passwordService.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := domain.NewUserWithRole(email, passwordHash, role)

	// Save user
	err = a.userRepo.CreateUser(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &domain.UserWithRole{
		User:        user,
		Role:        role,
		Permissions: role.Permissions,
	}, nil
}

func (a *AuthenticationServiceImpl) Login(ctx context.Context, email, password string, ipAddress, userAgent string) (*domain.AuthResult, error) {
	// Validate input
	if email == "" {
		return nil, domain.NewValidationError("email is required")
	}
	if password == "" {
		return nil, domain.NewValidationError("password is required")
	}

	// Get user with role and permissions
	user, err := a.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil, errors.NewDomainError("Login", "INVALID_CREDENTIALS", "invalid email or password", nil)
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.NewDomainError("Login", "ACCOUNT_DISABLED", "account is disabled", nil)
	}

	// Verify password
	if !a.passwordService.ComparePassword(password, user.PasswordHash) {
		return nil, errors.NewDomainError("Login", "INVALID_CREDENTIALS", "invalid email or password", nil)
	}

	// Get user with role and permissions
	userWithRole, err := a.userRepo.GetUserWithRole(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user with role: %w", err)
	}

	// Create session
	sessionID := domain.NewUserSessionID()
	
	// Generate tokens
	accessToken, accessExpiresAt, err := a.jwtService.GenerateToken(user, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, _, err := a.jwtService.GenerateRefreshToken(user, sessionID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Hash tokens for storage
	accessTokenHash := hashToken(accessToken)
	refreshTokenHash := hashToken(refreshToken)

	// Create session record
	session := &domain.UserSession{
		ID:           sessionID,
		UserID:       user.ID,
		TokenHash:    accessTokenHash,
		RefreshToken: refreshTokenHash,
		ExpiresAt:    accessExpiresAt,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Save session
	err = a.userRepo.CreateSession(ctx, session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	// Update user last login
	err = a.userRepo.UpdateUserLastLogin(ctx, user.ID, time.Now())
	if err != nil {
		// Log error but don't fail login
		fmt.Printf("Warning: failed to update last login time: %v", err)
	}

	return &domain.AuthResult{
		User:         userWithRole,
		Token:        accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExpiresAt,
		SessionID:    sessionID,
	}, nil
}

func (a *AuthenticationServiceImpl) Logout(ctx context.Context, sessionID domain.UserSessionID) error {
	err := a.userRepo.InvalidateSession(ctx, sessionID)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil // Session already doesn't exist, consider it logged out
		}
		return fmt.Errorf("failed to invalidate session: %w", err)
	}
	return nil
}

func (a *AuthenticationServiceImpl) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResult, error) {
	// Validate and extract claims from refresh token
	claims, err := a.jwtService.ValidateToken(refreshToken)
	if err != nil {
		return nil, errors.NewDomainError("RefreshToken", "INVALID_TOKEN", "invalid or expired refresh token", err)
	}

	// Get session
	refreshTokenHash := hashToken(refreshToken)
	session, err := a.userRepo.GetSessionByID(ctx, claims.SessionID)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil, errors.NewDomainError("RefreshToken", "SESSION_NOT_FOUND", "session not found", err)
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	// Verify session is valid
	if !session.IsValidSession() {
		return nil, errors.NewDomainError("RefreshToken", "SESSION_INVALID", "session is invalid or expired", nil)
	}

	// Verify refresh token hash matches
	if session.RefreshToken != refreshTokenHash {
		return nil, errors.NewDomainError("RefreshToken", "TOKEN_MISMATCH", "refresh token does not match session", nil)
	}

	// Get user with role
	userWithRole, err := a.userRepo.GetUserWithRole(ctx, session.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user with role: %w", err)
	}

	// Check if user is still active
	if !userWithRole.User.IsActive {
		// Invalidate session
		a.userRepo.InvalidateSession(ctx, session.ID)
		return nil, errors.NewDomainError("RefreshToken", "ACCOUNT_DISABLED", "account is disabled", nil)
	}

	// Generate new tokens
	newAccessToken, newAccessExpiresAt, err := a.jwtService.GenerateToken(userWithRole.User, session.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate new access token: %w", err)
	}

	newRefreshToken, _, err := a.jwtService.GenerateRefreshToken(userWithRole.User, session.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate new refresh token: %w", err)
	}

	// Hash new tokens
	newAccessTokenHash := hashToken(newAccessToken)
	newRefreshTokenHash := hashToken(newRefreshToken)

	// Update session with new tokens
	session.TokenHash = newAccessTokenHash
	session.RefreshToken = newRefreshTokenHash
	session.ExpiresAt = newAccessExpiresAt
	session.UpdatedAt = time.Now()

	err = a.userRepo.UpdateSession(ctx, session)
	if err != nil {
		return nil, fmt.Errorf("failed to update session: %w", err)
	}

	return &domain.AuthResult{
		User:         userWithRole,
		Token:        newAccessToken,
		RefreshToken: newRefreshToken,
		ExpiresAt:    newAccessExpiresAt,
		SessionID:    session.ID,
	}, nil
}

func (a *AuthenticationServiceImpl) ValidateToken(ctx context.Context, tokenString string) (*domain.UserWithRole, error) {
	// Validate token
	claims, err := a.jwtService.ValidateToken(tokenString)
	if err != nil {
		return nil, errors.NewDomainError("ValidateToken", "INVALID_TOKEN", "invalid or expired token", err)
	}

	// Get session to verify token is still valid
	tokenHash := hashToken(tokenString)
	session, err := a.userRepo.GetSessionByTokenHash(ctx, tokenHash)
	if err != nil {
		if errors.IsNotFound(err) {
			return nil, errors.NewDomainError("ValidateToken", "SESSION_NOT_FOUND", "session not found", err)
		}
		return nil, fmt.Errorf("failed to get session by token: %w", err)
	}

	// Verify session is valid
	if !session.IsValidSession() {
		return nil, errors.NewDomainError("ValidateToken", "SESSION_INVALID", "session is invalid or expired", nil)
	}

	// Get user with role and permissions
	userWithRole, err := a.userRepo.GetUserWithRole(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user with role: %w", err)
	}

	// Check if user is still active
	if !userWithRole.User.IsActive {
		// Invalidate session
		a.userRepo.InvalidateSession(ctx, session.ID)
		return nil, errors.NewDomainError("ValidateToken", "ACCOUNT_DISABLED", "account is disabled", nil)
	}

	return userWithRole, nil
}

func (a *AuthenticationServiceImpl) ChangePassword(ctx context.Context, userID domain.UserID, oldPassword, newPassword string) error {
	// Get user
	user, err := a.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify old password
	if !a.passwordService.ComparePassword(oldPassword, user.PasswordHash) {
		return errors.NewDomainError("ChangePassword", "INVALID_PASSWORD", "current password is incorrect", nil)
	}

	// Hash new password
	newPasswordHash, err := a.passwordService.HashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password
	err = a.userRepo.UpdateUserPassword(ctx, userID, newPasswordHash)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	// Invalidate all sessions except current one (force re-login on other devices)
	err = a.userRepo.InvalidateUserSessions(ctx, userID)
	if err != nil {
		// Log error but don't fail password change
		fmt.Printf("Warning: failed to invalidate user sessions: %v", err)
	}

	return nil
}

// Session management
func (a *AuthenticationServiceImpl) GetUserSessions(ctx context.Context, userID domain.UserID) ([]domain.UserSession, error) {
	sessions, err := a.userRepo.GetActiveSessionsByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	return sessions, nil
}

func (a *AuthenticationServiceImpl) InvalidateUserSessions(ctx context.Context, userID domain.UserID) error {
	err := a.userRepo.InvalidateUserSessions(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to invalidate user sessions: %w", err)
	}
	return nil
}

func (a *AuthenticationServiceImpl) CleanupExpiredSessions(ctx context.Context) error {
	err := a.userRepo.CleanupExpiredSessions(ctx)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}
	return nil
}

// User management
func (a *AuthenticationServiceImpl) GetUser(ctx context.Context, userID domain.UserID) (*domain.UserWithRole, error) {
	userWithRole, err := a.userRepo.GetUserWithRole(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return userWithRole, nil
}

func (a *AuthenticationServiceImpl) ListUsers(ctx context.Context, filters domain.UserFilters) ([]*domain.UserWithRole, error) {
	users, err := a.userRepo.ListUsers(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	// Convert users to UserWithRole
	result := make([]*domain.UserWithRole, 0, len(users))
	for _, user := range users {
		userWithRole, err := a.userRepo.GetUserWithRole(ctx, user.ID)
		if err != nil {
			// Log error but continue with other users
			fmt.Printf("Warning: failed to get user with role for user %s: %v\n", user.ID, err)
			continue
		}
		result = append(result, userWithRole)
	}

	return result, nil
}

func (a *AuthenticationServiceImpl) UpdateUser(ctx context.Context, userID domain.UserID, updates domain.UserUpdates) (*domain.UserWithRole, error) {
	user, err := a.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Apply updates
	if updates.Email != nil {
		user.Email = *updates.Email
	}
	if updates.RoleID != nil {
		user.RoleID = *updates.RoleID
	}
	if updates.IsActive != nil {
		user.IsActive = *updates.IsActive
	}

	// Update user
	err = a.userRepo.UpdateUser(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Return updated user with role
	return a.userRepo.GetUserWithRole(ctx, userID)
}

func (a *AuthenticationServiceImpl) ActivateUser(ctx context.Context, userID domain.UserID) error {
	updates := domain.UserUpdates{IsActive: &[]bool{true}[0]}
	_, err := a.UpdateUser(ctx, userID, updates)
	return err
}

func (a *AuthenticationServiceImpl) DeactivateUser(ctx context.Context, userID domain.UserID) error {
	updates := domain.UserUpdates{IsActive: &[]bool{false}[0]}
	_, err := a.UpdateUser(ctx, userID, updates)
	if err != nil {
		return err
	}

	// Invalidate all user sessions
	return a.InvalidateUserSessions(ctx, userID)
}

// Role and permission management
func (a *AuthenticationServiceImpl) GetRoles(ctx context.Context) ([]domain.Role, error) {
	roles, err := a.userRepo.ListRoles(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get roles: %w", err)
	}
	return roles, nil
}

func (a *AuthenticationServiceImpl) GetPermissions(ctx context.Context) ([]domain.Permission, error) {
	permissions, err := a.userRepo.ListPermissions(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get permissions: %w", err)
	}
	return permissions, nil
}

func (a *AuthenticationServiceImpl) AssignRole(ctx context.Context, userID domain.UserID, roleID domain.RoleID) error {
	user, err := a.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify role exists
	_, err = a.userRepo.GetRoleByID(ctx, roleID)
	if err != nil {
		return fmt.Errorf("failed to get role: %w", err)
	}

	// Update user role
	user.RoleID = roleID
	err = a.userRepo.UpdateUser(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to update user role: %w", err)
	}

	return nil
}

// Helper function to hash tokens for storage
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", hash)
}