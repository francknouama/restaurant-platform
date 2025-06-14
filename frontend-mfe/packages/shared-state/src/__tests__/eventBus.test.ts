import {
  EventBus,
  eventBus,
  createEventBus,
  RestaurantEvent,
  MenuItemUpdatedEvent,
  OrderCreatedEvent,
  OrderStatusUpdatedEvent,
  KitchenOrderUpdateEvent,
  InventoryLowStockEvent,
  InventoryStockUpdatedEvent,
  ReservationCreatedEvent,
  ReservationUpdatedEvent
} from '../eventBus';

describe('EventBus', () => {
  let testEventBus: EventBus;

  beforeEach(() => {
    testEventBus = createEventBus('test-source');
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    testEventBus.clear();
    jest.useRealTimers();
  });

  describe('Basic EventBus functionality', () => {
    it('should create EventBus with correct source', () => {
      const bus = createEventBus('test-app');
      expect(bus).toBeInstanceOf(EventBus);
    });

    it('should emit events with correct structure', () => {
      const handler = jest.fn();
      const payload = { test: 'data' };

      testEventBus.on('TEST_EVENT', handler);
      testEventBus.emit('TEST_EVENT', payload, 'target-app');

      expect(handler).toHaveBeenCalledWith({
        type: 'TEST_EVENT',
        payload,
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'target-app'
      });
    });

    it('should emit events without target', () => {
      const handler = jest.fn();
      const payload = { test: 'data' };

      testEventBus.on('TEST_EVENT', handler);
      testEventBus.emit('TEST_EVENT', payload);

      expect(handler).toHaveBeenCalledWith({
        type: 'TEST_EVENT',
        payload,
        timestamp: 1640995200000,
        source: 'test-source',
        target: undefined
      });
    });

    it('should handle multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const payload = { test: 'data' };

      testEventBus.on('TEST_EVENT', handler1);
      testEventBus.on('TEST_EVENT', handler2);
      testEventBus.emit('TEST_EVENT', payload);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers after unsubscription', () => {
      const handler = jest.fn();
      const unsubscribe = testEventBus.on('TEST_EVENT', handler);

      testEventBus.emit('TEST_EVENT', { test: 'data' });
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      testEventBus.emit('TEST_EVENT', { test: 'data' });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remove specific handlers with off method', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      testEventBus.on('TEST_EVENT', handler1);
      testEventBus.on('TEST_EVENT', handler2);

      testEventBus.off('TEST_EVENT', handler1);
      testEventBus.emit('TEST_EVENT', { test: 'data' });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should clear all handlers and history', () => {
      const handler = jest.fn();
      testEventBus.on('TEST_EVENT', handler);
      testEventBus.emit('TEST_EVENT', { test: 'data' });

      expect(testEventBus.getHistory()).toHaveLength(1);

      testEventBus.clear();
      testEventBus.emit('TEST_EVENT', { test: 'data' });

      expect(handler).toHaveBeenCalledTimes(1); // Only the first call
      expect(testEventBus.getHistory()).toHaveLength(0);
    });
  });

  describe('Event History Management', () => {
    it('should store events in history', () => {
      testEventBus.emit('TEST_EVENT_1', { data: 1 });
      testEventBus.emit('TEST_EVENT_2', { data: 2 });

      const history = testEventBus.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].type).toBe('TEST_EVENT_1');
      expect(history[1].type).toBe('TEST_EVENT_2');
    });

    it('should filter history by event type', () => {
      testEventBus.emit('TEST_EVENT_1', { data: 1 });
      testEventBus.emit('TEST_EVENT_2', { data: 2 });
      testEventBus.emit('TEST_EVENT_1', { data: 3 });

      const filteredHistory = testEventBus.getHistory('TEST_EVENT_1');
      expect(filteredHistory).toHaveLength(2);
      expect(filteredHistory[0].payload.data).toBe(1);
      expect(filteredHistory[1].payload.data).toBe(3);
    });

    it('should return copy of history array', () => {
      testEventBus.emit('TEST_EVENT', { data: 1 });
      const history1 = testEventBus.getHistory();
      const history2 = testEventBus.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('should limit history size to max 100 events', () => {
      // Emit 105 events
      for (let i = 0; i < 105; i++) {
        testEventBus.emit('TEST_EVENT', { index: i });
      }

      const history = testEventBus.getHistory();
      expect(history).toHaveLength(100);
      expect(history[0].payload.index).toBe(5); // First 5 should be removed
      expect(history[99].payload.index).toBe(104);
    });
  });

  describe('Development Logging', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should log events in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      testEventBus.emit('TEST_EVENT', { test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventBus] Emitting TEST_EVENT from test-source:',
        { test: 'data' }
      );
    });

    it('should log handler registration in development mode', () => {
      process.env.NODE_ENV = 'development';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      testEventBus.on('TEST_EVENT', jest.fn());

      expect(consoleSpy).toHaveBeenCalledWith(
        '[EventBus] Registering handler for TEST_EVENT in test-source'
      );
    });

    it('should not log in production mode', () => {
      process.env.NODE_ENV = 'production';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      testEventBus.emit('TEST_EVENT', { test: 'data' });
      testEventBus.on('TEST_EVENT', jest.fn());

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('Restaurant-specific Event Emitters', () => {
    it('should emit menu item updated event', () => {
      const handler = jest.fn();
      testEventBus.onMenuItemUpdated(handler);

      const updates = { available: false, price: 15.99, name: 'Updated Item' };
      testEventBus.emitMenuItemUpdated('item-123', updates);

      expect(handler).toHaveBeenCalledWith({
        type: 'MENU_ITEM_UPDATED',
        payload: { itemId: 'item-123', ...updates },
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'orders-mfe'
      });
    });

    it('should emit order created event', () => {
      const handler = jest.fn();
      testEventBus.onOrderCreated(handler);

      const orderData = {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        customerId: 'customer-456',
        items: [{ menuItemId: 'item-1', quantity: 2 }],
        total: 25.99,
        type: 'DINE_IN' as const
      };
      testEventBus.emitOrderCreated(orderData);

      expect(handler).toHaveBeenCalledWith({
        type: 'ORDER_CREATED',
        payload: orderData,
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'kitchen-mfe'
      });
    });

    it('should emit order status updated event', () => {
      const handler = jest.fn();
      testEventBus.onOrderStatusUpdated(handler);

      testEventBus.emitOrderStatusUpdated('order-123', 'PREPARING', 'CONFIRMED', 15);

      expect(handler).toHaveBeenCalledWith({
        type: 'ORDER_STATUS_UPDATED',
        payload: {
          orderId: 'order-123',
          status: 'PREPARING',
          previousStatus: 'CONFIRMED',
          estimatedTime: 15
        },
        timestamp: 1640995200000,
        source: 'test-source',
        target: undefined
      });
    });

    it('should emit kitchen order update event', () => {
      const handler = jest.fn();
      testEventBus.onKitchenOrderUpdate(handler);

      const itemStatuses = [
        { menuItemId: 'item-1', status: 'PREPARING' as const },
        { menuItemId: 'item-2', status: 'READY' as const }
      ];
      testEventBus.emitKitchenOrderUpdate('order-123', itemStatuses);

      expect(handler).toHaveBeenCalledWith({
        type: 'KITCHEN_ORDER_UPDATE',
        payload: { orderId: 'order-123', itemStatuses },
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'orders-mfe'
      });
    });

    it('should emit inventory low stock event', () => {
      const handler = jest.fn();
      testEventBus.onInventoryLowStock(handler);

      const payload = {
        itemId: 'ingredient-123',
        itemName: 'Tomatoes',
        currentStock: 5,
        minimumStock: 20,
        category: 'vegetables',
        priority: 'urgent' as const
      };
      testEventBus.emitInventoryLowStock(payload);

      expect(handler).toHaveBeenCalledWith({
        type: 'INVENTORY_LOW_STOCK',
        payload,
        timestamp: 1640995200000,
        source: 'test-source',
        target: undefined
      });
    });

    it('should emit inventory stock updated event', () => {
      const handler = jest.fn();
      testEventBus.onInventoryStockUpdated(handler);

      const payload = {
        itemId: 'ingredient-123',
        itemName: 'Tomatoes',
        previousStock: 20,
        newStock: 15,
        updateType: 'consumption' as const,
        relatedOrderId: 'order-456'
      };
      testEventBus.emitInventoryStockUpdated(payload);

      expect(handler).toHaveBeenCalledWith({
        type: 'INVENTORY_STOCK_UPDATED',
        payload,
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'kitchen-mfe'
      });
    });

    it('should emit reservation created event', () => {
      const handler = jest.fn();
      testEventBus.onReservationCreated(handler);

      const payload = {
        reservationId: 'res-123',
        customerName: 'John Doe',
        partySize: 4,
        date: '2022-01-15',
        time: '19:00',
        tableNumber: 5,
        specialRequests: 'Birthday celebration'
      };
      testEventBus.emitReservationCreated(payload);

      expect(handler).toHaveBeenCalledWith({
        type: 'RESERVATION_CREATED',
        payload,
        timestamp: 1640995200000,
        source: 'test-source',
        target: 'dashboard-mfe'
      });
    });

    it('should emit reservation updated event', () => {
      const handler = jest.fn();
      testEventBus.onReservationUpdated(handler);

      const updates = {
        status: 'confirmed' as const,
        tableNumber: 6,
        partySize: 5
      };
      testEventBus.emitReservationUpdated('res-123', updates);

      expect(handler).toHaveBeenCalledWith({
        type: 'RESERVATION_UPDATED',
        payload: { reservationId: 'res-123', updates },
        timestamp: 1640995200000,
        source: 'test-source',
        target: undefined
      });
    });
  });

  describe('Global Event Bus Instance', () => {
    it('should provide global event bus instance', () => {
      expect(eventBus).toBeInstanceOf(EventBus);
    });

    it('should create separate instances with factory', () => {
      const bus1 = createEventBus('app1');
      const bus2 = createEventBus('app2');

      expect(bus1).not.toBe(bus2);
      expect(bus1).not.toBe(eventBus);
    });

    it('should isolate events between instances', () => {
      const bus1 = createEventBus('app1');
      const bus2 = createEventBus('app2');
      
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      bus1.on('TEST_EVENT', handler1);
      bus2.on('TEST_EVENT', handler2);

      bus1.emit('TEST_EVENT', { data: 'from-bus1' });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('Type Safety and Event Validation', () => {
    it('should handle events with proper typing', () => {
      const menuHandler = jest.fn<void, [MenuItemUpdatedEvent]>();
      const orderHandler = jest.fn<void, [OrderCreatedEvent]>();

      testEventBus.onMenuItemUpdated(menuHandler);
      testEventBus.onOrderCreated(orderHandler);

      testEventBus.emitMenuItemUpdated('item-1', { available: true });
      testEventBus.emitOrderCreated({
        orderId: 'order-1',
        orderNumber: 'ORD-001',
        items: [],
        total: 0,
        type: 'TAKEOUT'
      });

      expect(menuHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MENU_ITEM_UPDATED',
          payload: expect.objectContaining({ itemId: 'item-1', available: true })
        })
      );

      expect(orderHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ORDER_CREATED',
          payload: expect.objectContaining({ orderId: 'order-1' })
        })
      );
    });

    it('should maintain event structure consistency', () => {
      const handler = jest.fn();
      testEventBus.on('CUSTOM_EVENT', handler);
      
      testEventBus.emit('CUSTOM_EVENT', { custom: 'data' }, 'target');

      const event = handler.mock.calls[0][0] as RestaurantEvent;
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('source');
      expect(event).toHaveProperty('target');
      expect(typeof event.timestamp).toBe('number');
    });
  });
});