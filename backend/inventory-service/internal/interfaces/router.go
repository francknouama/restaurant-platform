package interfaces

import (
	"github.com/restaurant-platform/inventory-service/internal/application"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(inventoryService *application.InventoryService) *gin.Engine {
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
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "inventory-service"})
	})

	// Initialize handlers
	inventoryHandler := NewInventoryHandler(inventoryService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Inventory item routes
		inventory := v1.Group("/inventory")
		{
			inventory.POST("/items", inventoryHandler.CreateItem)
			inventory.GET("/items", inventoryHandler.ListItems)
			inventory.GET("/items/:id", inventoryHandler.GetItem)
			inventory.POST("/items/:id/add-stock", inventoryHandler.AddStock)
			inventory.POST("/items/:id/use-stock", inventoryHandler.UseStock)
		}

		// Stock management routes
		stock := v1.Group("/stock")
		{
			stock.GET("/availability", inventoryHandler.CheckAvailability)
			stock.GET("/level/:sku", inventoryHandler.GetStockLevel)
			stock.GET("/low", inventoryHandler.GetLowStockItems)
			stock.GET("/out", inventoryHandler.GetOutOfStockItems)
			stock.POST("/reserve", inventoryHandler.ReserveStock)
		}

		// SKU-based routes
		sku := v1.Group("/sku")
		{
			sku.GET("/:sku", inventoryHandler.GetItemBySKU)
		}
	}

	return router
}