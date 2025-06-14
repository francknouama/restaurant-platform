package application

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	sharederrors "github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/user-service/internal/domain"
)

// Mock implementations for testing
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) CreateUser(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) GetUserByID(ctx context.Context, id domain.UserID) (*domain.User, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetUserWithRole(ctx context.Context, id domain.UserID) (*domain.UserWithRole, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserWithRole), args.Error(1)
}

func (m *MockUserRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateUserPassword(ctx context.Context, id domain.UserID, passwordHash string) error {
	args := m.Called(ctx, id, passwordHash)
	return args.Error(0)
}

func (m *MockUserRepository) UpdateUserLastLogin(ctx context.Context, id domain.UserID, lastLoginAt time.Time) error {
	args := m.Called(ctx, id, lastLoginAt)
	return args.Error(0)
}

func (m *MockUserRepository) DeleteUser(ctx context.Context, id domain.UserID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepository) ListUsers(ctx context.Context, filters domain.UserFilters) ([]domain.User, error) {
	args := m.Called(ctx, filters)
	return args.Get(0).([]domain.User), args.Error(1)
}

func (m *MockUserRepository) GetRoleByID(ctx context.Context, id domain.RoleID) (*domain.Role, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Role), args.Error(1)
}

func (m *MockUserRepository) GetRoleWithPermissions(ctx context.Context, id domain.RoleID) (*domain.Role, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Role), args.Error(1)
}

func (m *MockUserRepository) CreateSession(ctx context.Context, session *domain.UserSession) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockUserRepository) GetSessionByID(ctx context.Context, id domain.UserSessionID) (*domain.UserSession, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserSession), args.Error(1)
}

func (m *MockUserRepository) GetSessionByTokenHash(ctx context.Context, tokenHash string) (*domain.UserSession, error) {
	args := m.Called(ctx, tokenHash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserSession), args.Error(1)
}

func (m *MockUserRepository) GetActiveSessionsByUserID(ctx context.Context, userID domain.UserID) ([]domain.UserSession, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]domain.UserSession), args.Error(1)
}

func (m *MockUserRepository) UpdateSession(ctx context.Context, session *domain.UserSession) error {
	args := m.Called(ctx, session)
	return args.Error(0)
}

func (m *MockUserRepository) InvalidateSession(ctx context.Context, id domain.UserSessionID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepository) InvalidateUserSessions(ctx context.Context, userID domain.UserID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockUserRepository) ListRoles(ctx context.Context) ([]domain.Role, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Role), args.Error(1)
}

// Implement remaining methods with basic returns
func (m *MockUserRepository) CreateRole(ctx context.Context, role *domain.Role) error {
	return nil
}
func (m *MockUserRepository) GetRoleByName(ctx context.Context, name string) (*domain.Role, error) {
	return nil, nil
}
func (m *MockUserRepository) UpdateRole(ctx context.Context, role *domain.Role) error {
	return nil
}
func (m *MockUserRepository) DeleteRole(ctx context.Context, id domain.RoleID) error {
	return nil
}
func (m *MockUserRepository) CreatePermission(ctx context.Context, permission *domain.Permission) error {
	return nil
}
func (m *MockUserRepository) GetPermissionByID(ctx context.Context, id domain.PermissionID) (*domain.Permission, error) {
	return nil, nil
}
func (m *MockUserRepository) UpdatePermission(ctx context.Context, permission *domain.Permission) error {
	return nil
}
func (m *MockUserRepository) DeletePermission(ctx context.Context, id domain.PermissionID) error {
	return nil
}
func (m *MockUserRepository) ListPermissions(ctx context.Context) ([]domain.Permission, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Permission), args.Error(1)
}
func (m *MockUserRepository) GetPermissionsByRoleID(ctx context.Context, roleID domain.RoleID) ([]domain.Permission, error) {
	return nil, nil
}
func (m *MockUserRepository) AssignPermissionToRole(ctx context.Context, roleID domain.RoleID, permissionID domain.PermissionID) error {
	return nil
}
func (m *MockUserRepository) RemovePermissionFromRole(ctx context.Context, roleID domain.RoleID, permissionID domain.PermissionID) error {
	return nil
}
func (m *MockUserRepository) SetRolePermissions(ctx context.Context, roleID domain.RoleID, permissionIDs []domain.PermissionID) error {
	return nil
}
func (m *MockUserRepository) CleanupExpiredSessions(ctx context.Context) error {
	return nil
}
func (m *MockUserRepository) WithTx(ctx context.Context, fn func(domain.UserRepository) error) error {
	return nil
}

// Mock JWT Service
type MockJWTService struct {
	mock.Mock
}

func (m *MockJWTService) GenerateToken(user *domain.User, sessionID domain.UserSessionID) (string, time.Time, error) {
	args := m.Called(user, sessionID)
	return args.String(0), args.Get(1).(time.Time), args.Error(2)
}

func (m *MockJWTService) GenerateRefreshToken(user *domain.User, sessionID domain.UserSessionID) (string, time.Time, error) {
	args := m.Called(user, sessionID)
	return args.String(0), args.Get(1).(time.Time), args.Error(2)
}

func (m *MockJWTService) ValidateToken(tokenString string) (*domain.TokenClaims, error) {
	args := m.Called(tokenString)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.TokenClaims), args.Error(1)
}

func (m *MockJWTService) ExtractClaims(tokenString string) (*domain.TokenClaims, error) {
	args := m.Called(tokenString)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.TokenClaims), args.Error(1)
}

func (m *MockJWTService) IsTokenExpired(tokenString string) bool {
	args := m.Called(tokenString)
	return args.Bool(0)
}

// Mock Password Service
type MockPasswordService struct {
	mock.Mock
}

func (m *MockPasswordService) HashPassword(password string) (string, error) {
	args := m.Called(password)
	return args.String(0), args.Error(1)
}

func (m *MockPasswordService) ComparePassword(password, hash string) bool {
	args := m.Called(password, hash)
	return args.Bool(0)
}

func (m *MockPasswordService) ValidatePassword(password string) error {
	args := m.Called(password)
	return args.Error(0)
}

// Test Suite
type AuthServiceTestSuite struct {
	suite.Suite
	authService     *AuthenticationServiceImpl
	mockRepo        *MockUserRepository
	mockJWT         *MockJWTService
	mockPassword    *MockPasswordService
	ctx             context.Context
}

func TestAuthServiceTestSuite(t *testing.T) {
	suite.Run(t, new(AuthServiceTestSuite))
}

func (suite *AuthServiceTestSuite) SetupTest() {
	suite.mockRepo = new(MockUserRepository)
	suite.mockJWT = new(MockJWTService)
	suite.mockPassword = new(MockPasswordService)
	suite.ctx = context.Background()

	suite.authService = &AuthenticationServiceImpl{
		userRepo:        suite.mockRepo,
		jwtService:      suite.mockJWT,
		passwordService: suite.mockPassword,
	}
}

func (suite *AuthServiceTestSuite) TearDownTest() {
	suite.mockRepo.AssertExpectations(suite.T())
	suite.mockJWT.AssertExpectations(suite.T())
	suite.mockPassword.AssertExpectations(suite.T())
}

// Test Registration
func (suite *AuthServiceTestSuite) TestRegister_Success() {
	// Given
	email := "test@example.com"
	password := "ValidPassword123!"
	roleID := domain.NewRoleID()
	hashedPassword := "hashed_password"

	role := &domain.Role{
		ID:          roleID,
		Name:        domain.RoleManager,
		Description: "Manager role",
		Permissions: []domain.Permission{},
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(nil, sharederrors.WrapNotFound("GetUserByEmail", "user", email, nil))
	suite.mockRepo.On("GetRoleWithPermissions", suite.ctx, roleID).Return(role, nil)
	suite.mockPassword.On("HashPassword", password).Return(hashedPassword, nil)
	suite.mockRepo.On("CreateUser", suite.ctx, mock.AnythingOfType("*domain.User")).Return(nil)

	// When
	result, err := suite.authService.Register(suite.ctx, email, password, roleID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), email, result.User.Email)
	assert.Equal(suite.T(), hashedPassword, result.User.PasswordHash)
	assert.Equal(suite.T(), role, result.Role)
	assert.True(suite.T(), result.User.IsActive)
}

func (suite *AuthServiceTestSuite) TestRegister_EmptyEmail() {
	// When
	result, err := suite.authService.Register(suite.ctx, "", "password", domain.NewRoleID())

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "email is required")
}

func (suite *AuthServiceTestSuite) TestRegister_EmptyPassword() {
	// When
	result, err := suite.authService.Register(suite.ctx, "test@example.com", "", domain.NewRoleID())

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "password is required")
}

func (suite *AuthServiceTestSuite) TestRegister_UserAlreadyExists() {
	// Given
	email := "existing@example.com"
	existingUser := &domain.User{
		ID:    domain.NewUserID(),
		Email: email,
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(existingUser, nil)

	// When
	result, err := suite.authService.Register(suite.ctx, email, "password", domain.NewRoleID())

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "user with this email already exists")
}

func (suite *AuthServiceTestSuite) TestRegister_InvalidRole() {
	// Given
	email := "test@example.com"
	password := "ValidPassword123!"
	roleID := domain.NewRoleID()

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(nil, sharederrors.WrapNotFound("GetUserByEmail", "user", email, nil))
	suite.mockRepo.On("GetRoleWithPermissions", suite.ctx, roleID).Return(nil, sharederrors.WrapNotFound("GetRoleWithPermissions", "role", roleID.String(), nil))

	// When
	result, err := suite.authService.Register(suite.ctx, email, password, roleID)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid role ID")
}

// Test Login
func (suite *AuthServiceTestSuite) TestLogin_Success() {
	// Given
	email := "test@example.com"
	password := "ValidPassword123!"
	ipAddress := "192.168.1.1"
	userAgent := "Test Browser"
	
	userID := domain.NewUserID()
	roleID := domain.NewRoleID()
	_ = domain.NewUserSessionID() // sessionID for potential future use
	
	user := &domain.User{
		ID:           userID,
		Email:        email,
		PasswordHash: "hashed_password",
		RoleID:       roleID,
		IsActive:     true,
	}

	role := &domain.Role{
		ID:          roleID,
		Name:        domain.RoleManager,
		Permissions: []domain.Permission{},
	}

	userWithRole := &domain.UserWithRole{
		User:        user,
		Role:        role,
		Permissions: role.Permissions,
	}

	accessToken := "access_token_123"
	refreshToken := "refresh_token_123"
	expiresAt := time.Now().Add(time.Hour)

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(user, nil)
	suite.mockPassword.On("ComparePassword", password, "hashed_password").Return(true)
	suite.mockRepo.On("GetUserWithRole", suite.ctx, userID).Return(userWithRole, nil)
	suite.mockJWT.On("GenerateToken", user, mock.AnythingOfType("domain.UserSessionID")).Return(accessToken, expiresAt, nil)
	suite.mockJWT.On("GenerateRefreshToken", user, mock.AnythingOfType("domain.UserSessionID")).Return(refreshToken, expiresAt, nil)
	suite.mockRepo.On("CreateSession", suite.ctx, mock.AnythingOfType("*domain.UserSession")).Return(nil)
	suite.mockRepo.On("UpdateUserLastLogin", suite.ctx, userID, mock.AnythingOfType("time.Time")).Return(nil)

	// When
	result, err := suite.authService.Login(suite.ctx, email, password, ipAddress, userAgent)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), userWithRole, result.User)
	assert.Equal(suite.T(), accessToken, result.Token)
	assert.Equal(suite.T(), refreshToken, result.RefreshToken)
	assert.Equal(suite.T(), expiresAt, result.ExpiresAt)
}

func (suite *AuthServiceTestSuite) TestLogin_InvalidCredentials() {
	// Given
	email := "test@example.com"
	password := "wrong_password"

	user := &domain.User{
		ID:           domain.NewUserID(),
		Email:        email,
		PasswordHash: "hashed_password",
		IsActive:     true,
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(user, nil)
	suite.mockPassword.On("ComparePassword", password, "hashed_password").Return(false)

	// When
	result, err := suite.authService.Login(suite.ctx, email, password, "127.0.0.1", "browser")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid email or password")
}

func (suite *AuthServiceTestSuite) TestLogin_UserNotFound() {
	// Given
	email := "nonexistent@example.com"
	password := "password"

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(nil, sharederrors.WrapNotFound("GetUserByEmail", "user", email, nil))

	// When
	result, err := suite.authService.Login(suite.ctx, email, password, "127.0.0.1", "browser")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid email or password")
}

func (suite *AuthServiceTestSuite) TestLogin_InactiveUser() {
	// Given
	email := "test@example.com"
	password := "password"

	user := &domain.User{
		ID:           domain.NewUserID(),
		Email:        email,
		PasswordHash: "hashed_password",
		IsActive:     false, // Inactive user
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByEmail", suite.ctx, email).Return(user, nil)

	// When
	result, err := suite.authService.Login(suite.ctx, email, password, "127.0.0.1", "browser")

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "account is disabled")
}

// Test Logout
func (suite *AuthServiceTestSuite) TestLogout_Success() {
	// Given
	sessionID := domain.NewUserSessionID()

	// Setup mocks
	suite.mockRepo.On("InvalidateSession", suite.ctx, sessionID).Return(nil)

	// When
	err := suite.authService.Logout(suite.ctx, sessionID)

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *AuthServiceTestSuite) TestLogout_SessionNotFound() {
	// Given
	sessionID := domain.NewUserSessionID()

	// Setup mocks
	suite.mockRepo.On("InvalidateSession", suite.ctx, sessionID).Return(sharederrors.WrapNotFound("InvalidateSession", "session", sessionID.String(), nil))

	// When
	err := suite.authService.Logout(suite.ctx, sessionID)

	// Then
	assert.NoError(suite.T(), err) // Should not error if session doesn't exist
}

// Test RefreshToken
func (suite *AuthServiceTestSuite) TestRefreshToken_Success() {
	// Given
	refreshToken := "refresh_token_123"
	userID := domain.NewUserID()
	sessionID := domain.NewUserSessionID()
	roleID := domain.NewRoleID()
	
	claims := &domain.TokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		RoleID:    roleID,
		Email:     "test@example.com",
		ExpiresAt: time.Now().Add(time.Hour),
	}

	session := &domain.UserSession{
		ID:           sessionID,
		UserID:       userID,
		RefreshToken: hashToken(refreshToken),
		ExpiresAt:    time.Now().Add(time.Hour),
		IsActive:     true,
	}

	user := &domain.User{
		ID:       userID,
		Email:    "test@example.com",
		RoleID:   roleID,
		IsActive: true,
	}

	role := &domain.Role{
		ID:   roleID,
		Name: domain.RoleManager,
	}

	userWithRole := &domain.UserWithRole{
		User: user,
		Role: role,
	}

	newAccessToken := "new_access_token"
	newRefreshToken := "new_refresh_token"
	newExpiresAt := time.Now().Add(time.Hour)

	// Setup mocks
	suite.mockJWT.On("ValidateToken", refreshToken).Return(claims, nil)
	suite.mockRepo.On("GetSessionByID", suite.ctx, sessionID).Return(session, nil)
	suite.mockRepo.On("GetUserWithRole", suite.ctx, userID).Return(userWithRole, nil)
	suite.mockJWT.On("GenerateToken", user, sessionID).Return(newAccessToken, newExpiresAt, nil)
	suite.mockJWT.On("GenerateRefreshToken", user, sessionID).Return(newRefreshToken, newExpiresAt, nil)
	suite.mockRepo.On("UpdateSession", suite.ctx, mock.AnythingOfType("*domain.UserSession")).Return(nil)

	// When
	result, err := suite.authService.RefreshToken(suite.ctx, refreshToken)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), newAccessToken, result.Token)
	assert.Equal(suite.T(), newRefreshToken, result.RefreshToken)
	assert.Equal(suite.T(), sessionID, result.SessionID)
}

func (suite *AuthServiceTestSuite) TestRefreshToken_InvalidToken() {
	// Given
	refreshToken := "invalid_token"

	// Setup mocks
	suite.mockJWT.On("ValidateToken", refreshToken).Return(nil, errors.New("invalid token"))

	// When
	result, err := suite.authService.RefreshToken(suite.ctx, refreshToken)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid or expired refresh token")
}

// Test ValidateToken
func (suite *AuthServiceTestSuite) TestValidateToken_Success() {
	// Given
	accessToken := "access_token_123"
	userID := domain.NewUserID()
	sessionID := domain.NewUserSessionID()
	roleID := domain.NewRoleID()

	claims := &domain.TokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		RoleID:    roleID,
		Email:     "test@example.com",
		ExpiresAt: time.Now().Add(time.Hour),
	}

	session := &domain.UserSession{
		ID:        sessionID,
		UserID:    userID,
		TokenHash: hashToken(accessToken),
		ExpiresAt: time.Now().Add(time.Hour),
		IsActive:  true,
	}

	user := &domain.User{
		ID:       userID,
		Email:    "test@example.com",
		RoleID:   roleID,
		IsActive: true,
	}

	role := &domain.Role{
		ID:   roleID,
		Name: domain.RoleManager,
	}

	userWithRole := &domain.UserWithRole{
		User: user,
		Role: role,
	}

	// Setup mocks
	suite.mockJWT.On("ValidateToken", accessToken).Return(claims, nil)
	suite.mockRepo.On("GetSessionByTokenHash", suite.ctx, hashToken(accessToken)).Return(session, nil)
	suite.mockRepo.On("GetUserWithRole", suite.ctx, userID).Return(userWithRole, nil)

	// When
	result, err := suite.authService.ValidateToken(suite.ctx, accessToken)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), result)
	assert.Equal(suite.T(), userWithRole, result)
}

func (suite *AuthServiceTestSuite) TestValidateToken_InvalidToken() {
	// Given
	accessToken := "invalid_token"

	// Setup mocks
	suite.mockJWT.On("ValidateToken", accessToken).Return(nil, errors.New("invalid token"))

	// When
	result, err := suite.authService.ValidateToken(suite.ctx, accessToken)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), result)
	assert.Contains(suite.T(), err.Error(), "invalid or expired token")
}

// Test ChangePassword
func (suite *AuthServiceTestSuite) TestChangePassword_Success() {
	// Given
	userID := domain.NewUserID()
	oldPassword := "OldPassword123!"
	newPassword := "NewPassword123!"
	newPasswordHash := "new_hashed_password"

	user := &domain.User{
		ID:           userID,
		Email:        "test@example.com",
		PasswordHash: "old_hashed_password",
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByID", suite.ctx, userID).Return(user, nil)
	suite.mockPassword.On("ComparePassword", oldPassword, "old_hashed_password").Return(true)
	suite.mockPassword.On("HashPassword", newPassword).Return(newPasswordHash, nil)
	suite.mockRepo.On("UpdateUserPassword", suite.ctx, userID, newPasswordHash).Return(nil)
	suite.mockRepo.On("InvalidateUserSessions", suite.ctx, userID).Return(nil)

	// When
	err := suite.authService.ChangePassword(suite.ctx, userID, oldPassword, newPassword)

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *AuthServiceTestSuite) TestChangePassword_InvalidOldPassword() {
	// Given
	userID := domain.NewUserID()
	oldPassword := "WrongPassword123!"
	newPassword := "NewPassword123!"

	user := &domain.User{
		ID:           userID,
		Email:        "test@example.com",
		PasswordHash: "old_hashed_password",
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByID", suite.ctx, userID).Return(user, nil)
	suite.mockPassword.On("ComparePassword", oldPassword, "old_hashed_password").Return(false)

	// When
	err := suite.authService.ChangePassword(suite.ctx, userID, oldPassword, newPassword)

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "current password is incorrect")
}

// Test GetUserSessions
func (suite *AuthServiceTestSuite) TestGetUserSessions_Success() {
	// Given
	userID := domain.NewUserID()
	sessions := []domain.UserSession{
		{
			ID:        domain.NewUserSessionID(),
			UserID:    userID,
			ExpiresAt: time.Now().Add(time.Hour),
			IsActive:  true,
		},
		{
			ID:        domain.NewUserSessionID(),
			UserID:    userID,
			ExpiresAt: time.Now().Add(time.Hour),
			IsActive:  true,
		},
	}

	// Setup mocks
	suite.mockRepo.On("GetActiveSessionsByUserID", suite.ctx, userID).Return(sessions, nil)

	// When
	result, err := suite.authService.GetUserSessions(suite.ctx, userID)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), sessions, result)
}

// Test User Management
func (suite *AuthServiceTestSuite) TestGetUser_Success() {
	// Given
	userID := domain.NewUserID()
	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:    userID,
			Email: "test@example.com",
		},
		Role: &domain.Role{
			Name: domain.RoleManager,
		},
	}

	// Setup mocks
	suite.mockRepo.On("GetUserWithRole", suite.ctx, userID).Return(userWithRole, nil)

	// When
	result, err := suite.authService.GetUser(suite.ctx, userID)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), userWithRole, result)
}

func (suite *AuthServiceTestSuite) TestUpdateUser_Success() {
	// Given
	userID := domain.NewUserID()
	newEmail := "new@example.com"
	newRoleID := domain.NewRoleID()
	
	updates := domain.UserUpdates{
		Email:  &newEmail,
		RoleID: &newRoleID,
	}

	user := &domain.User{
		ID:    userID,
		Email: "old@example.com",
		RoleID: domain.NewRoleID(),
	}

	updatedUserWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:    userID,
			Email: newEmail,
			RoleID: newRoleID,
		},
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByID", suite.ctx, userID).Return(user, nil)
	suite.mockRepo.On("UpdateUser", suite.ctx, mock.AnythingOfType("*domain.User")).Return(nil)
	suite.mockRepo.On("GetUserWithRole", suite.ctx, userID).Return(updatedUserWithRole, nil)

	// When
	result, err := suite.authService.UpdateUser(suite.ctx, userID, updates)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), updatedUserWithRole, result)
}

// Test Role Management
func (suite *AuthServiceTestSuite) TestGetRoles_Success() {
	// Given
	roles := []domain.Role{
		{Name: domain.RoleAdmin},
		{Name: domain.RoleManager},
	}

	// Setup mocks
	suite.mockRepo.On("ListRoles", suite.ctx).Return(roles, nil)

	// When
	result, err := suite.authService.GetRoles(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), roles, result)
}

func (suite *AuthServiceTestSuite) TestGetPermissions_Success() {
	// Given
	permissions := []domain.Permission{
		{Name: "read_menu", Resource: domain.ResourceMenu, Action: domain.ActionRead},
		{Name: "create_order", Resource: domain.ResourceOrder, Action: domain.ActionCreate},
	}

	// Setup mocks
	suite.mockRepo.On("ListPermissions", suite.ctx).Return(permissions, nil)

	// When
	result, err := suite.authService.GetPermissions(suite.ctx)

	// Then
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), permissions, result)
}

func (suite *AuthServiceTestSuite) TestAssignRole_Success() {
	// Given
	userID := domain.NewUserID()
	roleID := domain.NewRoleID()

	user := &domain.User{
		ID:     userID,
		Email:  "test@example.com",
		RoleID: domain.NewRoleID(), // Old role
	}

	role := &domain.Role{
		ID:   roleID,
		Name: domain.RoleManager,
	}

	// Setup mocks
	suite.mockRepo.On("GetUserByID", suite.ctx, userID).Return(user, nil)
	suite.mockRepo.On("GetRoleByID", suite.ctx, roleID).Return(role, nil)
	suite.mockRepo.On("UpdateUser", suite.ctx, mock.AnythingOfType("*domain.User")).Return(nil)

	// When
	err := suite.authService.AssignRole(suite.ctx, userID, roleID)

	// Then
	assert.NoError(suite.T(), err)
}