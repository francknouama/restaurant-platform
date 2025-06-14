package integration_tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// HTTPClient wraps http.Client with helper methods for testing
type HTTPClient struct {
	client  *http.Client
	baseURL string
}

func NewHTTPClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		baseURL: baseURL,
	}
}

func (c *HTTPClient) POST(path string, body interface{}) (*http.Response, error) {
	return c.request("POST", path, body)
}

func (c *HTTPClient) GET(path string) (*http.Response, error) {
	return c.request("GET", path, nil)
}

func (c *HTTPClient) PUT(path string, body interface{}) (*http.Response, error) {
	return c.request("PUT", path, body)
}

func (c *HTTPClient) PATCH(path string, body interface{}) (*http.Response, error) {
	return c.request("PATCH", path, body)
}

func (c *HTTPClient) DELETE(path string) (*http.Response, error) {
	return c.request("DELETE", path, nil)
}

func (c *HTTPClient) request(method, path string, body interface{}) (*http.Response, error) {
	url := c.baseURL + path
	
	var bodyReader io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		bodyReader = bytes.NewBuffer(jsonBody)
	}
	
	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, err
	}
	
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	
	return c.client.Do(req)
}

// Response helpers
func ParseJSONResponse(resp *http.Response, target interface{}) error {
	defer resp.Body.Close()
	return json.NewDecoder(resp.Body).Decode(target)
}

func AssertJSONResponse(t *testing.T, resp *http.Response, expectedStatus int) map[string]interface{} {
	assert.Equal(t, expectedStatus, resp.StatusCode)
	
	var result map[string]interface{}
	err := ParseJSONResponse(resp, &result)
	assert.NoError(t, err)
	
	return result
}

// Common test data structures
type CreateMenuRequest struct {
	Name string `json:"name"`
}

type CreateOrderRequest struct {
	Type            string      `json:"type"`
	TableNumber     *int        `json:"tableNumber,omitempty"`
	CustomerName    string      `json:"customerName"`
	DeliveryAddress *string     `json:"deliveryAddress,omitempty"`
	Items           []OrderItem `json:"items"`
}

type OrderItem struct {
	MenuItemID   string  `json:"menuItemId"`
	MenuItemName string  `json:"menuItemName"`
	Quantity     int     `json:"quantity"`
	UnitPrice    float64 `json:"unitPrice"`
	Notes        string  `json:"notes,omitempty"`
}

type CreateReservationRequest struct {
	CustomerName    string    `json:"customerName"`
	CustomerEmail   string    `json:"customerEmail"`
	CustomerPhone   string    `json:"customerPhone"`
	PartySize       int       `json:"partySize"`
	ReservationTime time.Time `json:"reservationTime"`
	SpecialRequests string    `json:"specialRequests,omitempty"`
}

type CreateInventoryItemRequest struct {
	SKU               string  `json:"sku"`
	Name              string  `json:"name"`
	Category          string  `json:"category"`
	Unit              string  `json:"unit"`
	LowStockThreshold int     `json:"lowStockThreshold"`
	CostPerUnit       float64 `json:"costPerUnit"`
	Description       string  `json:"description,omitempty"`
}

type RegisterUserRequest struct {
	Username  string `json:"username"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Test server management
type TestServer struct {
	Port int
	URL  string
}

func (ts *TestServer) WaitForReady(timeout time.Duration) error {
	client := &http.Client{Timeout: 1 * time.Second}
	deadline := time.Now().Add(timeout)
	
	for time.Now().Before(deadline) {
		resp, err := client.Get(ts.URL + "/health")
		if err == nil && resp.StatusCode == 200 {
			resp.Body.Close()
			return nil
		}
		if resp != nil {
			resp.Body.Close()
		}
		time.Sleep(100 * time.Millisecond)
	}
	
	return fmt.Errorf("server not ready after %v", timeout)
}