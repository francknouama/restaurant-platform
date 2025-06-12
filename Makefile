# Restaurant Platform Makefile

.PHONY: help build up down dev logs test clean migrate sqlc

# Default target
help: ## Show this help message
	@echo "Restaurant Platform - Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Production commands
build: ## Build all services
	docker-compose build

up: ## Start production services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

# Development commands
dev: ## Start development environment with hot reload
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

dev-down: ## Stop development environment
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs: ## View development logs
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Database commands
migrate: ## Run database migrations
	docker-compose run --rm migrate

migrate-dev: ## Run migrations for development database
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml run --rm migrate \
		-database=postgres://postgres:postgres123@postgres:5432/restaurant_platform_dev?sslmode=disable

db-shell: ## Connect to database shell
	docker-compose exec postgres psql -U postgres -d restaurant_platform

db-shell-dev: ## Connect to development database shell
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres -d restaurant_platform_dev

# Backend commands
backend-shell: ## Get shell access to backend container
	docker-compose exec backend sh

backend-build: ## Build backend only
	docker-compose build backend

backend-logs: ## View backend logs only
	docker-compose logs -f backend

# SQLC commands
sqlc: ## Generate SQLC code
	cd backend && sqlc generate

sqlc-verify: ## Verify SQLC configuration
	cd backend && sqlc verify

# Testing commands
test: ## Run all tests
	cd backend && go test ./...

test-verbose: ## Run tests with verbose output
	cd backend && go test -v ./...

test-coverage: ## Run tests with coverage
	cd backend && go test -coverprofile=coverage.out ./... && go tool cover -html=coverage.out

# Linting and formatting
lint: ## Run linters
	cd backend && go vet ./...
	cd backend && go fmt ./...

# Cleanup commands
clean: ## Clean up containers and volumes
	docker-compose down -v
	docker system prune -f

clean-all: ## Clean up everything including images
	docker-compose down -v --rmi all
	docker system prune -a -f

# Reset commands
reset: ## Reset development environment
	$(MAKE) dev-down
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
	$(MAKE) dev

reset-db: ## Reset database only
	docker-compose stop postgres
	docker-compose rm -f postgres
	docker volume rm restaurant-platform_postgres_data restaurant-platform_postgres_dev_data 2>/dev/null || true
	docker-compose up -d postgres

# Monitoring
ps: ## Show running containers
	docker-compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose exec backend wget -q --spider http://localhost:8080/health && echo "✅ Backend: healthy" || echo "❌ Backend: unhealthy"
	@docker-compose exec postgres pg_isready -U postgres -d restaurant_platform && echo "✅ PostgreSQL: healthy" || echo "❌ PostgreSQL: unhealthy"  
	@docker-compose exec redis redis-cli ping | grep -q PONG && echo "✅ Redis: healthy" || echo "❌ Redis: unhealthy"

# Documentation
docs: ## Generate and serve documentation
	@echo "Opening API documentation..."
	@echo "Backend API will be available at: http://localhost:8080/docs"
	@echo "Database schema documentation in: ./backend/migrations/"

# Production deployment helpers
deploy-prepare: ## Prepare for production deployment
	@echo "Preparing for production deployment..."
	$(MAKE) test
	$(MAKE) build
	@echo "✅ Ready for deployment"

# Local development setup
setup: ## Initial setup for local development
	@echo "Setting up development environment..."
	@echo "1. Building development containers..."
	$(MAKE) dev
	@echo "2. Running migrations..."
	sleep 10
	$(MAKE) migrate-dev
	@echo "✅ Development environment ready!"
	@echo ""
	@echo "Services available at:"
	@echo "  - Backend API: http://localhost:8080"
	@echo "  - Frontend: http://localhost:3000"
	@echo "  - PostgreSQL: localhost:5433"
	@echo "  - Redis: localhost:6380"