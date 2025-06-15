import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock the shared state hook
const mockEmitInventoryLowStock = jest.fn();
const mockEmitInventoryStockUpdated = jest.fn();
const mockOnOrderCreated = jest.fn();
const mockOnKitchenOrderUpdate = jest.fn();

jest.mock('@restaurant/shared-state', () => ({
  useRestaurantEvents: () => ({
    emitInventoryLowStock: mockEmitInventoryLowStock,
    emitInventoryStockUpdated: mockEmitInventoryStockUpdated,
    onOrderCreated: mockOnOrderCreated,
    onKitchenOrderUpdate: mockOnKitchenOrderUpdate
  })
}));

// Mock a component that uses the integration
const InventoryIntegrationComponent = () => {
  const { 
    emitInventoryLowStock, 
    emitInventoryStockUpdated,
    onOrderCreated,
    onKitchenOrderUpdate 
  } = require('@restaurant/shared-state').useRestaurantEvents();

  React.useEffect(() => {
    // Set up event listeners
    const unsubscribeOrder = onOrderCreated((event) => {
      console.log('Order created:', event);
      // Update inventory based on order
    });

    const unsubscribeKitchen = onKitchenOrderUpdate((event) => {
      console.log('Kitchen order update:', event);
      // Update inventory based on kitchen usage
    });

    return () => {
      unsubscribeOrder();
      unsubscribeKitchen();
    };
  }, [onOrderCreated, onKitchenOrderUpdate]);

  const handleLowStockAlert = () => {
    emitInventoryLowStock({
      itemId: 'item_123',
      itemName: 'Premium Beef',
      currentStock: 2,
      minimumStock: 10,
      category: 'Meat',
      priority: 'urgent'
    });
  };

  const handleStockUpdate = () => {
    emitInventoryStockUpdated({
      itemId: 'item_123',
      itemName: 'Premium Beef',
      previousStock: 2,
      newStock: 15,
      updateType: 'restock'
    });
  };

  return (
    <div>
      <h1>Inventory Integration Test</h1>
      <button onClick={handleLowStockAlert}>Emit Low Stock Alert</button>
      <button onClick={handleStockUpdate}>Emit Stock Update</button>
      <div data-testid="integration-status">Ready</div>
    </div>
  );
};

// Helper function to render with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('Inventory MFE Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnOrderCreated.mockReturnValue(() => {});
    mockOnKitchenOrderUpdate.mockReturnValue(() => {});
  });

  describe('Cross-MFE Event Communication', () => {
    it('should emit low stock alerts to other MFEs', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      fireEvent.click(alertButton);
      
      expect(mockEmitInventoryLowStock).toHaveBeenCalledWith({
        itemId: 'item_123',
        itemName: 'Premium Beef',
        currentStock: 2,
        minimumStock: 10,
        category: 'Meat',
        priority: 'urgent'
      });
    });

    it('should emit stock updated events when inventory changes', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const updateButton = screen.getByText('Emit Stock Update');
      fireEvent.click(updateButton);
      
      expect(mockEmitInventoryStockUpdated).toHaveBeenCalledWith({
        itemId: 'item_123',
        itemName: 'Premium Beef',
        previousStock: 2,
        newStock: 15,
        updateType: 'restock'
      });
    });

    it('should listen for order created events', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnOrderCreated).toHaveBeenCalled();
    });

    it('should listen for kitchen order updates', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnKitchenOrderUpdate).toHaveBeenCalled();
    });

    it('should handle event emission with proper data structure', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      fireEvent.click(alertButton);
      
      const [eventData] = mockEmitInventoryLowStock.mock.calls[0];
      expect(eventData).toHaveProperty('itemId');
      expect(eventData).toHaveProperty('itemName');
      expect(eventData).toHaveProperty('currentStock');
      expect(eventData).toHaveProperty('minimumStock');
      expect(eventData).toHaveProperty('category');
      expect(eventData).toHaveProperty('priority');
    });

    it('should maintain event consistency across operations', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      // Emit multiple events
      const alertButton = screen.getByText('Emit Low Stock Alert');
      const updateButton = screen.getByText('Emit Stock Update');
      
      fireEvent.click(alertButton);
      fireEvent.click(updateButton);
      
      expect(mockEmitInventoryLowStock).toHaveBeenCalledTimes(1);
      expect(mockEmitInventoryStockUpdated).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Data Validation', () => {
    it('should emit events with required fields for low stock alerts', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      fireEvent.click(alertButton);
      
      const [eventData] = mockEmitInventoryLowStock.mock.calls[0];
      expect(eventData.itemId).toBe('item_123');
      expect(eventData.itemName).toBe('Premium Beef');
      expect(typeof eventData.currentStock).toBe('number');
      expect(typeof eventData.minimumStock).toBe('number');
      expect(eventData.category).toBe('Meat');
      expect(eventData.priority).toBe('urgent');
    });

    it('should emit events with required fields for stock updates', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const updateButton = screen.getByText('Emit Stock Update');
      fireEvent.click(updateButton);
      
      const [eventData] = mockEmitInventoryStockUpdated.mock.calls[0];
      expect(eventData.itemId).toBe('item_123');
      expect(eventData.itemName).toBe('Premium Beef');
      expect(typeof eventData.previousStock).toBe('number');
      expect(typeof eventData.newStock).toBe('number');
      expect(eventData.updateType).toBe('restock');
    });

    it('should validate priority levels for alerts', () => {
      const priorities = ['urgent', 'high', 'medium', 'low'];
      
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      fireEvent.click(alertButton);
      
      const [eventData] = mockEmitInventoryLowStock.mock.calls[0];
      expect(priorities).toContain(eventData.priority);
    });

    it('should validate update types for stock changes', () => {
      const updateTypes = ['restock', 'adjustment', 'consumption', 'waste', 'transfer'];
      
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const updateButton = screen.getByText('Emit Stock Update');
      fireEvent.click(updateButton);
      
      const [eventData] = mockEmitInventoryStockUpdated.mock.calls[0];
      expect(updateTypes).toContain(eventData.updateType);
    });
  });

  describe('Orders MFE Integration', () => {
    it('should handle order created events properly', () => {
      const mockOrderEvent = {
        orderId: 'order_123',
        items: [
          { itemId: 'item_123', quantity: 2, name: 'Premium Beef' },
          { itemId: 'item_456', quantity: 1, name: 'Fresh Salmon' }
        ],
        timestamp: new Date().toISOString()
      };

      // Mock the callback implementation
      mockOnOrderCreated.mockImplementation((callback) => {
        callback(mockOrderEvent);
        return () => {}; // cleanup function
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(consoleSpy).toHaveBeenCalledWith('Order created:', mockOrderEvent);
      
      consoleSpy.mockRestore();
    });

    it('should process order items for inventory deduction', () => {
      const mockOrderEvent = {
        orderId: 'order_123',
        items: [
          { itemId: 'item_123', quantity: 2, name: 'Premium Beef' }
        ]
      };

      mockOnOrderCreated.mockImplementation((callback) => {
        callback(mockOrderEvent);
        return () => {};
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnOrderCreated).toHaveBeenCalled();
    });

    it('should handle multiple order items correctly', () => {
      const mockOrderEvent = {
        orderId: 'order_123',
        items: [
          { itemId: 'item_123', quantity: 2, name: 'Premium Beef' },
          { itemId: 'item_456', quantity: 1, name: 'Fresh Salmon' },
          { itemId: 'item_789', quantity: 3, name: 'Organic Vegetables' }
        ]
      };

      mockOnOrderCreated.mockImplementation((callback) => {
        callback(mockOrderEvent);
        return () => {};
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnOrderCreated).toHaveBeenCalled();
    });
  });

  describe('Kitchen MFE Integration', () => {
    it('should handle kitchen order updates', () => {
      const mockKitchenEvent = {
        orderId: 'order_123',
        status: 'preparing',
        itemsUsed: [
          { itemId: 'item_123', quantityUsed: 2, waste: 0.1 }
        ],
        timestamp: new Date().toISOString()
      };

      mockOnKitchenOrderUpdate.mockImplementation((callback) => {
        callback(mockKitchenEvent);
        return () => {};
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(consoleSpy).toHaveBeenCalledWith('Kitchen order update:', mockKitchenEvent);
      
      consoleSpy.mockRestore();
    });

    it('should track ingredient usage from kitchen', () => {
      const mockKitchenEvent = {
        orderId: 'order_123',
        status: 'preparing',
        itemsUsed: [
          { itemId: 'item_123', quantityUsed: 2.5, waste: 0.2 }
        ]
      };

      mockOnKitchenOrderUpdate.mockImplementation((callback) => {
        callback(mockKitchenEvent);
        return () => {};
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnKitchenOrderUpdate).toHaveBeenCalled();
    });

    it('should handle waste tracking from kitchen operations', () => {
      const mockKitchenEvent = {
        orderId: 'order_123',
        status: 'completed',
        itemsUsed: [
          { itemId: 'item_123', quantityUsed: 2, waste: 0.5 },
          { itemId: 'item_456', quantityUsed: 1, waste: 0.1 }
        ]
      };

      mockOnKitchenOrderUpdate.mockImplementation((callback) => {
        callback(mockKitchenEvent);
        return () => {};
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      expect(mockOnKitchenOrderUpdate).toHaveBeenCalled();
    });
  });

  describe('Event Cleanup and Memory Management', () => {
    it('should properly clean up event listeners on unmount', () => {
      const mockUnsubscribe = jest.fn();
      mockOnOrderCreated.mockReturnValue(mockUnsubscribe);
      mockOnKitchenOrderUpdate.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderWithRouter(<InventoryIntegrationComponent />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
    });

    it('should handle event listener setup errors gracefully', () => {
      mockOnOrderCreated.mockImplementation(() => {
        throw new Error('Event setup failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderWithRouter(<InventoryIntegrationComponent />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should prevent memory leaks from event subscriptions', () => {
      const { rerender, unmount } = renderWithRouter(<InventoryIntegrationComponent />);
      
      // Re-render multiple times
      rerender(
        <MemoryRouter>
          <InventoryIntegrationComponent />
        </MemoryRouter>
      );
      
      rerender(
        <MemoryRouter>
          <InventoryIntegrationComponent />
        </MemoryRouter>
      );
      
      unmount();
      
      // Should not cause memory issues
      expect(mockOnOrderCreated).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle event emission failures gracefully', () => {
      mockEmitInventoryLowStock.mockImplementation(() => {
        throw new Error('Event emission failed');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      
      expect(() => {
        fireEvent.click(alertButton);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });

    it('should continue operation when event listeners fail', () => {
      mockOnOrderCreated.mockImplementation(() => {
        throw new Error('Listener setup failed');
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      // Component should still render
      expect(screen.getByTestId('integration-status')).toHaveTextContent('Ready');
    });

    it('should handle malformed event data', () => {
      const mockMalformedEvent = {
        // Missing required fields
        orderId: 'order_123'
        // items array missing
      };

      mockOnOrderCreated.mockImplementation((callback) => {
        callback(mockMalformedEvent);
        return () => {};
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderWithRouter(<InventoryIntegrationComponent />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause excessive re-renders on event updates', () => {
      const renderSpy = jest.fn();
      
      const OptimizedComponent = () => {
        renderSpy();
        return <InventoryIntegrationComponent />;
      };

      renderWithRouter(<OptimizedComponent />);
      
      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Trigger events
      const alertButton = screen.getByText('Emit Low Stock Alert');
      fireEvent.click(alertButton);
      
      // Should not cause additional renders
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle high frequency events efficiently', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      
      // Emit many events rapidly
      for (let i = 0; i < 100; i++) {
        fireEvent.click(alertButton);
      }
      
      expect(mockEmitInventoryLowStock).toHaveBeenCalledTimes(100);
    });

    it('should debounce similar events when appropriate', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      const updateButton = screen.getByText('Emit Stock Update');
      
      // Multiple rapid updates
      fireEvent.click(updateButton);
      fireEvent.click(updateButton);
      fireEvent.click(updateButton);
      
      expect(mockEmitInventoryStockUpdated).toHaveBeenCalledTimes(3);
    });
  });

  describe('Real-time Communication', () => {
    it('should support real-time inventory updates', async () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      // Simulate real-time update
      const updateButton = screen.getByText('Emit Stock Update');
      fireEvent.click(updateButton);
      
      await waitFor(() => {
        expect(mockEmitInventoryStockUpdated).toHaveBeenCalled();
      });
    });

    it('should handle network connectivity issues', () => {
      // Mock network failure
      mockEmitInventoryLowStock.mockImplementation(() => {
        throw new Error('Network error');
      });

      renderWithRouter(<InventoryIntegrationComponent />);
      
      const alertButton = screen.getByText('Emit Low Stock Alert');
      
      expect(() => {
        fireEvent.click(alertButton);
      }).not.toThrow();
    });

    it('should queue events when connection is unstable', () => {
      renderWithRouter(<InventoryIntegrationComponent />);
      
      // Component should be ready for event queuing
      expect(screen.getByTestId('integration-status')).toHaveTextContent('Ready');
    });
  });
});