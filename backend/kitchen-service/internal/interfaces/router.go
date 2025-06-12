package interfaces

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/restaurant-platform/kitchen-service/internal/application"
	"github.com/restaurant-platform/kitchen-service/internal/domain"
)

func SetupRouter(kitchenService domain.KitchenService) *gin.Engine {
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
		c.JSON(http.StatusOK, application.HealthResponse{
			Status:    "healthy",
			Service:   "kitchen-service",
			Timestamp: time.Now(),
		})
	})

	// Initialize handlers
	kitchenHandler := NewKitchenOrderHandler(kitchenService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Kitchen order routes
		kitchen := v1.Group("/kitchen")
		{
			// Kitchen order management
			orders := kitchen.Group("/orders")
			{
				orders.POST("", kitchenHandler.CreateKitchenOrder)
				orders.GET("", kitchenHandler.ListKitchenOrders)
				orders.GET("/active", kitchenHandler.GetActiveOrders)
				orders.GET("/status/:status", kitchenHandler.GetOrdersByStatus)
				orders.GET("/station/:stationID", kitchenHandler.GetOrdersByStation)
				orders.GET("/:id", kitchenHandler.GetKitchenOrder)
				orders.GET("/by-order/:orderID", kitchenHandler.GetKitchenOrderByOrderID)
				orders.PATCH("/:id/status", kitchenHandler.UpdateOrderStatus)
				orders.PATCH("/:id/assign", kitchenHandler.AssignToStation)
				orders.PATCH("/:id/priority", kitchenHandler.SetPriority)
				orders.PATCH("/:id/complete", kitchenHandler.CompleteKitchenOrder)
				orders.DELETE("/:id", kitchenHandler.CancelKitchenOrder)

				// Kitchen item management
				orders.POST("/:id/items", kitchenHandler.AddKitchenItem)
				orders.PATCH("/:id/items/:itemID/status", kitchenHandler.UpdateItemStatus)
			}
		}
	}

	return router
}