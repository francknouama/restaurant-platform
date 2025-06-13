import { InventoryItemID, StockMovementID, SupplierID, Timestamps } from '../common';

// Inventory domain types matching Go backend exactly

// Stock Movement Types (matching Go backend constants)
export const MovementType = {
  RECEIVED: 'RECEIVED',
  USED: 'USED',
  WASTED: 'WASTED',
  ADJUSTED: 'ADJUSTED',
  RETURNED: 'RETURNED'
} as const;

export type MovementType = typeof MovementType[keyof typeof MovementType];

// Unit Types (matching Go backend)
export const UnitType = {
  KILOGRAMS: 'KG',
  LITERS: 'L',
  UNITS: 'UNITS',
  GRAMS: 'G',
  MILLILITERS: 'ML',
  POUNDS: 'LBS',
  OUNCES: 'OZ'
} as const;

export type UnitType = typeof UnitType[keyof typeof UnitType];

// Inventory Status
export const InventoryStatus = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  REORDER_NEEDED: 'REORDER_NEEDED',
  EXPIRED: 'EXPIRED'
} as const;

export type InventoryStatus = typeof InventoryStatus[keyof typeof InventoryStatus];

export interface InventoryItem extends Timestamps {
  id: InventoryItemID;
  sku: string;
  name: string;
  description?: string;
  currentStock: number;
  unit: UnitType;
  minThreshold: number;
  maxThreshold: number;
  reorderPoint: number;
  cost: number;
  category: string;
  location: string;
  supplierID: SupplierID;
  lastOrdered?: string;
  expiryDate?: string;
  movements: StockMovement[];
  status: InventoryStatus;
}

export interface StockMovement extends Timestamps {
  id: StockMovementID;
  inventoryItemID: InventoryItemID;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reason?: string;
  reference?: string; // Order ID, invoice number, etc.
  performedBy: string;
  notes?: string;
}

export interface Supplier extends Timestamps {
  id: SupplierID;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTime: number; // in days
  minOrderAmount?: number;
  isActive: boolean;
  rating?: number; // 1-5 stars
  notes?: string;
}

// Request types for API
export interface CreateInventoryItemRequest {
  sku: string;
  name: string;
  description?: string;
  initialStock: number;
  unit: UnitType;
  minThreshold: number;
  maxThreshold: number;
  reorderPoint: number;
  cost: number;
  category: string;
  location: string;
  supplierID: SupplierID;
  expiryDate?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  description?: string;
  unit?: UnitType;
  minThreshold?: number;
  maxThreshold?: number;
  reorderPoint?: number;
  cost?: number;
  category?: string;
  location?: string;
  supplierID?: SupplierID;
  expiryDate?: string;
}

export interface CreateStockMovementRequest {
  inventoryItemID: InventoryItemID;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reason?: string;
  reference?: string;
  notes?: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  leadTime: number;
  minOrderAmount?: number;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  isActive?: boolean;
  rating?: number;
}

// Filter and search types
export interface InventoryFilters {
  category?: string;
  supplier?: SupplierID;
  status?: InventoryStatus[];
  location?: string;
  lowStock?: boolean;
  expired?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MovementFilters {
  itemID?: InventoryItemID;
  type?: MovementType[];
  dateFrom?: string;
  dateTo?: string;
  performedBy?: string;
  page?: number;
  limit?: number;
}

// Inventory analytics types
export interface InventoryMetrics {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiredItems: number;
  reorderNeededItems: number;
  wasteAmount: number;
  wasteValue: number;
  turnoverRate: number;
}

export interface CategoryMetrics {
  category: string;
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  averageTurnover: number;
  wastePercentage: number;
}

export interface SupplierMetrics {
  supplier: Supplier;
  totalItems: number;
  totalValue: number;
  orderFrequency: number;
  averageLeadTime: number;
  reliability: number; // percentage
}

// Business logic constants
export const INVENTORY_CONSTANTS = {
  MIN_STOCK_LEVEL: 0,
  MAX_STOCK_LEVEL: 999999,
  MIN_THRESHOLD_PERCENTAGE: 0.1, // 10% of max
  REORDER_PERCENTAGE: 0.2, // 20% of max
  MAX_SKU_LENGTH: 50,
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  CATEGORIES: [
    'Produce',
    'Meat & Poultry',
    'Seafood',
    'Dairy',
    'Dry Goods',
    'Beverages',
    'Spices & Seasonings',
    'Cleaning Supplies',
    'Packaging'
  ],
  LOCATIONS: [
    'Main Storage',
    'Walk-in Cooler',
    'Freezer',
    'Dry Storage',
    'Bar Storage',
    'Kitchen Storage'
  ]
} as const;

// Helper functions for inventory business logic
export const calculateInventoryStatus = (item: InventoryItem): InventoryStatus => {
  if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
    return InventoryStatus.EXPIRED;
  }
  if (item.currentStock <= 0) {
    return InventoryStatus.OUT_OF_STOCK;
  }
  if (item.currentStock <= item.reorderPoint) {
    return InventoryStatus.REORDER_NEEDED;
  }
  if (item.currentStock <= item.minThreshold) {
    return InventoryStatus.LOW_STOCK;
  }
  return InventoryStatus.IN_STOCK;
};

export const calculateStockValue = (item: InventoryItem): number => {
  return item.currentStock * item.cost;
};

export const calculateReorderQuantity = (item: InventoryItem): number => {
  return Math.max(0, item.maxThreshold - item.currentStock);
};

export const isExpiringSoon = (expiryDate: string, daysThreshold: number = 7): boolean => {
  const expiry = new Date(expiryDate);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + daysThreshold);
  return expiry <= threshold;
};

export const getInventoryTurnover = (item: InventoryItem, periodDays: number = 30): number => {
  const usedMovements = item.movements.filter(m => 
    m.type === MovementType.USED && 
    new Date(m.createdAt) >= new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
  );
  
  const totalUsed = usedMovements.reduce((sum, m) => sum + m.quantity, 0);
  const averageStock = item.currentStock; // Simplified calculation
  
  return averageStock > 0 ? totalUsed / averageStock : 0;
};