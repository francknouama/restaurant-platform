package interfaces

import (
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/restaurant-platform/order-service/internal/application"
	"github.com/restaurant-platform/order-service/internal/domain"
)

func SetupRouter(orderService domain.OrderService) *gin.Engine {
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
			Service:   "order-service",
			Timestamp: time.Now(),
		})
	})

	// Initialize handlers
	orderHandler := NewOrderHandler(orderService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Order routes
		orders := v1.Group("/orders")
		{
			orders.POST("", orderHandler.CreateOrder)
			orders.GET("", orderHandler.ListOrders)
			orders.GET("/active", orderHandler.GetActiveOrders)
			orders.GET("/status/:status", orderHandler.GetOrdersByStatus)
			orders.GET("/customer/:customerId", orderHandler.GetOrdersByCustomer)
			orders.GET("/table/:tableId", orderHandler.GetOrdersByTable)
			orders.GET("/:id", orderHandler.GetOrder)
			orders.PATCH("/:id/status", orderHandler.UpdateOrderStatus)
			orders.PATCH("/:id/table", orderHandler.SetTable)
			orders.PATCH("/:id/delivery-address", orderHandler.SetDeliveryAddress)
			orders.PATCH("/:id/notes", orderHandler.AddNotes)
			orders.PATCH("/:id/pay", orderHandler.PayOrder)
			orders.DELETE("/:id", orderHandler.CancelOrder)

			// Order item management
			orders.POST("/:id/items", orderHandler.AddItemToOrder)
			orders.PATCH("/:id/items/:itemId/quantity", orderHandler.UpdateItemQuantity)
			orders.DELETE("/:id/items/:itemId", orderHandler.RemoveItemFromOrder)
		}
	}

	return router
}