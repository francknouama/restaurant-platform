import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Supplier, SupplierState } from './types';
import InventoryService, { CreateSupplierRequest } from '../services/inventoryService';

interface SupplierStore extends SupplierState {
  // Actions
  fetchSuppliers: (offset?: number, limit?: number) => Promise<void>;
  fetchActiveSuppliers: () => Promise<void>;
  fetchSupplier: (id: string) => Promise<void>;
  createSupplier: (data: CreateSupplierRequest) => Promise<Supplier>;
  updateSupplier: (id: string, data: Partial<CreateSupplierRequest>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  selectSupplier: (supplier: Supplier | null) => void;
  
  // Utility actions
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useSupplierStore = create<SupplierStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      suppliers: [],
      loading: false,
      error: null,
      selectedSupplier: null,

      // Actions
      fetchSuppliers: async (offset = 0, limit = 50) => {
        set({ loading: true, error: null });
        try {
          const response = await InventoryService.getSuppliers(offset, limit);
          set({ 
            suppliers: response.suppliers, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch suppliers',
            loading: false 
          });
        }
      },

      fetchActiveSuppliers: async () => {
        set({ loading: true, error: null });
        try {
          const suppliers = await InventoryService.getActiveSuppliers();
          set({ 
            suppliers, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch active suppliers',
            loading: false 
          });
        }
      },

      fetchSupplier: async (id: string) => {
        set({ loading: true, error: null });
        try {
          const supplier = await InventoryService.getSupplier(id);
          
          // Update the supplier in the suppliers array if it exists
          const { suppliers } = get();
          const updatedSuppliers = suppliers.map(existingSupplier => 
            existingSupplier.id === id ? supplier : existingSupplier
          );
          
          // If supplier doesn't exist in array, add it
          if (!suppliers.some(existingSupplier => existingSupplier.id === id)) {
            updatedSuppliers.push(supplier);
          }
          
          set({ 
            suppliers: updatedSuppliers,
            selectedSupplier: supplier,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch supplier',
            loading: false 
          });
        }
      },

      createSupplier: async (data: CreateSupplierRequest) => {
        set({ loading: true, error: null });
        try {
          const newSupplier = await InventoryService.createSupplier(data);
          
          const { suppliers } = get();
          set({ 
            suppliers: [newSupplier, ...suppliers],
            loading: false 
          });
          
          return newSupplier;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create supplier',
            loading: false 
          });
          throw error;
        }
      },

      updateSupplier: async (id: string, data: Partial<CreateSupplierRequest>) => {
        set({ loading: true, error: null });
        try {
          const updatedSupplier = await InventoryService.updateSupplier(id, data);
          
          const { suppliers, selectedSupplier } = get();
          const updatedSuppliers = suppliers.map(supplier => 
            supplier.id === id ? updatedSupplier : supplier
          );
          
          set({ 
            suppliers: updatedSuppliers,
            selectedSupplier: selectedSupplier?.id === id ? updatedSupplier : selectedSupplier,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update supplier',
            loading: false 
          });
          throw error;
        }
      },

      deleteSupplier: async (id: string) => {
        set({ loading: true, error: null });
        try {
          await InventoryService.deleteSupplier(id);
          
          const { suppliers, selectedSupplier } = get();
          const updatedSuppliers = suppliers.filter(supplier => supplier.id !== id);
          
          set({ 
            suppliers: updatedSuppliers,
            selectedSupplier: selectedSupplier?.id === id ? null : selectedSupplier,
            loading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete supplier',
            loading: false 
          });
          throw error;
        }
      },

      selectSupplier: (supplier: Supplier | null) => {
        set({ selectedSupplier: supplier });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading });
      }
    }),
    {
      name: 'supplier-store',
    }
  )
);