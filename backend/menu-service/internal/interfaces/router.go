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
	}

	return router
}