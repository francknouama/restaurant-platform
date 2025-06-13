#!/bin/bash

# Test script for authentication endpoints
# This script tests the basic authentication flow

BASE_URL="http://localhost:8080/api/v1"

echo "🔐 Testing Restaurant Platform Authentication Service"
echo "================================================="

# Test health check
echo -e "\n1. 🏥 Testing health check..."
curl -s "$BASE_URL/../health" | jq '.' || echo "Health check failed"

# Test get roles (should work without auth for setup)
echo -e "\n2. 👥 Testing get roles..."
curl -s "$BASE_URL/roles" | jq '.' || echo "Get roles failed"

# Test get permissions (should work without auth for setup)
echo -e "\n3. 🔑 Testing get permissions..."
curl -s "$BASE_URL/permissions" | jq '.' || echo "Get permissions failed"

# Test user registration
echo -e "\n4. 📝 Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "SecurePass123!",
    "roleId": "role_admin"
  }')

echo "$REGISTER_RESPONSE" | jq '.' || echo "Registration failed"

# Test user login
echo -e "\n5. 🔑 Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "SecurePass123!"
  }')

echo "$LOGIN_RESPONSE" | jq '.' || echo "Login failed"

# Extract token from login response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
  echo -e "\n6. 👤 Testing get profile with token..."
  curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/profile" | jq '.' || echo "Get profile failed"
  
  echo -e "\n7. 🔍 Testing token validation..."
  curl -s -X POST "$BASE_URL/auth/validate" \
    -H "Authorization: Bearer $TOKEN" | jq '.' || echo "Token validation failed"
    
  echo -e "\n8. 🚪 Testing logout..."
  curl -s -X POST "$BASE_URL/auth/logout" \
    -H "Authorization: Bearer $TOKEN" | jq '.' || echo "Logout failed"
else
  echo "❌ No valid token received, skipping authenticated tests"
fi

echo -e "\n✅ Authentication tests completed!"
echo "================================================="