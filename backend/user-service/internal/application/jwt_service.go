package application

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/restaurant-platform/user-service/internal/domain"
)

type JWTService struct {
	secretKey        string
	issuer           string
	tokenExpiration  time.Duration
	refreshExpiration time.Duration
}

func NewJWTService(secretKey, issuer string, tokenExp, refreshExp time.Duration) domain.JWTService {
	return &JWTService{
		secretKey:         secretKey,
		issuer:            issuer,
		tokenExpiration:   tokenExp,
		refreshExpiration: refreshExp,
	}
}

type Claims struct {
	UserID    string `json:"userId"`
	SessionID string `json:"sessionId"`
	RoleID    string `json:"roleId"`
	Email     string `json:"email"`
	TokenType string `json:"tokenType"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func (j *JWTService) GenerateToken(user *domain.User, sessionID domain.UserSessionID) (string, time.Time, error) {
	expiresAt := time.Now().Add(j.tokenExpiration)
	
	claims := Claims{
		UserID:    user.ID.String(),
		SessionID: sessionID.String(),
		RoleID:    user.RoleID.String(),
		Email:     user.Email,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.issuer,
			Subject:   user.ID.String(),
			Audience:  []string{"restaurant-platform"},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        sessionID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secretKey))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expiresAt, nil
}

func (j *JWTService) GenerateRefreshToken(user *domain.User, sessionID domain.UserSessionID) (string, time.Time, error) {
	expiresAt := time.Now().Add(j.refreshExpiration)
	
	claims := Claims{
		UserID:    user.ID.String(),
		SessionID: sessionID.String(),
		RoleID:    user.RoleID.String(),
		Email:     user.Email,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    j.issuer,
			Subject:   user.ID.String(),
			Audience:  []string{"restaurant-platform"},
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        sessionID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(j.secretKey))
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return tokenString, expiresAt, nil
}

func (j *JWTService) ValidateToken(tokenString string) (*domain.TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Parse IDs
	userID, err := parseUserID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID in token: %w", err)
	}

	sessionID, err := parseUserSessionID(claims.SessionID)
	if err != nil {
		return nil, fmt.Errorf("invalid session ID in token: %w", err)
	}

	roleID, err := parseRoleID(claims.RoleID)
	if err != nil {
		return nil, fmt.Errorf("invalid role ID in token: %w", err)
	}

	return &domain.TokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		RoleID:    roleID,
		Email:     claims.Email,
		ExpiresAt: claims.ExpiresAt.Time,
	}, nil
}

func (j *JWTService) ExtractClaims(tokenString string) (*domain.TokenClaims, error) {
	// Parse without validation to extract claims
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Parse IDs
	userID, err := parseUserID(claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID in token: %w", err)
	}

	sessionID, err := parseUserSessionID(claims.SessionID)
	if err != nil {
		return nil, fmt.Errorf("invalid session ID in token: %w", err)
	}

	roleID, err := parseRoleID(claims.RoleID)
	if err != nil {
		return nil, fmt.Errorf("invalid role ID in token: %w", err)
	}

	return &domain.TokenClaims{
		UserID:    userID,
		SessionID: sessionID,
		RoleID:    roleID,
		Email:     claims.Email,
		ExpiresAt: claims.ExpiresAt.Time,
	}, nil
}

func (j *JWTService) IsTokenExpired(tokenString string) bool {
	claims, err := j.ExtractClaims(tokenString)
	if err != nil {
		return true
	}

	return claims.ExpiresAt.Before(time.Now())
}

// Helper functions for parsing IDs from strings
func parseUserID(s string) (domain.UserID, error) {
	return domain.UserID(s), nil
}

func parseUserSessionID(s string) (domain.UserSessionID, error) {
	return domain.UserSessionID(s), nil
}

func parseRoleID(s string) (domain.RoleID, error) {
	return domain.RoleID(s), nil
}