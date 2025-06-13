import { useEffect, useCallback } from 'react';
import { useGlobalStore } from './store';
import { 
  eventBus, 
  RestaurantEvent, 
  MenuItemUpdatedEvent, 
  OrderCreatedEvent, 
  OrderStatusUpdatedEvent, 
  KitchenOrderUpdateEvent,
  InventoryLowStockEvent,
  InventoryStockUpdatedEvent,
  ReservationCreatedEvent,
  ReservationUpdatedEvent
} from './eventBus';

// Hook for listening to cross-MFE events
export const useEventBus = (
  eventType: string,
  handler: (event: RestaurantEvent) => void,
  deps: any[] = []
) => {
  useEffect(() => {
    const unsubscribe = eventBus.on(eventType, handler);
    return unsubscribe;
  }, deps);
};

// Hook for emitting cross-MFE events
export const useEventEmitter = () => {
  return {
    emit: (type: string, payload: any, target?: string) => eventBus.emit(type, payload, target),
  };
};

// Restaurant-specific event hooks
export const useRestaurantEvents = () => {
  const emitMenuItemUpdated = useCallback((itemId: string, updates: { available?: boolean; price?: number; name?: string }) => {
    eventBus.emitMenuItemUpdated(itemId, updates);
  }, []);

  const emitOrderCreated = useCallback((orderData: OrderCreatedEvent['payload']) => {
    eventBus.emitOrderCreated(orderData);
  }, []);

  const emitOrderStatusUpdated = useCallback((orderId: string, status: OrderStatusUpdatedEvent['payload']['status'], previousStatus: string, estimatedTime?: number) => {
    eventBus.emitOrderStatusUpdated(orderId, status, previousStatus, estimatedTime);
  }, []);

  const emitKitchenOrderUpdate = useCallback((orderId: string, itemStatuses: KitchenOrderUpdateEvent['payload']['itemStatuses']) => {
    eventBus.emitKitchenOrderUpdate(orderId, itemStatuses);
  }, []);

  const emitInventoryLowStock = useCallback((payload: InventoryLowStockEvent['payload']) => {
    eventBus.emitInventoryLowStock(payload);
  }, []);

  const emitInventoryStockUpdated = useCallback((payload: InventoryStockUpdatedEvent['payload']) => {
    eventBus.emitInventoryStockUpdated(payload);
  }, []);

  const emitReservationCreated = useCallback((payload: ReservationCreatedEvent['payload']) => {
    eventBus.emitReservationCreated(payload);
  }, []);

  const emitReservationUpdated = useCallback((reservationId: string, updates: ReservationUpdatedEvent['payload']['updates']) => {
    eventBus.emitReservationUpdated(reservationId, updates);
  }, []);

  const onMenuItemUpdated = useCallback((handler: (event: MenuItemUpdatedEvent) => void) => {
    return eventBus.onMenuItemUpdated(handler);
  }, []);

  const onOrderCreated = useCallback((handler: (event: OrderCreatedEvent) => void) => {
    return eventBus.onOrderCreated(handler);
  }, []);

  const onOrderStatusUpdated = useCallback((handler: (event: OrderStatusUpdatedEvent) => void) => {
    return eventBus.onOrderStatusUpdated(handler);
  }, []);

  const onKitchenOrderUpdate = useCallback((handler: (event: KitchenOrderUpdateEvent) => void) => {
    return eventBus.onKitchenOrderUpdate(handler);
  }, []);

  const onInventoryLowStock = useCallback((handler: (event: InventoryLowStockEvent) => void) => {
    return eventBus.onInventoryLowStock(handler);
  }, []);

  const onInventoryStockUpdated = useCallback((handler: (event: InventoryStockUpdatedEvent) => void) => {
    return eventBus.onInventoryStockUpdated(handler);
  }, []);

  const onReservationCreated = useCallback((handler: (event: ReservationCreatedEvent) => void) => {
    return eventBus.onReservationCreated(handler);
  }, []);

  const onReservationUpdated = useCallback((handler: (event: ReservationUpdatedEvent) => void) => {
    return eventBus.onReservationUpdated(handler);
  }, []);

  return {
    // Emitters
    emitMenuItemUpdated,
    emitOrderCreated,
    emitOrderStatusUpdated,
    emitKitchenOrderUpdate,
    emitInventoryLowStock,
    emitInventoryStockUpdated,
    emitReservationCreated,
    emitReservationUpdated,
    // Listeners
    onMenuItemUpdated,
    onOrderCreated,
    onOrderStatusUpdated,
    onKitchenOrderUpdate,
    onInventoryLowStock,
    onInventoryStockUpdated,
    onReservationCreated,
    onReservationUpdated,
    // Event history
    getEventHistory: eventBus.getHistory.bind(eventBus),
  };
};

// Hook for global user state
export const useAuth = () => {
  const { user, setUser, clearUser } = useGlobalStore();
  
  return {
    user,
    isAuthenticated: user.isAuthenticated,
    login: setUser,
    logout: clearUser,
  };
};

// Hook for global notifications
export const useNotifications = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useGlobalStore();
  
  return {
    notifications,
    showNotification: addNotification,
    removeNotification,
    clearNotifications,
  };
};