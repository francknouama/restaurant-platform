import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { InventoryItem, InventoryState } from './types';
import InventoryService, { CreateItemRequest, UpdateItemRequest } from '../services/inventoryService';

interface InventoryStore extends InventoryState {
  // Actions
  fetchItems: (offset?: number, limit?: number) => Promise<void>;
  fetchItem: (id: string) => Promise<void>;
  createItem: (data: CreateItemRequest) => Promise<InventoryItem>;
  updateItem: (id: string, data: UpdateItemRequest) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  selectItem: (item: InventoryItem | null) => void;
  
  // Stock management actions
  addStock: (itemId: string, quantity: number, notes?: string, reference?: string, performedBy?: string) => Promise<void>;
  useStock: (itemId: string, quantity: number, notes?: string, reference?: string, performedBy?: string) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useInventoryStore = create<InventoryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      items: [],
      loading: false,
      error: null,
      selectedItem: null,

      // Actions
      fetchItems: async (offset = 0, limit = 50) => {
        set({ loading: true, error: null });
        try {
          const response = await InventoryService.getItems(offset, limit);
          set({ 
            items: response.items, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch items',
            loading: false 
          });
        }
      },

      fetchItem: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const item = await InventoryService.getItem(id);
          
          // Update the item in the items array if it exists
          const { items } = get();
          const updatedItems = items.map(existingItem => 
            existingItem.id === id ? item : existingItem
          );
          
          // If item doesn't exist in array, add it
          if (!items.some(existingItem => existingItem.id === id)) {
            updatedItems.push(item);
          }
          
          set({ 
            items: updatedItems,
            selectedItem: item,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch item',
            loading: false 
          });
        }
      },

      createItem: async (data: CreateItemRequest) => {
        set({ loading: true, error: null });
        try {
          const newItem = await InventoryService.createItem(data);
          
          const { items } = get();
          set({ 
            items: [newItem, ...items],
            loading: false 
          });
          
          return newItem;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create item',
            loading: false 
          });
          throw error;
        }
      },

      updateItem: async (id: string, data: UpdateItemRequest) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await InventoryService.updateItem(id, data);
          
          const { items, selectedItem } = get();
          const updatedItems = items.map(item => 
            item.id === id ? updatedItem : item
          );
          
          set({ 
            items: updatedItems,
            selectedItem: selectedItem?.id === id ? updatedItem : selectedItem,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update item',
            loading: false 
          });
          throw error;
        }
      },

      deleteItem: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await InventoryService.deleteItem(id);
          
          const { items, selectedItem } = get();
          const updatedItems = items.filter(item => item.id !== id);
          
          set({ 
            items: updatedItems,
            selectedItem: selectedItem?.id === id ? null : selectedItem,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete item',
            loading: false 
          });
          throw error;
        }
      },

      selectItem: (item: InventoryItem | null) => {
        set({ selectedItem: item });
      },

      addStock: async (itemId: string, quantity: number, notes?: string, reference?: string, performedBy?: string) => {
        set({ loading: true, error: null });
        try {
          await InventoryService.addStock(itemId, quantity, notes, reference, performedBy);
          
          // Refresh the specific item to get updated stock levels
          await get().fetchItem(itemId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add stock',
            loading: false 
          });
          throw error;
        }
      },

      useStock: async (itemId: string, quantity: number, notes?: string, reference?: string, performedBy?: string) => {
        set({ loading: true, error: null });
        try {
          await InventoryService.useStock(itemId, quantity, notes, reference, performedBy);
          
          // Refresh the specific item to get updated stock levels
          await get().fetchItem(itemId);
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to use stock',
            loading: false 
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      }
    }),
    {
      name: 'inventory-store',
    }
  )
);