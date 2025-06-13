package interfaces

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/restaurant-platform/user-service/internal/domain"
)

func SetupRouter(authService domain.AuthenticationService) *gin.Engine {
	router := gin.Default()

	// CORS middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Security headers
	router.Use(SecurityHeaders())

	// Request logging
	router.Use(RequestLogging())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "user-service"})
	})

	// Initialize handlers
	authHandler := NewAuthHandler(authService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/validate", authHandler.ValidateToken)
			
			// Protected auth routes
			authProtected := auth.Group("")
			authProtected.Use(AuthMiddleware(authService))
			{
				authProtected.GET("/profile", authHandler.GetProfile)
				authProtected.POST("/logout", authHandler.Logout)
				authProtected.POST("/change-password", authHandler.ChangePassword)
				authProtected.GET("/sessions", authHandler.GetUserSessions)
				authProtected.POST("/sessions/invalidate-all", authHandler.InvalidateAllSessions)
			}
		}

		// User management routes (admin/manager only)
		users := v1.Group("/users")
		users.Use(AuthMiddleware(authService))
		{
			// Admin or Manager access
			users.GET("", RequireManager(), authHandler.GetUsers)
			users.GET("/:id", RequireManager(), authHandler.GetUser)
			
			// Admin only
			users.PUT("/:id", RequireAdmin(), authHandler.UpdateUser)
			users.POST("/:id/activate", RequireAdmin(), authHandler.ActivateUser)
			users.POST("/:id/deactivate", RequireAdmin(), authHandler.DeactivateUser)
			users.POST("/:id/assign-role", RequireAdmin(), authHandler.AssignRole)
		}

		// Role and permission routes (admin/manager access)
		roles := v1.Group("/roles")
		roles.Use(AuthMiddleware(authService))
		roles.Use(RequireManager())
		{
			roles.GET("", authHandler.GetRoles)
		}

		permissions := v1.Group("/permissions")
		permissions.Use(AuthMiddleware(authService))
		permissions.Use(RequireManager())
		{
			permissions.GET("", authHandler.GetPermissions)
		}

		// System routes for other services to validate tokens
		system := v1.Group("/system")
		{
			// Token validation endpoint for other services (no auth required)
			system.POST("/validate-token", authHandler.ValidateToken)
		}
	}

	return router
}

// SetupAuthMiddlewareForExternalServices creates a middleware function that can be used by other services
func SetupAuthMiddlewareForExternalServices(authService domain.AuthenticationService) gin.HandlerFunc {
	return AuthMiddleware(authService)
}

// SetupPermissionMiddleware creates permission middleware for external services
func SetupPermissionMiddleware(resource, action string) gin.HandlerFunc {
	return RequirePermission(resource, action)
}

// SetupRoleMiddleware creates role middleware for external services
func SetupRoleMiddleware(roleName string) gin.HandlerFunc {
	return RequireRole(roleName)
}

// Common middleware combinations for external services
func RequireMenuAccess() gin.HandlerFunc {
	return RequirePermission("menu", "view")
}

func RequireMenuManagement() gin.HandlerFunc {
	return RequirePermission("menu", "manage")
}

func RequireOrderAccess() gin.HandlerFunc {
	return RequirePermission("order", "view")
}

func RequireOrderManagement() gin.HandlerFunc {
	return RequirePermission("order", "manage")
}

func RequireKitchenAccess() gin.HandlerFunc {
	return RequirePermission("kitchen", "view")
}

func RequireKitchenManagement() gin.HandlerFunc {
	return RequirePermission("kitchen", "manage")
}

func RequireReservationAccess() gin.HandlerFunc {
	return RequirePermission("reservation", "view")
}

func RequireReservationManagement() gin.HandlerFunc {
	return RequirePermission("reservation", "manage")
}

func RequireInventoryAccess() gin.HandlerFunc {
	return RequirePermission("inventory", "view")
}

func RequireInventoryManagement() gin.HandlerFunc {
	return RequirePermission("inventory", "manage")
}

// Restaurant staff role shortcuts
func RequireKitchenStaff() gin.HandlerFunc {
	return RequireAnyRole(domain.RoleAdmin, domain.RoleManager, domain.RoleKitchen)
}

func RequireWaitstaff() gin.HandlerFunc {
	return RequireAnyRole(domain.RoleAdmin, domain.RoleManager, domain.RoleWaitstaff)
}

func RequireHost() gin.HandlerFunc {
	return RequireAnyRole(domain.RoleAdmin, domain.RoleManager, domain.RoleHost)
}

func RequireCashier() gin.HandlerFunc {
	return RequireAnyRole(domain.RoleAdmin, domain.RoleManager, domain.RoleCashier)
}