# Phase 2: Event-Driven Architecture with Redis Streams

This document describes the implementation of Phase 2, which adds event-driven communication between microservices using Redis Streams.

## ✅ What's Implemented

### 🏗️ Go Workspace Structure
```
backend/
├── go.work                          # Go workspace configuration
├── menu-service/                    # Independent menu microservice
├── reservation-service/             # Independent reservation microservice
└── shared/                          # Shared libraries and events
    └── events/                      # Event infrastructure
```

### 📡 Event Infrastructure

#### Redis Streams Implementation
- **Event Publisher**: Publishes domain events to Redis Streams
- **Event Consumer**: Consumes events with consumer groups for reliability
- **Event Types**: Strongly-typed event definitions for all domains

#### Domain Events
```go
// Menu Events
MenuCreatedEvent
MenuActivatedEvent  
MenuDeactivatedEvent
ItemAvailabilityChangedEvent

// Reservation Events
ReservationCreatedEvent
ReservationConfirmedEvent
ReservationCancelledEvent
ReservationCompletedEvent
```

### 🔄 Event Flow Example

1. **Menu Service** publishes `MenuActivatedEvent` when a menu is activated
2. **Reservation Service** consumes the event via Redis Streams
3. **Event Handler** processes the event (e.g., validate upcoming reservations)

### 🚀 Quick Start

1. **Start the microservices**:
   ```bash
   docker-compose -f docker-compose.microservices.yml up -d
   ```

2. **Run the event communication test**:
   ```bash
   ./test-events.sh
   ```

3. **Monitor events in Redis**:
   ```bash
   docker exec -it <redis-container> redis-cli
   XREAD STREAMS menu-events reservation-events 0-0 0-0
   ```

### 📊 Service Endpoints

#### Menu Service (Port 8081)
- `POST /api/v1/menus` - Create menu (publishes `MenuCreatedEvent`)
- `POST /api/v1/menus/:id/activate` - Activate menu (publishes `MenuActivatedEvent`)
- `PATCH /api/v1/menus/:menuId/items/:itemId/availability` - Change item availability

#### Reservation Service (Port 8082)
- `POST /api/v1/reservations` - Create reservation (publishes `ReservationCreatedEvent`)
- `PATCH /api/v1/reservations/:id/confirm` - Confirm reservation (publishes `ReservationConfirmedEvent`)
- Consumes `MenuActivatedEvent` and `ItemAvailabilityChangedEvent`

#### API Gateway (Port 8080)
- Routes requests to appropriate services
- Single entry point for client applications

### 🔧 Configuration

Services use environment variables for configuration:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=restaurant_platform

# Redis Streams
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Server
SERVER_PORT=8080
```

### 📦 Event Structure

```go
type DomainEvent struct {
    ID          string                 `json:"id"`
    Type        EventType              `json:"type"`
    AggregateID string                 `json:"aggregate_id"`
    Version     int                    `json:"version"`
    Data        map[string]interface{} `json:"data"`
    Metadata    map[string]interface{} `json:"metadata"`
    OccurredAt  time.Time              `json:"occurred_at"`
}
```

### 🎯 Benefits Achieved

1. **Loose Coupling**: Services communicate via events, not direct API calls
2. **Resilience**: Redis Streams provide durability and replay capabilities
3. **Scalability**: Consumer groups allow horizontal scaling
4. **Observability**: All events are logged and trackable
5. **Eventual Consistency**: Services maintain their own data while staying synchronized

### 🔍 Monitoring Events

You can monitor the event streams:

```bash
# View all events in menu stream
XRANGE menu-events - +

# View all events in reservation stream  
XRANGE reservation-events - +

# Monitor live events
XREAD BLOCK 0 STREAMS menu-events reservation-events $ $
```

### 🚀 Next Steps (Phase 3-5)

- **Phase 3**: Extract Inventory Service with event integration
- **Phase 4**: Extract Kitchen Service with Order coordination  
- **Phase 5**: Extract Order Service as the final, most complex migration

The event infrastructure is now ready to support these additional services with minimal changes!