#!/bin/bash

# Restaurant Platform API Test Script
# Tests all major API endpoints with sample data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="http://localhost:8080/api/v1"

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Function to make API calls and check response
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    if [ -z "$expected_status" ]; then
        expected_status=200
    fi
    
    print_test "$method $endpoint"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$API_BASE$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" -eq "$expected_status" ]; then
        print_success "Status: $status_code"
        echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
    else
        print_error "Expected $expected_status, got $status_code"
        echo "Response: $body"
        return 1
    fi
    echo ""
}

echo "🧪 Restaurant Platform API Tests"
echo "================================="

# Check if API is available
print_test "Checking API health..."
if ! curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_error "API is not available. Please run bootstrap.sh first."
    exit 1
fi
print_success "API is available"
echo ""

# Test Menu Categories
echo "🏷️  Testing Menu Categories"
echo "----------------------------"

# Create categories
test_api "POST" "/menu-categories" '{
    "name": "Appetizers",
    "description": "Start your meal right",
    "displayOrder": 1,
    "isActive": true
}' 201

test_api "POST" "/menu-categories" '{
    "name": "Main Courses",
    "description": "Hearty main dishes",
    "displayOrder": 2,
    "isActive": true
}' 201

test_api "POST" "/menu-categories" '{
    "name": "Desserts",
    "description": "Sweet endings",
    "displayOrder": 3,
    "isActive": true
}' 201

# Get categories
test_api "GET" "/menu-categories"

echo "📋 Testing Menus"
echo "----------------"

# Create a menu
menu_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Dinner Menu",
        "description": "Our evening selection",
        "isActive": false,
        "categories": [],
        "items": []
    }' \
    "$API_BASE/menus")

menu_id=$(echo "$menu_response" | jq -r '.id' 2>/dev/null || echo "")

if [ -n "$menu_id" ] && [ "$menu_id" != "null" ]; then
    print_success "Created menu with ID: $menu_id"
else
    print_error "Failed to create menu"
    echo "Response: $menu_response"
fi

# Get menus
test_api "GET" "/menus"

echo "🍽️  Testing Menu Items"
echo "----------------------"

# Create menu items
test_api "POST" "/menu-items" '{
    "name": "Caesar Salad",
    "description": "Fresh romaine lettuce with Caesar dressing",
    "price": 12.99,
    "category": "Appetizers",
    "isAvailable": true,
    "allergens": ["Dairy", "Gluten"]
}' 201

test_api "POST" "/menu-items" '{
    "name": "Grilled Salmon",
    "description": "Fresh Atlantic salmon with herbs",
    "price": 28.99,
    "category": "Main Courses",
    "isAvailable": true,
    "nutrition": {
        "calories": 350,
        "protein": 35,
        "carbs": 5,
        "fat": 20
    }
}' 201

test_api "POST" "/menu-items" '{
    "name": "Chocolate Cake",
    "description": "Rich chocolate layer cake",
    "price": 8.99,
    "category": "Desserts",
    "isAvailable": true,
    "allergens": ["Dairy", "Gluten", "Eggs"]
}' 201

# Get menu items
test_api "GET" "/menu-items"

echo "📦 Testing Orders"
echo "----------------"

# Create an order
test_api "POST" "/orders" '{
    "type": "DINE_IN",
    "tableNumber": 5,
    "customerName": "John Doe",
    "items": [
        {
            "menuItemId": "menu_item_1",
            "quantity": 1,
            "notes": "No croutons"
        },
        {
            "menuItemId": "menu_item_2",
            "quantity": 1
        }
    ],
    "notes": "Customer prefers well-done salmon"
}' 201

# Get orders
test_api "GET" "/orders"

echo "👨‍🍳 Testing Kitchen"
echo "-------------------"

# Get kitchen orders
test_api "GET" "/kitchen/orders"

# Get kitchen queue
test_api "GET" "/kitchen/queue"

echo "📅 Testing Reservations"
echo "-----------------------"

# Create a reservation
test_api "POST" "/reservations" '{
    "customerName": "Jane Smith",
    "customerPhone": "(555) 123-4567",
    "customerEmail": "jane@example.com",
    "partySize": 4,
    "reservationDate": "2024-12-20",
    "reservationTime": "19:00",
    "specialRequests": "Window table if possible"
}' 201

# Get reservations
test_api "GET" "/reservations"

echo "📊 Testing Inventory"
echo "--------------------"

# Create inventory items
test_api "POST" "/inventory" '{
    "name": "Salmon Fillets",
    "description": "Fresh Atlantic salmon",
    "category": "Proteins",
    "unit": "lbs",
    "currentStock": 50,
    "minimumStock": 10,
    "maximumStock": 100,
    "unitCost": 15.99,
    "supplier": "Ocean Fresh Co."
}' 201

test_api "POST" "/inventory" '{
    "name": "Romaine Lettuce",
    "description": "Fresh romaine lettuce heads",
    "category": "Vegetables",
    "unit": "heads",
    "currentStock": 25,
    "minimumStock": 5,
    "maximumStock": 50,
    "unitCost": 2.49,
    "supplier": "Green Valley Farms"
}' 201

# Get inventory
test_api "GET" "/inventory"

echo ""
print_success "🎉 All API tests completed!"
echo ""
echo "📊 Test Summary:"
echo "   • Menu Categories: Created and retrieved"
echo "   • Menus: Created and retrieved"
echo "   • Menu Items: Created and retrieved"
echo "   • Orders: Created and retrieved"
echo "   • Kitchen: Queue retrieved"
echo "   • Reservations: Created and retrieved"
echo "   • Inventory: Created and retrieved"
echo ""
echo "🌐 You can now test the frontend at:"
echo "   http://localhost:3000"