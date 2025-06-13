import mitt, { Emitter } from 'mitt';
import { EventBusEvent } from './types';

// Restaurant-specific event types
export interface RestaurantEvent extends EventBusEvent {
  target?: string;
}

export interface MenuItemUpdatedEvent extends RestaurantEvent {
  type: 'MENU_ITEM_UPDATED';
  payload: {
    itemId: string;
    available: boolean;
    price?: number;
    name?: string;
  };
}

export interface OrderCreatedEvent extends RestaurantEvent {
  type: 'ORDER_CREATED';
  payload: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
    items: Array<{
      menuItemId: string;
      quantity: number;
    }>;
    total: number;
    type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  };
}

export interface OrderStatusUpdatedEvent extends RestaurantEvent {
  type: 'ORDER_STATUS_UPDATED';
  payload: {
    orderId: string;
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
    previousStatus: string;
    estimatedTime?: number;
  };
}

export interface KitchenOrderUpdateEvent extends RestaurantEvent {
  type: 'KITCHEN_ORDER_UPDATE';
  payload: {
    orderId: string;
    itemStatuses: Array<{
      menuItemId: string;
      status: 'PENDING' | 'PREPARING' | 'READY';
    }>;
  };
}

class EventBus {
  private emitter: Emitter<Record<string, RestaurantEvent>>;
  private source: string;
  private eventHistory: RestaurantEvent[] = [];
  private maxHistorySize = 100;

  constructor(source: string = 'unknown') {
    this.emitter = mitt();
    this.source = source;
  }

  emit(type: string, payload: any, target?: string): void {
    const event: RestaurantEvent = {
      type,
      payload,
      timestamp: Date.now(),
      source: this.source,
      target,
    };

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] Emitting ${type} from ${this.source}:`, payload);
    }
    this.emitter.emit(type, event);
  }

  on(type: string, handler: (event: RestaurantEvent) => void): () => void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[EventBus] Registering handler for ${type} in ${this.source}`);
    }
    this.emitter.on(type, handler);
    
    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  off(type: string, handler: (event: RestaurantEvent) => void): void {
    this.emitter.off(type, handler);
  }

  clear(): void {
    this.emitter.all.clear();
    this.eventHistory = [];
  }

  getHistory(eventType?: string): RestaurantEvent[] {
    if (eventType) {
      return this.eventHistory.filter(event => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  // Convenience methods for restaurant events
  emitMenuItemUpdated(itemId: string, updates: { available?: boolean; price?: number; name?: string }) {
    this.emit('MENU_ITEM_UPDATED', { itemId, ...updates }, 'orders-mfe');
  }

  emitOrderCreated(orderData: OrderCreatedEvent['payload']) {
    this.emit('ORDER_CREATED', orderData, 'kitchen-mfe');
  }

  emitOrderStatusUpdated(orderId: string, status: OrderStatusUpdatedEvent['payload']['status'], previousStatus: string, estimatedTime?: number) {
    this.emit('ORDER_STATUS_UPDATED', { orderId, status, previousStatus, estimatedTime });
  }

  emitKitchenOrderUpdate(orderId: string, itemStatuses: KitchenOrderUpdateEvent['payload']['itemStatuses']) {
    this.emit('KITCHEN_ORDER_UPDATE', { orderId, itemStatuses }, 'orders-mfe');
  }

  // Event listener helpers
  onMenuItemUpdated(handler: (event: MenuItemUpdatedEvent) => void): () => void {
    return this.on('MENU_ITEM_UPDATED', handler as (event: RestaurantEvent) => void);
  }

  onOrderCreated(handler: (event: OrderCreatedEvent) => void): () => void {
    return this.on('ORDER_CREATED', handler as (event: RestaurantEvent) => void);
  }

  onOrderStatusUpdated(handler: (event: OrderStatusUpdatedEvent) => void): () => void {
    return this.on('ORDER_STATUS_UPDATED', handler as (event: RestaurantEvent) => void);
  }

  onKitchenOrderUpdate(handler: (event: KitchenOrderUpdateEvent) => void): () => void {
    return this.on('KITCHEN_ORDER_UPDATE', handler as (event: RestaurantEvent) => void);
  }
}

// Global event bus instance
export const eventBus = new EventBus('global');

// Factory function for creating MFE-specific event buses
export const createEventBus = (source: string): EventBus => {
  return new EventBus(source);
};