package interfaces

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/user-service/internal/application"
	"github.com/restaurant-platform/user-service/internal/domain"
	sharederrors "github.com/restaurant-platform/shared/pkg/errors"
)

// Mock Authentication Service
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(ctx context.Context, email, password string, roleID domain.RoleID) (*domain.UserWithRole, error) {
	args := m.Called(ctx, email, password, roleID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserWithRole), args.Error(1)
}

func (m *MockAuthService) Login(ctx context.Context, email, password, ipAddress, userAgent string) (*domain.AuthResult, error) {
	args := m.Called(ctx, email, password, ipAddress, userAgent)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.AuthResult), args.Error(1)
}

func (m *MockAuthService) Logout(ctx context.Context, sessionID domain.UserSessionID) error {
	args := m.Called(ctx, sessionID)
	return args.Error(0)
}

func (m *MockAuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResult, error) {
	args := m.Called(ctx, refreshToken)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.AuthResult), args.Error(1)
}

func (m *MockAuthService) ValidateToken(ctx context.Context, token string) (*domain.UserWithRole, error) {
	args := m.Called(ctx, token)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserWithRole), args.Error(1)
}

func (m *MockAuthService) ChangePassword(ctx context.Context, userID domain.UserID, oldPassword, newPassword string) error {
	args := m.Called(ctx, userID, oldPassword, newPassword)
	return args.Error(0)
}

func (m *MockAuthService) GetUser(ctx context.Context, userID domain.UserID) (*domain.UserWithRole, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserWithRole), args.Error(1)
}

func (m *MockAuthService) UpdateUser(ctx context.Context, userID domain.UserID, updates domain.UserUpdates) (*domain.UserWithRole, error) {
	args := m.Called(ctx, userID, updates)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.UserWithRole), args.Error(1)
}

func (m *MockAuthService) GetUserSessions(ctx context.Context, userID domain.UserID) ([]domain.UserSession, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]domain.UserSession), args.Error(1)
}

func (m *MockAuthService) InvalidateUserSessions(ctx context.Context, userID domain.UserID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthService) CleanupExpiredSessions(ctx context.Context) error {
	args := m.Called(ctx)
	return args.Error(0)
}

func (m *MockAuthService) GetRoles(ctx context.Context) ([]domain.Role, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Role), args.Error(1)
}

func (m *MockAuthService) GetPermissions(ctx context.Context) ([]domain.Permission, error) {
	args := m.Called(ctx)
	return args.Get(0).([]domain.Permission), args.Error(1)
}

func (m *MockAuthService) AssignRole(ctx context.Context, userID domain.UserID, roleID domain.RoleID) error {
	args := m.Called(ctx, userID, roleID)
	return args.Error(0)
}

func (m *MockAuthService) ActivateUser(ctx context.Context, userID domain.UserID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthService) DeactivateUser(ctx context.Context, userID domain.UserID) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockAuthService) ListUsers(ctx context.Context, filters domain.UserFilters) ([]*domain.UserWithRole, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.UserWithRole), args.Error(1)
}

// Test Suite
type HandlersTestSuite struct {
	suite.Suite
	router      *gin.Engine
	mockAuth    *MockAuthService
	handler     *AuthHandler
}

func TestHandlersTestSuite(t *testing.T) {
	suite.Run(t, new(HandlersTestSuite))
}

func (suite *HandlersTestSuite) SetupTest() {
	gin.SetMode(gin.TestMode)
	suite.mockAuth = new(MockAuthService)
	suite.handler = NewAuthHandler(suite.mockAuth)
	
	suite.router = gin.New()
	suite.router.Use(gin.Recovery())
	
	// Setup routes similar to actual router
	api := suite.router.Group("/api/v1")
	auth := api.Group("/auth")
	
	auth.POST("/register", suite.handler.Register)
	auth.POST("/login", suite.handler.Login)
	auth.POST("/logout", suite.handler.Logout)
	auth.POST("/refresh", suite.handler.RefreshToken)
}

func (suite *HandlersTestSuite) TearDownTest() {
	suite.mockAuth.AssertExpectations(suite.T())
}

// Test Registration
func (suite *HandlersTestSuite) TestRegister_Success() {
	// Given
	roleID := domain.NewRoleID()
	requestBody := application.RegisterRequest{
		Email:    "test@example.com",
		Password: "ValidPassword123!",
		RoleID:   roleID.String(),
	}

	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       domain.NewUserID(),
			Email:    requestBody.Email,
			RoleID:   roleID,
			IsActive: true,
		},
		Role: &domain.Role{
			ID:   roleID,
			Name: domain.RoleManager,
		},
	}

	suite.mockAuth.On("Register", mock.Anything, requestBody.Email, requestBody.Password, roleID).
		Return(userWithRole, nil)

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusCreated, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))
}

func (suite *HandlersTestSuite) TestRegister_InvalidRequestBody() {
	// Given
	invalidBody := `{"email": "invalid", "password": ""}`

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBufferString(invalidBody))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
}

func (suite *HandlersTestSuite) TestRegister_EmailAlreadyExists() {
	// Given
	roleID := domain.NewRoleID()
	requestBody := application.RegisterRequest{
		Email:    "existing@example.com",
		Password: "ValidPassword123!",
		RoleID:   roleID.String(),
	}

	suite.mockAuth.On("Register", mock.Anything, requestBody.Email, requestBody.Password, roleID).
		Return(nil, sharederrors.WrapConflict("Register", "user", "user with this email already exists", nil))

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusConflict, w.Code)
}

// Test Login
func (suite *HandlersTestSuite) TestLogin_Success() {
	// Given
	requestBody := application.LoginRequest{
		Email:    "test@example.com",
		Password: "ValidPassword123!",
	}

	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       domain.NewUserID(),
			Email:    requestBody.Email,
			IsActive: true,
		},
		Role: &domain.Role{
			ID:   domain.NewRoleID(),
			Name: domain.RoleManager,
		},
	}

	authResult := &domain.AuthResult{
		User:         userWithRole,
		Token:        "access_token_123",
		RefreshToken: "refresh_token_123",
		ExpiresAt:    time.Now().Add(time.Hour),
		SessionID:    domain.NewUserSessionID(),
	}

	suite.mockAuth.On("Login", mock.Anything, requestBody.Email, requestBody.Password, mock.AnythingOfType("string"), mock.AnythingOfType("string")).
		Return(authResult, nil)

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Forwarded-For", "192.168.1.1")
	req.Header.Set("User-Agent", "Test Browser")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))
}

func (suite *HandlersTestSuite) TestLogin_InvalidCredentials() {
	// Given
	requestBody := application.LoginRequest{
		Email:    "test@example.com",
		Password: "WrongPassword123!",
	}

	suite.mockAuth.On("Login", mock.Anything, requestBody.Email, requestBody.Password, mock.AnythingOfType("string"), mock.AnythingOfType("string")).
		Return(nil, sharederrors.WrapUnauthorized("Login", "invalid email or password", nil))

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// Test Refresh Token
func (suite *HandlersTestSuite) TestRefreshToken_Success() {
	// Given
	requestBody := application.RefreshTokenRequest{
		RefreshToken: "valid_refresh_token",
	}

	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       domain.NewUserID(),
			Email:    "test@example.com",
			IsActive: true,
		},
		Role: &domain.Role{
			ID:   domain.NewRoleID(),
			Name: domain.RoleManager,
		},
	}

	authResult := &domain.AuthResult{
		User:         userWithRole,
		Token:        "new_access_token",
		RefreshToken: "new_refresh_token",
		ExpiresAt:    time.Now().Add(time.Hour),
		SessionID:    domain.NewUserSessionID(),
	}

	suite.mockAuth.On("RefreshToken", mock.Anything, requestBody.RefreshToken).
		Return(authResult, nil)

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(suite.T(), err)
	assert.True(suite.T(), response["success"].(bool))
}

func (suite *HandlersTestSuite) TestRefreshToken_InvalidToken() {
	// Given
	requestBody := application.RefreshTokenRequest{
		RefreshToken: "invalid_refresh_token",
	}

	suite.mockAuth.On("RefreshToken", mock.Anything, requestBody.RefreshToken).
		Return(nil, sharederrors.WrapUnauthorized("RefreshToken", "invalid refresh token", nil))

	body, _ := json.Marshal(requestBody)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
}

// Test validation errors
func (suite *HandlersTestSuite) TestRegister_ValidationErrors() {
	testCases := []struct {
		name         string
		requestBody  interface{}
		expectedCode int
	}{
		{
			name: "Missing email",
			requestBody: map[string]interface{}{
				"password": "ValidPassword123!",
				"roleId":   domain.NewRoleID().String(),
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Invalid email format",
			requestBody: map[string]interface{}{
				"email":    "invalid-email",
				"password": "ValidPassword123!",
				"roleId":   domain.NewRoleID().String(),
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Password too short",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "short",
				"roleId":   domain.NewRoleID().String(),
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Missing role ID",
			requestBody: map[string]interface{}{
				"email":    "test@example.com",
				"password": "ValidPassword123!",
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			body, _ := json.Marshal(tc.requestBody)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), tc.expectedCode, w.Code)
		})
	}
}

func (suite *HandlersTestSuite) TestLogin_ValidationErrors() {
	testCases := []struct {
		name         string
		requestBody  interface{}
		expectedCode int
	}{
		{
			name: "Missing email",
			requestBody: map[string]interface{}{
				"password": "ValidPassword123!",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Invalid email format",
			requestBody: map[string]interface{}{
				"email":    "invalid-email",
				"password": "ValidPassword123!",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "Missing password",
			requestBody: map[string]interface{}{
				"email": "test@example.com",
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			body, _ := json.Marshal(tc.requestBody)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), tc.expectedCode, w.Code)
		})
	}
}

// Test malformed JSON
func (suite *HandlersTestSuite) TestMalformedJSON() {
	endpoints := []string{
		"/api/v1/auth/register",
		"/api/v1/auth/login",
		"/api/v1/auth/refresh",
	}

	for _, endpoint := range endpoints {
		suite.Run("Malformed JSON "+endpoint, func() {
			malformedJSON := `{"email": "test@example.com", "password": }`

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", endpoint, bytes.NewBufferString(malformedJSON))
			req.Header.Set("Content-Type", "application/json")
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
		})
	}
}

// Test empty request body
func (suite *HandlersTestSuite) TestEmptyRequestBody() {
	endpoints := []string{
		"/api/v1/auth/register",
		"/api/v1/auth/login",
		"/api/v1/auth/refresh",
	}

	for _, endpoint := range endpoints {
		suite.Run("Empty body "+endpoint, func() {
			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", endpoint, bytes.NewBuffer([]byte{}))
			req.Header.Set("Content-Type", "application/json")
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), http.StatusBadRequest, w.Code)
		})
	}
}

// Test service errors
func (suite *HandlersTestSuite) TestServiceErrors() {
	// Test different error types from the service layer
	roleID := domain.NewRoleID()
	
	testCases := []struct {
		name         string
		setupMock    func()
		endpoint     string
		requestBody  interface{}
		expectedCode int
	}{
		{
			name: "Internal server error on register",
			setupMock: func() {
				suite.mockAuth.On("Register", mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, sharederrors.WrapInternal("Register", "database connection failed", nil))
			},
			endpoint: "/api/v1/auth/register",
			requestBody: application.RegisterRequest{
				Email:    "test@example.com",
				Password: "ValidPassword123!",
				RoleID:   roleID.String(),
			},
			expectedCode: http.StatusInternalServerError,
		},
		{
			name: "Not found error on login",
			setupMock: func() {
				suite.mockAuth.On("Login", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).
					Return(nil, sharederrors.WrapNotFound("Login", "user", "test@example.com", nil))
			},
			endpoint: "/api/v1/auth/login",
			requestBody: application.LoginRequest{
				Email:    "test@example.com",
				Password: "ValidPassword123!",
			},
			expectedCode: http.StatusNotFound,
		},
		{
			name: "Bad request error on refresh",
			setupMock: func() {
				suite.mockAuth.On("RefreshToken", mock.Anything, mock.Anything).
					Return(nil, sharederrors.WrapBadRequest("RefreshToken", "malformed token", nil))
			},
			endpoint: "/api/v1/auth/refresh",
			requestBody: application.RefreshTokenRequest{
				RefreshToken: "malformed_token",
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			tc.setupMock()

			body, _ := json.Marshal(tc.requestBody)

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("POST", tc.endpoint, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), tc.expectedCode, w.Code)
		})
	}
}