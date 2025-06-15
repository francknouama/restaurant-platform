package interfaces

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/restaurant-platform/inventory-service/internal/application"
	inventory "github.com/restaurant-platform/inventory-service/internal/domain"
	"github.com/restaurant-platform/shared/events"
	"github.com/restaurant-platform/shared/pkg/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Mock Repository
type mockInventoryRepository struct {
	mock.Mock
}

func (m *mockInventoryRepository) CreateItem(ctx context.Context, item *inventory.InventoryItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *mockInventoryRepository) GetItemByID(ctx context.Context, id inventory.InventoryItemID) (*inventory.InventoryItem, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) GetItemBySKU(ctx context.Context, sku string) (*inventory.InventoryItem, error) {
	args := m.Called(ctx, sku)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) UpdateItem(ctx context.Context, item *inventory.InventoryItem) error {
	args := m.Called(ctx, item)
	return args.Error(0)
}

func (m *mockInventoryRepository) DeleteItem(ctx context.Context, id inventory.InventoryItemID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockInventoryRepository) CheckStockAvailability(ctx context.Context, sku string, quantity float64) (bool, error) {
	args := m.Called(ctx, sku, quantity)
	return args.Bool(0), args.Error(1)
}

func (m *mockInventoryRepository) GetLowStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) GetOutOfStockItems(ctx context.Context) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) ListItems(ctx context.Context, offset, limit int) ([]*inventory.InventoryItem, int, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Int(1), args.Error(2)
}

func (m *mockInventoryRepository) GetItemsByCategory(ctx context.Context, category string) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, category)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) SearchItems(ctx context.Context, query string) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, query)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

func (m *mockInventoryRepository) CreateMovement(ctx context.Context, movement *inventory.StockMovement) error {
	args := m.Called(ctx, movement)
	return args.Error(0)
}

func (m *mockInventoryRepository) GetMovementsByItemID(ctx context.Context, itemID inventory.InventoryItemID, limit int) ([]*inventory.StockMovement, error) {
	args := m.Called(ctx, itemID, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.StockMovement), args.Error(1)
}

func (m *mockInventoryRepository) GetMovementsByDateRange(ctx context.Context, start, end time.Time) ([]*inventory.StockMovement, error) {
	args := m.Called(ctx, start, end)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.StockMovement), args.Error(1)
}

func (m *mockInventoryRepository) CreateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *mockInventoryRepository) GetSupplierByID(ctx context.Context, id inventory.SupplierID) (*inventory.Supplier, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*inventory.Supplier), args.Error(1)
}

func (m *mockInventoryRepository) UpdateSupplier(ctx context.Context, supplier *inventory.Supplier) error {
	args := m.Called(ctx, supplier)
	return args.Error(0)
}

func (m *mockInventoryRepository) DeleteSupplier(ctx context.Context, id inventory.SupplierID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockInventoryRepository) ListSuppliers(ctx context.Context, offset, limit int) ([]*inventory.Supplier, int, error) {
	args := m.Called(ctx, offset, limit)
	if args.Get(0) == nil {
		return nil, args.Int(1), args.Error(2)
	}
	return args.Get(0).([]*inventory.Supplier), args.Int(1), args.Error(2)
}

func (m *mockInventoryRepository) GetActiveSuppliers(ctx context.Context) ([]*inventory.Supplier, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.Supplier), args.Error(1)
}

func (m *mockInventoryRepository) GetItemsBySupplier(ctx context.Context, supplierID inventory.SupplierID) ([]*inventory.InventoryItem, error) {
	args := m.Called(ctx, supplierID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*inventory.InventoryItem), args.Error(1)
}

// Mock Event Publisher
type mockEventPublisher struct {
	mock.Mock
}

func (m *mockEventPublisher) Publish(ctx context.Context, event *events.DomainEvent) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *mockEventPublisher) Close() error {
	args := m.Called()
	return args.Error(0)
}

func setupIntegrationTest() (*gin.Engine, *mockInventoryRepository, *mockEventPublisher) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockRepo := new(mockInventoryRepository)
	mockPublisher := new(mockEventPublisher)
	service := application.NewInventoryService(mockRepo, mockPublisher)
	handler := NewInventoryHandler(service)

	api := router.Group("/api/v1")
	api.POST("/inventory", handler.CreateItem)
	api.GET("/inventory/:id", handler.GetItem)
	api.GET("/inventory", handler.ListItems)
	api.GET("/inventory/low-stock", handler.GetLowStockItems)
	api.POST("/inventory/:id/movements", handler.RecordMovement)
	api.GET("/inventory/:id/movements", handler.GetMovements)
	api.POST("/suppliers", handler.CreateSupplier)
	api.GET("/suppliers/:id", handler.GetSupplier)
	api.PUT("/suppliers/:id", handler.UpdateSupplier)
	api.DELETE("/suppliers/:id", handler.DeleteSupplier)
	api.GET("/suppliers", handler.ListSuppliers)

	return router, mockRepo, mockPublisher
}

func TestInventoryHandler_StockMovements_Integration(t *testing.T) {
	router, mockRepo, mockPublisher := setupIntegrationTest()

	t.Run("RecordMovement", func(t *testing.T) {
		itemID := types.NewID[inventory.InventoryItemEntity]("inv")
		
		// Setup mock expectations
		item := &inventory.InventoryItem{
			ID:           itemID,
			SKU:          "TEST-001",
			Name:         "Test Item",
			CurrentStock: 100.0,
			Unit:         inventory.UnitTypeUnits,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		
		mockRepo.On("GetItemByID", mock.Anything, itemID).Return(item, nil)
		mockRepo.On("CreateMovement", mock.Anything, mock.AnythingOfType("*inventory.StockMovement")).Return(nil)
		mockRepo.On("UpdateItem", mock.Anything, mock.AnythingOfType("*inventory.InventoryItem")).Return(nil)
		mockPublisher.On("Publish", mock.Anything, mock.Anything).Return(nil)
		
		payload := map[string]interface{}{
			"type":         "USED",
			"quantity":     10.5,
			"notes":        "Used for order preparation",
			"reference":    "ORDER-123",
			"performed_by": "user123",
		}

		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", fmt.Sprintf("/api/v1/inventory/%s/movements", itemID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockRepo.AssertExpectations(t)
		mockPublisher.AssertExpectations(t)
	})

	t.Run("GetMovements", func(t *testing.T) {
		itemID := types.NewID[inventory.InventoryItemEntity]("inv")
		
		movements := []*inventory.StockMovement{
			{
				ID:              types.NewID[inventory.MovementEntity]("mov"),
				InventoryItemID: itemID,
				Type:            inventory.MovementTypeReceived,
				Quantity:        50.0,
				PreviousStock:   100.0,
				NewStock:        150.0,
				Notes:           "Restocked from supplier",
				CreatedAt:       time.Now(),
			},
			{
				ID:              types.NewID[inventory.MovementEntity]("mov"),
				InventoryItemID: itemID,
				Type:            inventory.MovementTypeUsed,
				Quantity:        20.0,
				PreviousStock:   150.0,
				NewStock:        130.0,
				Reference:       "ORDER-124",
				CreatedAt:       time.Now(),
			},
		}

		mockRepo.On("GetMovementsByItemID", mock.Anything, itemID, 20).Return(movements, nil)

		req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/inventory/%s/movements?limit=20", itemID), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Movements []*inventory.StockMovement `json:"movements"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response.Movements, 2)
		mockRepo.AssertExpectations(t)
	})
}

func TestInventoryHandler_Suppliers_Integration(t *testing.T) {
	router, mockRepo, mockPublisher := setupIntegrationTest()

	t.Run("CreateSupplier", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":         "Test Supplier Co.",
			"contact_name": "John Doe",
			"email":        "john@testsupplier.com",
			"phone":        "123-456-7890",
			"address":      "123 Test St",
			"website":      "https://testsupplier.com",
			"notes":        "Reliable supplier",
		}

		mockRepo.On("CreateSupplier", mock.Anything, mock.AnythingOfType("*inventory.Supplier")).Return(nil)
		mockPublisher.On("Publish", mock.Anything, mock.Anything).Return(nil)

		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/suppliers", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)
		mockRepo.AssertExpectations(t)
		mockPublisher.AssertExpectations(t)
	})

	t.Run("GetSupplier", func(t *testing.T) {
		supplierID := types.NewID[inventory.SupplierEntity]("sup")
		
		supplier := &inventory.Supplier{
			ID:          supplierID,
			Name:        "Test Supplier",
			Email:       "test@supplier.com",
			IsActive:    true,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		mockRepo.On("GetSupplierByID", mock.Anything, supplierID).Return(supplier, nil)

		req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/suppliers/%s", supplierID), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response inventory.Supplier
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, supplier.Name, response.Name)
		mockRepo.AssertExpectations(t)
	})

	t.Run("UpdateSupplier", func(t *testing.T) {
		supplierID := types.NewID[inventory.SupplierEntity]("sup")
		
		payload := map[string]interface{}{
			"name":         "Updated Supplier Co.",
			"email":        "updated@supplier.com",
			"phone":        "987-654-3210",
			"is_active":    false,
		}

		mockRepo.On("UpdateSupplier", mock.Anything, mock.AnythingOfType("*inventory.Supplier")).Return(nil)
		mockPublisher.On("Publish", mock.Anything, mock.Anything).Return(nil)

		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", fmt.Sprintf("/api/v1/suppliers/%s", supplierID), bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockRepo.AssertExpectations(t)
		mockPublisher.AssertExpectations(t)
	})

	t.Run("ListSuppliers", func(t *testing.T) {
		suppliers := []*inventory.Supplier{
			{
				ID:        types.NewID[inventory.SupplierEntity]("sup"),
				Name:      "Supplier A",
				IsActive:  true,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
			{
				ID:        types.NewID[inventory.SupplierEntity]("sup"),
				Name:      "Supplier B",
				IsActive:  false,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			},
		}

		mockRepo.On("ListSuppliers", mock.Anything, 0, 20).Return(suppliers, 2, nil)

		req := httptest.NewRequest("GET", "/api/v1/suppliers?offset=0&limit=20", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response struct {
			Suppliers []*inventory.Supplier `json:"suppliers"`
			Total     int                   `json:"total"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Len(t, response.Suppliers, 2)
		assert.Equal(t, 2, response.Total)
		mockRepo.AssertExpectations(t)
	})

	t.Run("DeleteSupplier", func(t *testing.T) {
		supplierID := types.NewID[inventory.SupplierEntity]("sup")
		
		// Mock checking for associated items
		mockRepo.On("GetItemsBySupplier", mock.Anything, supplierID).Return([]*inventory.InventoryItem{}, nil)
		mockRepo.On("DeleteSupplier", mock.Anything, supplierID).Return(nil)
		mockPublisher.On("Publish", mock.Anything, mock.Anything).Return(nil)

		req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/v1/suppliers/%s", supplierID), nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNoContent, w.Code)
		mockRepo.AssertExpectations(t)
		mockPublisher.AssertExpectations(t)
	})
}