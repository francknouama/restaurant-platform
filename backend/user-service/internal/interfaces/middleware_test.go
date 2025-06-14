package interfaces

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/user-service/internal/domain"
	sharederrors "github.com/restaurant-platform/shared/pkg/errors"
)

// MiddlewareTestSuite contains all middleware tests
type MiddlewareTestSuite struct {
	suite.Suite
	router   *gin.Engine
	mockAuth *MockAuthService
}

func TestMiddlewareTestSuite(t *testing.T) {
	suite.Run(t, new(MiddlewareTestSuite))
}

func (suite *MiddlewareTestSuite) SetupTest() {
	gin.SetMode(gin.TestMode)
	suite.mockAuth = new(MockAuthService)
	
	suite.router = gin.New()
	suite.router.Use(gin.Recovery())
	
	// Setup a protected route for testing middleware
	protected := suite.router.Group("/protected")
	protected.Use(AuthMiddleware(suite.mockAuth))
	protected.GET("/test", func(c *gin.Context) {
		user := c.MustGet("user").(*domain.UserWithRole)
		c.JSON(http.StatusOK, gin.H{"user_id": user.User.ID.String()})
	})
}

func (suite *MiddlewareTestSuite) TearDownTest() {
	suite.mockAuth.AssertExpectations(suite.T())
}

// Test successful authentication
func (suite *MiddlewareTestSuite) TestRequireAuth_Success() {
	// Given
	userID := domain.NewUserID()
	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       userID,
			Email:    "test@example.com",
			IsActive: true,
		},
		Role: &domain.Role{
			ID:   domain.NewRoleID(),
			Name: domain.RoleManager,
		},
	}

	suite.mockAuth.On("ValidateToken", mock.Anything, "valid_token").Return(userWithRole, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer valid_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	assert.Contains(suite.T(), w.Body.String(), userID.String())
}

// Test missing authorization header
func (suite *MiddlewareTestSuite) TestRequireAuth_MissingAuthHeader() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "Authorization header required")
}

// Test invalid authorization header format
func (suite *MiddlewareTestSuite) TestRequireAuth_InvalidAuthHeaderFormat() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "InvalidFormat")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "Bearer token required")
}

// Test empty token
func (suite *MiddlewareTestSuite) TestRequireAuth_EmptyToken() {
	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer ")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "Bearer token required")
}

// Test invalid token
func (suite *MiddlewareTestSuite) TestRequireAuth_InvalidToken() {
	// Given
	suite.mockAuth.On("ValidateToken", mock.Anything, "invalid_token").
		Return(nil, sharederrors.WrapUnauthorized("ValidateToken", "invalid or expired token", nil))

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer invalid_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "invalid or expired token")
}

// Test expired token
func (suite *MiddlewareTestSuite) TestRequireAuth_ExpiredToken() {
	// Given
	suite.mockAuth.On("ValidateToken", mock.Anything, "expired_token").
		Return(nil, sharederrors.WrapUnauthorized("ValidateToken", "token has expired", nil))

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer expired_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusUnauthorized, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "token has expired")
}

// Test inactive user
func (suite *MiddlewareTestSuite) TestRequireAuth_InactiveUser() {
	// Given
	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       domain.NewUserID(),
			Email:    "test@example.com",
			IsActive: false, // Inactive user
		},
		Role: &domain.Role{
			ID:   domain.NewRoleID(),
			Name: domain.RoleManager,
		},
	}

	suite.mockAuth.On("ValidateToken", mock.Anything, "valid_token").Return(userWithRole, nil)

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer valid_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusForbidden, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "account is disabled")
}

// Test authentication with different token formats
func (suite *MiddlewareTestSuite) TestRequireAuth_DifferentTokenFormats() {
	testCases := []struct {
		name           string
		authorization  string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Valid Bearer token",
			authorization:  "Bearer valid_token",
			expectedStatus: http.StatusOK,
			expectedError:  "",
		},
		{
			name:           "Bearer with extra spaces",
			authorization:  "Bearer  valid_token",
			expectedStatus: http.StatusOK,
			expectedError:  "",
		},
		{
			name:           "Lowercase bearer",
			authorization:  "bearer valid_token",
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Bearer token required",
		},
		{
			name:           "Missing Bearer keyword",
			authorization:  "valid_token",
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Bearer token required",
		},
		{
			name:           "Different auth type",
			authorization:  "Basic dXNlcjpwYXNz",
			expectedStatus: http.StatusUnauthorized,
			expectedError:  "Bearer token required",
		},
	}

	for _, tc := range testCases {
		suite.Run(tc.name, func() {
			if tc.expectedStatus == http.StatusOK {
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
				// Extract token from authorization header (trim "Bearer " prefix)
				token := strings.TrimPrefix(tc.authorization, "Bearer ")
				if strings.HasPrefix(tc.authorization, "Bearer ") {
					token = strings.TrimSpace(token)
				}
				suite.mockAuth.On("ValidateToken", mock.Anything, token).Return(userWithRole, nil)
			}

			w := httptest.NewRecorder()
			req, _ := http.NewRequest("GET", "/protected/test", nil)
			req.Header.Set("Authorization", tc.authorization)
			suite.router.ServeHTTP(w, req)

			assert.Equal(suite.T(), tc.expectedStatus, w.Code)
			if tc.expectedError != "" {
				assert.Contains(suite.T(), w.Body.String(), tc.expectedError)
			}
		})
	}
}

// Test user context setting
func (suite *MiddlewareTestSuite) TestRequireAuth_UserContextSet() {
	// Given
	userID := domain.NewUserID()
	roleID := domain.NewRoleID()
	
	userWithRole := &domain.UserWithRole{
		User: &domain.User{
			ID:       userID,
			Email:    "test@example.com",
			RoleID:   roleID,
			IsActive: true,
		},
		Role: &domain.Role{
			ID:          roleID,
			Name:        domain.RoleManager,
			Description: "Manager role",
		},
		Permissions: []domain.Permission{
			{
				ID:       domain.NewPermissionID(),
				Name:     "read_menu",
				Resource: domain.ResourceMenu,
				Action:   domain.ActionRead,
			},
		},
	}

	suite.mockAuth.On("ValidateToken", mock.Anything, "valid_token").Return(userWithRole, nil)

	// Setup a test route that checks the user context
	suite.router.GET("/context-test", AuthMiddleware(suite.mockAuth), func(c *gin.Context) {
		user := c.MustGet("user").(*domain.UserWithRole)
		c.JSON(http.StatusOK, gin.H{
			"user_id":     user.User.ID.String(),
			"email":       user.User.Email,
			"role":        user.Role.Name,
			"permissions": len(user.Permissions),
		})
	})

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/context-test", nil)
	req.Header.Set("Authorization", "Bearer valid_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusOK, w.Code)
	
	responseBody := w.Body.String()
	assert.Contains(suite.T(), responseBody, userID.String())
	assert.Contains(suite.T(), responseBody, "test@example.com")
	assert.Contains(suite.T(), responseBody, domain.RoleManager)
	assert.Contains(suite.T(), responseBody, "\"permissions\":1")
}

// Test multiple consecutive requests
func (suite *MiddlewareTestSuite) TestRequireAuth_MultipleRequests() {
	// Given
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

	// Mock multiple calls
	suite.mockAuth.On("ValidateToken", mock.Anything, "valid_token").Return(userWithRole, nil).Times(3)

	// When - Make multiple requests
	for i := 0; i < 3; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/protected/test", nil)
		req.Header.Set("Authorization", "Bearer valid_token")
		suite.router.ServeHTTP(w, req)

		// Then
		assert.Equal(suite.T(), http.StatusOK, w.Code)
	}
}

// Test middleware error handling
func (suite *MiddlewareTestSuite) TestRequireAuth_ServiceError() {
	// Given - Service returns an internal error
	suite.mockAuth.On("ValidateToken", mock.Anything, "valid_token").
		Return(nil, sharederrors.WrapInternal("ValidateToken", "database connection failed", nil))

	// When
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/protected/test", nil)
	req.Header.Set("Authorization", "Bearer valid_token")
	suite.router.ServeHTTP(w, req)

	// Then
	assert.Equal(suite.T(), http.StatusInternalServerError, w.Code)
	assert.Contains(suite.T(), w.Body.String(), "database connection failed")
}