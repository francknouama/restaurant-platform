# Restaurant Management Platform

A modern restaurant management platform built with Clean Architecture principles, featuring Go 1.24.4 backend with PostgreSQL and Redis.

## Features

- **Menu Management**: Versioned menus with categories and availability tracking
- **Order Processing**: Multi-type orders (dine-in, takeout, delivery) with automated workflow
- **Kitchen Operations**: Order preparation with priority system and station assignment
- **Reservation System**: Table booking with party size management
- **Inventory Tracking**: Basic inventory management structure

## Architecture

Built using **Clean Architecture/Hexagonal Architecture** with clear separation of concerns:

- **Domain Layer**: Business entities and logic
- **Application Layer**: Services and use cases
- **Infrastructure Layer**: Database, cache, and external integrations
- **Interface Layer**: HTTP handlers and routing

## Tech Stack

### Backend
- **Go 1.24.4** with enhanced generics and modern error handling
- **PostgreSQL** with JSONB for flexible data storage
- **Redis** for caching and session management
- **Gin** web framework with middleware support

### Frontend
- **TailwindCSS** for styling (implementation minimal)

## Quick Start

### Prerequisites
- Go 1.24.4+
- PostgreSQL 12+
- Redis 6+

### Environment Setup
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

### Installation & Running

1. **Clone and setup**:
```bash
git clone <repository-url>
cd restaurant-platform/backend
go mod download
```

2. **Database setup**:
```bash
# Create database
createdb restaurant_platform

# Run migrations
for file in migrations/*.sql; do
    psql -U postgres -d restaurant_platform -f "$file"
done
```

3. **Start the server**:
```bash
go run cmd/server/main.go
```

4. **Build for production**:
```bash
go build -o bin/server cmd/server/main.go
```

## API Endpoints

Base URL: `http://localhost:8080/api/v1/`

### Menu Management
- `GET /menus` - List all menus
- `POST /menus` - Create new menu
- `GET /menus/{id}` - Get menu details
- `PUT /menus/{id}` - Update menu
- `POST /menus/{id}/activate` - Activate menu

### Order Processing
- `GET /orders` - List orders
- `POST /orders` - Create new order
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status

## Domain Models

### Order Flow
```
CREATED → PAID → PREPARING → READY → COMPLETED
```

### Order Types
- `DINE_IN` - Restaurant dining
- `TAKEOUT` - Customer pickup
- `DELIVERY` - Third-party delivery

### Menu Structure
- Only one menu can be active at a time
- Categories contain multiple items
- Items have availability tracking
- Automatic tax calculation (10%)

## Development

### Project Structure
```
backend/
├── cmd/server/          # Application entry point
├── internal/
│   ├── application/     # Services, handlers, DTOs
│   ├── domain/         # Business entities and logic
│   ├── infrastructure/ # Database, cache implementations
│   └── interfaces/     # HTTP router and handlers
├── migrations/         # PostgreSQL schema files
└── shared/pkg/        # Shared utilities
```

### Key Features
- **Type-Safe IDs**: Generic entity IDs prevent mixing between domains
- **Advanced Error Handling**: Structured error responses with proper classification
- **Event System**: Type-safe event handling with generics
- **Repository Pattern**: Clean data access abstraction
- **Graceful Shutdown**: Proper cleanup with 30-second timeout

## Contributing

1. Follow Clean Architecture principles
2. Use existing patterns for new features
3. Add proper error handling and validation
4. Include database migrations for schema changes
5. Test endpoints with proper status codes

## License

[Add your license here]