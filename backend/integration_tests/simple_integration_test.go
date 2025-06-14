package integration_tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// SimpleIntegrationTestSuite provides HTTP-based integration tests
// that don't depend on internal service packages
type SimpleIntegrationTestSuite struct {
	suite.Suite
	client *http.Client
}

func (suite *SimpleIntegrationTestSuite) SetupSuite() {
	suite.client = &http.Client{
		Timeout: 30 * time.Second,
	}
}

func TestSimpleIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(SimpleIntegrationTestSuite))
}

// Helper methods for HTTP requests
func (suite *SimpleIntegrationTestSuite) makeRequest(method, url string, body interface{}) (*http.Response, error) {
	var bodyBytes []byte
	var err error
	
	if body != nil {
		bodyBytes, err = json.Marshal(body)
		if err != nil {
			return nil, err
		}
	}
	
	req, err := http.NewRequest(method, url, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}
	
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	
	return suite.client.Do(req)
}

func (suite *SimpleIntegrationTestSuite) assertJSONResponse(resp *http.Response, expectedStatus int) map[string]interface{} {
	defer resp.Body.Close()
	
	assert.Equal(suite.T(), expectedStatus, resp.StatusCode)
	
	var result map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&result)
	assert.NoError(suite.T(), err)
	
	return result
}

// Test API Health Endpoints
func (suite *SimpleIntegrationTestSuite) TestHealthEndpoints() {
	services := map[string]string{
		"menu":        "http://localhost:8081/health",
		"order":       "http://localhost:8082/health", 
		"kitchen":     "http://localhost:8083/health",
		"reservation": "http://localhost:8084/health",
		"inventory":   "http://localhost:8085/health",
		"user":        "http://localhost:8086/health",
	}
	
	for serviceName, healthURL := range services {
		suite.T().Run(fmt.Sprintf("Health_%s", serviceName), func(t *testing.T) {
			resp, err := suite.client.Get(healthURL)
			if err != nil {
				t.Skipf("Service %s not available: %v", serviceName, err)
				return
			}
			
			result := suite.assertJSONResponse(resp, http.StatusOK)
			assert.Contains(t, result, "status")
			assert.Equal(t, "healthy", result["status"])
		})
	}
}

// Menu Service Tests
func (suite *SimpleIntegrationTestSuite) TestMenuService_BasicCRUD() {
	baseURL := "http://localhost:8081/api/v1"
	
	// Test Create Menu
	createMenuReq := map[string]interface{}{
		"name": "Integration Test Menu",
	}
	
	resp, err := suite.makeRequest("POST", baseURL+"/menus", createMenuReq)
	if err != nil {
		suite.T().Skip("Menu service not available")
		return
	}
	
	createResult := suite.assertJSONResponse(resp, http.StatusCreated)
	assert.True(suite.T(), createResult["success"].(bool))
	
	data := createResult["data"].(map[string]interface{})
	menuID := data["id"].(string)
	assert.NotEmpty(suite.T(), menuID)
	assert.Equal(suite.T(), createMenuReq["name"], data["name"])
	
	// Test Get Menu
	resp, err = suite.makeRequest("GET", baseURL+"/menus/"+menuID, nil)
	assert.NoError(suite.T(), err)
	
	getResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), getResult["success"].(bool))
	
	// Test List Menus
	resp, err = suite.makeRequest("GET", baseURL+"/menus", nil)
	assert.NoError(suite.T(), err)
	
	listResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), listResult["success"].(bool))
}

// Order Service Tests  
func (suite *SimpleIntegrationTestSuite) TestOrderService_BasicCRUD() {
	baseURL := "http://localhost:8082/api/v1"
	
	// Test Create Order
	createOrderReq := map[string]interface{}{
		"type":         "DINE_IN",
		"tableNumber":  5,
		"customerName": "Integration Test Customer",
		"items": []map[string]interface{}{
			{
				"menuItemId":   "test_item_1",
				"menuItemName": "Test Item",
				"quantity":     2,
				"unitPrice":    15.99,
			},
		},
	}
	
	resp, err := suite.makeRequest("POST", baseURL+"/orders", createOrderReq)
	if err != nil {
		suite.T().Skip("Order service not available")
		return
	}
	
	createResult := suite.assertJSONResponse(resp, http.StatusCreated)
	assert.True(suite.T(), createResult["success"].(bool))
	
	data := createResult["data"].(map[string]interface{})
	orderID := data["id"].(string)
	assert.NotEmpty(suite.T(), orderID)
	assert.Equal(suite.T(), createOrderReq["type"], data["type"])
	assert.Equal(suite.T(), createOrderReq["customerName"], data["customerName"])
	
	// Test Get Order
	resp, err = suite.makeRequest("GET", baseURL+"/orders/"+orderID, nil)
	assert.NoError(suite.T(), err)
	
	getResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), getResult["success"].(bool))
	
	// Test List Orders
	resp, err = suite.makeRequest("GET", baseURL+"/orders", nil)
	assert.NoError(suite.T(), err)
	
	listResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), listResult["success"].(bool))
}

// Reservation Service Tests
func (suite *SimpleIntegrationTestSuite) TestReservationService_BasicCRUD() {
	baseURL := "http://localhost:8084/api/v1"
	
	// Test Create Reservation
	reservationTime := time.Now().Add(24 * time.Hour).Format(time.RFC3339)
	createReservationReq := map[string]interface{}{
		"customerName":    "Integration Test Customer",
		"customerEmail":   "test@integration.com",
		"customerPhone":   "+1234567890",
		"partySize":       4,
		"reservationTime": reservationTime,
		"specialRequests": "Window table preferred",
	}
	
	resp, err := suite.makeRequest("POST", baseURL+"/reservations", createReservationReq)
	if err != nil {
		suite.T().Skip("Reservation service not available")
		return
	}
	
	createResult := suite.assertJSONResponse(resp, http.StatusCreated)
	assert.True(suite.T(), createResult["success"].(bool))
	
	data := createResult["data"].(map[string]interface{})
	reservationID := data["id"].(string)
	assert.NotEmpty(suite.T(), reservationID)
	assert.Equal(suite.T(), createReservationReq["customerName"], data["customerName"])
	
	// Test Get Reservation  
	resp, err = suite.makeRequest("GET", baseURL+"/reservations/"+reservationID, nil)
	assert.NoError(suite.T(), err)
	
	getResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), getResult["success"].(bool))
	
	// Test List Reservations
	resp, err = suite.makeRequest("GET", baseURL+"/reservations", nil)
	assert.NoError(suite.T(), err)
	
	listResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), listResult["success"].(bool))
}

// Inventory Service Tests
func (suite *SimpleIntegrationTestSuite) TestInventoryService_BasicCRUD() {
	baseURL := "http://localhost:8085/api/v1"
	
	// Test Create Inventory Item
	createItemReq := map[string]interface{}{
		"sku":               "INTEGRATION-001",
		"name":              "Integration Test Item", 
		"category":          "Test Category",
		"unit":              "units",
		"lowStockThreshold": 10,
		"costPerUnit":       5.99,
		"description":       "Integration test inventory item",
	}
	
	resp, err := suite.makeRequest("POST", baseURL+"/inventory/items", createItemReq)
	if err != nil {
		suite.T().Skip("Inventory service not available")
		return
	}
	
	createResult := suite.assertJSONResponse(resp, http.StatusCreated)
	assert.True(suite.T(), createResult["success"].(bool))
	
	data := createResult["data"].(map[string]interface{})
	itemID := data["id"].(string)
	assert.NotEmpty(suite.T(), itemID)
	assert.Equal(suite.T(), createItemReq["sku"], data["sku"])
	assert.Equal(suite.T(), createItemReq["name"], data["name"])
	
	// Test Get Item
	resp, err = suite.makeRequest("GET", baseURL+"/inventory/items/"+itemID, nil)
	assert.NoError(suite.T(), err)
	
	getResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), getResult["success"].(bool))
	
	// Test List Items
	resp, err = suite.makeRequest("GET", baseURL+"/inventory/items", nil)
	assert.NoError(suite.T(), err)
	
	listResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), listResult["success"].(bool))
}

// User Service Tests
func (suite *SimpleIntegrationTestSuite) TestUserService_Authentication() {
	baseURL := "http://localhost:8086/api/v1"
	
	// Test User Registration
	registerReq := map[string]interface{}{
		"username":  "integrationuser",
		"email":     "integration@test.com",
		"password":  "SecurePassword123!",
		"firstName": "Integration",
		"lastName":  "User",
		"role":      "waitstaff",
	}
	
	resp, err := suite.makeRequest("POST", baseURL+"/auth/register", registerReq)
	if err != nil {
		suite.T().Skip("User service not available")
		return
	}
	
	registerResult := suite.assertJSONResponse(resp, http.StatusCreated)
	assert.True(suite.T(), registerResult["success"].(bool))
	
	data := registerResult["data"].(map[string]interface{})
	user := data["user"].(map[string]interface{})
	assert.Equal(suite.T(), registerReq["username"], user["username"])
	assert.Equal(suite.T(), registerReq["email"], user["email"])
	assert.NotEmpty(suite.T(), data["accessToken"])
	
	// Test User Login
	loginReq := map[string]interface{}{
		"username": registerReq["username"],
		"password": registerReq["password"],
	}
	
	resp, err = suite.makeRequest("POST", baseURL+"/auth/login", loginReq)
	assert.NoError(suite.T(), err)
	
	loginResult := suite.assertJSONResponse(resp, http.StatusOK)
	assert.True(suite.T(), loginResult["success"].(bool))
	
	loginData := loginResult["data"].(map[string]interface{})
	loginUser := loginData["user"].(map[string]interface{})
	assert.Equal(suite.T(), registerReq["username"], loginUser["username"])
	assert.NotEmpty(suite.T(), loginData["accessToken"])
	assert.NotEmpty(suite.T(), loginData["refreshToken"])
}

// Cross-Service Integration Test
func (suite *SimpleIntegrationTestSuite) TestCrossService_FullWorkflow() {
	// This test demonstrates integration across multiple services
	// Skip if any service is not available
	
	// 1. Register a user
	registerReq := map[string]interface{}{
		"username":  "workflowuser",
		"email":     "workflow@test.com", 
		"password":  "SecurePassword123!",
		"firstName": "Workflow",
		"lastName":  "User",
		"role":      "waitstaff",
	}
	
	resp, err := suite.makeRequest("POST", "http://localhost:8086/api/v1/auth/register", registerReq)
	if err != nil {
		suite.T().Skip("User service not available for workflow test")
		return
	}
	suite.assertJSONResponse(resp, http.StatusCreated)
	
	// 2. Create a menu
	menuReq := map[string]interface{}{
		"name": "Workflow Test Menu",
	}
	
	resp, err = suite.makeRequest("POST", "http://localhost:8081/api/v1/menus", menuReq)
	if err != nil {
		suite.T().Skip("Menu service not available for workflow test")
		return
	}
	menuResult := suite.assertJSONResponse(resp, http.StatusCreated)
	menuData := menuResult["data"].(map[string]interface{})
	menuID := menuData["id"].(string)
	
	// 3. Create an order
	orderReq := map[string]interface{}{
		"type":         "DINE_IN",
		"tableNumber":  10,
		"customerName": "Workflow Customer",
		"items": []map[string]interface{}{
			{
				"menuItemId":   "workflow_item_1",
				"menuItemName": "Workflow Item",
				"quantity":     1,
				"unitPrice":    25.99,
			},
		},
	}
	
	resp, err = suite.makeRequest("POST", "http://localhost:8082/api/v1/orders", orderReq)
	if err != nil {
		suite.T().Skip("Order service not available for workflow test")
		return
	}
	orderResult := suite.assertJSONResponse(resp, http.StatusCreated)
	orderData := orderResult["data"].(map[string]interface{})
	orderID := orderData["id"].(string)
	
	// 4. Create a reservation
	reservationTime := time.Now().Add(48 * time.Hour).Format(time.RFC3339)
	reservationReq := map[string]interface{}{
		"customerName":    "Workflow Customer",
		"customerEmail":   "workflow@customer.com",
		"customerPhone":   "+1234567890",
		"partySize":       2,
		"reservationTime": reservationTime,
	}
	
	resp, err = suite.makeRequest("POST", "http://localhost:8084/api/v1/reservations", reservationReq)
	if err != nil {
		suite.T().Skip("Reservation service not available for workflow test")
		return
	}
	reservationResult := suite.assertJSONResponse(resp, http.StatusCreated)
	reservationData := reservationResult["data"].(map[string]interface{})
	reservationID := reservationData["id"].(string)
	
	suite.T().Logf("Full workflow completed successfully:")
	suite.T().Logf("  - User registered: %s", registerReq["username"])
	suite.T().Logf("  - Menu created: %s", menuID)
	suite.T().Logf("  - Order created: %s", orderID)
	suite.T().Logf("  - Reservation created: %s", reservationID)
}