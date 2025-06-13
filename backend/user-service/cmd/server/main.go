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

	"github.com/restaurant-platform/shared/pkg/config"
	"github.com/restaurant-platform/user-service/internal/application"
	"github.com/restaurant-platform/user-service/internal/infrastructure"
	"github.com/restaurant-platform/user-service/internal/interfaces"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database connection
	db, err := infrastructure.NewConnection(&cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize services
	userRepo := infrastructure.NewPostgreSQLUserRepository(db)
	
	// Initialize JWT service with configuration
	jwtService := application.NewJWTService(
		cfg.JWT.SecretKey,
		"restaurant-platform",
		time.Duration(cfg.JWT.ExpirationMinutes)*time.Minute,
		time.Duration(cfg.JWT.RefreshExpirationHours)*time.Hour,
	)
	
	passwordService := application.NewPasswordService()
	
	authService := application.NewAuthenticationService(
		userRepo,
		jwtService,
		passwordService,
	)

	// Setup router
	router := interfaces.SetupRouter(authService)

	// Setup server
	server := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🔐 User service starting on port %s", cfg.Server.Port)
		log.Printf("🏥 Health check available at http://localhost:%s/health", cfg.Server.Port)
		log.Printf("📚 API endpoints available at http://localhost:%s/api/v1/auth/*", cfg.Server.Port)
		
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Setup cleanup session routine
	go func() {
		ticker := time.NewTicker(1 * time.Hour) // Clean up expired sessions every hour
		defer ticker.Stop()
		
		for range ticker.C {
			if err := authService.CleanupExpiredSessions(context.Background()); err != nil {
				log.Printf("Failed to cleanup expired sessions: %v", err)
			} else {
				log.Println("✅ Cleaned up expired sessions")
			}
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 User service shutting down...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ User service shut down successfully")
}