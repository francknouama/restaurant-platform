import { OrderID, OrderItemID, MenuItemID, Timestamps } from '../common';

// Order domain types matching Go backend exactly

// Order Types (matching Go backend constants)
export const OrderType = {
  DINE_IN: 'DINE_IN',
  TAKEOUT: 'TAKEOUT',
  DELIVERY: 'DELIVERY'
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];

// Order Status (matching Go backend state machine)
export const OrderStatus = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Valid status transitions (matching Go backend business rules)
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export interface Order extends Timestamps {
  id: OrderID;
  customerID: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number; // Always 10% as per backend business rule
  tableID?: string; // Required for DINE_IN
  deliveryAddress?: string; // Required for DELIVERY
  notes?: string;
}

export interface OrderItem {
  id: OrderItemID;
  menuItemID: MenuItemID;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}

// Request types for API
export interface CreateOrderRequest {
  customerID: string;
  type: OrderType;
  items: CreateOrderItemRequest[];
  tableID?: string; // Required for DINE_IN
  deliveryAddress?: string; // Required for DELIVERY
  notes?: string;
}

export interface CreateOrderItemRequest {
  menuItemID: MenuItemID;
  quantity: number;
  specialInstructions?: string;
}

export interface UpdateOrderRequest {
  items?: CreateOrderItemRequest[];
  tableID?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// Filter and search types
export interface OrderFilters {
  status?: OrderStatus[];
  type?: OrderType[];
  customerID?: string;
  dateFrom?: string;
  dateTo?: string;
  tableID?: string;
  page?: number;
  limit?: number;
}

// Business rule validation
export interface OrderValidationError {
  field: string;
  message: string;
  code: string;
}

// Order business logic constants
export const ORDER_CONSTANTS = {
  TAX_RATE: 0.10, // 10% tax rate
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 99,
  MAX_ITEMS_PER_ORDER: 50,
  MAX_NOTES_LENGTH: 500,
  MAX_SPECIAL_INSTRUCTIONS_LENGTH: 200
} as const;

// Helper functions for order business logic
export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((total, item) => total + item.totalPrice, 0);
};

export const calculateTaxAmount = (subtotal: number): number => {
  return subtotal * ORDER_CONSTANTS.TAX_RATE;
};

export const calculateItemTotal = (unitPrice: number, quantity: number): number => {
  return unitPrice * quantity;
};

export const isValidStatusTransition = (currentStatus: OrderStatus, newStatus: OrderStatus): boolean => {
  return ORDER_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};