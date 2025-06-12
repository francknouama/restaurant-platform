# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a restaurant management platform built with **Clean Architecture/Hexagonal Architecture** principles. The backend uses Go 1.24.4 with PostgreSQL and Redis, leveraging modern Go features including enhanced generics, improved error handling, and advanced type safety. The frontend uses TailwindCSS for styling.

### Backend Structure (`/backend/`)
- `cmd/server/` - Application entry point with dependency injection
- `internal/application/` - Services, handlers, DTOs
- `internal/domain/` - Business entities and logic (Menu, Order, Kitchen, Reservation, Inventory)
- `internal/infrastructure/` - Database, cache, messaging implementations
- `internal/interfaces/` - HTTP router and handlers with modern error handling
- `migrations/` - PostgreSQL schema files
- `shared/pkg/` - Shared utilities (types, errors) using Go 1.24.4 generics

## Essential Commands

### Backend Development
```bash
cd backend/

# Install dependencies
go mod download

# Run database migrations (manual process)
for file in migrations/*.sql; do
    psql -U postgres -d restaurant_platform -f "$file"
done

# Run the server
go run cmd/server/main.go

# Build for production
go build -o bin/server cmd/server/main.go
```

### Environment Setup
Required environment variables:
```bash
# Database
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_NAME=restaurant_platform

# Redis
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Server
export SERVER_PORT=8080
```

## Domain Model

The system implements five main business domains:

**Menu Domain**: Menu versioning, categories, items with availability tracking. Only one menu can be active at a time.

**Order Domain**: Multi-type orders (DINE_IN, TAKEOUT, DELIVERY) with status flow: CREATED → PAID → PREPARING → READY → COMPLETED. Includes automatic tax calculation (10%).

**Kitchen Domain**: Order preparation workflow with priority system and station assignment.

**Reservation Domain**: Table booking system with party size management and no-show tracking.

**Inventory Domain**: Basic inventory management structure (implementation incomplete).

## Modern Go 1.24.4 Features

**Type-Safe IDs**: Uses enhanced generics for type-safe entity IDs (`types.ID[T EntityMarker]`) preventing ID mixing between domains.

**Advanced Error Handling**: Implements structured error handling with `shared/pkg/errors` using modern error wrapping and context.

**Generic Event System**: Event data conversion using type-safe generics in `shared/events` package.

**Enhanced HTTP Handlers**: Modern error handling patterns with structured responses and proper error classification.

## Key Implementation Details

**Repository Pattern**: All data access goes through repository interfaces implemented in `infrastructure/database/`. Repositories use JSONB for complex nested data (menu categories, order items) with improved error handling.

**Configuration**: Environment-driven config in `pkg/config/` with sensible defaults for development.

**HTTP Layer**: Gin router with CORS, logging middleware. RESTful API at `/api/v1/` with comprehensive endpoints for menus and orders.

**Database**: PostgreSQL with JSONB for flexible data storage. Manual migration system - run SQL files in order.

**Error Handling**: Domain models contain business rule validation. HTTP handlers return structured error responses with appropriate status codes.

## Development Notes

**ID Generation**: Simple timestamp-based IDs (`menu_20060102150405` format) throughout the system.

**Status Transitions**: Order and reservation status changes have validation rules - invalid transitions are rejected.

**Dependency Injection**: Main server (`cmd/server/main.go`) wires up all dependencies manually in startup sequence.

**Graceful Shutdown**: Server handles SIGINT/SIGTERM with 30-second timeout for cleanup.

The frontend structure exists but implementation is minimal. Focus backend development on extending the existing clean architecture patterns.