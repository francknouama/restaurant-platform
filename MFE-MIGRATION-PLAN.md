# Restaurant Platform - Micro-Frontend Migration Plan

## Executive Summary

This document outlines the comprehensive migration plan to transform the current monolithic React frontend into a domain-driven micro-frontend (MFE) architecture using Webpack 5 Module Federation. The migration will split the restaurant platform into 5 independent micro-frontends aligned with our backend microservices architecture.

> 📋 **Detailed Views Specification**: For comprehensive view breakdowns, components, and features for each MFE, see [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md)

## Current State Analysis

### Existing Monolithic Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── kitchen/
│   │   ├── menu/
│   │   ├── order/
│   │   ├── reservation/
│   │   └── ui/
│   ├── hooks/
│   │   ├── useKitchen.ts
│   │   ├── useMenus.ts
│   │   ├── useOrders.ts
│   │   └── useReservations.ts
│   ├── pages/
│   │   ├── KitchenDashboard.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── OrderProcessing.tsx
│   │   ├── ReservationManagement.tsx
│   │   └── RestaurantDashboard.tsx
│   ├── services/api/
│   └── types/
```

### Migration Goals
- **Domain Autonomy**: Independent development and deployment per domain
- **Team Scalability**: Enable multiple teams to work on different domains
- **Technology Flexibility**: Allow different MFEs to evolve independently
- **Performance**: Optimize loading and reduce bundle sizes
- **Fault Isolation**: Prevent domain failures from affecting entire platform

## Target MFE Architecture

### Domain-Driven MFE Boundaries

```
restaurant-platform-mfe/
├── apps/
│   ├── shell-app/              # Host Application (Port 3000)
│   ├── menu-mfe/               # Menu Management (Port 3001)
│   ├── orders-mfe/             # Order Processing (Port 3002)
│   ├── kitchen-mfe/            # Kitchen Operations (Port 3003)
│   ├── reservations-mfe/       # Reservation System (Port 3004)
│   └── inventory-mfe/          # Inventory Management (Port 3005)
├── packages/
│   ├── shared-ui/              # Design System & Components
│   ├── shared-utils/           # Common Utilities & Types
│   ├── shared-state/           # Cross-MFE Communication
│   └── mfe-tools/              # Build & Development Tools
└── infrastructure/
    ├── docker/                 # Container Configurations
    ├── kubernetes/             # K8s Manifests
    └── nginx/                  # Gateway Configuration
```

### MFE Domain Responsibilities

| MFE | Port | Domain Responsibilities | Team Ownership |
|-----|------|------------------------|----------------|
| **shell-app** | 3000 | Authentication, Navigation, Global Layout, MFE Orchestration | Platform Team |
| **menu-mfe** | 3001 | Menu CRUD, Categories, Items, Pricing, Availability | Menu Team |
| **orders-mfe** | 3002 | Order Creation, Status Management, Customer Orders | Orders Team |
| **kitchen-mfe** | 3003 | Kitchen Dashboard, Order Queue, Preparation Workflow | Kitchen Team |
| **reservations-mfe** | 3004 | Table Booking, Customer Management, Waitlist | Reservations Team |
| **inventory-mfe** | 3005 | Stock Management, Suppliers, Cost Tracking | Inventory Team |

## Technical Architecture

### Module Federation Configuration

#### Shell App (Host Configuration)
```javascript
// apps/shell-app/webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3000,
    historyApiFallback: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        menuMfe: 'menuMfe@http://localhost:3001/remoteEntry.js',
        ordersMfe: 'ordersMfe@http://localhost:3002/remoteEntry.js',
        kitchenMfe: 'kitchenMfe@http://localhost:3003/remoteEntry.js',
        reservationsMfe: 'reservationsMfe@http://localhost:3004/remoteEntry.js',
        inventoryMfe: 'inventoryMfe@http://localhost:3005/remoteEntry.js'
      },
      shared: {
        react: { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, eager: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        'react-query': { singleton: true, requiredVersion: '^3.39.0' },
        '@shared-ui/components': { singleton: true, eager: true },
        '@shared-utils/api': { singleton: true, eager: true },
        '@shared-state/store': { singleton: true, eager: true }
      }
    })
  ]
};
```

#### Individual MFE Configuration
```javascript
// apps/menu-mfe/webpack.config.js
const ModuleFederationPlugin = require('@module-federation/webpack');

module.exports = {
  mode: 'development',
  devServer: {
    port: 3001,
    historyApiFallback: true,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'menuMfe',
      filename: 'remoteEntry.js',
      exposes: {
        './MenuApp': './src/App',
        './MenuRoutes': './src/routes/MenuRoutes',
        './MenuDashboard': './src/pages/MenuDashboard',
        './MenuComponents': './src/components/index'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        'react-query': { singleton: true, requiredVersion: '^3.39.0' },
        '@shared-ui/components': { singleton: true },
        '@shared-utils/api': { singleton: true },
        '@shared-state/store': { singleton: true }
      }
    })
  ]
};
```

### Authentication & Session Management Strategy

#### **Centralized Authentication in Shell App**

The shell-app serves as the authentication and session management hub for all MFEs, providing:
- Single Sign-On (SSO) across all micro-frontends
- Role-based access control (RBAC)
- Token management and automatic refresh
- Session persistence and synchronization

```typescript
// packages/shared-state/src/auth/authTypes.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RestaurantRole;
  permissions: Permission[];
  restaurantId: string;
  profileImage?: string;
  lastLogin: string;
  createdAt: string;
}

export const RestaurantRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  KITCHEN_STAFF: 'kitchen_staff',
  WAITSTAFF: 'waitstaff',
  HOST: 'host',
  CASHIER: 'cashier'
} as const;

export type RestaurantRole = typeof RestaurantRoles[keyof typeof RestaurantRoles];

export const Permissions = {
  // Menu Management
  MENU_READ: 'menu:read',
  MENU_WRITE: 'menu:write',
  MENU_ACTIVATE: 'menu:activate',
  
  // Order Management
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  
  // Kitchen Operations
  KITCHEN_VIEW: 'kitchen:view',
  KITCHEN_MANAGE: 'kitchen:manage',
  KITCHEN_ASSIGN: 'kitchen:assign',
  
  // Reservations
  RESERVATION_READ: 'reservation:read',
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_UPDATE: 'reservation:update',
  RESERVATION_CANCEL: 'reservation:cancel',
  
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_MANAGE: 'inventory:manage',
  
  // Administration
  USER_MANAGE: 'user:manage',
  SETTINGS_MANAGE: 'settings:manage',
  REPORTS_VIEW: 'reports:view'
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number;
  permissions: Permission[];
  mfeAccess: Record<string, boolean>;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastActivity: number;
}
```

#### **Role-Based MFE Access Control**

```typescript
// packages/shared-state/src/auth/rbac.ts
export const ROLE_PERMISSIONS: Record<RestaurantRole, Permission[]> = {
  [RestaurantRoles.ADMIN]: [
    // Full access to everything
    ...Object.values(Permissions)
  ],
  
  [RestaurantRoles.MANAGER]: [
    Permissions.MENU_READ,
    Permissions.MENU_WRITE,
    Permissions.MENU_ACTIVATE,
    Permissions.ORDER_READ,
    Permissions.ORDER_CREATE,
    Permissions.ORDER_UPDATE,
    Permissions.ORDER_CANCEL,
    Permissions.KITCHEN_VIEW,
    Permissions.KITCHEN_MANAGE,
    Permissions.RESERVATION_READ,
    Permissions.RESERVATION_CREATE,
    Permissions.RESERVATION_UPDATE,
    Permissions.RESERVATION_CANCEL,
    Permissions.INVENTORY_READ,
    Permissions.INVENTORY_WRITE,
    Permissions.REPORTS_VIEW
  ],
  
  [RestaurantRoles.KITCHEN_STAFF]: [
    Permissions.MENU_READ,
    Permissions.ORDER_READ,
    Permissions.ORDER_UPDATE,
    Permissions.KITCHEN_VIEW,
    Permissions.KITCHEN_MANAGE,
    Permissions.INVENTORY_READ
  ],
  
  [RestaurantRoles.WAITSTAFF]: [
    Permissions.MENU_READ,
    Permissions.ORDER_READ,
    Permissions.ORDER_CREATE,
    Permissions.ORDER_UPDATE,
    Permissions.RESERVATION_READ,
    Permissions.RESERVATION_CREATE,
    Permissions.RESERVATION_UPDATE
  ],
  
  [RestaurantRoles.HOST]: [
    Permissions.RESERVATION_READ,
    Permissions.RESERVATION_CREATE,
    Permissions.RESERVATION_UPDATE,
    Permissions.ORDER_READ
  ],
  
  [RestaurantRoles.CASHIER]: [
    Permissions.ORDER_READ,
    Permissions.ORDER_CREATE,
    Permissions.ORDER_UPDATE,
    Permissions.MENU_READ
  ]
};

export const MFE_ACCESS: Record<RestaurantRole, string[]> = {
  [RestaurantRoles.ADMIN]: ['menu-mfe', 'orders-mfe', 'kitchen-mfe', 'reservations-mfe', 'inventory-mfe'],
  [RestaurantRoles.MANAGER]: ['menu-mfe', 'orders-mfe', 'kitchen-mfe', 'reservations-mfe', 'inventory-mfe'],
  [RestaurantRoles.KITCHEN_STAFF]: ['kitchen-mfe', 'orders-mfe'],
  [RestaurantRoles.WAITSTAFF]: ['orders-mfe', 'reservations-mfe'],
  [RestaurantRoles.HOST]: ['reservations-mfe'],
  [RestaurantRoles.CASHIER]: ['orders-mfe']
};

export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

export const hasMfeAccess = (user: User, mfeName: string): boolean => {
  const allowedMfes = MFE_ACCESS[user.role] || [];
  return allowedMfes.includes(mfeName);
};

export const canAccessRoute = (user: User, route: string): boolean => {
  const routePermissions: Record<string, Permission[]> = {
    '/menus': [Permissions.MENU_READ],
    '/menus/create': [Permissions.MENU_WRITE],
    '/menus/*/edit': [Permissions.MENU_WRITE],
    '/orders': [Permissions.ORDER_READ],
    '/orders/create': [Permissions.ORDER_CREATE],
    '/kitchen': [Permissions.KITCHEN_VIEW],
    '/reservations': [Permissions.RESERVATION_READ],
    '/reservations/create': [Permissions.RESERVATION_CREATE],
    '/inventory': [Permissions.INVENTORY_READ],
    '/inventory/manage': [Permissions.INVENTORY_WRITE]
  };
  
  const requiredPermissions = routePermissions[route] || [];
  return requiredPermissions.every(permission => hasPermission(user, permission));
};
```

#### **Authentication Service Implementation**

```typescript
// packages/shared-state/src/auth/authService.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateLastActivity: () => void;
  checkSession: () => Promise<boolean>;
  
  // Selectors
  getUser: () => User | null;
  isAuthenticated: () => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasMfeAccess: (mfeName: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial State
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastActivity: Date.now(),
      
      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          
          if (!response.ok) {
            throw new Error('Invalid credentials');
          }
          
          const data = await response.json();
          const session: AuthSession = {
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
            permissions: ROLE_PERMISSIONS[data.user.role] || [],
            mfeAccess: MFE_ACCESS[data.user.role]?.reduce((acc, mfe) => ({ ...acc, [mfe]: true }), {}) || {}
          };
          
          set({ 
            session, 
            isAuthenticated: true, 
            isLoading: false,
            lastActivity: Date.now()
          });
          
          // Setup token refresh
          setupTokenRefresh(session.expiresAt);
          
          // Notify all MFEs about authentication
          window.postMessage({
            type: 'auth-login',
            session: session
          }, '*');
          
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
          throw error;
        }
      },
      
      logout: () => {
        const { session } = get();
        
        // Clear session
        set({ 
          session: null, 
          isAuthenticated: false,
          error: null,
          lastActivity: Date.now()
        });
        
        // Clear tokens from storage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        
        // Notify backend about logout
        if (session?.token) {
          fetch('/api/v1/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.token}`
            }
          }).catch(() => {
            // Ignore logout errors
          });
        }
        
        // Notify all MFEs about logout
        window.postMessage({
          type: 'auth-logout'
        }, '*');
        
        // Clear token refresh timer
        clearTokenRefreshTimer();
      },
      
      refreshToken: async () => {
        const { session } = get();
        if (!session?.refreshToken) {
          throw new Error('No refresh token available');
        }
        
        try {
          const response = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.refreshToken}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Token refresh failed');
          }
          
          const data = await response.json();
          const updatedSession: AuthSession = {
            ...session,
            token: data.token,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt
          };
          
          set({ session: updatedSession });
          
          // Setup next refresh
          setupTokenRefresh(updatedSession.expiresAt);
          
          // Notify MFEs about token update
          window.postMessage({
            type: 'auth-token-refreshed',
            session: updatedSession
          }, '*');
          
        } catch (error) {
          // If refresh fails, logout user
          get().logout();
          throw error;
        }
      },
      
      updateLastActivity: () => {
        set({ lastActivity: Date.now() });
      },
      
      checkSession: async () => {
        const { session } = get();
        if (!session?.token) {
          return false;
        }
        
        try {
          const response = await fetch('/api/v1/auth/validate', {
            headers: {
              'Authorization': `Bearer ${session.token}`
            }
          });
          
          return response.ok;
        } catch {
          return false;
        }
      },
      
      // Selectors
      getUser: () => get().session?.user || null,
      isAuthenticated: () => get().isAuthenticated,
      hasPermission: (permission: Permission) => {
        const user = get().session?.user;
        return user ? hasPermission(user, permission) : false;
      },
      hasMfeAccess: (mfeName: string) => {
        const user = get().session?.user;
        return user ? hasMfeAccess(user, mfeName) : false;
      },
      canAccessRoute: (route: string) => {
        const user = get().session?.user;
        return user ? canAccessRoute(user, route) : false;
      }
    })),
    {
      name: 'restaurant-auth-store',
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity
      })
    }
  )
);

// Token refresh management
let tokenRefreshTimer: NodeJS.Timeout | null = null;

const setupTokenRefresh = (expiresAt: number) => {
  clearTokenRefreshTimer();
  
  const refreshTime = expiresAt - Date.now() - 5 * 60 * 1000; // Refresh 5 minutes before expiry
  
  if (refreshTime > 0) {
    tokenRefreshTimer = setTimeout(() => {
      useAuthStore.getState().refreshToken().catch(() => {
        useAuthStore.getState().logout();
      });
    }, refreshTime);
  }
};

const clearTokenRefreshTimer = () => {
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
    tokenRefreshTimer = null;
  }
};

// Session activity monitoring
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

const checkInactivity = () => {
  const { lastActivity, isAuthenticated, logout } = useAuthStore.getState();
  
  if (isAuthenticated && Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
    logout();
  }
};

// Check inactivity every minute
setInterval(checkInactivity, 60 * 1000);
```

#### **Protected Route Components**

```typescript
// apps/shell-app/src/components/Auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@shared-state/auth';
import { Permission } from '@shared-state/auth/authTypes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredMfeAccess?: string;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredMfeAccess,
  fallback
}) => {
  const { isAuthenticated, hasPermission, hasMfeAccess } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check permissions
  const hasRequiredPermissions = requiredPermissions.every(permission => 
    hasPermission(permission)
  );
  
  if (!hasRequiredPermissions) {
    return fallback || (
      <div className="p-8 text-center">
        <div className="text-red-600 text-6xl mb-4">🚫</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600">
          You don't have permission to access this area.
        </p>
      </div>
    );
  }
  
  // Check MFE access
  if (requiredMfeAccess && !hasMfeAccess(requiredMfeAccess)) {
    return fallback || (
      <div className="p-8 text-center">
        <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Feature Not Available
        </h2>
        <p className="text-gray-600">
          This feature is not available for your role.
        </p>
      </div>
    );
  }
  
  return <>{children}</>;
};

// apps/shell-app/src/components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@shared-state/auth';
import { Button, FormField, Card } from '@shared-ui/components';

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, isLoading } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login(credentials);
      navigate('/');
    } catch (error) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Restaurant Platform
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to your account
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Email"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            required
            data-testid="email-input"
          />
          
          <FormField
            label="Password"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            required
            data-testid="password-input"
          />
          
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={credentials.rememberMe}
              onChange={(e) => setCredentials(prev => ({ ...prev, rememberMe: e.target.checked }))}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={isLoading || isSubmitting}
            data-testid="login-button"
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
};
```

### Cross-MFE Communication Strategy

#### 1. Event Bus System
```typescript
// packages/shared-state/src/eventBus.ts
export interface RestaurantEvent {
  type: string;
  payload: any;
  source: string;
  timestamp: number;
  correlation?: string;
}

export const RestaurantEventTypes = {
  // Menu Domain Events
  MENU_ACTIVATED: 'menu:activated',
  MENU_ITEM_AVAILABILITY_CHANGED: 'menu:item_availability_changed',
  MENU_ITEM_PRICE_UPDATED: 'menu:item_price_updated',
  
  // Order Domain Events
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_PAID: 'order:paid',
  ORDER_CANCELLED: 'order:cancelled',
  
  // Kitchen Domain Events
  KITCHEN_ORDER_STARTED: 'kitchen:order_started',
  KITCHEN_ORDER_READY: 'kitchen:order_ready',
  KITCHEN_QUEUE_UPDATED: 'kitchen:queue_updated',
  KITCHEN_STATION_ASSIGNED: 'kitchen:station_assigned',
  
  // Reservation Domain Events
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_CONFIRMED: 'reservation:confirmed',
  TABLE_ASSIGNED: 'table:assigned',
  CUSTOMER_CHECKED_IN: 'customer:checked_in',
  
  // Inventory Domain Events
  STOCK_LOW: 'inventory:stock_low',
  STOCK_OUT: 'inventory:stock_out',
  SUPPLIER_ORDER_PLACED: 'inventory:supplier_order_placed'
} as const;

class RestaurantEventBus {
  private listeners: Map<string, Set<Function>> = new Map();
  private eventHistory: RestaurantEvent[] = [];
  private maxHistorySize = 1000;
  
  emit(type: string, payload: any, source: string, correlation?: string) {
    const event: RestaurantEvent = {
      type,
      payload,
      source,
      timestamp: Date.now(),
      correlation
    };
    
    // Store in history for debugging
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Emit to listeners
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }
    
    // Also emit to global listeners
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in global event listener:`, error);
        }
      });
    }
  }
  
  subscribe(type: string, listener: Function): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }
  
  getEventHistory(): RestaurantEvent[] {
    return [...this.eventHistory];
  }
  
  clear() {
    this.listeners.clear();
    this.eventHistory.length = 0;
  }
}

export const restaurantEventBus = new RestaurantEventBus();

// React Hook for Event Bus
export const useRestaurantEvents = (eventType: string, handler: (event: RestaurantEvent) => void) => {
  useEffect(() => {
    const unsubscribe = restaurantEventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
};
```

#### 2. Shared State Management
```typescript
// packages/shared-state/src/globalStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'kitchen_staff' | 'waitstaff';
  permissions: string[];
}

interface RestaurantConfig {
  id: string;
  name: string;
  address: string;
  taxRate: number;
  timezone: string;
  operatingHours: {
    open: string;
    close: string;
  };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface GlobalRestaurantState {
  // Authentication & User
  user: User | null;
  isAuthenticated: boolean;
  
  // Restaurant Configuration
  restaurantConfig: RestaurantConfig | null;
  
  // Cross-MFE Shared Data
  activeMenu: { id: string; name: string; version: number } | null;
  todaysReservationCount: number;
  kitchenQueueLength: number;
  lowStockItems: Array<{ id: string; name: string; currentStock: number; threshold: number }>;
  
  // UI State
  sidebarCollapsed: boolean;
  currentTheme: 'light' | 'dark';
  
  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  
  // Performance Monitoring
  mfeLoadTimes: Record<string, number>;
  lastSync: number;
}

interface GlobalRestaurantActions {
  // Authentication
  setUser: (user: User | null) => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  
  // Restaurant Config
  setRestaurantConfig: (config: RestaurantConfig) => void;
  
  // Cross-MFE Data Updates
  setActiveMenu: (menu: { id: string; name: string; version: number } | null) => void;
  updateReservationCount: (count: number) => void;
  updateKitchenQueueLength: (length: number) => void;
  updateLowStockItems: (items: Array<{ id: string; name: string; currentStock: number; threshold: number }>) => void;
  
  // UI Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Notification Management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Performance Monitoring
  recordMfeLoadTime: (mfeName: string, loadTime: number) => void;
  updateLastSync: () => void;
}

export const useGlobalRestaurantStore = create<
  GlobalRestaurantState & GlobalRestaurantActions
>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial State
      user: null,
      isAuthenticated: false,
      restaurantConfig: null,
      activeMenu: null,
      todaysReservationCount: 0,
      kitchenQueueLength: 0,
      lowStockItems: [],
      sidebarCollapsed: false,
      currentTheme: 'light',
      notifications: [],
      unreadNotificationCount: 0,
      mfeLoadTimes: {},
      lastSync: Date.now(),
      
      // Authentication Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),
      
      login: async (credentials) => {
        try {
          // API call to authenticate
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
          });
          
          if (response.ok) {
            const { user, token } = await response.json();
            localStorage.setItem('authToken', token);
            set({ user, isAuthenticated: true });
          } else {
            throw new Error('Authentication failed');
          }
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('authToken');
        set({ 
          user: null, 
          isAuthenticated: false 
        });
      },
      
      // Restaurant Config
      setRestaurantConfig: (restaurantConfig) => set({ restaurantConfig }),
      
      // Cross-MFE Data Actions
      setActiveMenu: (activeMenu) => set({ activeMenu }),
      updateReservationCount: (todaysReservationCount) => set({ todaysReservationCount }),
      updateKitchenQueueLength: (kitchenQueueLength) => set({ kitchenQueueLength }),
      updateLowStockItems: (lowStockItems) => set({ lowStockItems }),
      
      // UI Actions
      toggleSidebar: () => set(state => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      setTheme: (currentTheme) => set({ currentTheme }),
      
      // Notification Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          read: false
        };
        
        set(state => ({
          notifications: [newNotification, ...state.notifications],
          unreadNotificationCount: state.unreadNotificationCount + 1
        }));
      },
      
      markNotificationRead: (id) => set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadNotificationCount: Math.max(0, state.unreadNotificationCount - 1)
      })),
      
      markAllNotificationsRead: () => set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotificationCount: 0
      })),
      
      removeNotification: (id) => set(state => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadNotificationCount: wasUnread 
            ? Math.max(0, state.unreadNotificationCount - 1)
            : state.unreadNotificationCount
        };
      }),
      
      clearNotifications: () => set({
        notifications: [],
        unreadNotificationCount: 0
      }),
      
      // Performance Monitoring
      recordMfeLoadTime: (mfeName, loadTime) => set(state => ({
        mfeLoadTimes: {
          ...state.mfeLoadTimes,
          [mfeName]: loadTime
        }
      })),
      
      updateLastSync: () => set({ lastSync: Date.now() })
    })),
    {
      name: 'restaurant-global-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        restaurantConfig: state.restaurantConfig,
        sidebarCollapsed: state.sidebarCollapsed,
        currentTheme: state.currentTheme
      })
    }
  )
);

// Setup cross-MFE synchronization
export const setupCrossMfeSync = () => {
  // Subscribe to event bus events and update global state
  restaurantEventBus.subscribe(
    RestaurantEventTypes.MENU_ACTIVATED,
    (event) => {
      useGlobalRestaurantStore.getState().setActiveMenu(event.payload);
    }
  );
  
  restaurantEventBus.subscribe(
    RestaurantEventTypes.KITCHEN_QUEUE_UPDATED,
    (event) => {
      useGlobalRestaurantStore.getState().updateKitchenQueueLength(event.payload.length);
    }
  );
  
  restaurantEventBus.subscribe(
    RestaurantEventTypes.STOCK_LOW,
    (event) => {
      const store = useGlobalRestaurantStore.getState();
      store.addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${event.payload.itemName} is running low (${event.payload.currentStock} remaining)`,
        actions: [
          {
            label: 'View Inventory',
            action: () => window.location.href = '/inventory'
          }
        ]
      });
    }
  );
};
```

#### 3. Shared Component Library
```typescript
// packages/shared-ui/src/components/index.ts
export { Button } from './Button/Button';
export { Card } from './Card/Card';
export { Modal } from './Modal/Modal';
export { Table } from './Table/Table';
export { StatusBadge } from './StatusBadge/StatusBadge';
export { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
export { DatePicker } from './DatePicker/DatePicker';
export { FormField } from './FormField/FormField';
export { Toast } from './Toast/Toast';

// Restaurant-specific components
export { RestaurantHeader } from './RestaurantHeader/RestaurantHeader';
export { RestaurantSidebar } from './RestaurantSidebar/RestaurantSidebar';
export { OrderStatusBadge } from './OrderStatusBadge/OrderStatusBadge';
export { MenuItemCard } from './MenuItemCard/MenuItemCard';
export { ReservationCard } from './ReservationCard/ReservationCard';
export { KitchenTimer } from './KitchenTimer/KitchenTimer';

// Layout components
export { MfeContainer } from './MfeContainer/MfeContainer';
export { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
export { LoadingFallback } from './LoadingFallback/LoadingFallback';

// packages/shared-ui/src/components/MfeContainer/MfeContainer.tsx
import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { LoadingFallback } from '../LoadingFallback/LoadingFallback';

interface MfeContainerProps {
  children: React.ReactNode;
  mfeName: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const MfeContainer: React.FC<MfeContainerProps> = ({
  children,
  mfeName,
  fallback,
  onError
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Error in MFE ${mfeName}:`, error, errorInfo);
    onError?.(error, errorInfo);
    
    // Send to monitoring service
    if (window.analytics) {
      window.analytics.track('MFE Error', {
        mfeName,
        error: error.message,
        stack: error.stack
      });
    }
  };

  return (
    <ErrorBoundary
      fallback={fallback || <div>Error loading {mfeName}</div>}
      onError={handleError}
    >
      <Suspense fallback={<LoadingFallback mfeName={mfeName} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
```

# MIGRATION PHASES

The migration is organized into **7 distinct phases**, each with clear objectives, deliverables, and success criteria. Each phase builds upon the previous one to ensure a smooth transition.

---

## 📋 **PHASE 1: FOUNDATION & INFRASTRUCTURE**
**Duration**: Week 1 (5 days)  
**Team**: Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Establish MFE foundation, shared packages, and development environment

### **Phase 1 Objectives**
- **Create backend authentication service** with Go microservice architecture
- Create monorepo structure with pnpm workspaces
- Extract shared components into reusable packages
- Setup Module Federation infrastructure
- Create shell application for MFE orchestration with authentication integration

### **Phase 1 Tasks**

#### **Day 1: Backend Authentication Service Creation**
- [ ] **Backend: Create user-service directory** following existing microservice architecture pattern
- [ ] **Backend: Setup Go module and dependencies** (golang-jwt/jwt, bcrypt, postgres driver)
- [ ] **Backend: Create user domain models** with type-safe IDs (User, Role, Permission entities)
- [ ] **Backend: Design authentication database schema** with PostgreSQL migrations:
  - `users` table (id, email, password_hash, role_id, created_at, updated_at, is_active)
  - `roles` table (id, name, description, permissions_json, created_at)
  - `user_sessions` table (id, user_id, token_hash, expires_at, created_at, ip_address)
  - `permissions` table (id, name, resource, action, description)
- [ ] **Backend: Implement user repository layer** with PostgreSQL integration
- [ ] **Backend: Create authentication business logic** (register, login, password validation, session management)

#### **Day 2: Backend Authentication Integration**
- [ ] **Backend: Build JWT token service** with Go-JWT library integration and refresh token support
- [ ] **Backend: Add authentication HTTP handlers** with REST API endpoints:
  - `POST /auth/register` - User registration
  - `POST /auth/login` - User login with email/password
  - `POST /auth/logout` - Session invalidation
  - `POST /auth/refresh` - Token refresh
  - `GET /auth/profile` - Get current user profile
  - `GET /auth/validate` - Token validation
- [ ] **Backend: Create authentication middleware** for protecting existing service APIs
- [ ] **Backend: Update nginx gateway** to route `/api/v1/auth/*` to user-service
- [ ] **Backend: Add RBAC permission system** with restaurant-specific roles:
  - `admin` - Full system access and user management
  - `manager` - Restaurant operations, reports, and staff management
  - `kitchen_staff` - Kitchen dashboard, order management, and inventory updates
  - `waitstaff` - Order creation, customer service, and table management
  - `host` - Reservation management, seating, and customer check-in
  - `cashier` - Payment processing, order completion, and daily reports
- [ ] **Backend: Configure environment variables** for JWT secrets, token expiration, and database connections
- [ ] **Backend: Test authentication endpoints** and verify integration with existing services

#### **Day 3: Frontend MFE Structure Setup**
- [ ] Create new repository structure with pnpm workspaces
- [ ] Setup shared packages (shared-ui, shared-utils, shared-state, mfe-tools)
- [ ] Configure TypeScript and ESLint for monorepo
- [ ] Setup build tools and development scripts
- [ ] Create package.json configurations for all packages

#### **Day 4: Shared Component Library & Backend Integration**
- [ ] Extract current UI components to shared-ui package
- [ ] Migrate TailwindCSS configuration to shared package
- [ ] Create MFE-specific components (MfeContainer, ErrorBoundary, LoadingFallback)
- [ ] Setup shared utilities and API client base
- [ ] Create shared type definitions matching backend user service
- [ ] **Create authentication TypeScript types** matching backend models:
  ```typescript
  interface User {
    id: UserID;
    email: string;
    role: RestaurantRole;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
  }
  ```
- [ ] **Setup JWT token management utilities** with automatic refresh
- [ ] **Create authentication API client** for user-service integration

#### **Day 5: Shell Application with Backend Authentication**
- [ ] Create shell-app with Module Federation host configuration
- [ ] Implement basic routing and layout structure
- [ ] **Integrate with backend authentication service**:
  - Login/logout forms connecting to `/api/v1/auth/*` endpoints
  - JWT token storage and management
  - Automatic token refresh with backend
  - Session validation with backend
- [ ] **Implement frontend RBAC system** matching backend permissions
- [ ] **Setup protected routes and MFE authorization** based on user roles
- [ ] **Create authentication guards** for all MFE access control
- [ ] Create MFE loading and error handling mechanisms
- [ ] Setup development environment with backend service integration
- [ ] **Test end-to-end authentication flow** from frontend login to backend validation

### **Phase 1 Deliverables**
✅ **Infrastructure**
- Working MFE monorepo with pnpm workspaces
- Module Federation configured and tested
- Development environment setup

✅ **Shared Packages**
- shared-ui package with component library
- shared-utils package with API clients and utilities
- shared-state package with global store, event bus, and authentication

✅ **Backend Authentication Service**
- Complete user-service microservice with Go architecture
- PostgreSQL database schema for users, roles, and sessions
- JWT token management with refresh token support
- Authentication middleware protecting all backend APIs
- RBAC system with 6 restaurant-specific roles
- Secure authentication endpoints with proper validation

✅ **Shell Application & Authentication Integration**
- Basic shell app running on port 3000
- Complete authentication system connected to backend user-service
- Role-based access control (RBAC) matching backend permissions
- Protected routing for MFEs based on user roles
- Session management and automatic token refresh
- MFE orchestration capabilities with authentication guards

✅ **Security & Authorization**
- JWT token management with automatic refresh
- Role-based permissions system
- MFE access control per user role
- Session timeout and inactivity monitoring
- Secure communication between MFEs

✅ **Documentation**
- Development setup guide
- Authentication system documentation
- Role and permission management guide
- Shared package usage documentation
- Architecture decision records

### **Phase 1 Success Criteria**

#### **Backend Authentication**
- [ ] **User-service running** and accessible via API Gateway (`/api/v1/auth/*`)
- [ ] **Database migrations applied** with users, roles, and sessions tables
- [ ] **JWT authentication working** end-to-end (register → login → token → validation)
- [ ] **All existing APIs protected** with authentication middleware
- [ ] **RBAC permissions enforced** across all backend services
- [ ] **Token refresh mechanism** working automatically

#### **Frontend MFE Infrastructure**
- [ ] All shared packages build and publish successfully
- [ ] Shell app loads without errors and shows login form
- [ ] **Authentication system connects to backend** (login/logout/token refresh)
- [ ] **Frontend RBAC matches backend** role permissions
- [ ] Module Federation configuration works
- [ ] **Protected routes prevent unauthorized access** based on backend validation
- [ ] **Session management syncs with backend** and handles timeouts correctly
- [ ] **End-to-end authentication flow** working from frontend to backend
- [ ] Development environment is fully functional
- [ ] Team can run `pnpm dev` and authenticate successfully

---

## 🎯 **PHASE 2: MENU MFE EXTRACTION**
**Duration**: Week 2 (5 days)  
**Team**: Menu Team + Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Extract Menu domain into first independent MFE and establish patterns

### **Phase 2 Objectives**
- Create first domain-specific MFE (Menu)
- Establish MFE development patterns
- Prove Module Federation integration works
- Setup independent deployment pipeline

### **Phase 2 Tasks**

#### **Day 1-2: Menu MFE Creation**
- [ ] Create menu-mfe application structure
- [ ] Configure Module Federation for menu-mfe (port 3001)
- [ ] Setup webpack configuration and build process
- [ ] Create basic routing structure for menu domain
- [ ] Setup development and build scripts

#### **Day 3-4: Component Migration & Views Implementation**
**📋 Refer to: [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md#-menu-mfe-port-3001) for complete Menu MFE view specifications**

**Core Views to Implement:**
- [ ] **Menu Management Views**
  - [ ] Menu List (`/menu`) - Active menu display with stats
  - [ ] Menu Editor (`/menu/edit/:menuId`) - Drag-and-drop editor
  - [ ] Menu Preview (`/menu/preview/:menuId`) - Customer-facing view
- [ ] **Item Management Views**  
  - [ ] Item List (`/menu/items`) - Searchable item grid
  - [ ] Item Editor (`/menu/items/edit/:itemId`) - Complete item form
  - [ ] Item Creation (`/menu/items/new`) - Creation wizard
- [ ] **Category Management Views**
  - [ ] Category List (`/menu/categories`) - Hierarchy management
  - [ ] Category Editor - Category details and ordering
- [ ] **Analytics Views**
  - [ ] Menu Performance (`/menu/analytics`) - Sales and popularity metrics

**Component Migration:**
- [ ] Migrate core components: MenuList, MenuCard, MenuEditor
- [ ] Migrate specialized: CategoryManager, MenuVersionControl, AvailabilityToggle
- [ ] Migrate hooks: useMenus, useActiveMenu, useMenuItems, useMenuAnalytics
- [ ] Migrate API services and type definitions
- [ ] Update all components to use shared-ui library
- [ ] Implement real-time inventory sync for availability
- [ ] Test menu functionality in isolation

#### **Day 5: Integration & Testing**
- [ ] Integrate menu-mfe into shell-app via Module Federation
- [ ] Test menu functionality loaded from shell app
- [ ] Setup CI/CD pipeline for menu-mfe
- [ ] Performance testing and bundle size optimization
- [ ] Create menu-mfe documentation

### **Phase 2 Deliverables**
✅ **Menu MFE**
- Functional menu-mfe running independently on port 3001
- Complete menu management functionality
- Integration with shared packages working

✅ **Module Federation Integration**
- Menu MFE loads successfully in shell app
- Shared dependencies working correctly
- Error handling and fallbacks implemented

✅ **CI/CD Pipeline**
- Independent deployment pipeline for menu-mfe
- Automated testing and build process
- Docker containerization working

✅ **Documentation**
- Menu MFE development guide
- Module Federation integration patterns
- Deployment procedures

### **Phase 2 Success Criteria**
- [ ] Menu MFE builds and runs independently
- [ ] Menu MFE loads correctly in shell app
- [ ] All menu functionality works as before
- [ ] CI/CD pipeline deploys menu-mfe successfully
- [ ] Performance metrics meet targets (< 500ms load time)

---

## 🔄 **PHASE 3: ORDERS MFE & CROSS-MFE COMMUNICATION**
**Duration**: Week 3 (5 days)  
**Team**: Orders Team + Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Extract Orders domain and establish cross-MFE communication patterns

### **Phase 3 Objectives**
- Create Orders MFE with complete order management
- Implement event bus for cross-MFE communication
- Establish data synchronization patterns
- Test order-menu integration workflows

### **Phase 3 Tasks**

#### **Day 1-2: Orders MFE Creation & Views Implementation**
**📋 Refer to: [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md#️-orders-mfe-port-3002) for complete Orders MFE view specifications**

**Core Views to Implement:**
- [ ] **Order Management Views**
  - [ ] Order Dashboard (`/orders`) - Active orders with filtering
  - [ ] Order Details (`/orders/:orderId`) - Complete order information
  - [ ] Order History (`/orders/history`) - Completed orders archive
- [ ] **Order Creation Views**
  - [ ] New Order (`/orders/new`) - Multi-type order creation
  - [ ] Quick Order (`/orders/quick`) - Streamlined common orders
- [ ] **Customer Management Views**
  - [ ] Customer Lookup (`/orders/customers`) - Customer search
  - [ ] Customer Details (`/orders/customers/:customerId`) - Profile and history
- [ ] **Payment Views**
  - [ ] Payment Processing (Modal) - Payment method handling
  - [ ] Payment History (`/orders/payments`) - Transaction management

**Component Migration:**
- [ ] Create orders-mfe application structure (port 3002)
- [ ] Configure Module Federation for orders-mfe
- [ ] Migrate core components: OrderList, OrderCard, OrderForm, OrderTimeline
- [ ] Migrate specialized: MenuItemSelector, PaymentProcessor, CustomerSelector
- [ ] Migrate order hooks and API services
- [ ] Setup order-specific routing and navigation
- [ ] Implement real-time order status updates

#### **Day 3-4: Cross-MFE Communication**
- [ ] Implement restaurant event bus system
- [ ] Setup shared state management for cross-domain data
- [ ] Implement order-menu communication patterns
  - [ ] Menu item selection in order creation
  - [ ] Menu availability updates affecting orders
- [ ] Test order creation workflow with menu integration
- [ ] Implement order status update events

#### **Day 5: Integration Testing**
- [ ] End-to-end testing of order creation workflow
- [ ] Test cross-MFE event propagation
- [ ] Performance testing with multiple MFEs
- [ ] Setup monitoring for cross-MFE communication
- [ ] Documentation of communication patterns

### **Phase 3 Deliverables**
✅ **Orders MFE**
- Functional orders-mfe running on port 3002
- Complete order management functionality
- Integration with menu-mfe working

✅ **Event Bus System**
- Restaurant-specific event system implemented
- Cross-MFE communication working
- Shared state synchronization functional

✅ **Integration Workflows**
- Order creation with menu integration
- Real-time order status updates
- Menu availability affecting order creation

✅ **Documentation**
- Cross-MFE communication guide
- Event bus usage patterns
- Order-menu integration workflows

### **Phase 3 Success Criteria**
- [ ] Orders MFE functions independently
- [ ] Order creation with menu selection works seamlessly
- [ ] Events propagate correctly between MFEs
- [ ] No performance degradation with multiple MFEs
- [ ] All order workflows function as before

---

## 👨‍🍳 **PHASE 4: KITCHEN MFE & REAL-TIME INTEGRATION**
**Duration**: Week 4 (5 days)  
**Team**: Kitchen Team + Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Extract Kitchen domain and complete order-to-kitchen real-time workflow

### **Phase 4 Objectives**
- Create Kitchen MFE with real-time capabilities
- Implement WebSocket integration for live updates
- Complete order-to-kitchen workflow
- Establish kitchen performance monitoring

### **Phase 4 Tasks**

#### **Day 1-2: Kitchen MFE Creation & Views Implementation**
**📋 Refer to: [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md#-kitchen-mfe-port-3003) for complete Kitchen MFE view specifications**

**Core Views to Implement:**
- [ ] **Kitchen Dashboard Views**
  - [ ] Kitchen Queue (`/kitchen`) - Active orders queue with timers
  - [ ] Order Preparation (`/kitchen/orders/:orderId`) - Detailed prep view
- [ ] **Station Management Views**
  - [ ] Station Overview (`/kitchen/stations`) - All stations status
  - [ ] Station Details (`/kitchen/stations/:stationId`) - Station-specific orders
- [ ] **Workflow Views**
  - [ ] Prep Schedule (`/kitchen/prep`) - Daily prep requirements
  - [ ] Kitchen Analytics (`/kitchen/analytics`) - Performance metrics
- [ ] **Communication Views**
  - [ ] Kitchen Notes (`/kitchen/notes`) - Team communication

**Component Migration:**
- [ ] Create kitchen-mfe application structure (port 3003)
- [ ] Configure Module Federation for kitchen-mfe
- [ ] Migrate core components: KitchenQueue, KitchenOrderCard, PreparationTimer
- [ ] Migrate specialized: StationAssignment, KitchenStatusBoard, KitchenChat
- [ ] Setup WebSocket integration for real-time updates
- [ ] Migrate kitchen hooks and API services
- [ ] Implement kitchen-specific routing and navigation

#### **Day 3-4: Order-Kitchen Integration**
- [ ] Implement order-to-kitchen event flow
- [ ] Setup kitchen queue real-time updates
- [ ] Test order preparation workflow
  - [ ] Orders appear in kitchen queue when paid
  - [ ] Kitchen status updates propagate to orders
- [ ] Implement kitchen station assignment
- [ ] Setup kitchen performance metrics

#### **Day 5: Real-time Testing**
- [ ] End-to-end testing: order creation → kitchen completion
- [ ] Performance testing with real-time updates
- [ ] Load testing with multiple concurrent orders
- [ ] WebSocket connection stability testing
- [ ] Create kitchen team training materials

### **Phase 4 Deliverables**
✅ **Kitchen MFE**
- Functional kitchen-mfe running on port 3003
- Real-time kitchen dashboard working
- WebSocket integration functional

✅ **Order-Kitchen Workflow**
- Complete order lifecycle from creation to completion
- Real-time status updates across MFEs
- Kitchen queue management working

✅ **Performance Monitoring**
- Kitchen performance metrics implemented
- Real-time update performance optimized
- Load testing results documented

✅ **Documentation**
- Kitchen MFE usage guide
- Real-time integration patterns
- WebSocket implementation guide

### **Phase 4 Success Criteria**
- [ ] Kitchen MFE displays orders in real-time
- [ ] Order status updates propagate instantly
- [ ] Kitchen workflow performs as efficiently as before
- [ ] WebSocket connections remain stable under load
- [ ] Kitchen team can use new interface effectively

---

## 📅 **PHASE 5: RESERVATIONS MFE**
**Duration**: Week 5 (5 days)  
**Team**: Reservations Team + Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Extract Reservations domain and complete customer-facing features

### **Phase 5 Objectives**
- Create Reservations MFE with booking capabilities
- Implement table management and waitlist features
- Setup reservation notification system
- Complete core restaurant domains extraction

### **Phase 5 Tasks**

#### **Day 1-3: Reservations MFE Creation & Views Implementation**
**📋 Refer to: [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md#-reservations-mfe-port-3004) for complete Reservations MFE view specifications**

**Core Views to Implement:**
- [ ] **Reservation Management Views**
  - [ ] Reservations Dashboard (`/reservations`) - Today's reservations overview
  - [ ] Reservation Calendar (`/reservations/calendar`) - Multi-view calendar
  - [ ] Reservation Details (`/reservations/:reservationId`) - Complete booking info
- [ ] **Table Management Views**
  - [ ] Table Layout (`/reservations/tables`) - Interactive floor plan
  - [ ] Table Details (`/reservations/tables/:tableId`) - Table information
- [ ] **Customer Views**
  - [ ] Guest Management (`/reservations/guests`) - Customer database
  - [ ] Waitlist Management (`/reservations/waitlist`) - Queue management
- [ ] **Booking Views**
  - [ ] New Reservation (`/reservations/new`) - Booking creation
  - [ ] Walk-in Booking (`/reservations/walkin`) - Quick booking

**Component Migration:**
- [ ] Create reservations-mfe application structure (port 3004)
- [ ] Configure Module Federation for reservations-mfe
- [ ] Migrate core components: ReservationCard, ReservationCalendar, TableLayout
- [ ] Migrate specialized: GuestProfile, WaitlistManager, AvailabilityChecker
- [ ] Setup table management functionality
- [ ] Implement waitlist management system
- [ ] Implement real-time table status integration

#### **Day 4-5: Integration and Testing**
- [ ] Integrate reservations with global notification system
- [ ] Test reservation creation and management workflows
- [ ] Setup reservation confirmation notifications
- [ ] Test table availability checking
- [ ] Performance testing and optimization

### **Phase 5 Deliverables**
✅ **Reservations MFE**
- Functional reservations-mfe running on port 3004
- Complete reservation management system
- Table booking and waitlist functionality

✅ **Customer Experience**
- Reservation creation and confirmation working
- Waitlist management functional
- Table availability checking accurate

✅ **Notification System**
- Reservation notifications working
- Cross-MFE notification propagation
- Email/SMS notification integration ready

### **Phase 5 Success Criteria**
- [ ] Reservations MFE handles all booking scenarios
- [ ] Table management works correctly
- [ ] Waitlist functionality operates smoothly
- [ ] Notification system delivers messages reliably
- [ ] Restaurant staff can manage reservations effectively

---

## 📦 **PHASE 6: INVENTORY MFE & ECOSYSTEM COMPLETION**
**Duration**: Week 6 (5 days)  
**Team**: Inventory Team + Platform Team  
**Status**: 🔴 Not Started  
**Goal**: Complete MFE ecosystem with Inventory domain and final integrations

### **Phase 6 Objectives**
- Create Inventory MFE with stock management
- Complete all cross-domain integrations
- Implement inventory-driven menu availability
- Finalize complete restaurant ecosystem

### **Phase 6 Tasks**

#### **Day 1-3: Inventory MFE Creation & Views Implementation**
**📋 Refer to: [MFE-DETAILED-VIEWS.md](./MFE-DETAILED-VIEWS.md#-inventory-mfe-port-3005) for complete Inventory MFE view specifications**

**Core Views to Implement:**
- [ ] **Inventory Dashboard Views**
  - [ ] Inventory Overview (`/inventory`) - Stock level summary with alerts
  - [ ] Stock Levels (`/inventory/stock`) - Item-by-item inventory tracking
- [ ] **Item Management Views**
  - [ ] Inventory Items (`/inventory/items`) - Complete item catalog
  - [ ] Item Details (`/inventory/items/:itemId`) - Detailed item management
- [ ] **Supplier Management Views**
  - [ ] Supplier List (`/inventory/suppliers`) - Supplier directory
  - [ ] Supplier Details (`/inventory/suppliers/:supplierId`) - Supplier profiles
- [ ] **Analytics Views**
  - [ ] Usage Analytics (`/inventory/analytics`) - Consumption patterns
  - [ ] Purchase Orders (`/inventory/orders`) - Order management
- [ ] **Stock Operations Views**
  - [ ] Stock Movements (`/inventory/movements`) - Movement tracking
  - [ ] Stock Take (`/inventory/stocktake`) - Physical inventory counting

**Component Migration:**
- [ ] Create inventory-mfe application structure (port 3005)
- [ ] Configure Module Federation for inventory-mfe
- [ ] Migrate core components: InventoryGrid, StockLevelIndicator, SupplierCard
- [ ] Migrate specialized: PurchaseOrderForm, StockMovementTracker, CostTracker
- [ ] Setup stock monitoring and alert system
- [ ] Implement supplier management functionality
- [ ] Implement real-time stock level synchronization

#### **Day 4-5: Final Integration**
- [ ] Complete inventory-menu integration for availability updates
- [ ] Setup low stock notifications across all MFEs
- [ ] Final end-to-end testing of complete ecosystem
- [ ] Performance optimization and monitoring setup
- [ ] Complete documentation and training materials

### **Phase 6 Deliverables**
✅ **Inventory MFE**
- Functional inventory-mfe running on port 3005
- Complete stock management system
- Supplier management functionality

✅ **Complete Ecosystem**
- All 5 MFEs working together seamlessly
- Cross-domain integrations functional
- Inventory-driven menu availability working

✅ **Final Integration**
- Low stock alerts propagating to relevant MFEs
- Complete restaurant workflow functional
- Performance optimized across all domains

### **Phase 6 Success Criteria**
- [ ] Inventory MFE manages stock effectively
- [ ] Menu availability updates based on inventory
- [ ] All MFEs communicate correctly
- [ ] Complete restaurant workflow functions end-to-end
- [ ] Performance meets or exceeds current system

---

## 🚀 **PHASE 7: PRODUCTION OPTIMIZATION & DEPLOYMENT**
**Duration**: Week 7 (5 days)  
**Team**: All Teams + DevOps  
**Status**: 🔴 Not Started  
**Goal**: Production readiness, performance optimization, and go-live preparation

### **Phase 7 Objectives**
- Optimize all MFEs for production performance
- Setup production infrastructure and deployment
- Implement comprehensive monitoring and alerting
- Complete team training and go-live preparation

### **Phase 7 Tasks**

#### **Day 1-2: Performance Optimization**
- [ ] Bundle size optimization for all MFEs
- [ ] Implement lazy loading strategies
- [ ] Setup CDN deployment for static assets
- [ ] Optimize shared dependency loading
- [ ] Implement caching strategies

#### **Day 3-4: Production Infrastructure**
- [ ] Setup production Docker containers
- [ ] Configure Kubernetes manifests
- [ ] Setup monitoring and alerting systems
- [ ] Implement health checks and circuit breakers
- [ ] Configure production environment variables

#### **Day 5: Go-Live Preparation**
- [ ] Final production testing and load testing
- [ ] Complete team training and documentation
- [ ] Test deployment procedures and rollback plans
- [ ] Setup production monitoring dashboards
- [ ] Go-live readiness review

### **Phase 7 Deliverables**
✅ **Production-Ready Platform**
- All MFEs optimized for production performance
- Complete deployment automation working
- Production infrastructure configured

✅ **Monitoring & Operations**
- Comprehensive monitoring and alerting setup
- Performance dashboards operational
- Error tracking and logging implemented

✅ **Team Readiness**
- All teams trained on new MFE architecture
- Documentation complete and accessible
- Support procedures established

✅ **Go-Live Preparation**
- Production deployment tested
- Rollback procedures verified
- Performance benchmarks established

### **Phase 7 Success Criteria**
- [ ] All MFEs perform better than current monolith
- [ ] Production deployment successful
- [ ] Monitoring systems operational
- [ ] Teams confident with new architecture
- [ ] Ready for production traffic

---

## 📊 **PHASE SUMMARY & TIMELINE**

| Phase | Duration | Team | Key Deliverable | Success Metric |
|-------|----------|------|----------------|----------------|
| **Phase 1** | Week 1 | Platform | MFE Infrastructure | Shell app loads with Module Federation |
| **Phase 2** | Week 2 | Menu + Platform | Menu MFE | Menu functionality working independently |
| **Phase 3** | Week 3 | Orders + Platform | Orders MFE + Communication | Order-menu integration working |
| **Phase 4** | Week 4 | Kitchen + Platform | Kitchen MFE + Real-time | Order-kitchen workflow complete |
| **Phase 5** | Week 5 | Reservations + Platform | Reservations MFE | Reservation system fully functional |
| **Phase 6** | Week 6 | Inventory + Platform | Complete Ecosystem | All domains integrated |
| **Phase 7** | Week 7 | All Teams | Production Ready | Performance targets met |

### **Critical Dependencies**
- Phase 2 depends on Phase 1 completion
- Phase 3 requires Phase 2 patterns established
- Phase 4 builds on Phase 3 communication
- Phases 5-6 can run in parallel after Phase 4
- Phase 7 requires all previous phases complete

### **Risk Mitigation**
- Each phase has fallback plans
- Phase dependencies clearly defined
- Team training included in each phase
- Performance testing throughout
- Rollback procedures documented

## Development Workflow

### Project Structure
```
restaurant-platform-mfe/
├── apps/
│   ├── shell-app/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layout/
│   │   │   │   │   ├── AppLayout.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── Sidebar.tsx
│   │   │   │   ├── MfeLoader/
│   │   │   │   │   ├── MfeLoader.tsx
│   │   │   │   │   └── MfeFallback.tsx
│   │   │   │   └── Auth/
│   │   │   │       ├── LoginForm.tsx
│   │   │   │       └── ProtectedRoute.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── NotFound.tsx
│   │   │   ├── routes/
│   │   │   │   └── AppRoutes.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useMfeLoader.ts
│   │   │   ├── utils/
│   │   │   │   ├── mfeLoader.ts
│   │   │   │   └── errorHandling.ts
│   │   │   ├── App.tsx
│   │   │   └── index.tsx
│   │   ├── public/
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── menu-mfe/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── MenuList/
│   │   │   │   ├── MenuEditor/
│   │   │   │   ├── CategoryManager/
│   │   │   │   └── MenuItemForm/
│   │   │   ├── pages/
│   │   │   │   ├── MenuDashboard.tsx
│   │   │   │   ├── MenuEditor.tsx
│   │   │   │   └── MenuAnalytics.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useMenus.ts
│   │   │   │   ├── useMenuItems.ts
│   │   │   │   └── useMenuAnalytics.ts
│   │   │   ├── services/
│   │   │   │   └── menuApi.ts
│   │   │   ├── types/
│   │   │   │   └── menu.types.ts
│   │   │   ├── routes/
│   │   │   │   └── MenuRoutes.tsx
│   │   │   ├── App.tsx
│   │   │   └── bootstrap.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── orders-mfe/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── OrderList/
│   │   │   │   ├── OrderForm/
│   │   │   │   ├── OrderCard/
│   │   │   │   └── OrderStatusTracker/
│   │   │   ├── pages/
│   │   │   │   ├── OrderDashboard.tsx
│   │   │   │   ├── OrderCreator.tsx
│   │   │   │   └── OrderDetails.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useOrders.ts
│   │   │   │   ├── useOrderCreation.ts
│   │   │   │   └── useOrderStatus.ts
│   │   │   ├── services/
│   │   │   │   └── orderApi.ts
│   │   │   ├── types/
│   │   │   │   └── order.types.ts
│   │   │   ├── routes/
│   │   │   │   └── OrderRoutes.tsx
│   │   │   ├── App.tsx
│   │   │   └── bootstrap.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── kitchen-mfe/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── KitchenQueue/
│   │   │   │   ├── OrderCard/
│   │   │   │   ├── Timer/
│   │   │   │   └── StationAssignment/
│   │   │   ├── pages/
│   │   │   │   ├── KitchenDashboard.tsx
│   │   │   │   └── KitchenMetrics.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useKitchenOrders.ts
│   │   │   │   ├── useKitchenMetrics.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   ├── services/
│   │   │   │   ├── kitchenApi.ts
│   │   │   │   └── webSocketService.ts
│   │   │   ├── types/
│   │   │   │   └── kitchen.types.ts
│   │   │   ├── routes/
│   │   │   │   └── KitchenRoutes.tsx
│   │   │   ├── App.tsx
│   │   │   └── bootstrap.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── reservations-mfe/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ReservationCalendar/
│   │   │   │   ├── ReservationForm/
│   │   │   │   ├── TableLayout/
│   │   │   │   └── WaitlistManager/
│   │   │   ├── pages/
│   │   │   │   ├── ReservationDashboard.tsx
│   │   │   │   ├── ReservationCalendar.tsx
│   │   │   │   └── TableManagement.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useReservations.ts
│   │   │   │   ├── useTableAvailability.ts
│   │   │   │   └── useWaitlist.ts
│   │   │   ├── services/
│   │   │   │   └── reservationApi.ts
│   │   │   ├── types/
│   │   │   │   └── reservation.types.ts
│   │   │   ├── routes/
│   │   │   │   └── ReservationRoutes.tsx
│   │   │   ├── App.tsx
│   │   │   └── bootstrap.tsx
│   │   ├── webpack.config.js
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── inventory-mfe/
│       ├── src/
│       │   ├── components/
│       │   │   ├── InventoryGrid/
│       │   │   ├── StockLevelIndicator/
│       │   │   ├── SupplierManager/
│       │   │   └── StockMovementLog/
│       │   ├── pages/
│       │   │   ├── InventoryDashboard.tsx
│       │   │   ├── StockManagement.tsx
│       │   │   └── SupplierManagement.tsx
│       │   ├── hooks/
│       │   │   ├── useInventory.ts
│       │   │   ├── useStockMovements.ts
│       │   │   └── useSuppliers.ts
│       │   ├── services/
│       │   │   └── inventoryApi.ts
│       │   ├── types/
│       │   │   └── inventory.types.ts
│       │   ├── routes/
│       │   │   └── InventoryRoutes.tsx
│       │   ├── App.tsx
│       │   └── bootstrap.tsx
│       ├── webpack.config.js
│       ├── package.json
│       └── Dockerfile
│
├── packages/
│   ├── shared-ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Button.stories.tsx
│   │   │   │   │   └── Button.test.tsx
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Table/
│   │   │   │   ├── StatusBadge/
│   │   │   │   ├── RestaurantHeader/
│   │   │   │   ├── RestaurantSidebar/
│   │   │   │   ├── MfeContainer/
│   │   │   │   ├── ErrorBoundary/
│   │   │   │   └── LoadingFallback/
│   │   │   ├── tokens/
│   │   │   │   ├── colors.ts
│   │   │   │   ├── typography.ts
│   │   │   │   ├── spacing.ts
│   │   │   │   └── breakpoints.ts
│   │   │   ├── utils/
│   │   │   │   ├── classNames.ts
│   │   │   │   └── theme.ts
│   │   │   └── index.ts
│   │   ├── tailwind.config.js
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── shared-utils/
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── apiClient.ts
│   │   │   │   ├── authApi.ts
│   │   │   │   └── types.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useApi.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   └── useDebounce.ts
│   │   │   ├── types/
│   │   │   │   ├── common.types.ts
│   │   │   │   ├── api.types.ts
│   │   │   │   └── restaurant.types.ts
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── validators.ts
│   │   │   │   ├── dateUtils.ts
│   │   │   │   └── constants.ts
│   │   │   ├── constants/
│   │   │   │   ├── routes.ts
│   │   │   │   ├── statusCodes.ts
│   │   │   │   └── errorMessages.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── shared-state/
│   │   ├── src/
│   │   │   ├── eventBus/
│   │   │   │   ├── eventBus.ts
│   │   │   │   ├── eventTypes.ts
│   │   │   │   └── hooks.ts
│   │   │   ├── stores/
│   │   │   │   ├── globalStore.ts
│   │   │   │   ├── authStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   ├── websocket/
│   │   │   │   ├── webSocketClient.ts
│   │   │   │   └── webSocketHooks.ts
│   │   │   ├── sync/
│   │   │   │   ├── crossMfeSync.ts
│   │   │   │   └── syncHooks.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── mfe-tools/
│       ├── src/
│       │   ├── webpack/
│       │   │   ├── webpack.common.js
│       │   │   ├── webpack.dev.js
│       │   │   ├── webpack.prod.js
│       │   │   └── module-federation.config.js
│       │   ├── scripts/
│       │   │   ├── start-all-mfes.js
│       │   │   ├── build-all-mfes.js
│       │   │   └── test-all-mfes.js
│       │   ├── configs/
│       │   │   ├── jest.config.js
│       │   │   ├── eslint.config.js
│       │   │   └── tsconfig.base.json
│       │   └── index.js
│       ├── package.json
│       └── README.md
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── docker-compose.dev.yml
│   │   └── nginx/
│   │       ├── nginx.conf
│   │       └── default.conf
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── shell-app/
│   │   │   ├── deployment.yaml
│   │   │   ├── service.yaml
│   │   │   └── ingress.yaml
│   │   ├── menu-mfe/
│   │   │   ├── deployment.yaml
│   │   │   └── service.yaml
│   │   ├── orders-mfe/
│   │   ├── kitchen-mfe/
│   │   ├── reservations-mfe/
│   │   ├── inventory-mfe/
│   │   └── configmaps/
│   │       └── app-config.yaml
│   └── scripts/
│       ├── deploy.sh
│       ├── rollback.sh
│       └── health-check.sh
│
├── .github/
│   └── workflows/
│       ├── shell-app.yml
│       ├── menu-mfe.yml
│       ├── orders-mfe.yml
│       ├── kitchen-mfe.yml
│       ├── reservations-mfe.yml
│       ├── inventory-mfe.yml
│       └── shared-packages.yml
│
├── docs/
│   ├── architecture/
│   │   ├── mfe-architecture.md
│   │   ├── communication-patterns.md
│   │   └── deployment-strategy.md
│   ├── development/
│   │   ├── getting-started.md
│   │   ├── mfe-development-guide.md
│   │   └── testing-strategy.md
│   └── operations/
│       ├── deployment-guide.md
│       ├── monitoring.md
│       └── troubleshooting.md
│
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .gitignore
└── README.md
```

### Package.json Configuration
```json
{
  "name": "restaurant-platform-mfe",
  "private": true,
  "scripts": {
    "dev": "concurrently \"pnpm --filter shell-app dev\" \"pnpm --filter menu-mfe dev\" \"pnpm --filter orders-mfe dev\" \"pnpm --filter kitchen-mfe dev\" \"pnpm --filter reservations-mfe dev\" \"pnpm --filter inventory-mfe dev\"",
    "dev:shell": "pnpm --filter shell-app dev",
    "dev:menu": "pnpm --filter menu-mfe dev",
    "dev:orders": "pnpm --filter orders-mfe dev",
    "dev:kitchen": "pnpm --filter kitchen-mfe dev",
    "dev:reservations": "pnpm --filter reservations-mfe dev",
    "dev:inventory": "pnpm --filter inventory-mfe dev",
    "build": "pnpm --filter shared-ui build && pnpm --filter shared-utils build && pnpm --filter shared-state build && concurrently \"pnpm --filter shell-app build\" \"pnpm --filter menu-mfe build\" \"pnpm --filter orders-mfe build\" \"pnpm --filter kitchen-mfe build\" \"pnpm --filter reservations-mfe build\" \"pnpm --filter inventory-mfe build\"",
    "build:shared": "pnpm --filter shared-ui build && pnpm --filter shared-utils build && pnpm --filter shared-state build",
    "test": "pnpm --recursive test",
    "test:unit": "pnpm --recursive test:unit",
    "test:e2e": "pnpm --filter shell-app test:e2e",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check",
    "clean": "pnpm --recursive clean",
    "docker:build": "docker-compose -f infrastructure/docker/docker-compose.yml build",
    "docker:up": "docker-compose -f infrastructure/docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f infrastructure/docker/docker-compose.yml down"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "concurrently": "^8.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Development Commands
```bash
# Clone and setup
git clone <repository>
cd restaurant-platform-mfe
pnpm install

# Development - Start all MFEs
pnpm dev

# Development - Start specific MFE
pnpm dev:shell     # Shell app on port 3000
pnpm dev:menu      # Menu MFE on port 3001
pnpm dev:orders    # Orders MFE on port 3002
pnpm dev:kitchen   # Kitchen MFE on port 3003
pnpm dev:reservations # Reservations MFE on port 3004
pnpm dev:inventory # Inventory MFE on port 3005

# Build for production
pnpm build

# Testing
pnpm test          # All tests
pnpm test:unit     # Unit tests only
pnpm test:e2e      # End-to-end tests

# Code quality
pnpm lint          # Lint all packages
pnpm type-check    # TypeScript checking

# Docker development
pnpm docker:build  # Build all containers
pnpm docker:up     # Start all services
pnpm docker:down   # Stop all services
```

## Deployment Strategy

### Docker Containerization
```yaml
# infrastructure/docker/docker-compose.yml
version: '3.8'
services:
  # Backend Services (existing)
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: restaurant_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - restaurant-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - restaurant-network

  backend-gateway:
    build: ../../backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    networks:
      - restaurant-network

  # Frontend MFEs
  shell-app:
    build:
      context: ../..
      dockerfile: apps/shell-app/Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
      - REACT_APP_MENU_MFE_URL=http://menu-mfe
      - REACT_APP_ORDERS_MFE_URL=http://orders-mfe
      - REACT_APP_KITCHEN_MFE_URL=http://kitchen-mfe
      - REACT_APP_RESERVATIONS_MFE_URL=http://reservations-mfe
      - REACT_APP_INVENTORY_MFE_URL=http://inventory-mfe
    depends_on:
      - backend-gateway
    networks:
      - restaurant-network

  menu-mfe:
    build:
      context: ../..
      dockerfile: apps/menu-mfe/Dockerfile
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
    networks:
      - restaurant-network

  orders-mfe:
    build:
      context: ../..
      dockerfile: apps/orders-mfe/Dockerfile
    ports:
      - "3002:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
    networks:
      - restaurant-network

  kitchen-mfe:
    build:
      context: ../..
      dockerfile: apps/kitchen-mfe/Dockerfile
    ports:
      - "3003:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
    networks:
      - restaurant-network

  reservations-mfe:
    build:
      context: ../..
      dockerfile: apps/reservations-mfe/Dockerfile
    ports:
      - "3004:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
    networks:
      - restaurant-network

  inventory-mfe:
    build:
      context: ../..
      dockerfile: apps/inventory-mfe/Dockerfile
    ports:
      - "3005:80"
    environment:
      - REACT_APP_API_URL=http://backend-gateway:8080/api/v1
    networks:
      - restaurant-network

  # API Gateway for MFEs
  mfe-gateway:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - shell-app
      - menu-mfe
      - orders-mfe
      - kitchen-mfe
      - reservations-mfe
      - inventory-mfe
    networks:
      - restaurant-network

volumes:
  postgres_data:
  redis_data:

networks:
  restaurant-network:
    driver: bridge
```

### Nginx Gateway Configuration
```nginx
# infrastructure/docker/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream shell-app {
        server shell-app:80;
    }

    upstream menu-mfe {
        server menu-mfe:80;
    }

    upstream orders-mfe {
        server orders-mfe:80;
    }

    upstream kitchen-mfe {
        server kitchen-mfe:80;
    }

    upstream reservations-mfe {
        server reservations-mfe:80;
    }

    upstream inventory-mfe {
        server inventory-mfe:80;
    }

    server {
        listen 80;
        server_name localhost;

        # Shell app (default)
        location / {
            proxy_pass http://shell-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # MFE-specific routes for Module Federation
        location /menu-mfe/ {
            proxy_pass http://menu-mfe/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /orders-mfe/ {
            proxy_pass http://orders-mfe/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /kitchen-mfe/ {
            proxy_pass http://kitchen-mfe/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /reservations-mfe/ {
            proxy_pass http://reservations-mfe/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /inventory-mfe/ {
            proxy_pass http://inventory-mfe/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check endpoint
        location /health {
            return 200 'MFE Gateway Healthy';
            add_header Content-Type text/plain;
        }
    }
}
```

### CI/CD Pipeline Configuration
```yaml
# .github/workflows/shell-app.yml
name: Shell App CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['apps/shell-app/**', 'packages/**']
  pull_request:
    branches: [main]
    paths: ['apps/shell-app/**', 'packages/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build shared packages
        run: pnpm build:shared
      
      - name: Lint
        run: pnpm --filter shell-app lint
      
      - name: Type check
        run: pnpm --filter shell-app type-check
      
      - name: Unit tests
        run: pnpm --filter shell-app test:unit
      
      - name: Build
        run: pnpm --filter shell-app build

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -f apps/shell-app/Dockerfile -t restaurant-shell-app:${{ github.sha }} .
      
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          echo "Deploying shell-app to staging"
      
      - name: Run E2E tests
        run: |
          # Run end-to-end tests against staging
          echo "Running E2E tests"
      
      - name: Deploy to production
        if: success()
        run: |
          # Deploy to production environment
          echo "Deploying shell-app to production"
```

## Performance Optimization

### Bundle Size Optimization
```javascript
// packages/mfe-tools/src/webpack/webpack.prod.js
const path = require('path');
const ModuleFederationPlugin = require('@module-federation/webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  mode: 'production',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          enforce: true
        },
        shared: {
          test: /[\\/]packages[\\/](shared-ui|shared-utils|shared-state)[\\/]/,
          name: 'shared',
          chunks: 'all',
          enforce: true
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE_BUNDLE ? 'server' : 'disabled'
    })
  ]
};
```

### Lazy Loading Strategy
```typescript
// apps/shell-app/src/components/MfeLoader/MfeLoader.tsx
import React, { Suspense, lazy } from 'react';
import { MfeContainer } from '@shared-ui/components';
import { LoadingFallback } from '@shared-ui/components';

interface MfeLoaderProps {
  mfeName: string;
  moduleName: string;
  fallback?: React.ReactNode;
}

const mfeCache = new Map<string, React.ComponentType<any>>();

export const MfeLoader: React.FC<MfeLoaderProps> = ({
  mfeName,
  moduleName,
  fallback
}) => {
  const cacheKey = `${mfeName}/${moduleName}`;
  
  if (!mfeCache.has(cacheKey)) {
    const LazyComponent = lazy(() => {
      const startTime = performance.now();
      
      return import(/* webpackIgnore: true */ `${mfeName}/${moduleName}`)
        .then(module => {
          const endTime = performance.now();
          const loadTime = endTime - startTime;
          
          // Record performance metrics
          if (window.analytics) {
            window.analytics.track('MFE Loaded', {
              mfeName,
              moduleName,
              loadTime
            });
          }
          
          return module;
        })
        .catch(error => {
          console.error(`Failed to load MFE ${mfeName}/${moduleName}:`, error);
          
          // Return fallback component
          return {
            default: () => (
              <div className="p-8 text-center">
                <div className="text-red-600 text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Failed to load {mfeName}
                </h3>
                <p className="text-gray-600">
                  Please refresh the page or contact support if the problem persists.
                </p>
              </div>
            )
          };
        });
    });
    
    mfeCache.set(cacheKey, LazyComponent);
  }
  
  const Component = mfeCache.get(cacheKey)!;
  
  return (
    <MfeContainer mfeName={mfeName} fallback={fallback}>
      <Suspense fallback={<LoadingFallback mfeName={mfeName} />}>
        <Component />
      </Suspense>
    </MfeContainer>
  );
};
```

## Monitoring and Observability

### Performance Monitoring
```typescript
// packages/shared-utils/src/monitoring/performanceMonitor.ts
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  mfeName?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];
  
  constructor() {
    this.setupObservers();
  }
  
  private setupObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, 'ms');
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'ms');
          }
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
    
    // Resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('remoteEntry.js')) {
          const mfeName = this.extractMfeNameFromUrl(entry.name);
          this.recordMetric('mfe_load_time', entry.duration, 'ms', mfeName);
        }
      }
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }
  
  recordMetric(name: string, value: number, unit: string, mfeName?: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      mfeName,
      metadata
    };
    
    this.metrics.push(metric);
    
    // Send to monitoring service
    this.sendToMonitoringService(metric);
  }
  
  private extractMfeNameFromUrl(url: string): string {
    const patterns = [
      /menu-mfe/,
      /orders-mfe/,
      /kitchen-mfe/,
      /reservations-mfe/,
      /inventory-mfe/
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return pattern.source;
      }
    }
    
    return 'unknown';
  }
  
  private sendToMonitoringService(metric: PerformanceMetric) {
    // Send to your monitoring service (e.g., DataDog, New Relic, etc.)
    if (window.analytics) {
      window.analytics.track('Performance Metric', metric);
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
  
  clear() {
    this.metrics.length = 0;
  }
  
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.length = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Error Tracking
```typescript
// packages/shared-utils/src/monitoring/errorTracker.ts
interface ErrorReport {
  message: string;
  stack?: string;
  mfeName?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  
  constructor() {
    this.setupGlobalErrorHandlers();
  }
  
  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        metadata: {
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        metadata: {
          type: 'unhandledrejection'
        }
      });
    });
    
    // Module Federation errors
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'mfe-error') {
        this.trackError({
          message: event.data.message,
          stack: event.data.stack,
          mfeName: event.data.mfeName,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          metadata: {
            type: 'mfe-error',
            ...event.data.metadata
          }
        });
      }
    });
  }
  
  trackError(error: Omit<ErrorReport, 'userId'>) {
    const errorReport: ErrorReport = {
      ...error,
      userId: this.getCurrentUserId()
    };
    
    this.errors.push(errorReport);
    
    // Send to error tracking service
    this.sendToErrorTracker(errorReport);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', errorReport);
    }
  }
  
  private getCurrentUserId(): string | undefined {
    // Get user ID from global store or auth service
    try {
      const store = (window as any).__RESTAURANT_GLOBAL_STORE__;
      return store?.getState?.()?.user?.id;
    } catch {
      return undefined;
    }
  }
  
  private sendToErrorTracker(error: ErrorReport) {
    // Send to your error tracking service (e.g., Sentry, Bugsnag, etc.)
    if (window.analytics) {
      window.analytics.track('Error', error);
    }
    
    // Also send to backend for logging
    fetch('/api/v1/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(error)
    }).catch(() => {
      // Silently fail if error reporting fails
    });
  }
  
  getErrors(): ErrorReport[] {
    return [...this.errors];
  }
  
  clear() {
    this.errors.length = 0;
  }
}

export const errorTracker = new ErrorTracker();
```

## Testing Strategy

### Cross-MFE Integration Tests
```typescript
// tests/integration/cross-mfe.test.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Cross-MFE Integration', () => {
  let page: Page;
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });
  
  test('should create order and see it in kitchen queue', async () => {
    // Login
    await page.fill('[data-testid=email-input]', 'admin@restaurant.com');
    await page.fill('[data-testid=password-input]', 'password');
    await page.click('[data-testid=login-button]');
    
    // Navigate to orders
    await page.click('[data-testid=orders-nav]');
    await expect(page).toHaveURL(/.*\/orders/);
    
    // Create new order
    await page.click('[data-testid=create-order-button]');
    await page.fill('[data-testid=customer-name]', 'John Doe');
    await page.selectOption('[data-testid=order-type]', 'DINE_IN');
    await page.fill('[data-testid=table-id]', 'table-1');
    
    // Add menu items
    await page.click('[data-testid=add-item-button]');
    await page.selectOption('[data-testid=menu-item-select]', 'burger');
    await page.fill('[data-testid=quantity-input]', '2');
    await page.click('[data-testid=confirm-item-button]');
    
    // Submit order
    await page.click('[data-testid=submit-order-button]');
    
    // Verify order created
    await expect(page.locator('[data-testid=order-success-message]')).toBeVisible();
    
    // Navigate to kitchen
    await page.click('[data-testid=kitchen-nav]');
    await expect(page).toHaveURL(/.*\/kitchen/);
    
    // Verify order appears in kitchen queue
    await expect(page.locator('[data-testid=kitchen-order-card]')).toContainText('John Doe');
    await expect(page.locator('[data-testid=kitchen-order-card]')).toContainText('table-1');
    
    // Start preparation
    await page.click('[data-testid=start-preparation-button]');
    
    // Verify order status updated
    await expect(page.locator('[data-testid=order-status]')).toContainText('PREPARING');
    
    // Navigate back to orders
    await page.click('[data-testid=orders-nav]');
    
    // Verify order status updated in orders view
    await expect(page.locator('[data-testid=order-list]')).toContainText('PREPARING');
  });
  
  test('should handle MFE loading failure gracefully', async () => {
    // Mock MFE loading failure
    await page.route('**/menu-mfe/remoteEntry.js', route => {
      route.abort('failed');
    });
    
    // Navigate to menu
    await page.click('[data-testid=menu-nav]');
    
    // Verify fallback is shown
    await expect(page.locator('[data-testid=mfe-error-fallback]')).toBeVisible();
    await expect(page.locator('[data-testid=mfe-error-fallback]')).toContainText('Failed to load menu');
  });
  
  test('should sync data across MFEs in real-time', async () => {
    // Open multiple tabs/contexts
    const context1 = await page.context();
    const page1 = await context1.newPage();
    const page2 = await context1.newPage();
    
    // Login on both pages
    for (const p of [page1, page2]) {
      await p.goto('http://localhost:3000');
      await p.fill('[data-testid=email-input]', 'admin@restaurant.com');
      await p.fill('[data-testid=password-input]', 'password');
      await p.click('[data-testid=login-button]');
    }
    
    // Navigate to different MFEs
    await page1.click('[data-testid=menu-nav]');
    await page2.click('[data-testid=kitchen-nav]');
    
    // Activate menu on page1
    await page1.click('[data-testid=activate-menu-button]');
    
    // Verify notification appears on page2
    await expect(page2.locator('[data-testid=notification]')).toContainText('Menu activated');
  });
});
```

## Security Considerations

### Content Security Policy
```typescript
// apps/shell-app/src/security/csp.ts
export const generateCSP = (mfeUrls: string[]) => {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Required for Module Federation
    ...mfeUrls
  ].join(' ');
  
  const connectSrc = [
    "'self'",
    process.env.REACT_APP_API_URL,
    ...mfeUrls
  ].join(' ');
  
  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `connect-src ${connectSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`
  ].join('; ');
};
```

### MFE Authentication
```typescript
// packages/shared-utils/src/auth/mfeAuth.ts
export class MfeAuthManager {
  private token: string | null = null;
  private refreshToken: string | null = null;
  
  constructor() {
    this.loadTokensFromStorage();
    this.setupTokenRefresh();
  }
  
  private loadTokensFromStorage() {
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }
  
  private setupTokenRefresh() {
    // Auto-refresh token before expiry
    setInterval(() => {
      if (this.token && this.isTokenExpiringSoon()) {
        this.refreshAuthToken();
      }
    }, 60000); // Check every minute
  }
  
  private isTokenExpiringSoon(): boolean {
    if (!this.token) return false;
    
    try {
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      
      // Refresh if token expires within 5 minutes
      return (expiryTime - currentTime) < 5 * 60 * 1000;
    } catch {
      return true; // Refresh if token is invalid
    }
  }
  
  private async refreshAuthToken() {
    if (!this.refreshToken) return;
    
    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.refreshToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.token, data.refreshToken);
      } else {
        this.logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
    }
  }
  
  setTokens(token: string, refreshToken: string) {
    this.token = token;
    this.refreshToken = refreshToken;
    
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Notify all MFEs about token update
    window.postMessage({
      type: 'auth-token-updated',
      token,
      refreshToken
    }, '*');
  }
  
  getToken(): string | null {
    return this.token;
  }
  
  logout() {
    this.token = null;
    this.refreshToken = null;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    
    // Notify all MFEs about logout
    window.postMessage({
      type: 'auth-logout'
    }, '*');
    
    // Redirect to login
    window.location.href = '/login';
  }
}

export const mfeAuthManager = new MfeAuthManager();
```

## Success Metrics

### Technical Metrics
- **Bundle Size Reduction**: 40% reduction in individual bundle sizes
- **Load Time**: < 2 seconds for initial shell app load
- **MFE Load Time**: < 500ms for subsequent MFE loads
- **Build Time**: < 5 minutes for individual MFE builds
- **Deployment Frequency**: Multiple deployments per day per domain

### Business Metrics
- **Development Velocity**: 50% increase in feature delivery speed
- **Team Autonomy**: Independent deployment capability per domain
- **Fault Isolation**: 99.9% uptime for non-affected domains during issues
- **Scalability**: Ability to scale individual domains independently

### Operational Metrics
- **Error Isolation**: Errors in one MFE don't affect others
- **Performance**: No degradation in overall application performance
- **SEO**: Maintained SEO performance with proper routing
- **Security**: No new security vulnerabilities introduced

## Risk Mitigation

### Technical Risks
1. **Module Federation Compatibility Issues**
   - Mitigation: Extensive testing with shared dependencies
   - Fallback: Version pinning and compatibility matrix

2. **Cross-MFE Communication Latency**
   - Mitigation: Event bus optimization and caching
   - Monitoring: Performance monitoring for event propagation

3. **Bundle Size Increase**
   - Mitigation: Careful shared dependency management
   - Solution: Bundle analysis and optimization tools

### Operational Risks
1. **Deployment Complexity**
   - Mitigation: Automated deployment pipelines
   - Solution: Infrastructure as Code (IaC)

2. **Monitoring Challenges**
   - Mitigation: Centralized logging and monitoring
   - Solution: Distributed tracing across MFEs

3. **Team Coordination**
   - Mitigation: Clear API contracts and documentation
   - Solution: Regular cross-team sync meetings

## Conclusion

This migration plan provides a comprehensive roadmap for transforming the restaurant platform into a domain-driven micro-frontend architecture. The phased approach ensures minimal disruption while maximizing the benefits of independent development and deployment.

Key benefits include:
- **Enhanced Team Autonomy**: Each domain team can work independently
- **Improved Scalability**: Individual domains can be scaled based on usage
- **Better Performance**: Optimized loading and reduced bundle sizes
- **Fault Isolation**: Issues in one domain don't affect others
- **Technology Flexibility**: Different domains can evolve independently

The plan prioritizes maintaining the current functionality while introducing the benefits of micro-frontend architecture, ensuring a smooth transition for both the development team and end users.