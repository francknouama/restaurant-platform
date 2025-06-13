// Main types export file for restaurant platform frontend

// Common types
export * from './common';

// Domain types
export * from './domains/menu';
export * from './domains/order';
export * from './domains/kitchen';
export * from './domains/reservation';
export * from './domains/inventory';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  Timestamps
} from './common';

export type {
  Menu,
  MenuItem,
  MenuCategory,
  CreateMenuRequest,
  UpdateMenuRequest
} from './domains/menu';

export type {
  Order,
  OrderItem,
  OrderType,
  OrderStatus,
  CreateOrderRequest,
  OrderFilters
} from './domains/order';

export type {
  KitchenOrder,
  KitchenItem,
  KitchenOrderStatus,
  KitchenPriority,
  KitchenMetrics
} from './domains/kitchen';

export type {
  Reservation,
  ReservationStatus,
  CreateReservationRequest,
  TableAvailability
} from './domains/reservation';

export type {
  InventoryItem,
  StockMovement,
  Supplier,
  MovementType,
  UnitType,
  InventoryStatus
} from './domains/inventory';

// Avoid name conflicts by aliasing
export { isValidStatusTransition as isValidOrderStatusTransition } from './domains/order';
export { isValidStatusTransition as isValidReservationStatusTransition } from './domains/reservation';