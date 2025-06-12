# Build stage
FROM golang:1.24.4-alpine AS builder

WORKDIR /app

# Copy shared module
COPY shared/ ./shared/

# Copy reservation service files
COPY reservation-service/ ./reservation-service/

# Download dependencies (disable workspace for Docker build)
RUN cd reservation-service && GOWORK=off go mod download

# Build the application
RUN cd reservation-service && GOWORK=off CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/reservation-service/main .

# Copy migrations
COPY --from=builder /app/reservation-service/migrations ./migrations

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]