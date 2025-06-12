# Build stage
FROM golang:1.24.4-alpine AS builder

WORKDIR /app

# Copy shared module
COPY shared/ ./shared/

# Copy order service files
COPY order-service/ ./order-service/

# Download dependencies (disable workspace for Docker build)
RUN cd order-service && GOWORK=off go mod download

# Build the application
RUN cd order-service && GOWORK=off CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates wget

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/order-service/main .

# Copy migrations if they exist
COPY --from=builder /app/order-service/migrations ./migrations 2>/dev/null || true

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]