// Type-safe ID system matching Go backend generics
export type EntityMarker = string;

export interface ID<T extends EntityMarker> {
  value: string;
  __marker?: T;
}

// ID types for each domain
export type MenuID = ID<'Menu'>;
export type MenuCategoryID = ID<'MenuCategory'>;
export type MenuItemID = ID<'MenuItem'>;
export type OrderID = ID<'Order'>;
export type OrderItemID = ID<'OrderItem'>;
export type KitchenOrderID = ID<'KitchenOrder'>;
export type KitchenItemID = ID<'KitchenItem'>;
export type ReservationID = ID<'Reservation'>;
export type InventoryItemID = ID<'InventoryItem'>;
export type StockMovementID = ID<'StockMovement'>;
export type SupplierID = ID<'Supplier'>;

// ID generation utility matching Go backend pattern (timestamp-based)
export const createID = <T extends EntityMarker>(prefix: string): ID<T> => ({
  value: `${prefix}_${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}`
});

// Helper functions for working with IDs
export const idToString = <T extends EntityMarker>(id: ID<T>): string => id.value;
export const stringToID = <T extends EntityMarker>(value: string): ID<T> => ({ value });

// API Response types matching Go backend
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  details?: any;
  timestamp?: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Common error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode: number;
}

// Base timestamps (matching Go backend)
export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}