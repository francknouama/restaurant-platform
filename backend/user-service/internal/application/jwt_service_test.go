package application

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"

	"github.com/restaurant-platform/user-service/internal/domain"
)

// JWTServiceTestSuite contains all JWT service tests
type JWTServiceTestSuite struct {
	suite.Suite
	jwtService      *JWTService
	secretKey       string
	issuer          string
	tokenExp        time.Duration
	refreshExp      time.Duration
	testUser        *domain.User
	testSessionID   domain.UserSessionID
}

func TestJWTServiceTestSuite(t *testing.T) {
	suite.Run(t, new(JWTServiceTestSuite))
}

func (suite *JWTServiceTestSuite) SetupTest() {
	suite.secretKey = "test_secret_key_for_jwt_testing_purposes_only"
	suite.issuer = "restaurant-platform-test"
	suite.tokenExp = 15 * time.Minute
	suite.refreshExp = 24 * time.Hour

	suite.jwtService = &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   suite.tokenExp,
		refreshExpiration: suite.refreshExp,
	}

	suite.testUser = &domain.User{
		ID:     domain.NewUserID(),
		Email:  "test@example.com",
		RoleID: domain.NewRoleID(),
	}

	suite.testSessionID = domain.NewUserSessionID()
}

// Test Token Generation
func (suite *JWTServiceTestSuite) TestGenerateToken_Success() {
	// When
	token, expiresAt, err := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), token)
	assert.True(suite.T(), expiresAt.After(time.Now()))
	assert.True(suite.T(), expiresAt.Before(time.Now().Add(suite.tokenExp+time.Minute)))

	// Verify token contains expected data
	claims, err := suite.jwtService.ValidateToken(token)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
	assert.Equal(suite.T(), suite.testSessionID, claims.SessionID)
	assert.Equal(suite.T(), suite.testUser.RoleID, claims.RoleID)
	assert.Equal(suite.T(), suite.testUser.Email, claims.Email)
}

func (suite *JWTServiceTestSuite) TestGenerateRefreshToken_Success() {
	// When
	refreshToken, expiresAt, err := suite.jwtService.GenerateRefreshToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), refreshToken)
	assert.True(suite.T(), expiresAt.After(time.Now()))
	assert.True(suite.T(), expiresAt.Before(time.Now().Add(suite.refreshExp+time.Minute)))

	// Verify refresh token contains expected data
	claims, err := suite.jwtService.ValidateToken(refreshToken)
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
	assert.Equal(suite.T(), suite.testSessionID, claims.SessionID)
	assert.Equal(suite.T(), suite.testUser.RoleID, claims.RoleID)
	assert.Equal(suite.T(), suite.testUser.Email, claims.Email)
}

func (suite *JWTServiceTestSuite) TestGenerateToken_DifferentTokensForSameUser() {
	// When
	token1, _, err1 := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	time.Sleep(10 * time.Millisecond) // Ensure different timestamps (increased from 1ms)
	token2, _, err2 := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.NotEqual(suite.T(), token1, token2) // Tokens should be different due to timestamps
}

// Test Token Validation
func (suite *JWTServiceTestSuite) TestValidateToken_Success() {
	// Given
	token, _, err := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// When
	claims, err := suite.jwtService.ValidateToken(token)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), claims)
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
	assert.Equal(suite.T(), suite.testSessionID, claims.SessionID)
	assert.Equal(suite.T(), suite.testUser.RoleID, claims.RoleID)
	assert.Equal(suite.T(), suite.testUser.Email, claims.Email)
	assert.True(suite.T(), claims.ExpiresAt.After(time.Now()))
}

func (suite *JWTServiceTestSuite) TestValidateToken_InvalidToken() {
	// Given
	invalidToken := "invalid.jwt.token"

	// When
	claims, err := suite.jwtService.ValidateToken(invalidToken)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), claims)
	assert.Contains(suite.T(), err.Error(), "failed to parse token")
}

func (suite *JWTServiceTestSuite) TestValidateToken_MalformedToken() {
	// Given
	malformedToken := "not.a.valid.jwt.token.format"

	// When
	claims, err := suite.jwtService.ValidateToken(malformedToken)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), claims)
}

func (suite *JWTServiceTestSuite) TestValidateToken_ExpiredToken() {
	// Given - Create a JWT service with very short expiration
	shortExpJWT := &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   1 * time.Millisecond,
		refreshExpiration: suite.refreshExp,
	}

	token, _, err := shortExpJWT.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// Wait for token to expire
	time.Sleep(10 * time.Millisecond)

	// When
	claims, err := suite.jwtService.ValidateToken(token)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), claims)
}

func (suite *JWTServiceTestSuite) TestValidateToken_WrongSecret() {
	// Given
	wrongSecretJWT := &JWTService{
		secretKey:         "wrong_secret_key",
		issuer:            suite.issuer,
		tokenExpiration:   suite.tokenExp,
		refreshExpiration: suite.refreshExp,
	}

	token, _, err := wrongSecretJWT.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// When - Validate with correct service (different secret)
	claims, err := suite.jwtService.ValidateToken(token)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), claims)
}

// Test Extract Claims (without validation)
func (suite *JWTServiceTestSuite) TestExtractClaims_Success() {
	// Given
	token, _, err := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// When
	claims, err := suite.jwtService.ExtractClaims(token)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), claims)
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
	assert.Equal(suite.T(), suite.testSessionID, claims.SessionID)
	assert.Equal(suite.T(), suite.testUser.RoleID, claims.RoleID)
	assert.Equal(suite.T(), suite.testUser.Email, claims.Email)
}

func (suite *JWTServiceTestSuite) TestExtractClaims_ExpiredToken() {
	// Given - Create an expired token
	shortExpJWT := &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   1 * time.Millisecond,
		refreshExpiration: suite.refreshExp,
	}

	token, _, err := shortExpJWT.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// Wait for token to expire
	time.Sleep(10 * time.Millisecond)

	// When - Extract claims without validation (should still work)
	claims, err := suite.jwtService.ExtractClaims(token)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), claims)
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
}

func (suite *JWTServiceTestSuite) TestExtractClaims_InvalidToken() {
	// Given
	invalidToken := "invalid.jwt.token"

	// When
	claims, err := suite.jwtService.ExtractClaims(invalidToken)

	// Then
	assert.Error(suite.T(), err)
	assert.Nil(suite.T(), claims)
}

// Test Token Expiration Check
func (suite *JWTServiceTestSuite) TestIsTokenExpired_NotExpired() {
	// Given
	token, _, err := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// When
	isExpired := suite.jwtService.IsTokenExpired(token)

	// Then
	assert.False(suite.T(), isExpired)
}

func (suite *JWTServiceTestSuite) TestIsTokenExpired_Expired() {
	// Given - Create a JWT service with very short expiration
	shortExpJWT := &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   1 * time.Millisecond,
		refreshExpiration: suite.refreshExp,
	}

	token, _, err := shortExpJWT.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// Wait for token to expire
	time.Sleep(10 * time.Millisecond)

	// When
	isExpired := suite.jwtService.IsTokenExpired(token)

	// Then
	assert.True(suite.T(), isExpired)
}

func (suite *JWTServiceTestSuite) TestIsTokenExpired_InvalidToken() {
	// Given
	invalidToken := "invalid.jwt.token"

	// When
	isExpired := suite.jwtService.IsTokenExpired(invalidToken)

	// Then
	assert.True(suite.T(), isExpired) // Invalid tokens are considered expired
}

// Test Token Structure and Claims
func (suite *JWTServiceTestSuite) TestTokenStructure_ContainsExpectedClaims() {
	// Given
	token, expiresAt, err := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	assert.NoError(suite.T(), err)

	// When
	claims, err := suite.jwtService.ValidateToken(token)

	// Then
	assert.NoError(suite.T(), err)
	
	// Verify all expected claims are present
	assert.Equal(suite.T(), suite.testUser.ID, claims.UserID)
	assert.Equal(suite.T(), suite.testSessionID, claims.SessionID)
	assert.Equal(suite.T(), suite.testUser.RoleID, claims.RoleID)
	assert.Equal(suite.T(), suite.testUser.Email, claims.Email)
	assert.True(suite.T(), claims.ExpiresAt.Equal(expiresAt) || claims.ExpiresAt.Before(expiresAt.Add(time.Second)))
}

func (suite *JWTServiceTestSuite) TestRefreshTokenStructure_DifferentFromAccessToken() {
	// Given
	accessToken, _, err1 := suite.jwtService.GenerateToken(suite.testUser, suite.testSessionID)
	refreshToken, _, err2 := suite.jwtService.GenerateRefreshToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.NotEqual(suite.T(), accessToken, refreshToken)

	// Both should be valid but different
	accessClaims, err1 := suite.jwtService.ValidateToken(accessToken)
	refreshClaims, err2 := suite.jwtService.ValidateToken(refreshToken)

	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.Equal(suite.T(), accessClaims.UserID, refreshClaims.UserID)
	assert.Equal(suite.T(), accessClaims.SessionID, refreshClaims.SessionID)
	
	// But expiration times should be different
	assert.True(suite.T(), refreshClaims.ExpiresAt.After(accessClaims.ExpiresAt))
}

// Test Different Users and Sessions
func (suite *JWTServiceTestSuite) TestMultipleUsers_GenerateDifferentTokens() {
	// Given
	user1 := &domain.User{
		ID:     domain.NewUserID(),
		Email:  "user1@example.com",
		RoleID: domain.NewRoleID(),
	}

	user2 := &domain.User{
		ID:     domain.NewUserID(),
		Email:  "user2@example.com",
		RoleID: domain.NewRoleID(),
	}

	session1 := domain.NewUserSessionID()
	session2 := domain.NewUserSessionID()

	// When
	token1, _, err1 := suite.jwtService.GenerateToken(user1, session1)
	token2, _, err2 := suite.jwtService.GenerateToken(user2, session2)

	// Then
	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.NotEqual(suite.T(), token1, token2)

	// Verify each token contains correct user data
	claims1, err1 := suite.jwtService.ValidateToken(token1)
	claims2, err2 := suite.jwtService.ValidateToken(token2)

	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)

	assert.Equal(suite.T(), user1.ID, claims1.UserID)
	assert.Equal(suite.T(), user1.Email, claims1.Email)
	assert.Equal(suite.T(), session1, claims1.SessionID)

	assert.Equal(suite.T(), user2.ID, claims2.UserID)
	assert.Equal(suite.T(), user2.Email, claims2.Email)
	assert.Equal(suite.T(), session2, claims2.SessionID)
}

func (suite *JWTServiceTestSuite) TestSameUser_DifferentSessions() {
	// Given
	session1 := domain.NewUserSessionID()
	session2 := domain.NewUserSessionID()

	// When
	token1, _, err1 := suite.jwtService.GenerateToken(suite.testUser, session1)
	time.Sleep(1 * time.Millisecond) // Ensure different timestamps
	token2, _, err2 := suite.jwtService.GenerateToken(suite.testUser, session2)

	// Then
	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)
	assert.NotEqual(suite.T(), token1, token2)

	// Verify session IDs are different
	claims1, err1 := suite.jwtService.ValidateToken(token1)
	claims2, err2 := suite.jwtService.ValidateToken(token2)

	assert.NoError(suite.T(), err1)
	assert.NoError(suite.T(), err2)

	assert.Equal(suite.T(), suite.testUser.ID, claims1.UserID)
	assert.Equal(suite.T(), suite.testUser.ID, claims2.UserID)
	assert.Equal(suite.T(), session1, claims1.SessionID)
	assert.Equal(suite.T(), session2, claims2.SessionID)
	assert.NotEqual(suite.T(), claims1.SessionID, claims2.SessionID)
}

// Test Edge Cases
func (suite *JWTServiceTestSuite) TestEmptySecretKey() {
	// Given
	emptySecretJWT := &JWTService{
		secretKey:         "",
		issuer:            suite.issuer,
		tokenExpiration:   suite.tokenExp,
		refreshExpiration: suite.refreshExp,
	}

	// When
	token, _, err := emptySecretJWT.GenerateToken(suite.testUser, suite.testSessionID)

	// Then - Should still generate token (JWT allows empty secret, though not recommended)
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), token)
}

func (suite *JWTServiceTestSuite) TestVeryLongExpiration() {
	// Given
	longExpJWT := &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   365 * 24 * time.Hour, // 1 year
		refreshExpiration: 365 * 24 * time.Hour,
	}

	// When
	token, expiresAt, err := longExpJWT.GenerateToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), token)
	assert.True(suite.T(), expiresAt.After(time.Now().Add(300*24*time.Hour))) // At least 300 days from now

	// Token should be valid
	claims, err := longExpJWT.ValidateToken(token)
	assert.NoError(suite.T(), err)
	assert.NotNil(suite.T(), claims)
}

func (suite *JWTServiceTestSuite) TestZeroExpiration() {
	// Given
	zeroExpJWT := &JWTService{
		secretKey:         suite.secretKey,
		issuer:            suite.issuer,
		tokenExpiration:   0,
		refreshExpiration: 0,
	}

	// When
	token, expiresAt, err := zeroExpJWT.GenerateToken(suite.testUser, suite.testSessionID)

	// Then
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), token)
	
	// With zero expiration, token should expire immediately or very soon
	assert.True(suite.T(), expiresAt.Before(time.Now().Add(time.Second)))
}

// Test Concurrent Token Generation
func (suite *JWTServiceTestSuite) TestConcurrentTokenGeneration() {
	// Given
	numGoroutines := 100
	tokens := make(chan string, numGoroutines)
	errors := make(chan error, numGoroutines)

	// When - Generate tokens concurrently
	for i := 0; i < numGoroutines; i++ {
		go func() {
			user := &domain.User{
				ID:     domain.NewUserID(),
				Email:  "concurrent@example.com",
				RoleID: domain.NewRoleID(),
			}
			session := domain.NewUserSessionID()
			
			token, _, err := suite.jwtService.GenerateToken(user, session)
			if err != nil {
				errors <- err
			} else {
				tokens <- token
			}
		}()
	}

	// Then - Collect results
	var generatedTokens []string
	var generationErrors []error

	for i := 0; i < numGoroutines; i++ {
		select {
		case token := <-tokens:
			generatedTokens = append(generatedTokens, token)
		case err := <-errors:
			generationErrors = append(generationErrors, err)
		case <-time.After(5 * time.Second):
			suite.T().Fatal("Timeout waiting for concurrent token generation")
		}
	}

	// Verify no errors occurred
	assert.Empty(suite.T(), generationErrors)
	assert.Len(suite.T(), generatedTokens, numGoroutines)

	// Verify all tokens are unique
	tokenSet := make(map[string]bool)
	for _, token := range generatedTokens {
		assert.False(suite.T(), tokenSet[token], "Duplicate token found: %s", token)
		tokenSet[token] = true
		
		// Verify each token is valid
		claims, err := suite.jwtService.ValidateToken(token)
		assert.NoError(suite.T(), err)
		assert.NotNil(suite.T(), claims)
	}
}