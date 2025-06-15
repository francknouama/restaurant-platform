package interfaces

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/restaurant-platform/user-service/internal/domain"
)

// AuthMiddleware validates JWT tokens and sets user context
func AuthMiddleware(authService domain.AuthenticationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			handleUnauthorized(c, "Authorization header required")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			handleUnauthorized(c, "Bearer token required")
			c.Abort()
			return
		}
		
		// Trim any leading/trailing whitespace from token
		tokenString = strings.TrimSpace(tokenString)
		if tokenString == "" {
			handleUnauthorized(c, "Bearer token required")
			c.Abort()
			return
		}

		// Validate token
		userWithRole, err := authService.ValidateToken(c.Request.Context(), tokenString)
		if err != nil {
			handleError(c, err)
			c.Abort()
			return
		}

		// Check if user is active
		if !userWithRole.User.IsActive {
			handleForbidden(c, "account is disabled")
			c.Abort()
			return
		}

		// Extract session ID from token claims
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err == nil && token != nil {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if sessionID, exists := claims["sessionId"]; exists {
					c.Set("sessionID", sessionID)
				}
			}
		}

		// Set user information in context
		c.Set("userID", userWithRole.User.ID.String())
		c.Set("email", userWithRole.User.Email)
		c.Set("roleID", userWithRole.User.RoleID.String())
		c.Set("roleName", userWithRole.Role.Name)
		c.Set("permissions", userWithRole.Permissions)
		c.Set("user", userWithRole)

		c.Next()
	}
}

// RequirePermission middleware checks if user has specific permission
func RequirePermission(resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user permissions from context
		permissionsInterface, exists := c.Get("permissions")
		if !exists {
			handleForbidden(c, "No permissions found")
			c.Abort()
			return
		}

		permissions, ok := permissionsInterface.([]domain.Permission)
		if !ok {
			handleForbidden(c, "Invalid permissions format")
			c.Abort()
			return
		}

		// Check if user has required permission
		hasPermission := false
		for _, perm := range permissions {
			if perm.Resource == resource && (perm.Action == action || perm.Action == "manage") {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			handleForbidden(c, "Insufficient permissions")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole middleware checks if user has specific role
func RequireRole(roleName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleName, exists := c.Get("roleName")
		if !exists {
			handleForbidden(c, "Role information not found")
			c.Abort()
			return
		}

		if userRoleName != roleName {
			handleForbidden(c, "Insufficient role permissions")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyRole middleware checks if user has any of the specified roles
func RequireAnyRole(roleNames ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRoleName, exists := c.Get("roleName")
		if !exists {
			handleForbidden(c, "Role information not found")
			c.Abort()
			return
		}

		hasRole := false
		for _, roleName := range roleNames {
			if userRoleName == roleName {
				hasRole = true
				break
			}
		}

		if !hasRole {
			handleForbidden(c, "Insufficient role permissions")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAdmin middleware checks if user is admin
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(domain.RoleAdmin)
}

// RequireManager middleware checks if user is admin or manager
func RequireManager() gin.HandlerFunc {
	return RequireAnyRole(domain.RoleAdmin, domain.RoleManager)
}

// OptionalAuth middleware sets user context if token is present but doesn't require it
func OptionalAuth(authService domain.AuthenticationService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		// Try to validate token
		userWithRole, err := authService.ValidateToken(c.Request.Context(), tokenString)
		if err != nil {
			// Token is invalid, but we don't fail the request
			c.Next()
			return
		}

		// Set user information in context
		c.Set("userID", userWithRole.User.ID.String())
		c.Set("email", userWithRole.User.Email)
		c.Set("roleID", userWithRole.User.RoleID.String())
		c.Set("roleName", userWithRole.Role.Name)
		c.Set("permissions", userWithRole.Permissions)
		c.Set("user", userWithRole)

		c.Next()
	}
}

// CORS middleware for authentication service
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RequestLogging middleware for authentication requests
func RequestLogging() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Custom log format for authentication service
		return fmt.Sprintf("[AUTH] %s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// SecurityHeaders middleware adds security headers
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}