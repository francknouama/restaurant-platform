# Multi-stage build for Go backend
FROM golang:1.24.4-alpine AS builder

# Install necessary tools
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy workspace files
COPY go.work go.work.sum ./

# Copy all services and shared module
COPY shared/ ./shared/
COPY menu-service/ ./menu-service/
COPY order-service/ ./order-service/
COPY kitchen-service/ ./kitchen-service/
COPY reservation-service/ ./reservation-service/
COPY inventory-service/ ./inventory-service/

# Download dependencies for all modules
RUN go work sync

# Build all services
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/menu-service ./menu-service/cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/order-service ./order-service/cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/kitchen-service ./kitchen-service/cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/reservation-service ./reservation-service/cmd/server
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/inventory-service ./inventory-service/cmd/server

# Final stage - create a minimal image
FROM alpine:latest

# Install ca-certificates and wget for health checks
RUN apk --no-cache add ca-certificates wget

# Set working directory
WORKDIR /root/

# Copy all built binaries
COPY --from=builder /app/bin/ ./bin/

# Copy migrations
COPY migrations/ ./migrations/

# Expose ports (will use different ports for different services)
EXPOSE 8080

# Health check (default for menu service)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Default command runs menu service (can be overridden)
CMD ["./bin/menu-service"]