package main

import (
	"context"
	"fmt"
	"log"
	"github.com/restaurant-platform/menu-service/internal/application"
	"github.com/restaurant-platform/menu-service/internal/infrastructure"
	"github.com/restaurant-platform/menu-service/internal/interfaces"
	"github.com/restaurant-platform/shared/pkg/config"
	"github.com/restaurant-platform/shared/events"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Setup database
	db, err := infrastructure.NewConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Setup event publisher
	redisAddr := fmt.Sprintf("%s:%s", cfg.Redis.Host, cfg.Redis.Port)
	eventPublisher, err := events.NewRedisStreamPublisher(redisAddr, cfg.Redis.Password, cfg.Redis.DB, events.MenuStream)
	if err != nil {
		log.Fatalf("Failed to create event publisher: %v", err)
	}
	defer eventPublisher.Close()

	// Initialize repositories
	menuRepo := infrastructure.NewMenuRepository(db)

	// Initialize services
	menuService := application.NewMenuService(menuRepo, eventPublisher)

	// Setup event consumer for inventory events
	redisConsumer, err := events.NewRedisStreamConsumer(
		redisAddr, 
		cfg.Redis.Password, 
		cfg.Redis.DB, 
		events.InventoryStream, 
		"menu-service-group", 
		"menu-service-consumer-1",
	)
	if err != nil {
		log.Fatalf("Failed to create event consumer: %v", err)
	}

	// Setup event handlers
	eventHandler := application.NewEventHandler(menuService)
	
	// Subscribe to inventory events
	err = redisConsumer.Subscribe(context.Background(), []events.EventType{
		events.LowStockAlertEvent,
		events.OutOfStockAlertEvent,
		events.StockReceivedEvent,
	}, eventHandler.HandleInventoryEvent)
	if err != nil {
		log.Fatalf("Failed to subscribe to inventory events: %v", err)
	}

	// Start consuming events in the background
	go func() {
		if err := redisConsumer.Start(context.Background()); err != nil {
			log.Printf("Event consumer error: %v", err)
		}
	}()

	// Setup router
	router := interfaces.SetupRouter(menuService)

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Menu Service starting on port %s", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down Menu Service...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Stop event consumer
	redisConsumer.Stop()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Menu Service forced to shutdown: %v", err)
	}

	log.Println("Menu Service shutdown complete")
}