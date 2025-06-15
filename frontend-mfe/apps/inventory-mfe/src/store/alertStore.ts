import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { InventoryAlert, AlertState } from './types';
import InventoryService from '../services/inventoryService';

interface AlertStore extends AlertState {
  // Actions
  fetchAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string) => void;
  markAllAsRead: () => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAlertStore = create<AlertStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      alerts: [],
      loading: false,
      error: null,
      unreadCount: 0,

      // Actions
      fetchAlerts: async () => {
        set({ loading: true, error: null });
        try {
          const alerts = await InventoryService.getStockAlerts();
          const unreadCount = alerts.filter(alert => alert.status === 'active').length;
          
          set({ 
            alerts, 
            unreadCount,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch alerts',
            loading: false 
          });
        }
      },

      acknowledgeAlert: (alertId: string) => {
        const { alerts } = get();
        const updatedAlerts = alerts.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged' as const }
            : alert
        );
        
        const unreadCount = updatedAlerts.filter(alert => alert.status === 'active').length;
        
        set({ 
          alerts: updatedAlerts,
          unreadCount 
        });
        
        // TODO: Send acknowledgment to backend
        // await InventoryService.acknowledgeAlert(alertId);
      },

      dismissAlert: (alertId: string) => {
        const { alerts } = get();
        const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
        const unreadCount = updatedAlerts.filter(alert => alert.status === 'active').length;
        
        set({ 
          alerts: updatedAlerts,
          unreadCount 
        });
        
        // TODO: Send dismissal to backend if needed
      },

      markAllAsRead: () => {
        const { alerts } = get();
        const updatedAlerts = alerts.map(alert => ({
          ...alert,
          status: 'acknowledged' as const
        }));
        
        set({ 
          alerts: updatedAlerts,
          unreadCount: 0 
        });
        
        // TODO: Send bulk acknowledgment to backend
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      }
    }),
    {
      name: 'alert-store',
    }
  )
);