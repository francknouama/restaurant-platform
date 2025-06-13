export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

export const ORDER_STATUSES = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
} as const;

export const ORDER_TYPES = {
  DINE_IN: 'DINE_IN',
  TAKEOUT: 'TAKEOUT',
  DELIVERY: 'DELIVERY',
} as const;

export const RESERVATION_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;

export const KITCHEN_STATUSES = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
} as const;

export const EVENT_TYPES = {
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_PAID: 'order:paid',
  KITCHEN_STATUS_UPDATED: 'kitchen:status_updated',
  MENU_UPDATED: 'menu:updated',
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_UPDATED: 'reservation:updated',
} as const;