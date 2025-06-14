package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"restaurant-platform/shared/pkg/config"

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
	// Load configuration using Viper
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Validate configuration
	if err := cfg.Validate(); err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}

	// Set Gin mode based on config
	gin.SetMode(cfg.Server.Mode)

	// Create Gin router
	router := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"config_path": config.GetConfigPath(),
			"services": []string{"menu", "order", "kitchen", "reservation", "inventory"},
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Configuration info endpoint
	router.GET("/config", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"config_path": config.GetConfigPath(),
			"server_mode": cfg.Server.Mode,
			"database_host": cfg.Database.Host,
			"redis_host": cfg.Redis.Host,
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
			"config": "/config",
		})
	})

	// Create HTTP server using config
	srv := &http.Server{
		Addr:    cfg.Server.GetServerAddr(),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Restaurant Platform Server starting on %s (mode: %s)", cfg.Server.GetServerAddr(), cfg.Server.Mode)
		log.Printf("📋 API Documentation: http://%s/api", cfg.Server.GetServerAddr())
		log.Printf("💚 Health Check: http://%s/health", cfg.Server.GetServerAddr())
		log.Printf("⚙️  Config Info: http://%s/config", cfg.Server.GetServerAddr())
		log.Printf("📁 Config File: %s", config.GetConfigPath())
		
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