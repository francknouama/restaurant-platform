package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	// Import all service routers
	menuHandlers "restaurant-platform/menu-service/internal/interfaces"
	orderHandlers "restaurant-platform/order-service/internal/interfaces"
	kitchenHandlers "restaurant-platform/kitchen-service/internal/interfaces"
	reservationHandlers "restaurant-platform/reservation-service/internal/interfaces"
	inventoryHandlers "restaurant-platform/inventory-service/internal/interfaces"

	// Import repositories and services
	menuApp "restaurant-platform/menu-service/internal/application"
	orderApp "restaurant-platform/order-service/internal/application"
	kitchenApp "restaurant-platform/kitchen-service/internal/application"
	reservationApp "restaurant-platform/reservation-service/internal/application"
	inventoryApp "restaurant-platform/inventory-service/internal/application"

	menuInfra "restaurant-platform/menu-service/internal/infrastructure"
	orderInfra "restaurant-platform/order-service/internal/infrastructure"
	kitchenInfra "restaurant-platform/kitchen-service/internal/infrastructure"
	reservationInfra "restaurant-platform/reservation-service/internal/infrastructure"
	inventoryInfra "restaurant-platform/inventory-service/internal/infrastructure"
)

func main() {
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create Gin router
	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	router.Use(cors.New(config))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"services": []string{"menu", "order", "kitchen", "reservation", "inventory"},
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Initialize database connections for each service
	menuDB, err := menuInfra.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize menu database: %v", err)
	}

	orderDB, err := orderInfra.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize order database: %v", err)
	}

	kitchenDB, err := kitchenInfra.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize kitchen database: %v", err)
	}

	reservationDB, err := reservationInfra.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize reservation database: %v", err)
	}

	inventoryDB, err := inventoryInfra.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize inventory database: %v", err)
	}

	// Initialize repositories
	menuRepo := menuInfra.NewMenuRepository(menuDB)
	orderRepo := orderInfra.NewOrderRepository(orderDB)
	kitchenRepo := kitchenInfra.NewKitchenRepository(kitchenDB)
	reservationRepo := reservationInfra.NewReservationRepository(reservationDB)
	inventoryRepo := inventoryInfra.NewInventoryRepository(inventoryDB)

	// Initialize services
	menuService := menuApp.NewMenuService(menuRepo)
	orderService := orderApp.NewOrderService(orderRepo)
	kitchenService := kitchenApp.NewKitchenService(kitchenRepo)
	reservationService := reservationApp.NewReservationService(reservationRepo)
	inventoryService := inventoryApp.NewInventoryService(inventoryRepo)

	// Initialize handlers
	menuHandler := menuHandlers.NewMenuHandler(menuService)
	orderHandler := orderHandlers.NewOrderHandler(orderService)
	kitchenHandler := kitchenHandlers.NewKitchenHandler(kitchenService)
	reservationHandler := reservationHandlers.NewReservationHandler(reservationService)
	inventoryHandler := inventoryHandlers.NewInventoryHandler(inventoryService)

	// Setup API routes
	api := router.Group("/api/v1")
	{
		// Menu routes
		menuGroup := api.Group("/menus")
		menuHandler.SetupRoutes(menuGroup)

		// Menu categories routes
		categoriesGroup := api.Group("/menu-categories")
		menuHandler.SetupCategoryRoutes(categoriesGroup)

		// Menu items routes
		itemsGroup := api.Group("/menu-items")
		menuHandler.SetupItemRoutes(itemsGroup)

		// Order routes
		orderGroup := api.Group("/orders")
		orderHandler.SetupRoutes(orderGroup)

		// Kitchen routes
		kitchenGroup := api.Group("/kitchen")
		kitchenHandler.SetupRoutes(kitchenGroup)

		// Reservation routes
		reservationGroup := api.Group("/reservations")
		reservationHandler.SetupRoutes(reservationGroup)

		// Inventory routes
		inventoryGroup := api.Group("/inventory")
		inventoryHandler.SetupRoutes(inventoryGroup)
	}

	// API documentation endpoint
	router.GET("/api", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"name": "Restaurant Platform API",
			"version": "1.0.0",
			"services": gin.H{
				"menu": "/api/v1/menus",
				"orders": "/api/v1/orders",
				"kitchen": "/api/v1/kitchen",
				"reservations": "/api/v1/reservations",
				"inventory": "/api/v1/inventory",
			},
			"health": "/health",
		})
	})

	// Get port from environment or default to 8080
	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}

	// Create HTTP server
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Restaurant Platform Test Server starting on port %s", port)
		log.Printf("📋 API Documentation: http://localhost:%s/api", port)
		log.Printf("💚 Health Check: http://localhost:%s/health", port)
		
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server shutdown complete")
}