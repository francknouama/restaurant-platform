// Main types export file for restaurant platform frontend

// Common types
export * from './common';

// Domain types - explicit exports to avoid conflicts
export * from './domains/menu';
export * from './domains/kitchen';
export * from './domains/inventory';

// Order domain - excluding isValidStatusTransition to avoid conflicts
export type {
  Order,
  OrderItem,
  OrderType,
  OrderStatus,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  OrderValidationError,
  ORDER_STATUS_TRANSITIONS,
  ORDER_CONSTANTS
} from './domains/order';

// Order functions with aliases to avoid conflicts
export { 
  calculateOrderTotal,
  calculateTaxAmount, 
  calculateItemTotal,
  isValidStatusTransition as isValidOrderStatusTransition 
} from './domains/order';

// Reservation domain - excluding isValidStatusTransition to avoid conflicts
export type {
  Reservation,
  ReservationStatus,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationFilters,
  Table,
  TableAvailability,
  TableLayout,
  WaitlistEntry,
  RESERVATION_STATUS_TRANSITIONS,
  RESERVATION_CONSTANTS
} from './domains/reservation';

// Reservation functions with aliases to avoid conflicts
export { 
  isValidReservationTime,
  calculateReservationEndTime,
  getReservationDuration,
  isValidStatusTransition as isValidReservationStatusTransition 
} from './domains/reservation';