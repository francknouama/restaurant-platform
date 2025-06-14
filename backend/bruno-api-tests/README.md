# Bruno API Testing Suite for Restaurant Platform

This directory contains a comprehensive Bruno API collection for testing all endpoints of the Restaurant Platform backend services.

## Overview

Bruno is a fast and open-source API client that allows you to test, explore and interact with APIs. This collection covers all major services:

- **Menu Service** - Menu and category management
- **Order Service** - Order lifecycle management
- **User Service** - Authentication and user management
- **Reservation Service** - Table reservation management
- **Kitchen Service** - Kitchen order tracking
- **Inventory Service** - Inventory management

## Installation

1. Install Bruno desktop app:
   - Download from [usebruno.com](https://www.usebruno.com/)
   - Or install via package manager:
     ```bash
     # macOS
     brew install bruno
     
     # Windows
     choco install bruno
     
     # Linux
     snap install bruno
     ```

2. Open Bruno and import this collection:
   - Open Bruno
   - Click "Open Collection"
   - Navigate to this directory (`bruno-api-tests`)
   - Select the folder

## Environment Setup

The collection includes multiple environments:

### Local Development
- **Environment**: `local`
- **Base URL**: `http://localhost:8080`
- **Usage**: Testing against locally running backend services

### Docker Environment
- **Environment**: `docker`
- **Base URL**: `http://backend:8080`
- **Usage**: Testing within Docker Compose network

### Staging Environment
- **Environment**: `staging`
- **Base URL**: `https://staging-api.restaurant-platform.com`
- **Usage**: Testing against staging deployment

### Production Environment
- **Environment**: `production`
- **Base URL**: `https://api.restaurant-platform.com`
- **Usage**: Testing against production (use with caution)

## Collection Structure

```
Restaurant-Platform/
├── Menu-Service/
│   ├── 1. Create Menu.bru
│   ├── 2. Get Menu by ID.bru
│   ├── 3. List All Menus.bru
│   ├── 4. Activate Menu.bru
│   ├── 5. Deactivate Menu.bru
│   └── 6. Get Active Menus.bru
├── Order-Service/
│   ├── 1. Create Order.bru
│   ├── 2. Get Order by ID.bru
│   ├── 3. List All Orders.bru
│   ├── 4. Update Order Status to PAID.bru
│   ├── 5. Update Order Status to PREPARING.bru
│   ├── 6. Update Order Status to READY.bru
│   ├── 7. Update Order Status to COMPLETED.bru
│   ├── 8. Filter Orders by Status.bru
│   └── 9. Filter Orders by Type.bru
├── User-Service/
│   ├── 1. Register User.bru
│   ├── 2. Login User.bru
│   └── 3. Get User Profile.bru
├── Reservation-Service/
│   ├── 1. Create Reservation.bru
│   ├── 2. Get Reservation by ID.bru
│   └── 3. Update Reservation Status.bru
├── Kitchen-Service/
│   └── 1. Get Kitchen Orders.bru
├── Inventory-Service/
│   └── 1. Get Inventory Items.bru
└── environments/
    ├── local.bru
    ├── docker.bru
    ├── staging.bru
    └── production.bru
```

## Running Tests

### Prerequisites

Ensure the backend services are running:

```bash
# For local testing
cd backend
go run cmd/server/main.go

# For Docker testing
cd backend
docker-compose up -d
```

### Test Execution

1. **Select Environment**:
   - In Bruno, click on the environment dropdown (top right)
   - Select the appropriate environment (local, docker, staging, production)

2. **Run Individual Tests**:
   - Navigate to any service folder
   - Click on a test file
   - Click "Send" to execute the request
   - View the response and test results

3. **Run Collection Tests**:
   - Right-click on "Restaurant-Platform" folder
   - Select "Run Collection"
   - All tests will execute in sequence

4. **Run Service Tests**:
   - Right-click on any service folder (e.g., "Menu-Service")
   - Select "Run Folder"
   - All tests in that service will execute

### Test Flow

The tests are designed to run in sequence and build upon each other:

1. **Menu Service Flow**:
   - Create a menu → Get menu → List menus → Activate → Deactivate

2. **Order Service Flow**:
   - Create order → Get order → Update status through workflow → Filter orders

3. **User Service Flow**:
   - Register user → Login → Get profile (authenticated)

4. **Reservation Service Flow**:
   - Create reservation → Get reservation → Update status

## Environment Variables

Tests automatically set and use environment variables:

- `menuId` - Set after creating a menu
- `orderId` - Set after creating an order
- `userId` - Set after user registration
- `userEmail` - Set after user registration
- `reservationId` - Set after creating a reservation
- `accessToken` - Set after user login
- `refreshToken` - Set after user login

These variables are automatically passed between tests for seamless workflow testing.

## Test Validation

Each test includes comprehensive assertions:

- **Status Code Validation**: Ensures correct HTTP response codes
- **Response Structure**: Validates response body structure
- **Data Integrity**: Ensures data is correctly saved and retrieved
- **Business Logic**: Validates business rules (e.g., order status transitions)
- **Timestamps**: Validates creation and update timestamps

## Adding New Tests

To add new API tests:

1. **Create Test File**:
   ```
   meta {
     name: Test Name
     type: http
     seq: 1
   }
   
   post {
     url: {{baseUrl}}/api/v1/endpoint
     body: json
     auth: none
   }
   
   headers {
     Content-Type: application/json
   }
   
   body:json {
     {
       "field": "value"
     }
   }
   
   tests {
     test("Status code is 200", function() {
       expect(res.status).to.equal(200);
     });
   }
   ```

2. **Add Environment Variables** (if needed):
   - Update environment files with new variables
   - Use `bru.setEnvVar("name", value)` in post-response scripts

3. **Add Test Assertions**:
   - Validate status codes
   - Check response structure
   - Verify business logic

## Integration with CI/CD

Bruno tests can be run in CI/CD pipelines using the CLI:

```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run tests
bru run --env local Restaurant-Platform
```

## Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Ensure backend services are running
   - Check the correct environment is selected
   - Verify base URL in environment configuration

2. **Authentication Errors**:
   - Run user registration and login tests first
   - Check that `accessToken` is set in environment variables

3. **Test Dependencies**:
   - Some tests depend on previous tests (e.g., orders depend on menus)
   - Run tests in sequence or run the full collection

4. **Environment Variables Not Set**:
   - Check post-response scripts are executing
   - Verify environment variable names match between tests

### Debug Mode

Enable verbose logging in Bruno:
- Go to Settings → App → Enable request/response logging
- View console output for detailed request/response information

## Best Practices

1. **Environment Separation**: Always use the correct environment for testing
2. **Test Isolation**: Each test should be independent where possible
3. **Data Cleanup**: Consider adding cleanup requests for test data
4. **Assertion Quality**: Write comprehensive assertions for each test
5. **Documentation**: Update this README when adding new services or tests

## Contributing

When adding new API endpoints:

1. Create corresponding Bruno test files
2. Follow existing naming conventions
3. Include comprehensive test assertions
4. Update environment variables if needed
5. Update this documentation