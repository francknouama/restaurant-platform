import { renderHook, act } from '@testing-library/react';
import { createEventBus, EventBus } from '../eventBus';
import { useGlobalStore } from '../store';
import { useRestaurantEvents, useAuth, useNotifications } from '../hooks';

describe('Cross-MFE Communication Integration Tests', () => {
  let kitchenEventBus: EventBus;
  let ordersEventBus: EventBus;
  let dashboardEventBus: EventBus;

  beforeEach(() => {
    kitchenEventBus = createEventBus('kitchen-mfe');
    ordersEventBus = createEventBus('orders-mfe');
    dashboardEventBus = createEventBus('dashboard-mfe');
    
    jest.useFakeTimers();
    
    // Clear global store
    const { result } = renderHook(() => useGlobalStore());
    act(() => {
      result.current.clearUser();
      result.current.clearNotifications();
    });
  });

  afterEach(() => {
    kitchenEventBus.clear();
    ordersEventBus.clear();
    dashboardEventBus.clear();
    jest.useRealTimers();
  });

  describe('Order Workflow Integration', () => {
    it('should handle complete order lifecycle across MFEs', () => {
      const kitchenHandler = jest.fn();
      const dashboardHandler = jest.fn();
      const ordersHandler = jest.fn();

      // Set up listeners across different MFEs
      kitchenEventBus.onOrderCreated(kitchenHandler);
      kitchenEventBus.onOrderStatusUpdated(ordersHandler);
      dashboardEventBus.onOrderStatusUpdated(dashboardHandler);

      // Orders MFE creates an order
      const orderData = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        customerId: 'customer-456',
        items: [
          { menuItemId: 'item-1', quantity: 2 },
          { menuItemId: 'item-2', quantity: 1 }
        ],
        total: 45.98,
        type: 'DINE_IN' as const
      };

      act(() => {
        ordersEventBus.emitOrderCreated(orderData);
      });

      // Kitchen should receive the order
      expect(kitchenHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ORDER_CREATED',
          payload: orderData,
          source: 'orders-mfe'
        })
      );

      // Kitchen updates order status
      act(() => {
        kitchenEventBus.emitOrderStatusUpdated(
          'order-123',
          'PREPARING',
          'CONFIRMED',
          15
        );
      });

      // Orders and Dashboard should receive status update
      expect(ordersHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ORDER_STATUS_UPDATED',
          payload: {
            orderId: 'order-123',
            status: 'PREPARING',
            previousStatus: 'CONFIRMED',
            estimatedTime: 15
          },
          source: 'kitchen-mfe'
        })
      );

      expect(dashboardHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ORDER_STATUS_UPDATED',
          payload: {
            orderId: 'order-123',
            status: 'PREPARING',
            previousStatus: 'CONFIRMED',
            estimatedTime: 15
          },
          source: 'kitchen-mfe'
        })
      );
    });

    it('should handle kitchen item status updates', () => {
      const ordersHandler = jest.fn();
      ordersEventBus.onKitchenOrderUpdate(ordersHandler);

      const itemStatuses = [
        { menuItemId: 'item-1', status: 'PREPARING' as const },
        { menuItemId: 'item-2', status: 'READY' as const }
      ];

      act(() => {
        kitchenEventBus.emitKitchenOrderUpdate('order-123', itemStatuses);
      });

      expect(ordersHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'KITCHEN_ORDER_UPDATE',
          payload: { orderId: 'order-123', itemStatuses },
          source: 'kitchen-mfe'
        })
      );
    });
  });

  describe('Menu Management Integration', () => {
    it('should propagate menu item updates across MFEs', () => {
      const ordersHandler = jest.fn();
      const kitchenHandler = jest.fn();
      const dashboardHandler = jest.fn();

      ordersEventBus.onMenuItemUpdated(ordersHandler);
      kitchenEventBus.onMenuItemUpdated(kitchenHandler);
      dashboardEventBus.onMenuItemUpdated(dashboardHandler);

      // Menu MFE updates item availability
      const menuBus = createEventBus('menu-mfe');
      
      act(() => {
        menuBus.emitMenuItemUpdated('item-123', {
          available: false,
          price: 18.99,
          name: 'Updated Dish Name'
        });
      });

      const expectedEvent = expect.objectContaining({
        type: 'MENU_ITEM_UPDATED',
        payload: {
          itemId: 'item-123',
          available: false,
          price: 18.99,
          name: 'Updated Dish Name'
        },
        source: 'menu-mfe'
      });

      expect(ordersHandler).toHaveBeenCalledWith(expectedEvent);
      expect(kitchenHandler).toHaveBeenCalledWith(expectedEvent);
      expect(dashboardHandler).toHaveBeenCalledWith(expectedEvent);
    });
  });

  describe('Inventory Integration', () => {
    it('should handle inventory low stock alerts across MFEs', () => {
      const kitchenHandler = jest.fn();
      const dashboardHandler = jest.fn();

      kitchenEventBus.onInventoryLowStock(kitchenHandler);
      dashboardEventBus.onInventoryLowStock(dashboardHandler);

      const inventoryBus = createEventBus('inventory-mfe');
      const lowStockPayload = {
        itemId: 'ingredient-123',
        itemName: 'Tomatoes',
        currentStock: 3,
        minimumStock: 20,
        category: 'vegetables',
        priority: 'urgent' as const
      };

      act(() => {
        inventoryBus.emitInventoryLowStock(lowStockPayload);
      });

      const expectedEvent = expect.objectContaining({
        type: 'INVENTORY_LOW_STOCK',
        payload: lowStockPayload,
        source: 'inventory-mfe'
      });

      expect(kitchenHandler).toHaveBeenCalledWith(expectedEvent);
      expect(dashboardHandler).toHaveBeenCalledWith(expectedEvent);
    });

    it('should handle inventory stock updates', () => {
      const kitchenHandler = jest.fn();
      kitchenEventBus.onInventoryStockUpdated(kitchenHandler);

      const inventoryBus = createEventBus('inventory-mfe');
      const stockUpdatePayload = {
        itemId: 'ingredient-123',
        itemName: 'Tomatoes',
        previousStock: 20,
        newStock: 15,
        updateType: 'consumption' as const,
        relatedOrderId: 'order-456'
      };

      act(() => {
        inventoryBus.emitInventoryStockUpdated(stockUpdatePayload);
      });

      expect(kitchenHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INVENTORY_STOCK_UPDATED',
          payload: stockUpdatePayload,
          source: 'inventory-mfe'
        })
      );
    });
  });

  describe('Reservation System Integration', () => {
    it('should handle reservation creation across MFEs', () => {
      const dashboardHandler = jest.fn();
      const hostingHandler = jest.fn();

      dashboardEventBus.onReservationCreated(dashboardHandler);
      const hostingBus = createEventBus('hosting-mfe');
      hostingBus.onReservationCreated(hostingHandler);

      const reservationsBus = createEventBus('reservations-mfe');
      const reservationPayload = {
        reservationId: 'res-123',
        customerName: 'John Doe',
        partySize: 4,
        date: '2022-01-15',
        time: '19:00',
        tableNumber: 5,
        specialRequests: 'Birthday celebration'
      };

      act(() => {
        reservationsBus.emitReservationCreated(reservationPayload);
      });

      const expectedEvent = expect.objectContaining({
        type: 'RESERVATION_CREATED',
        payload: reservationPayload,
        source: 'reservations-mfe'
      });

      expect(dashboardHandler).toHaveBeenCalledWith(expectedEvent);
      expect(hostingHandler).toHaveBeenCalledWith(expectedEvent);
    });

    it('should handle reservation updates', () => {
      const dashboardHandler = jest.fn();
      const hostingHandler = jest.fn();

      dashboardEventBus.onReservationUpdated(dashboardHandler);
      const hostingBus = createEventBus('hosting-mfe');
      hostingBus.onReservationUpdated(hostingHandler);

      const reservationsBus = createEventBus('reservations-mfe');
      const updates = {
        status: 'confirmed' as const,
        tableNumber: 6,
        partySize: 5
      };

      act(() => {
        reservationsBus.emitReservationUpdated('res-123', updates);
      });

      const expectedEvent = expect.objectContaining({
        type: 'RESERVATION_UPDATED',
        payload: { reservationId: 'res-123', updates },
        source: 'reservations-mfe'
      });

      expect(dashboardHandler).toHaveBeenCalledWith(expectedEvent);
      expect(hostingHandler).toHaveBeenCalledWith(expectedEvent);
    });
  });

  describe('Global State Integration with Events', () => {
    it('should integrate event bus with global notifications', () => {
      const { result: notificationsResult } = renderHook(() => useNotifications());
      const { result: restaurantEventsResult } = renderHook(() => useRestaurantEvents());

      // Setup event listener to create notifications
      act(() => {
        const unsubscribe = restaurantEventsResult.current.onInventoryLowStock((event) => {
          notificationsResult.current.showNotification({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${event.payload.itemName} is running low (${event.payload.currentStock} remaining)`,
            duration: 10000
          });
        });
      });

      // Emit inventory low stock event
      act(() => {
        restaurantEventsResult.current.emitInventoryLowStock({
          itemId: 'ingredient-123',
          itemName: 'Tomatoes',
          currentStock: 3,
          minimumStock: 20,
          category: 'vegetables',
          priority: 'urgent'
        });
      });

      // Verify notification was created
      expect(notificationsResult.current.notifications).toHaveLength(1);
      expect(notificationsResult.current.notifications[0]).toMatchObject({
        type: 'warning',
        title: 'Low Stock Alert',
        message: 'Tomatoes is running low (3 remaining)'
      });
    });

    it('should integrate authentication state with order events', () => {
      const { result: authResult } = renderHook(() => useAuth());
      const { result: restaurantEventsResult } = renderHook(() => useRestaurantEvents());

      // Login user
      act(() => {
        authResult.current.login({
          id: 'user-123',
          email: 'chef@restaurant.com',
          role: 'kitchen_staff'
        });
      });

      expect(authResult.current.isAuthenticated).toBe(true);
      expect(authResult.current.user.role).toBe('kitchen_staff');

      // Create order (authenticated context)
      act(() => {
        restaurantEventsResult.current.emitOrderCreated({
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          customerId: authResult.current.user.id,
          items: [{ menuItemId: 'item-1', quantity: 2 }],
          total: 25.99,
          type: 'DINE_IN'
        });
      });

      // Verify event was emitted with authenticated user context
      const history = restaurantEventsResult.current.getEventHistory('ORDER_CREATED');
      expect(history).toHaveLength(1);
      expect(history[0].payload.customerId).toBe('user-123');
    });
  });

  describe('Event History and Persistence', () => {
    it('should maintain event history across MFE communications', () => {
      // Simulate multiple events across different MFEs
      act(() => {
        ordersEventBus.emitOrderCreated({
          orderId: 'order-1',
          orderNumber: 'ORD-001',
          items: [],
          total: 10.99,
          type: 'TAKEOUT'
        });

        kitchenEventBus.emitOrderStatusUpdated('order-1', 'PREPARING', 'CONFIRMED');
        
        dashboardEventBus.emit('CUSTOM_DASHBOARD_EVENT', { dashboardData: 'test' });
      });

      // Check event history from different sources
      const ordersHistory = ordersEventBus.getHistory();
      const kitchenHistory = kitchenEventBus.getHistory();
      const dashboardHistory = dashboardEventBus.getHistory();

      expect(ordersHistory).toHaveLength(1);
      expect(ordersHistory[0].type).toBe('ORDER_CREATED');
      expect(ordersHistory[0].source).toBe('orders-mfe');

      expect(kitchenHistory).toHaveLength(1);
      expect(kitchenHistory[0].type).toBe('ORDER_STATUS_UPDATED');
      expect(kitchenHistory[0].source).toBe('kitchen-mfe');

      expect(dashboardHistory).toHaveLength(1);
      expect(dashboardHistory[0].type).toBe('CUSTOM_DASHBOARD_EVENT');
      expect(dashboardHistory[0].source).toBe('dashboard-mfe');
    });

    it('should filter event history by type', () => {
      act(() => {
        kitchenEventBus.emitOrderStatusUpdated('order-1', 'PREPARING', 'CONFIRMED');
        kitchenEventBus.emitOrderStatusUpdated('order-2', 'READY', 'PREPARING');
        kitchenEventBus.emitKitchenOrderUpdate('order-1', []);
      });

      const statusUpdateHistory = kitchenEventBus.getHistory('ORDER_STATUS_UPDATED');
      const allHistory = kitchenEventBus.getHistory();

      expect(statusUpdateHistory).toHaveLength(2);
      expect(allHistory).toHaveLength(3);
      expect(statusUpdateHistory.every(event => event.type === 'ORDER_STATUS_UPDATED')).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle unsubscription during event emission', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      const unsubscribe1 = kitchenEventBus.onOrderCreated(handler1);
      kitchenEventBus.onOrderCreated(handler2);

      // Unsubscribe first handler
      unsubscribe1();

      act(() => {
        kitchenEventBus.emitOrderCreated({
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          items: [],
          total: 10.99,
          type: 'TAKEOUT'
        });
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid event emissions', () => {
      const handler = jest.fn();
      kitchenEventBus.onOrderStatusUpdated(handler);

      const statuses = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'];
      
      act(() => {
        statuses.forEach((status, index) => {
          kitchenEventBus.emitOrderStatusUpdated(
            'order-123',
            status as any,
            index > 0 ? statuses[index - 1] : 'PENDING'
          );
        });
      });

      expect(handler).toHaveBeenCalledTimes(4);
      expect(handler.mock.calls.map(call => call[0].payload.status)).toEqual(statuses);
    });

    it('should isolate events between different MFE instances', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      kitchenEventBus.onOrderCreated(handler1);
      ordersEventBus.onOrderCreated(handler2);

      act(() => {
        kitchenEventBus.emitOrderCreated({
          orderId: 'order-kitchen',
          orderNumber: 'ORD-K001',
          items: [],
          total: 15.99,
          type: 'DINE_IN'
        });
      });

      // Only kitchen handler should be called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      act(() => {
        ordersEventBus.emitOrderCreated({
          orderId: 'order-orders',
          orderNumber: 'ORD-O001',
          items: [],
          total: 20.99,
          type: 'TAKEOUT'
        });
      });

      // Now orders handler should be called, kitchen handler unchanged
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
});