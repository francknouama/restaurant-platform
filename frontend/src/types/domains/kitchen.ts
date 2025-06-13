import { KitchenOrderID, KitchenItemID, OrderID, MenuItemID, Timestamps } from '../common';

// Kitchen domain types matching Go backend exactly

// Kitchen Order Status (matching Go backend state machine)
export const KitchenOrderStatus = {
  NEW: 'NEW',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type KitchenOrderStatus = typeof KitchenOrderStatus[keyof typeof KitchenOrderStatus];

// Kitchen Priority Levels (matching Go backend)
export const KitchenPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

export type KitchenPriority = typeof KitchenPriority[keyof typeof KitchenPriority];

// Kitchen Item Status
export const KitchenItemStatus = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED'
} as const;

export type KitchenItemStatus = typeof KitchenItemStatus[keyof typeof KitchenItemStatus];

// Valid status transitions for kitchen orders
export const KITCHEN_STATUS_TRANSITIONS: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
  NEW: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

export interface KitchenOrder extends Timestamps {
  id: KitchenOrderID;
  orderID: OrderID;
  tableID: string;
  status: KitchenOrderStatus;
  items: KitchenItem[];
  priority: KitchenPriority;
  assignedStation?: string;
  estimatedTime: number; // in minutes - auto-calculated from items
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface KitchenItem {
  id: KitchenItemID;
  menuItemID: MenuItemID;
  menuItemName: string;
  quantity: number;
  status: KitchenItemStatus;
  prepTime: number; // in minutes
  station?: string;
  specialInstructions?: string;
  startedAt?: string;
  completedAt?: string;
}

// Request types for API
export interface CreateKitchenOrderRequest {
  orderID: OrderID;
  tableID: string;
  items: CreateKitchenItemRequest[];
  priority?: KitchenPriority;
  notes?: string;
}

export interface CreateKitchenItemRequest {
  menuItemID: MenuItemID;
  quantity: number;
  prepTime: number;
  specialInstructions?: string;
}

export interface UpdateKitchenOrderRequest {
  status?: KitchenOrderStatus;
  priority?: KitchenPriority;
  assignedStation?: string;
  notes?: string;
}

export interface UpdateKitchenItemRequest {
  status?: KitchenItemStatus;
  station?: string;
}

// Filter and search types
export interface KitchenOrderFilters {
  status?: KitchenOrderStatus[];
  priority?: KitchenPriority[];
  station?: string;
  tableID?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Kitchen metrics and performance types
export interface KitchenMetrics {
  totalOrders: number;
  averagePrepTime: number;
  ordersInQueue: number;
  completedToday: number;
  ordersByPriority: Record<KitchenPriority, number>;
  ordersByStatus: Record<KitchenOrderStatus, number>;
  averageWaitTime: number;
  efficiency: number; // percentage
}

export interface StationMetrics {
  station: string;
  activeOrders: number;
  averagePrepTime: number;
  completedToday: number;
  efficiency: number;
}

// Business logic constants
export const KITCHEN_CONSTANTS = {
  MAX_PREP_TIME: 120, // 2 hours in minutes
  DEFAULT_PREP_TIME: 15, // 15 minutes
  URGENT_THRESHOLD: 30, // 30 minutes for urgent priority
  MAX_NOTES_LENGTH: 500,
  STATIONS: [
    'GRILL',
    'FRYER',
    'SALAD',
    'DESSERT',
    'BEVERAGES',
    'EXPO'
  ]
} as const;

// Helper functions for kitchen business logic
export const calculateEstimatedTime = (items: KitchenItem[]): number => {
  if (items.length === 0) return 0;
  return Math.max(...items.map(item => item.prepTime));
};

export const getPriorityLevel = (estimatedTime: number): KitchenPriority => {
  if (estimatedTime <= 10) return KitchenPriority.LOW;
  if (estimatedTime <= 20) return KitchenPriority.NORMAL;
  if (estimatedTime <= 30) return KitchenPriority.HIGH;
  return KitchenPriority.URGENT;
};

export const isValidKitchenStatusTransition = (
  currentStatus: KitchenOrderStatus, 
  newStatus: KitchenOrderStatus
): boolean => {
  return KITCHEN_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};

export const getOrderAge = (createdAt: string): number => {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60)); // in minutes
};