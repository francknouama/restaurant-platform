import { useEffect } from 'react';
import { useGlobalStore } from './store';
import { eventBus } from './eventBus';
import { EventBusEvent } from './types';

// Hook for listening to cross-MFE events
export const useEventBus = (
  eventType: string,
  handler: (event: EventBusEvent) => void,
  deps: any[] = []
) => {
  useEffect(() => {
    eventBus.on(eventType, handler);
    
    return () => {
      eventBus.off(eventType, handler);
    };
  }, deps);
};

// Hook for emitting cross-MFE events
export const useEventEmitter = () => {
  return {
    emit: (type: string, payload: any) => eventBus.emit(type, payload),
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