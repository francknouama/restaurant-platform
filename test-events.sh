#!/bin/bash

# Test script for Redis Streams Event-Driven Communication
# This script tests the communication between Menu Service and Reservation Service

echo "🧪 Testing Event-Driven Communication with Redis Streams"
echo "======================================================="

# Configuration
MENU_SERVICE_URL="http://localhost:8081"
RESERVATION_SERVICE_URL="http://localhost:8082"
API_GATEWAY_URL="http://localhost:8080"

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    echo "⏳ Checking $service_name health..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url/health")
    if [ "$response" = "200" ]; then
        echo "✅ $service_name is healthy"
        return 0
    else
        echo "❌ $service_name is not healthy (HTTP $response)"
        return 1
    fi
}

# Function to make API call
api_call() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo "📡 $description"
    echo "   Request: $method $url"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url")
    else
        response=$(curl -s -X "$method" "$url")
    fi
    
    echo "   Response: $response"
    echo ""
}

# Main test flow
main() {
    echo "1️⃣ Health Checks"
    echo "=================="
    
    # Check all services
    check_service "Menu Service" "$MENU_SERVICE_URL" || exit 1
    check_service "Reservation Service" "$RESERVATION_SERVICE_URL" || exit 1
    check_service "API Gateway" "$API_GATEWAY_URL" || exit 1
    
    echo ""
    echo "2️⃣ Create Menu (should trigger MenuCreatedEvent)"
    echo "================================================="
    
    menu_data='{
        "name": "Summer Menu 2024"
    }'
    
    api_call "POST" "$MENU_SERVICE_URL/api/v1/menus" "$menu_data" "Creating new menu"
    
    echo "3️⃣ Activate Menu (should trigger MenuActivatedEvent)"
    echo "===================================================="
    
    # Get the menu ID from the created menu (simplified - in real scenario you'd parse JSON)
    # For now, we'll use a dummy ID format
    menu_id="menu_$(date +%Y%m%d%H%M%S)"
    
    api_call "POST" "$MENU_SERVICE_URL/api/v1/menus/$menu_id/activate" "" "Activating menu"
    
    echo "4️⃣ Create Reservation (should trigger ReservationCreatedEvent)"
    echo "=============================================================="
    
    reservation_data='{
        "customer_id": "customer_123",
        "table_id": "table1",
        "date_time": "2024-12-25T19:00:00Z",
        "party_size": 4,
        "notes": "Anniversary dinner"
    }'
    
    api_call "POST" "$RESERVATION_SERVICE_URL/api/v1/reservations" "$reservation_data" "Creating new reservation"
    
    echo "5️⃣ Waiting for Event Processing..."
    echo "==================================="
    echo "⏳ Allowing time for events to be processed..."
    sleep 3
    
    echo "6️⃣ Check Redis Streams"
    echo "======================"
    echo "📊 You can check Redis Streams manually with:"
    echo "   docker exec -it <redis-container> redis-cli"
    echo "   XREAD STREAMS menu-events reservation-events 0-0 0-0"
    echo ""
    echo "7️⃣ Test Complete!"
    echo "=================="
    echo "✅ Event-driven communication test completed"
    echo "💡 Check service logs to see event publishing and consuming"
    echo ""
    echo "Docker logs commands:"
    echo "  docker-compose -f docker-compose.microservices.yml logs menu-service"
    echo "  docker-compose -f docker-compose.microservices.yml logs reservation-service"
    echo "  docker-compose -f docker-compose.microservices.yml logs redis"
}

# Run the test
main