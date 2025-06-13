// User Authentication Types matching backend domain model
export type UserID = string;
export type RoleID = string;
export type PermissionID = string;
export type UserSessionID = string;

// Restaurant-specific roles matching backend
export const RestaurantRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  KITCHEN_STAFF: 'kitchen_staff',
  WAITSTAFF: 'waitstaff',
  HOST: 'host',
  CASHIER: 'cashier',
} as const;

export type RestaurantRole = typeof RestaurantRoles[keyof typeof RestaurantRoles];

// Permission resources and actions
export const PermissionResources = {
  MENU: 'menu',
  ORDER: 'order',
  KITCHEN: 'kitchen',
  RESERVATION: 'reservation',
  INVENTORY: 'inventory',
  USER: 'user',
  REPORT: 'report',
} as const;

export const PermissionActions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  VIEW: 'view',
} as const;

export type PermissionResource = typeof PermissionResources[keyof typeof PermissionResources];
export type PermissionAction = typeof PermissionActions[keyof typeof PermissionActions];

export interface Permission {
  id: PermissionID;
  name: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
  createdAt: string;
}

export interface Role {
  id: RoleID;
  name: RestaurantRole;
  description: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: UserID;
  email: string;
  roleId: RoleID;
  role?: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRole {
  user: User;
  role: Role;
  permissions: Permission[];
}

export interface UserSession {
  id: UserSessionID;
  userId: UserID;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserWithRole;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
}

export interface Order {
  id: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'CREATED' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  partySize: number;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export interface KitchenOrder {
  id: string;
  orderId: string;
  items: OrderItem[];
  status: 'PENDING' | 'PREPARING' | 'READY';
  priority: number;
  estimatedTime: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}