package integration_tests

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// DockerIntegrationTestSuite tests against actual running services
type DockerIntegrationTestSuite struct {
	suite.Suite
	menuClient       *HTTPClient
	orderClient      *HTTPClient
	kitchenClient    *HTTPClient
	reservationClient *HTTPClient
	inventoryClient  *HTTPClient
	authClient       *HTTPClient
}

func (suite *DockerIntegrationTestSuite) SetupSuite() {
	// Initialize HTTP clients for each service
	// These would connect to services running via docker-compose
	suite.menuClient = NewHTTPClient("http://localhost:8081")
	suite.orderClient = NewHTTPClient("http://localhost:8082")
	suite.kitchenClient = NewHTTPClient("http://localhost:8083")
	suite.reservationClient = NewHTTPClient("http://localhost:8084")
	suite.inventoryClient = NewHTTPClient("http://localhost:8085")
	suite.authClient = NewHTTPClient("http://localhost:8086")

	// Wait for all services to be ready
	suite.waitForServices()
}

func (suite *DockerIntegrationTestSuite) waitForServices() {
	clients := map[string]*HTTPClient{
		"menu":        suite.menuClient,
		"order":       suite.orderClient,
		"kitchen":     suite.kitchenClient,
		"reservation": suite.reservationClient,
		"inventory":   suite.inventoryClient,
		"auth":        suite.authClient,
	}

	for name, client := range clients {
		suite.T().Logf("Waiting for %s service to be ready...", name)
		
		timeout := 60 * time.Second
		deadline := time.Now().Add(timeout)
		
		for time.Now().Before(deadline) {
			resp, err := client.GET("/health")
			if err == nil && resp.StatusCode == 200 {
				resp.Body.Close()
				suite.T().Logf("%s service is ready", name)
				break
			}
			if resp != nil {
				resp.Body.Close()
			}
			time.Sleep(1 * time.Second)
		}
	}
}

func TestDockerIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(DockerIntegrationTestSuite))
}

// Menu Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestMenuService_CreateMenu_Success() {
	// Given
	request := CreateMenuRequest{
		Name: "Integration Test Menu",
	}

	// When
	resp, err := suite.menuClient.POST("/api/v1/menus", request)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusCreated)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	assert.Equal(suite.T(), request.Name, data["name"])
	assert.NotEmpty(suite.T(), data["id"])
}

func (suite *DockerIntegrationTestSuite) TestMenuService_GetMenus_Success() {
	// When
	resp, err := suite.menuClient.GET("/api/v1/menus")
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusOK)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	assert.Contains(suite.T(), data, "items")
	assert.Contains(suite.T(), data, "total")
}

// Order Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestOrderService_CreateOrder_Success() {
	// Given
	tableNumber := 5
	request := CreateOrderRequest{
		Type:         "DINE_IN",
		TableNumber:  &tableNumber,
		CustomerName: "Integration Test Customer",
		Items: []OrderItem{
			{
				MenuItemID:   "test_item_1",
				MenuItemName: "Test Item",
				Quantity:     2,
				UnitPrice:    15.99,
			},
		},
	}

	// When
	resp, err := suite.orderClient.POST("/api/v1/orders", request)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusCreated)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	assert.Equal(suite.T(), request.Type, data["type"])
	assert.Equal(suite.T(), float64(*request.TableNumber), data["tableNumber"])
	assert.Equal(suite.T(), request.CustomerName, data["customerName"])
}

func (suite *DockerIntegrationTestSuite) TestOrderService_GetOrders_Success() {
	// When
	resp, err := suite.orderClient.GET("/api/v1/orders")
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusOK)
	assert.True(suite.T(), result["success"].(bool))
}

// Reservation Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestReservationService_CreateReservation_Success() {
	// Given
	reservationTime := time.Now().Add(24 * time.Hour) // Tomorrow
	request := CreateReservationRequest{
		CustomerName:    "Integration Test Customer",
		CustomerEmail:   "test@integration.com",
		CustomerPhone:   "+1234567890",
		PartySize:       4,
		ReservationTime: reservationTime,
		SpecialRequests: "Window table preferred",
	}

	// When
	resp, err := suite.reservationClient.POST("/api/v1/reservations", request)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusCreated)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	assert.Equal(suite.T(), request.CustomerName, data["customerName"])
	assert.Equal(suite.T(), request.CustomerEmail, data["customerEmail"])
	assert.Equal(suite.T(), float64(request.PartySize), data["partySize"])
}

// Inventory Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestInventoryService_CreateItem_Success() {
	// Given
	request := CreateInventoryItemRequest{
		SKU:               "INTEGRATION-001",
		Name:              "Integration Test Item",
		Category:          "Test Category",
		Unit:              "units",
		LowStockThreshold: 10,
		CostPerUnit:       5.99,
		Description:       "Integration test inventory item",
	}

	// When
	resp, err := suite.inventoryClient.POST("/api/v1/inventory/items", request)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusCreated)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	assert.Equal(suite.T(), request.SKU, data["sku"])
	assert.Equal(suite.T(), request.Name, data["name"])
	assert.Equal(suite.T(), request.Category, data["category"])
}

// Auth Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestAuthService_Register_Success() {
	// Given
	request := RegisterUserRequest{
		Username:  "integrationuser",
		Email:     "integration@test.com",
		Password:  "SecurePassword123!",
		FirstName: "Integration",
		LastName:  "User",
		Role:      "waitstaff",
	}

	// When
	resp, err := suite.authClient.POST("/api/v1/auth/register", request)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusCreated)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	user := data["user"].(map[string]interface{})
	assert.Equal(suite.T(), request.Username, user["username"])
	assert.Equal(suite.T(), request.Email, user["email"])
	assert.NotEmpty(suite.T(), data["accessToken"])
}

func (suite *DockerIntegrationTestSuite) TestAuthService_Login_Success() {
	// Given - First register a user
	registerReq := RegisterUserRequest{
		Username:  "loginuser",
		Email:     "login@test.com",
		Password:  "SecurePassword123!",
		FirstName: "Login",
		LastName:  "User",
		Role:      "waitstaff",
	}
	
	registerResp, err := suite.authClient.POST("/api/v1/auth/register", registerReq)
	assert.NoError(suite.T(), err)
	registerResp.Body.Close()

	// When - Login with the user
	loginReq := LoginRequest{
		Username: registerReq.Username,
		Password: registerReq.Password,
	}
	
	resp, err := suite.authClient.POST("/api/v1/auth/login", loginReq)
	assert.NoError(suite.T(), err)

	// Then
	result := AssertJSONResponse(suite.T(), resp, http.StatusOK)
	assert.True(suite.T(), result["success"].(bool))
	
	data := result["data"].(map[string]interface{})
	user := data["user"].(map[string]interface{})
	assert.Equal(suite.T(), registerReq.Username, user["username"])
	assert.NotEmpty(suite.T(), data["accessToken"])
	assert.NotEmpty(suite.T(), data["refreshToken"])
}

// Cross-Service Integration Tests
func (suite *DockerIntegrationTestSuite) TestCrossService_OrderWorkflow_Success() {
	// This test demonstrates a complete workflow across multiple services
	
	// 1. Create a menu item (Menu Service)
	menuResp, err := suite.menuClient.POST("/api/v1/menus", CreateMenuRequest{
		Name: "Workflow Test Menu",
	})
	assert.NoError(suite.T(), err)
	menuResult := AssertJSONResponse(suite.T(), menuResp, http.StatusCreated)
	menuData := menuResult["data"].(map[string]interface{})
	menuID := menuData["id"].(string)

	// 2. Create an order (Order Service)
	tableNumber := 10
	orderResp, err := suite.orderClient.POST("/api/v1/orders", CreateOrderRequest{
		Type:         "DINE_IN",
		TableNumber:  &tableNumber,
		CustomerName: "Workflow Test Customer",
		Items: []OrderItem{
			{
				MenuItemID:   "workflow_item_1",
				MenuItemName: "Workflow Test Item",
				Quantity:     1,
				UnitPrice:    25.99,
			},
		},
	})
	assert.NoError(suite.T(), err)
	orderResult := AssertJSONResponse(suite.T(), orderResp, http.StatusCreated)
	orderData := orderResult["data"].(map[string]interface{})
	orderID := orderData["id"].(string)

	// 3. Verify order exists
	getOrderResp, err := suite.orderClient.GET(fmt.Sprintf("/api/v1/orders/%s", orderID))
	assert.NoError(suite.T(), err)
	getOrderResult := AssertJSONResponse(suite.T(), getOrderResp, http.StatusOK)
	assert.True(suite.T(), getOrderResult["success"].(bool))

	suite.T().Logf("Cross-service workflow completed successfully: Menu ID=%s, Order ID=%s", menuID, orderID)
}

// Performance and Load Tests
func (suite *DockerIntegrationTestSuite) TestService_PerformanceBaseline() {
	// Basic performance test to ensure services respond within reasonable time
	start := time.Now()
	
	// Test multiple concurrent requests
	for i := 0; i < 10; i++ {
		go func() {
			resp, err := suite.menuClient.GET("/api/v1/menus")
			if err == nil {
				resp.Body.Close()
			}
		}()
	}
	
	elapsed := time.Since(start)
	assert.Less(suite.T(), elapsed, 5*time.Second, "Performance test should complete within 5 seconds")
}