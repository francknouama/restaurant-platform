import {
  EventBusEvent,
  GlobalState,
  Notification
} from '../types';
import {
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

describe('Type Safety Tests', () => {
  describe('EventBusEvent Interface', () => {
    it('should define correct base event structure', () => {
      const event: EventBusEvent = {
        type: 'TEST_EVENT',
        payload: { data: 'test' },
        timestamp: Date.now(),
        source: 'test-source'
      };

      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('payload');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('source');
      expect(typeof event.type).toBe('string');
      expect(typeof event.timestamp).toBe('number');
      expect(typeof event.source).toBe('string');
    });

    it('should allow any payload type', () => {
      const events: EventBusEvent[] = [
        {
          type: 'STRING_PAYLOAD',
          payload: 'string data',
          timestamp: Date.now(),
          source: 'test'
        },
        {
          type: 'OBJECT_PAYLOAD',
          payload: { nested: { data: 'object' } },
          timestamp: Date.now(),
          source: 'test'
        },
        {
          type: 'NUMBER_PAYLOAD',
          payload: 42,
          timestamp: Date.now(),
          source: 'test'
        },
        {
          type: 'ARRAY_PAYLOAD',
          payload: [1, 2, 3],
          timestamp: Date.now(),
          source: 'test'
        },
        {
          type: 'NULL_PAYLOAD',
          payload: null,
          timestamp: Date.now(),
          source: 'test'
        }
      ];

      events.forEach(event => {
        expect(event).toHaveProperty('type');
        expect(event).toHaveProperty('payload');
        expect(event).toHaveProperty('timestamp');
        expect(event).toHaveProperty('source');
      });
    });
  });

  describe('GlobalState Interface', () => {
    it('should define correct user state structure', () => {
      const globalState: GlobalState = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'admin',
          isAuthenticated: true
        },
        notifications: []
      };

      expect(globalState.user).toHaveProperty('id');
      expect(globalState.user).toHaveProperty('email');
      expect(globalState.user).toHaveProperty('role');
      expect(globalState.user).toHaveProperty('isAuthenticated');
      expect(Array.isArray(globalState.notifications)).toBe(true);
    });

    it('should allow null values for user properties', () => {
      const globalState: GlobalState = {
        user: {
          id: null,
          email: null,
          role: null,
          isAuthenticated: false
        },
        notifications: []
      };

      expect(globalState.user.id).toBeNull();
      expect(globalState.user.email).toBeNull();
      expect(globalState.user.role).toBeNull();
      expect(globalState.user.isAuthenticated).toBe(false);
    });

    it('should contain notifications array', () => {
      const notifications: Notification[] = [
        {
          id: 'notif-1',
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
          duration: 5000,
          timestamp: Date.now()
        }
      ];

      const globalState: GlobalState = {
        user: {
          id: null,
          email: null,
          role: null,
          isAuthenticated: false
        },
        notifications
      };

      expect(globalState.notifications).toBe(notifications);
      expect(globalState.notifications).toHaveLength(1);
    });
  });

  describe('Notification Interface', () => {
    it('should define correct notification structure', () => {
      const notification: Notification = {
        id: 'notification-123',
        type: 'success',
        title: 'Success Title',
        message: 'Success message',
        duration: 3000,
        timestamp: Date.now()
      };

      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('duration');
      expect(notification).toHaveProperty('timestamp');
      expect(typeof notification.id).toBe('string');
      expect(typeof notification.title).toBe('string');
      expect(typeof notification.timestamp).toBe('number');
    });

    it('should enforce notification type values', () => {
      const validTypes: Array<Notification['type']> = ['info', 'success', 'warning', 'error'];
      
      validTypes.forEach(type => {
        const notification: Notification = {
          id: `notification-${type}`,
          type,
          title: `${type} notification`,
          timestamp: Date.now()
        };
        
        expect(notification.type).toBe(type);
      });
    });

    it('should allow optional message and duration', () => {
      const notificationWithoutOptionals: Notification = {
        id: 'notification-1',
        type: 'info',
        title: 'Title Only',
        timestamp: Date.now()
      };

      const notificationWithOptionals: Notification = {
        id: 'notification-2',
        type: 'error',
        title: 'Title with extras',
        message: 'Error message',
        duration: 10000,
        timestamp: Date.now()
      };

      expect(notificationWithoutOptionals.message).toBeUndefined();
      expect(notificationWithoutOptionals.duration).toBeUndefined();
      expect(notificationWithOptionals.message).toBe('Error message');
      expect(notificationWithOptionals.duration).toBe(10000);
    });
  });

  describe('RestaurantEvent Interface Extension', () => {
    it('should extend EventBusEvent with optional target', () => {
      const restaurantEvent: RestaurantEvent = {
        type: 'RESTAURANT_EVENT',
        payload: { data: 'restaurant specific' },
        timestamp: Date.now(),
        source: 'restaurant-app',
        target: 'kitchen-mfe'
      };

      expect(restaurantEvent).toHaveProperty('target');
      expect(restaurantEvent.target).toBe('kitchen-mfe');
    });

    it('should allow target to be undefined', () => {
      const restaurantEvent: RestaurantEvent = {
        type: 'RESTAURANT_EVENT',
        payload: { data: 'restaurant specific' },
        timestamp: Date.now(),
        source: 'restaurant-app'
      };

      expect(restaurantEvent.target).toBeUndefined();
    });
  });

  describe('Specific Restaurant Event Types', () => {
    it('should enforce MenuItemUpdatedEvent structure', () => {
      const event: MenuItemUpdatedEvent = {
        type: 'MENU_ITEM_UPDATED',
        payload: {
          itemId: 'item-123',
          available: false,
          price: 15.99,
          name: 'Updated Item Name'
        },
        timestamp: Date.now(),
        source: 'menu-mfe',
        target: 'orders-mfe'
      };

      expect(event.type).toBe('MENU_ITEM_UPDATED');
      expect(event.payload).toHaveProperty('itemId');
      expect(typeof event.payload.itemId).toBe('string');
      expect(typeof event.payload.available).toBe('boolean');
      expect(typeof event.payload.price).toBe('number');
      expect(typeof event.payload.name).toBe('string');
    });

    it('should enforce OrderCreatedEvent structure', () => {
      const event: OrderCreatedEvent = {
        type: 'ORDER_CREATED',
        payload: {
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          customerId: 'customer-456',
          items: [
            { menuItemId: 'item-1', quantity: 2 },
            { menuItemId: 'item-2', quantity: 1 }
          ],
          total: 45.98,
          type: 'DINE_IN'
        },
        timestamp: Date.now(),
        source: 'orders-mfe',
        target: 'kitchen-mfe'
      };

      expect(event.type).toBe('ORDER_CREATED');
      expect(event.payload.type).toBe('DINE_IN');
      expect(Array.isArray(event.payload.items)).toBe(true);
      expect(event.payload.items[0]).toHaveProperty('menuItemId');
      expect(event.payload.items[0]).toHaveProperty('quantity');
    });

    it('should enforce OrderStatusUpdatedEvent structure', () => {
      const validStatuses: Array<OrderStatusUpdatedEvent['payload']['status']> = [
        'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'
      ];

      validStatuses.forEach(status => {
        const event: OrderStatusUpdatedEvent = {
          type: 'ORDER_STATUS_UPDATED',
          payload: {
            orderId: 'order-123',
            status,
            previousStatus: 'PENDING',
            estimatedTime: 15
          },
          timestamp: Date.now(),
          source: 'kitchen-mfe'
        };

        expect(event.payload.status).toBe(status);
        expect(typeof event.payload.estimatedTime).toBe('number');
      });
    });

    it('should enforce KitchenOrderUpdateEvent structure', () => {
      const event: KitchenOrderUpdateEvent = {
        type: 'KITCHEN_ORDER_UPDATE',
        payload: {
          orderId: 'order-123',
          itemStatuses: [
            { menuItemId: 'item-1', status: 'PREPARING' },
            { menuItemId: 'item-2', status: 'READY' }
          ]
        },
        timestamp: Date.now(),
        source: 'kitchen-mfe',
        target: 'orders-mfe'
      };

      expect(event.type).toBe('KITCHEN_ORDER_UPDATE');
      expect(Array.isArray(event.payload.itemStatuses)).toBe(true);
      expect(event.payload.itemStatuses[0].status).toBe('PREPARING');
      expect(event.payload.itemStatuses[1].status).toBe('READY');
    });

    it('should enforce InventoryLowStockEvent structure', () => {
      const priorities: Array<InventoryLowStockEvent['payload']['priority']> = [
        'urgent', 'high', 'medium', 'low'
      ];

      priorities.forEach(priority => {
        const event: InventoryLowStockEvent = {
          type: 'INVENTORY_LOW_STOCK',
          payload: {
            itemId: 'ingredient-123',
            itemName: 'Tomatoes',
            currentStock: 5,
            minimumStock: 20,
            category: 'vegetables',
            priority
          },
          timestamp: Date.now(),
          source: 'inventory-mfe'
        };

        expect(event.payload.priority).toBe(priority);
        expect(typeof event.payload.currentStock).toBe('number');
        expect(typeof event.payload.minimumStock).toBe('number');
      });
    });

    it('should enforce InventoryStockUpdatedEvent structure', () => {
      const updateTypes: Array<InventoryStockUpdatedEvent['payload']['updateType']> = [
        'consumption', 'delivery', 'adjustment', 'purchase_order'
      ];

      updateTypes.forEach(updateType => {
        const event: InventoryStockUpdatedEvent = {
          type: 'INVENTORY_STOCK_UPDATED',
          payload: {
            itemId: 'ingredient-123',
            itemName: 'Tomatoes',
            previousStock: 20,
            newStock: 15,
            updateType,
            relatedOrderId: 'order-456'
          },
          timestamp: Date.now(),
          source: 'inventory-mfe',
          target: 'kitchen-mfe'
        };

        expect(event.payload.updateType).toBe(updateType);
        expect(typeof event.payload.previousStock).toBe('number');
        expect(typeof event.payload.newStock).toBe('number');
      });
    });

    it('should enforce ReservationCreatedEvent structure', () => {
      const event: ReservationCreatedEvent = {
        type: 'RESERVATION_CREATED',
        payload: {
          reservationId: 'res-123',
          customerName: 'John Doe',
          partySize: 4,
          date: '2022-01-15',
          time: '19:00',
          tableNumber: 5,
          specialRequests: 'Birthday celebration'
        },
        timestamp: Date.now(),
        source: 'reservations-mfe',
        target: 'dashboard-mfe'
      };

      expect(event.type).toBe('RESERVATION_CREATED');
      expect(typeof event.payload.partySize).toBe('number');
      expect(typeof event.payload.tableNumber).toBe('number');
      expect(typeof event.payload.date).toBe('string');
      expect(typeof event.payload.time).toBe('string');
    });

    it('should enforce ReservationUpdatedEvent structure', () => {
      const statuses: Array<ReservationUpdatedEvent['payload']['updates']['status']> = [
        'pending', 'confirmed', 'cancelled', 'completed', 'noshow'
      ];

      statuses.forEach(status => {
        const event: ReservationUpdatedEvent = {
          type: 'RESERVATION_UPDATED',
          payload: {
            reservationId: 'res-123',
            updates: {
              status,
              tableNumber: 6,
              partySize: 5,
              time: '20:00'
            }
          },
          timestamp: Date.now(),
          source: 'reservations-mfe'
        };

        expect(event.payload.updates.status).toBe(status);
        expect(typeof event.payload.updates.tableNumber).toBe('number');
        expect(typeof event.payload.updates.partySize).toBe('number');
      });
    });
  });

  describe('Type Compatibility and Extension', () => {
    it('should allow RestaurantEvent to be used as EventBusEvent', () => {
      const restaurantEvent: RestaurantEvent = {
        type: 'RESTAURANT_SPECIFIC',
        payload: { data: 'test' },
        timestamp: Date.now(),
        source: 'test-source',
        target: 'test-target'
      };

      const eventBusEvent: EventBusEvent = restaurantEvent;
      
      expect(eventBusEvent.type).toBe(restaurantEvent.type);
      expect(eventBusEvent.payload).toBe(restaurantEvent.payload);
      expect(eventBusEvent.timestamp).toBe(restaurantEvent.timestamp);
      expect(eventBusEvent.source).toBe(restaurantEvent.source);
    });

    it('should allow specific restaurant events to be used as RestaurantEvent', () => {
      const menuEvent: MenuItemUpdatedEvent = {
        type: 'MENU_ITEM_UPDATED',
        payload: { itemId: 'item-1', available: true },
        timestamp: Date.now(),
        source: 'menu-mfe'
      };

      const restaurantEvent: RestaurantEvent = menuEvent;
      
      expect(restaurantEvent.type).toBe('MENU_ITEM_UPDATED');
      expect(restaurantEvent.payload).toEqual({ itemId: 'item-1', available: true });
    });

    it('should maintain type safety for event handlers', () => {
      const menuHandler = (event: MenuItemUpdatedEvent) => {
        expect(event.type).toBe('MENU_ITEM_UPDATED');
        expect(event.payload).toHaveProperty('itemId');
        return event.payload.itemId;
      };

      const orderHandler = (event: OrderCreatedEvent) => {
        expect(event.type).toBe('ORDER_CREATED');
        expect(event.payload).toHaveProperty('orderId');
        expect(event.payload).toHaveProperty('total');
        return event.payload.orderId;
      };

      const menuEvent: MenuItemUpdatedEvent = {
        type: 'MENU_ITEM_UPDATED',
        payload: { itemId: 'item-123', available: false },
        timestamp: Date.now(),
        source: 'test'
      };

      const orderEvent: OrderCreatedEvent = {
        type: 'ORDER_CREATED',
        payload: {
          orderId: 'order-123',
          orderNumber: 'ORD-001',
          items: [],
          total: 25.99,
          type: 'TAKEOUT'
        },
        timestamp: Date.now(),
        source: 'test'
      };

      expect(menuHandler(menuEvent)).toBe('item-123');
      expect(orderHandler(orderEvent)).toBe('order-123');
    });
  });
});