import { InventoryItem, Supplier, InventoryAlert } from '../store/types';

// API Configuration
const INVENTORY_API_BASE = process.env.REACT_APP_INVENTORY_API_URL || 'http://localhost:8084/api/v1';

// Types for API requests/responses
export interface StockMovement {
  id: string;
  inventory_item_id: string;
  type: 'RECEIVED' | 'USED' | 'WASTED' | 'RETURNED' | 'ADJUSTED';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  reference?: string;
  performed_by?: string;
  created_at: string;
}

export interface StockAdjustmentRequest {
  inventory_item_id: string;
  quantity: number;
  notes?: string;
  reference?: string;
  performed_by?: string;
}

export interface DashboardMetrics {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  pendingOrders: number;
  monthlyTurnover: number;
  averageStockDays: number;
  supplierCount: number;
}

export interface RecentActivity {
  id: string;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'purchase_order';
  description: string;
  timestamp: string;
  user: string;
  amount?: number;
}

export interface CreateItemRequest {
  sku: string;
  name: string;
  initial_stock: number;
  unit: string;
  cost: number;
  category?: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
}

export interface UpdateItemRequest {
  name?: string;
  cost?: number;
  category?: string;
  min_threshold?: number;
  max_threshold?: number;
  reorder_point?: number;
}

export interface CreateSupplierRequest {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}

// HTTP Client utility
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Initialize API client
const apiClient = new ApiClient(INVENTORY_API_BASE);

// Inventory Service
export class InventoryService {
  // ===== INVENTORY ITEMS =====
  
  /**
   * Get all inventory items with pagination
   */
  static async getItems(offset = 0, limit = 50): Promise<{ items: InventoryItem[]; total: number }> {
    const response = await apiClient.get<{ items: any[]; total: number }>(
      `/inventory/items?offset=${offset}&limit=${limit}`
    );
    
    return {
      items: response.items.map(this.transformItemFromApi),
      total: response.total
    };
  }

  /**
   * Get single inventory item by ID
   */
  static async getItem(id: string): Promise<InventoryItem> {
    const item = await apiClient.get<any>(`/inventory/items/${id}`);
    return this.transformItemFromApi(item);
  }

  /**
   * Get inventory item by SKU
   */
  static async getItemBySKU(sku: string): Promise<InventoryItem> {
    const item = await apiClient.get<any>(`/inventory/items/sku/${sku}`);
    return this.transformItemFromApi(item);
  }

  /**
   * Create new inventory item
   */
  static async createItem(data: CreateItemRequest): Promise<InventoryItem> {
    const item = await apiClient.post<any>('/inventory/items', data);
    return this.transformItemFromApi(item);
  }

  /**
   * Update inventory item
   */
  static async updateItem(id: string, data: UpdateItemRequest): Promise<InventoryItem> {
    const item = await apiClient.put<any>(`/inventory/items/${id}`, data);
    return this.transformItemFromApi(item);
  }

  /**
   * Delete inventory item
   */
  static async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/inventory/items/${id}`);
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(): Promise<InventoryItem[]> {
    const response = await apiClient.get<{ items: any[] }>('/inventory/items/low-stock');
    return response.items.map(this.transformItemFromApi);
  }

  /**
   * Get out of stock items
   */
  static async getOutOfStockItems(): Promise<InventoryItem[]> {
    const response = await apiClient.get<{ items: any[] }>('/inventory/items/out-of-stock');
    return response.items.map(this.transformItemFromApi);
  }

  // ===== STOCK MANAGEMENT =====

  /**
   * Add stock to item
   */
  static async addStock(
    itemId: string,
    quantity: number,
    notes?: string,
    reference?: string,
    performedBy?: string
  ): Promise<void> {
    await apiClient.post(`/inventory/items/${itemId}/stock/add`, {
      quantity,
      notes,
      reference,
      performed_by: performedBy
    });
  }

  /**
   * Use stock from item
   */
  static async useStock(
    itemId: string,
    quantity: number,
    notes?: string,
    reference?: string,
    performedBy?: string
  ): Promise<void> {
    await apiClient.post(`/inventory/items/${itemId}/stock/use`, {
      quantity,
      notes,
      reference,
      performed_by: performedBy
    });
  }

  /**
   * Adjust stock levels
   */
  static async adjustStock(data: StockAdjustmentRequest): Promise<void> {
    await apiClient.post('/inventory/stock/adjust', data);
  }

  /**
   * Get stock movements for an item
   */
  static async getStockMovements(itemId: string, limit = 50): Promise<StockMovement[]> {
    const response = await apiClient.get<{ movements: StockMovement[] }>(
      `/inventory/items/${itemId}/movements?limit=${limit}`
    );
    return response.movements;
  }

  /**
   * Check stock availability
   */
  static async checkStockAvailability(sku: string, quantity: number): Promise<boolean> {
    const response = await apiClient.get<{ available: boolean }>(
      `/inventory/stock/check?sku=${sku}&quantity=${quantity}`
    );
    return response.available;
  }

  /**
   * Get current stock level for SKU
   */
  static async getStockLevel(sku: string): Promise<number> {
    const response = await apiClient.get<{ stock_level: number }>(
      `/inventory/stock/level?sku=${sku}`
    );
    return response.stock_level;
  }

  // ===== SUPPLIERS =====

  /**
   * Get all suppliers
   */
  static async getSuppliers(offset = 0, limit = 50): Promise<{ suppliers: Supplier[]; total: number }> {
    const response = await apiClient.get<{ suppliers: any[]; total: number }>(
      `/inventory/suppliers?offset=${offset}&limit=${limit}`
    );
    
    return {
      suppliers: response.suppliers.map(this.transformSupplierFromApi),
      total: response.total
    };
  }

  /**
   * Get active suppliers only
   */
  static async getActiveSuppliers(): Promise<Supplier[]> {
    const response = await apiClient.get<{ suppliers: any[] }>('/inventory/suppliers/active');
    return response.suppliers.map(this.transformSupplierFromApi);
  }

  /**
   * Get single supplier by ID
   */
  static async getSupplier(id: string): Promise<Supplier> {
    const supplier = await apiClient.get<any>(`/inventory/suppliers/${id}`);
    return this.transformSupplierFromApi(supplier);
  }

  /**
   * Create new supplier
   */
  static async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const supplier = await apiClient.post<any>('/inventory/suppliers', data);
    return this.transformSupplierFromApi(supplier);
  }

  /**
   * Update supplier
   */
  static async updateSupplier(id: string, data: Partial<CreateSupplierRequest>): Promise<Supplier> {
    const supplier = await apiClient.put<any>(`/inventory/suppliers/${id}`, data);
    return this.transformSupplierFromApi(supplier);
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/inventory/suppliers/${id}`);
  }

  // ===== DASHBOARD & ANALYTICS =====

  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Since the backend doesn't have dedicated analytics endpoints yet,
    // we'll compute metrics from the available data
    try {
      const [itemsResponse, lowStockItems, outOfStockItems, suppliersResponse] = await Promise.all([
        this.getItems(0, 1), // Just get total count
        this.getLowStockItems(),
        this.getOutOfStockItems(),
        this.getSuppliers(0, 1) // Just get total count
      ]);

      // For now, we'll provide basic metrics and mock some advanced ones
      // TODO: Implement proper analytics endpoints in the backend
      return {
        totalItems: itemsResponse.total,
        lowStockItems: lowStockItems.length,
        outOfStockItems: outOfStockItems.length,
        totalValue: 0, // TODO: Calculate from item costs and stock levels
        pendingOrders: 0, // TODO: Implement purchase order tracking
        monthlyTurnover: 2.1, // TODO: Calculate from movement history
        averageStockDays: 12, // TODO: Calculate from movement patterns
        supplierCount: suppliersResponse.total
      };
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get recent activity (stock movements)
   */
  static async getRecentActivity(limit = 20): Promise<RecentActivity[]> {
    // Since we don't have a dedicated recent activity endpoint,
    // we'll need to get this data from stock movements
    // TODO: Implement proper activity feed in backend
    try {
      // For now, return empty array and let components handle gracefully
      // This will be implemented once we have proper activity tracking
      return [];
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
      throw error;
    }
  }

  /**
   * Get stock alerts
   */
  static async getStockAlerts(): Promise<InventoryAlert[]> {
    try {
      const [lowStockItems, outOfStockItems] = await Promise.all([
        this.getLowStockItems(),
        this.getOutOfStockItems()
      ]);

      const alerts: InventoryAlert[] = [];

      // Convert low stock items to alerts
      lowStockItems.forEach(item => {
        alerts.push({
          id: `low-stock-${item.id}`,
          type: 'low-stock',
          priority: item.currentStock <= (item.minimumStock * 0.5) ? 'urgent' : 'high',
          itemName: item.name,
          message: `${item.name} is low on stock (${item.currentStock} ${item.unit} remaining)`,
          timestamp: new Date().toISOString(), // TODO: Get actual timestamp
          status: 'active',
          actionRequired: true
        });
      });

      // Convert out of stock items to alerts
      outOfStockItems.forEach(item => {
        alerts.push({
          id: `out-of-stock-${item.id}`,
          type: 'out-of-stock',
          priority: 'urgent',
          itemName: item.name,
          message: `${item.name} is out of stock`,
          timestamp: new Date().toISOString(), // TODO: Get actual timestamp
          status: 'active',
          actionRequired: true
        });
      });

      return alerts;
    } catch (error) {
      console.error('Failed to fetch stock alerts:', error);
      throw error;
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Transform API item to frontend format
   */
  private static transformItemFromApi(apiItem: any): InventoryItem {
    return {
      id: apiItem.id,
      name: apiItem.name,
      category: apiItem.category || 'Uncategorized',
      sku: apiItem.sku,
      currentStock: apiItem.current_stock,
      minimumStock: apiItem.min_threshold || 0,
      maximumStock: apiItem.max_threshold || 0,
      unit: apiItem.unit,
      costPerUnit: apiItem.cost,
      supplier: 'Unknown', // TODO: Map supplier ID to name
      location: apiItem.storage_location || 'N/A',
      status: this.determineStockStatus(
        apiItem.current_stock,
        apiItem.min_threshold || 0
      ),
      lastUpdated: apiItem.updated_at
    };
  }

  /**
   * Transform API supplier to frontend format
   */
  private static transformSupplierFromApi(apiSupplier: any): Supplier {
    return {
      id: apiSupplier.id,
      name: apiSupplier.name,
      contactPerson: apiSupplier.contact_name || 'N/A',
      email: apiSupplier.email || 'N/A',
      phone: apiSupplier.phone || 'N/A',
      status: apiSupplier.is_active ? 'active' : 'inactive',
      rating: 4.5, // TODO: Implement supplier ratings
      totalOrders: 0, // TODO: Track supplier orders
      totalSpent: 0, // TODO: Calculate spending per supplier
      onTimeDeliveryRate: 95.0 // TODO: Track delivery performance
    };
  }

  /**
   * Determine stock status based on current and minimum stock
   */
  private static determineStockStatus(
    currentStock: number,
    minimumStock: number
  ): 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued' {
    if (currentStock === 0) return 'out-of-stock';
    if (currentStock <= minimumStock) return 'low-stock';
    return 'in-stock';
  }
}

export default InventoryService;