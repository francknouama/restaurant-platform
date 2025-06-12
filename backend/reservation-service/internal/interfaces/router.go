package interfaces

import (
	"github.com/restaurant-platform/reservation-service/internal/application"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(reservationService *application.ReservationService) *gin.Engine {
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
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "reservation-service"})
	})

	// Initialize handlers
	reservationHandler := NewReservationHandler(reservationService)

	// API routes
	v1 := router.Group("/api/v1")
	{
		// Reservation routes
		reservations := v1.Group("/reservations")
		{
			reservations.POST("", reservationHandler.CreateReservation)
			reservations.GET("", reservationHandler.ListReservations)
			reservations.GET("/:id", reservationHandler.GetReservation)
			reservations.PATCH("/:id/confirm", reservationHandler.ConfirmReservation)
			reservations.PATCH("/:id/cancel", reservationHandler.CancelReservation)
		}

		// Customer-specific reservation routes
		customers := v1.Group("/customers")
		{
			customers.GET("/:customerId/reservations", reservationHandler.GetReservationsByCustomer)
		}

		// Table availability routes
		tables := v1.Group("/tables")
		{
			tables.GET("/available", reservationHandler.FindAvailableTables)
		}
	}

	return router
}