# Restaurant Platform Microservices Makefile
# Provides development workflow commands for all microservices

.PHONY: all build build-services clean test lint fmt help install-tools \
		docker-build docker-clean db-migrate setup-services

# Default target
all: build-services

# Build all microservices
build-services:
	@echo "Building all microservices..."
	@cd menu-service && go build -o ../bin/menu-service cmd/server/main.go
	@cd reservation-service && go build -o ../bin/reservation-service cmd/server/main.go
	@cd inventory-service && go build -o ../bin/inventory-service cmd/server/main.go
	@cd kitchen-service && go build -o ../bin/kitchen-service cmd/server/main.go
	@cd order-service && go build -o ../bin/order-service cmd/server/main.go
	@echo "All services built successfully"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@cd menu-service && go clean
	@cd reservation-service && go clean
	@cd inventory-service && go clean
	@cd kitchen-service && go clean
	@cd order-service && go clean
	@cd shared && go clean
	@echo "Clean complete"

# Test all services
test:
	@echo "Testing all microservices..."
	@cd shared && go test ./...
	@cd menu-service && go test ./...
	@cd reservation-service && go test ./...
	@cd inventory-service && go test ./...
	@cd kitchen-service && go test ./...
	@cd order-service && go test ./...
	@echo "All tests complete"

# Lint all services
lint:
	@echo "Linting all microservices..."
	@if command -v golangci-lint > /dev/null; then \
		cd shared && golangci-lint run ./...; \
		cd menu-service && golangci-lint run ./...; \
		cd reservation-service && golangci-lint run ./...; \
		cd inventory-service && golangci-lint run ./...; \
		cd kitchen-service && golangci-lint run ./...; \
		cd order-service && golangci-lint run ./...; \
	else \
		echo "golangci-lint not found. Install with: make install-tools"; \
	fi
	@echo "Linting complete"

# Format all services
fmt:
	@echo "Formatting all microservices..."
	@gofmt -s -w shared/
	@gofmt -s -w menu-service/
	@gofmt -s -w reservation-service/
	@gofmt -s -w inventory-service/
	@gofmt -s -w kitchen-service/
	@gofmt -s -w order-service/
	@echo "Formatting complete"

# Download dependencies for all services
deps:
	@echo "Downloading dependencies for all services..."
	@cd shared && go mod download && go mod tidy
	@cd menu-service && go mod download && go mod tidy
	@cd reservation-service && go mod download && go mod tidy
	@cd inventory-service && go mod download && go mod tidy
	@cd kitchen-service && go mod download && go mod tidy
	@cd order-service && go mod download && go mod tidy
	@echo "Dependencies updated"

# Docker build all services
docker-build:
	@echo "Building Docker images for all services..."
	@docker build -f menu-service/Dockerfile -t restaurant-menu-service .
	@docker build -f reservation-service/Dockerfile -t restaurant-reservation-service .
	@docker build -f inventory-service/Dockerfile -t restaurant-inventory-service .
	@docker build -f kitchen-service/Dockerfile -t restaurant-kitchen-service .
	@docker build -f order-service/Dockerfile -t restaurant-order-service .
	@echo "All Docker images built"

# Clean Docker images
docker-clean:
	@echo "Cleaning Docker images..."
	@docker rmi restaurant-menu-service restaurant-reservation-service restaurant-inventory-service restaurant-kitchen-service restaurant-order-service 2>/dev/null || true
	@docker system prune -f
	@echo "Docker cleanup complete"

# Database migrations
db-migrate:
	@echo "Running database migrations..."
	@if [ -z "$(DB_PASSWORD)" ]; then \
		echo "DB_PASSWORD is required. Set it as environment variable or run: make db-migrate DB_PASSWORD=yourpassword"; \
		exit 1; \
	fi
	@for file in migrations/*.sql; do \
		echo "Applying migration: $$file"; \
		PGPASSWORD=$(DB_PASSWORD) psql -h $(DB_HOST:-localhost) -p $(DB_PORT:-5432) -U $(DB_USER:-postgres) -d $(DB_NAME:-restaurant_platform) -f "$$file"; \
	done
	@echo "Migrations complete"

# Install development tools
install-tools:
	@echo "Installing development tools..."
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@go install github.com/cosmtrek/air@latest
	@echo "Tools installed"

# Full quality check
check: deps fmt lint test
	@echo "Full quality check complete"

# Start all services with Docker Compose
start-microservices:
	@echo "Starting all microservices..."
	@docker-compose -f ../docker-compose.microservices.yml up -d
	@echo "All services started"

# Stop all services
stop-microservices:
	@echo "Stopping all microservices..."
	@docker-compose -f ../docker-compose.microservices.yml down
	@echo "All services stopped"

# Show logs for all services
logs:
	@echo "Showing logs for all services..."
	@docker-compose -f ../docker-compose.microservices.yml logs -f

# Setup development environment
setup: install-tools deps
	@echo "Microservices development environment setup complete"
	@echo ""
	@echo "Available commands:"
	@echo "  make build-services      - Build all microservices"
	@echo "  make test               - Test all microservices"
	@echo "  make start-microservices - Start all services with Docker"
	@echo "  make stop-microservices  - Stop all services"
	@echo "  make logs               - Show service logs"
	@echo "  make help               - Show detailed help"

# Performance testing targets
.PHONY: perf-setup perf-smoke perf-load perf-stress perf-spike perf-all perf-clean perf-dashboard

# Setup performance testing environment
perf-setup:
	@echo "Setting up performance testing environment..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml up -d postgres redis influxdb grafana
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Performance testing environment ready"
	@echo "Grafana available at: http://localhost:3001 (admin/admin123)"

# Run smoke tests (minimal load)
perf-smoke: perf-setup
	@echo "Running smoke tests..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml up -d backend
	@sleep 5
	@cd performance_tests && docker-compose -f docker-compose.perf.yml run --rm \
		-e TEST_SCRIPT=scripts/menu-service.js \
		k6 run --vus 1 --duration 30s \
		--out influxdb=http://influxdb:8086/k6 \
		/tests/scripts/menu-service.js

# Run load tests (normal load)
perf-load: perf-setup
	@echo "Running load tests..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml up -d backend
	@sleep 5
	@cd performance_tests && docker-compose -f docker-compose.perf.yml run --rm \
		-e TEST_SCRIPT=scripts/menu-service.js k6
	@cd performance_tests && docker-compose -f docker-compose.perf.yml run --rm \
		-e TEST_SCRIPT=scripts/order-service.js k6

# Run stress tests (high load)
perf-stress: perf-setup
	@echo "Running stress tests..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml up -d backend
	@sleep 5
	@cd performance_tests && docker-compose -f docker-compose.perf.yml run --rm \
		-e TEST_SCRIPT=scenarios/full-workflow.js k6

# Run spike tests (sudden load)
perf-spike: perf-setup
	@echo "Running spike tests..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml up -d backend
	@sleep 5
	@cd performance_tests && docker-compose -f docker-compose.perf.yml run --rm \
		-e TEST_SCRIPT=scenarios/spike-test.js k6

# Run all performance tests
perf-all: perf-smoke perf-load perf-stress perf-spike
	@echo "All performance tests completed"

# Open Grafana dashboard
perf-dashboard:
	@echo "Opening Grafana dashboard..."
	@open http://localhost:3001 || xdg-open http://localhost:3001 || echo "Open http://localhost:3001 in your browser"

# Clean up performance testing environment
perf-clean:
	@echo "Cleaning up performance testing environment..."
	@cd performance_tests && docker-compose -f docker-compose.perf.yml down -v
	@echo "Performance testing environment cleaned"

# Interactive performance test runner
perf-interactive:
	@cd performance_tests && ./run-tests.sh

# Show help
help:
	@echo "Restaurant Platform Microservices Makefile"
	@echo ""
	@echo "USAGE:"
	@echo "  make [target]"
	@echo ""
	@echo "TARGETS:"
	@echo "  Build:"
	@echo "    build-services    Build all microservices"
	@echo "    clean            Remove build artifacts"
	@echo ""
	@echo "  Development:"
	@echo "    start-microservices Start all services with Docker Compose"
	@echo "    stop-microservices  Stop all services"
	@echo "    logs             Show service logs"
	@echo "    setup            Setup development environment"
	@echo ""
	@echo "  Testing:"
	@echo "    test             Test all microservices"
	@echo "    check            Full quality check (fmt, lint, test)"
	@echo ""
	@echo "  Performance Testing:"
	@echo "    perf-setup       Setup performance testing environment"
	@echo "    perf-smoke       Run smoke tests (1 VU, 30s)"
	@echo "    perf-load        Run load tests (normal load)"
	@echo "    perf-stress      Run stress tests (high load)"
	@echo "    perf-spike       Run spike tests (sudden load)"
	@echo "    perf-all         Run all performance tests"
	@echo "    perf-dashboard   Open Grafana dashboard"
	@echo "    perf-clean       Clean up performance environment"
	@echo "    perf-interactive Run interactive test selector"
	@echo ""
	@echo "  Code Quality:"
	@echo "    fmt              Format code for all services"
	@echo "    lint             Lint all services"
	@echo ""
	@echo "  Dependencies:"
	@echo "    deps             Download dependencies for all services"
	@echo ""
	@echo "  Database:"
	@echo "    db-migrate       Run database migrations"
	@echo ""
	@echo "  Docker:"
	@echo "    docker-build     Build Docker images for all services"
	@echo "    docker-clean     Clean Docker images"
	@echo ""
	@echo "  Tools:"
	@echo "    install-tools    Install development tools"
	@echo ""
	@echo "MICROSERVICES:"
	@echo "  menu-service        (port 8081) - Menu management"
	@echo "  reservation-service (port 8082) - Reservation management"
	@echo "  inventory-service   (port 8083) - Inventory management"
	@echo "  kitchen-service     (port 8084) - Kitchen workflow"
	@echo "  order-service       (port 8085) - Order management"
	@echo "  api-gateway         (port 8080) - API Gateway"
	@echo ""
	@echo "EXAMPLES:"
	@echo "  make setup                              # Setup development environment"
	@echo "  make start-microservices                # Start all services"
	@echo "  make logs                               # View service logs"
	@echo "  make db-migrate DB_PASSWORD=mypass      # Run migrations"
	@echo "  make check                              # Full quality check"
	@echo ""
	@echo "  Performance Testing:"
	@echo "  make perf-smoke                         # Quick smoke test"
	@echo "  make perf-load                          # Normal load test"
	@echo "  make perf-all                           # Run all tests"
	@echo "  make perf-dashboard                     # View results in Grafana"