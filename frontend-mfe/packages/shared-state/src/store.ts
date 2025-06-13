import { create } from 'zustand';
import { GlobalState, Notification } from './types';

interface GlobalStore extends GlobalState {
  // User actions
  setUser: (user: Partial<GlobalState['user']>) => void;
  clearUser: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  // Initial state
  user: {
    id: null,
    email: null,
    role: null,
    isAuthenticated: false,
  },
  notifications: [],

  // User actions
  setUser: (userData) => {
    set((state) => ({
      user: {
        ...state.user,
        ...userData,
        isAuthenticated: Boolean(userData.id),
      },
    }));
  },

  clearUser: () => {
    set({
      user: {
        id: null,
        email: null,
        role: null,
        isAuthenticated: false,
      },
    });
  },

  // Notification actions
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      get().removeNotification(newNotification.id);
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));