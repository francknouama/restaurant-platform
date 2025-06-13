package interfaces

import (
	"github.com/restaurant-platform/menu-service/internal/application"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(menuService *application.MenuService) *gin.Engine {
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

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "menu-service"})
	})

	// Initialize handlers
	menuHandler := NewMenuHandler(menuService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Menu routes
		menus := v1.Group("/menus")
		{
			menus.GET("", menuHandler.GetMenus)
			menus.POST("", menuHandler.CreateMenu)
			menus.GET("/active", menuHandler.GetActiveMenu)
			menus.GET("/:id", menuHandler.GetMenu)
			menus.POST("/:id/activate", menuHandler.ActivateMenu)
			menus.POST("/:id/deactivate", menuHandler.DeactivateMenu)
			menus.POST("/:id/categories", menuHandler.AddCategory)
			menus.POST("/:id/items", menuHandler.AddMenuItem)
			menus.PATCH("/:menuId/items/:itemId/availability", menuHandler.UpdateItemAvailability)
		}

		// Item routes
		items := v1.Group("/items")
		{
			items.GET("/available", menuHandler.GetAvailableItems)
			items.GET("/:id", menuHandler.GetMenuItem)
		}

		// Development stub endpoints for missing services
		// Orders stub
		orders := v1.Group("/orders")
		{
			orders.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": gin.H{
						"items": []interface{}{},
						"total": 0,
						"page": 1,
						"limit": 20,
						"hasNext": false,
						"hasPrev": false,
					},
					"message": "Development stub - no orders data available",
				})
			})
		}

		// Kitchen stub
		kitchen := v1.Group("/kitchen")
		{
			kitchen.GET("/orders", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": []interface{}{},
					"message": "Development stub - no kitchen orders available",
				})
			})
			kitchen.GET("/metrics", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": gin.H{
						"totalOrders": 0,
						"completedOrders": 0,
						"pendingOrders": 0,
						"averagePrepTime": 0,
					},
					"message": "Development stub - no kitchen metrics available",
				})
			})
			kitchen.GET("/stations", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": []interface{}{},
					"message": "Development stub - no kitchen stations available",
				})
			})
		}

		// Reservations stub
		reservations := v1.Group("/reservations")
		{
			reservations.GET("", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": gin.H{
						"items": []interface{}{},
						"total": 0,
						"page": 1,
						"limit": 20,
						"hasNext": false,
						"hasPrev": false,
					},
					"message": "Development stub - no reservations data available",
				})
			})
			reservations.GET("/waitlist", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": []interface{}{},
					"message": "Development stub - no waitlist data available",
				})
			})
			reservations.GET("/metrics", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": gin.H{
						"totalReservations": 0,
						"todayReservations": 0,
						"confirmedReservations": 0,
						"walkIns": 0,
					},
					"message": "Development stub - no reservation metrics available",
				})
			})
			reservations.GET("/date/:date", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"success": true,
					"data": []interface{}{},
					"message": "Development stub - no reservations for date available",
				})
			})
		}
	}

	return router
}