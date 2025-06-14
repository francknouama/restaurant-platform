import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  useEventBus,
  useEventEmitter,
  useRestaurantEvents,
  useAuth,
  useNotifications
} from '../hooks';
import { eventBus, createEventBus, RestaurantEvent } from '../eventBus';
import { useGlobalStore } from '../store';

// Mock eventBus for isolation
jest.mock('../eventBus', () => {
  const originalModule = jest.requireActual('../eventBus');
  return {
    ...originalModule,
    eventBus: {
      on: jest.fn(),
      emit: jest.fn(),
      emitMenuItemUpdated: jest.fn(),
      emitOrderCreated: jest.fn(),
      emitOrderStatusUpdated: jest.fn(),
      emitKitchenOrderUpdate: jest.fn(),
      emitInventoryLowStock: jest.fn(),
      emitInventoryStockUpdated: jest.fn(),
      emitReservationCreated: jest.fn(),
      emitReservationUpdated: jest.fn(),
      onMenuItemUpdated: jest.fn(),
      onOrderCreated: jest.fn(),
      onOrderStatusUpdated: jest.fn(),
      onKitchenOrderUpdate: jest.fn(),
      onInventoryLowStock: jest.fn(),
      onInventoryStockUpdated: jest.fn(),
      onReservationCreated: jest.fn(),
      onReservationUpdated: jest.fn(),
      getHistory: jest.fn()
    }
  };
});

const mockEventBus = eventBus as jest.Mocked<typeof eventBus>;

describe('Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useEventBus', () => {
    it('should subscribe to events on mount and unsubscribe on unmount', () => {
      const handler = jest.fn();
      const unsubscribeMock = jest.fn();
      mockEventBus.on.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => 
        useEventBus('TEST_EVENT', handler)
      );

      expect(mockEventBus.on).toHaveBeenCalledWith('TEST_EVENT', handler);

      unmount();
      expect(unsubscribeMock).toHaveBeenCalled();
    });

    it('should resubscribe when dependencies change', () => {
      const handler = jest.fn();
      const unsubscribeMock = jest.fn();
      mockEventBus.on.mockReturnValue(unsubscribeMock);

      const { rerender } = renderHook(({ dep }) => 
        useEventBus('TEST_EVENT', handler, [dep]),
        { initialProps: { dep: 'initial' } }
      );

      expect(mockEventBus.on).toHaveBeenCalledTimes(1);

      rerender({ dep: 'changed' });
      expect(unsubscribeMock).toHaveBeenCalled();
      expect(mockEventBus.on).toHaveBeenCalledTimes(2);
    });

    it('should not resubscribe when dependencies do not change', () => {
      const handler = jest.fn();
      const unsubscribeMock = jest.fn();
      mockEventBus.on.mockReturnValue(unsubscribeMock);

      const { rerender } = renderHook(({ dep }) => 
        useEventBus('TEST_EVENT', handler, [dep]),
        { initialProps: { dep: 'same' } }
      );

      expect(mockEventBus.on).toHaveBeenCalledTimes(1);

      rerender({ dep: 'same' });
      expect(mockEventBus.on).toHaveBeenCalledTimes(1);
      expect(unsubscribeMock).not.toHaveBeenCalled();
    });

    it('should use empty deps array by default', () => {
      const handler = jest.fn();
      const unsubscribeMock = jest.fn();
      mockEventBus.on.mockReturnValue(unsubscribeMock);

      const { rerender } = renderHook(() => 
        useEventBus('TEST_EVENT', handler)
      );

      expect(mockEventBus.on).toHaveBeenCalledTimes(1);

      // Should not resubscribe on rerender without deps
      rerender();
      expect(mockEventBus.on).toHaveBeenCalledTimes(1);
    });
  });

  describe('useEventEmitter', () => {
    it('should return emit function that calls eventBus.emit', () => {
      const { result } = renderHook(() => useEventEmitter());

      act(() => {
        result.current.emit('TEST_EVENT', { data: 'test' }, 'target-mfe');
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'TEST_EVENT',
        { data: 'test' },
        'target-mfe'
      );
    });

    it('should work without target parameter', () => {
      const { result } = renderHook(() => useEventEmitter());

      act(() => {
        result.current.emit('TEST_EVENT', { data: 'test' });
      });

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'TEST_EVENT',
        { data: 'test' },
        undefined
      );
    });
  });

  describe('useRestaurantEvents', () => {
    it('should provide all emitter functions', () => {
      const { result } = renderHook(() => useRestaurantEvents());

      expect(result.current).toHaveProperty('emitMenuItemUpdated');
      expect(result.current).toHaveProperty('emitOrderCreated');
      expect(result.current).toHaveProperty('emitOrderStatusUpdated');
      expect(result.current).toHaveProperty('emitKitchenOrderUpdate');
      expect(result.current).toHaveProperty('emitInventoryLowStock');
      expect(result.current).toHaveProperty('emitInventoryStockUpdated');
      expect(result.current).toHaveProperty('emitReservationCreated');
      expect(result.current).toHaveProperty('emitReservationUpdated');
    });

    it('should provide all listener functions', () => {
      const { result } = renderHook(() => useRestaurantEvents());

      expect(result.current).toHaveProperty('onMenuItemUpdated');
      expect(result.current).toHaveProperty('onOrderCreated');
      expect(result.current).toHaveProperty('onOrderStatusUpdated');
      expect(result.current).toHaveProperty('onKitchenOrderUpdate');
      expect(result.current).toHaveProperty('onInventoryLowStock');
      expect(result.current).toHaveProperty('onInventoryStockUpdated');
      expect(result.current).toHaveProperty('onReservationCreated');
      expect(result.current).toHaveProperty('onReservationUpdated');
    });

    it('should provide getEventHistory function', () => {
      const { result } = renderHook(() => useRestaurantEvents());
      
      expect(result.current).toHaveProperty('getEventHistory');
      expect(typeof result.current.getEventHistory).toBe('function');
    });

    describe('Emitter Functions', () => {
      it('should call emitMenuItemUpdated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        
        act(() => {
          result.current.emitMenuItemUpdated('item-123', { available: false, price: 15.99 });
        });

        expect(mockEventBus.emitMenuItemUpdated).toHaveBeenCalledWith(
          'item-123',
          { available: false, price: 15.99 }
        );
      });

      it('should call emitOrderCreated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const orderData = {
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          items: [{ menuItemId: 'item-1', quantity: 2 }],
          total: 25.99,
          type: 'DINE_IN' as const
        };
        
        act(() => {
          result.current.emitOrderCreated(orderData);
        });

        expect(mockEventBus.emitOrderCreated).toHaveBeenCalledWith(orderData);
      });

      it('should call emitOrderStatusUpdated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        
        act(() => {
          result.current.emitOrderStatusUpdated('order-123', 'PREPARING', 'CONFIRMED', 15);
        });

        expect(mockEventBus.emitOrderStatusUpdated).toHaveBeenCalledWith(
          'order-123',
          'PREPARING',
          'CONFIRMED',
          15
        );
      });

      it('should call emitKitchenOrderUpdate correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const itemStatuses = [
          { menuItemId: 'item-1', status: 'PREPARING' as const }
        ];
        
        act(() => {
          result.current.emitKitchenOrderUpdate('order-123', itemStatuses);
        });

        expect(mockEventBus.emitKitchenOrderUpdate).toHaveBeenCalledWith(
          'order-123',
          itemStatuses
        );
      });

      it('should call emitInventoryLowStock correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const payload = {
          itemId: 'ingredient-123',
          itemName: 'Tomatoes',
          currentStock: 5,
          minimumStock: 20,
          category: 'vegetables',
          priority: 'urgent' as const
        };
        
        act(() => {
          result.current.emitInventoryLowStock(payload);
        });

        expect(mockEventBus.emitInventoryLowStock).toHaveBeenCalledWith(payload);
      });

      it('should call emitInventoryStockUpdated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const payload = {
          itemId: 'ingredient-123',
          itemName: 'Tomatoes',
          previousStock: 20,
          newStock: 15,
          updateType: 'consumption' as const
        };
        
        act(() => {
          result.current.emitInventoryStockUpdated(payload);
        });

        expect(mockEventBus.emitInventoryStockUpdated).toHaveBeenCalledWith(payload);
      });

      it('should call emitReservationCreated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const payload = {
          reservationId: 'res-123',
          customerName: 'John Doe',
          partySize: 4,
          date: '2022-01-15',
          time: '19:00'
        };
        
        act(() => {
          result.current.emitReservationCreated(payload);
        });

        expect(mockEventBus.emitReservationCreated).toHaveBeenCalledWith(payload);
      });

      it('should call emitReservationUpdated correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const updates = { status: 'confirmed' as const, tableNumber: 6 };
        
        act(() => {
          result.current.emitReservationUpdated('res-123', updates);
        });

        expect(mockEventBus.emitReservationUpdated).toHaveBeenCalledWith(
          'res-123',
          updates
        );
      });
    });

    describe('Listener Functions', () => {
      it('should call event bus listener methods correctly', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const handler = jest.fn();

        act(() => {
          result.current.onMenuItemUpdated(handler);
        });
        expect(mockEventBus.onMenuItemUpdated).toHaveBeenCalledWith(handler);

        act(() => {
          result.current.onOrderCreated(handler);
        });
        expect(mockEventBus.onOrderCreated).toHaveBeenCalledWith(handler);

        act(() => {
          result.current.onOrderStatusUpdated(handler);
        });
        expect(mockEventBus.onOrderStatusUpdated).toHaveBeenCalledWith(handler);

        act(() => {
          result.current.onKitchenOrderUpdate(handler);
        });
        expect(mockEventBus.onKitchenOrderUpdate).toHaveBeenCalledWith(handler);
      });

      it('should return unsubscribe functions from listeners', () => {
        const { result } = renderHook(() => useRestaurantEvents());
        const unsubscribeMock = jest.fn();
        mockEventBus.onMenuItemUpdated.mockReturnValue(unsubscribeMock);

        let unsubscribe: (() => void) | undefined;
        act(() => {
          unsubscribe = result.current.onMenuItemUpdated(jest.fn());
        });

        expect(unsubscribe).toBe(unsubscribeMock);
      });
    });

    it('should maintain referential stability of functions', () => {
      const { result, rerender } = renderHook(() => useRestaurantEvents());
      
      const firstRenderEmit = result.current.emitMenuItemUpdated;
      const firstRenderListen = result.current.onMenuItemUpdated;

      rerender();

      expect(result.current.emitMenuItemUpdated).toBe(firstRenderEmit);
      expect(result.current.onMenuItemUpdated).toBe(firstRenderListen);
    });

    it('should call getEventHistory correctly', () => {
      const { result } = renderHook(() => useRestaurantEvents());
      const mockHistory = [{ type: 'TEST', payload: {}, timestamp: 123, source: 'test' }];
      mockEventBus.getHistory.mockReturnValue(mockHistory);

      let history: any;
      act(() => {
        history = result.current.getEventHistory('TEST_EVENT');
      });

      expect(mockEventBus.getHistory).toHaveBeenCalledWith('TEST_EVENT');
      expect(history).toBe(mockHistory);
    });
  });

  describe('useAuth', () => {
    beforeEach(() => {
      // Reset store state
      const { result } = renderHook(() => useGlobalStore());
      act(() => {
        result.current.clearUser();
      });
    });

    it('should return user state and authentication status', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual({
        id: null,
        email: null,
        role: null,
        isAuthenticated: false
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should provide login function that sets user data', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login({
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin'
        });
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'admin',
        isAuthenticated: true
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should provide logout function that clears user data', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login({
          id: 'user-123',
          email: 'test@example.com'
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toEqual({
        id: null,
        email: null,
        role: null,
        isAuthenticated: false
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should update isAuthenticated based on user state', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login({ id: 'user-123' });
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.login({ id: null });
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle partial user updates', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login({
          id: 'user-123',
          email: 'original@example.com',
          role: 'user'
        });
      });

      act(() => {
        result.current.login({ role: 'admin' });
      });

      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'original@example.com',
        role: 'admin',
        isAuthenticated: true
      });
    });

    it('should maintain state across rerenders', () => {
      const { result, rerender } = renderHook(() => useAuth());

      act(() => {
        result.current.login({
          id: 'user-123',
          email: 'test@example.com'
        });
      });

      rerender();

      expect(result.current.user.id).toBe('user-123');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('useNotifications', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Reset store state
      const { result } = renderHook(() => useGlobalStore());
      act(() => {
        result.current.clearNotifications();
      });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return empty notifications array initially', () => {
      const { result } = renderHook(() => useNotifications());

      expect(result.current.notifications).toEqual([]);
    });

    it('should provide showNotification function that adds notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({
          type: 'success',
          title: 'Success Message',
          message: 'Operation completed successfully'
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0]).toMatchObject({
        type: 'success',
        title: 'Success Message',
        message: 'Operation completed successfully'
      });
    });

    it('should provide removeNotification function', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({
          type: 'info',
          title: 'Test Notification'
        });
      });

      const notificationId = result.current.notifications[0].id;

      act(() => {
        result.current.removeNotification(notificationId);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should provide clearNotifications function', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({ type: 'info', title: 'Notification 1' });
        result.current.showNotification({ type: 'success', title: 'Notification 2' });
      });

      expect(result.current.notifications).toHaveLength(2);

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should handle multiple notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({ type: 'info', title: 'Info' });
        result.current.showNotification({ type: 'success', title: 'Success' });
        result.current.showNotification({ type: 'warning', title: 'Warning' });
        result.current.showNotification({ type: 'error', title: 'Error' });
      });

      expect(result.current.notifications).toHaveLength(4);
      expect(result.current.notifications.map(n => n.type)).toEqual([
        'info', 'success', 'warning', 'error'
      ]);
    });

    it('should auto-remove notifications after duration', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({
          type: 'info',
          title: 'Auto Remove',
          duration: 2000
        });
      });

      expect(result.current.notifications).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('should maintain state across rerenders', () => {
      const { result, rerender } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({
          type: 'info',
          title: 'Persistent Notification'
        });
      });

      rerender();

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Persistent Notification');
    });

    it('should generate unique IDs for notifications', () => {
      const { result } = renderHook(() => useNotifications());

      act(() => {
        result.current.showNotification({ type: 'info', title: 'First' });
        result.current.showNotification({ type: 'info', title: 'Second' });
      });

      const ids = result.current.notifications.map(n => n.id);
      expect(ids[0]).not.toBe(ids[1]);
      expect(ids[0]).toMatch(/^notification_\d+$/);
      expect(ids[1]).toMatch(/^notification_\d+$/);
    });
  });
});