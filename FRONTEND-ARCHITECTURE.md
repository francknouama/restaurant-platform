# Restaurant Platform Frontend Architecture

## Overview

This document provides detailed architectural recommendations for rebuilding the restaurant platform frontend to align with the Go backend's domain-driven design.

## Current Issues Analysis

### Domain Misalignment
The existing Bolt.new frontend implements:
- Generic `User` and `Task` entities instead of restaurant-specific domains
- Authentication-focused routing (`/login`, `/dashboard`, `/profile`) 
- Task management APIs instead of restaurant operations
- Generic UI components that don't reflect restaurant workflows

### Required Transformation
We need to transform from generic business application to specialized restaurant platform:

**From (Generic)**:
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'moderator';
}

interface Task {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high';
}
```

**To (Restaurant Domain)**:
```typescript
interface Menu {
  id: MenuID;
  name: string;
  version: number;
  categories: MenuCategory[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

interface Order {
  id: OrderID;
  customerID: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'CREATED' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number;
}
```

## Recommended Architecture

### 1. Domain-Driven Component Structure

```
src/
├── domains/
│   ├── menu/
│   │   ├── components/
│   │   │   ├── MenuList.tsx
│   │   │   ├── MenuEditor.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── MenuItemCard.tsx
│   │   │   └── MenuVersionControl.tsx
│   │   ├── hooks/
│   │   │   ├── useMenus.ts
│   │   │   ├── useMenuItems.ts
│   │   │   └── useMenuActivation.ts
│   │   ├── services/
│   │   │   └── menuApi.ts
│   │   └── types/
│   │       └── menu.types.ts
│   ├── orders/
│   │   ├── components/
│   │   │   ├── OrderList.tsx
│   │   │   ├── OrderCreator.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── OrderItemSelector.tsx
│   │   ├── hooks/
│   │   │   ├── useOrders.ts
│   │   │   ├── useOrderCreation.ts
│   │   │   └── useOrderStatus.ts
│   │   ├── services/
│   │   │   └── orderApi.ts
│   │   └── types/
│   │       └── order.types.ts
│   ├── kitchen/
│   │   ├── components/
│   │   │   ├── KitchenDashboard.tsx
│   │   │   ├── OrderQueue.tsx
│   │   │   ├── KitchenOrderCard.tsx
│   │   │   ├── PrepTimer.tsx
│   │   │   └── StationAssignment.tsx
│   │   ├── hooks/
│   │   │   ├── useKitchenOrders.ts
│   │   │   ├── useOrderPreparation.ts
│   │   │   └── useKitchenMetrics.ts
│   │   ├── services/
│   │   │   └── kitchenApi.ts
│   │   └── types/
│   │       └── kitchen.types.ts
│   ├── reservations/
│   │   ├── components/
│   │   │   ├── ReservationCalendar.tsx
│   │   │   ├── ReservationForm.tsx
│   │   │   ├── TableLayout.tsx
│   │   │   └── ReservationCard.tsx
│   │   ├── hooks/
│   │   │   ├── useReservations.ts
│   │   │   └── useTableAvailability.ts
│   │   ├── services/
│   │   │   └── reservationApi.ts
│   │   └── types/
│   │       └── reservation.types.ts
│   └── inventory/
│       ├── components/
│       │   ├── InventoryDashboard.tsx
│       │   ├── StockLevelMonitor.tsx
│       │   ├── SupplierManager.tsx
│       │   └── StockMovementLog.tsx
│       ├── hooks/
│       │   ├── useInventory.ts
│       │   └── useStockMovements.ts
│       ├── services/
│       │   └── inventoryApi.ts
│       └── types/
│           └── inventory.types.ts
├── shared/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── layout/
│   │   │   ├── RestaurantLayout.tsx
│   │   │   ├── RestaurantHeader.tsx
│   │   │   └── RestaurantSidebar.tsx
│   │   └── forms/
│   │       ├── FormField.tsx
│   │       ├── SelectField.tsx
│   │       └── DateTimePicker.tsx
│   ├── hooks/
│   │   ├── useApi.ts
│   │   ├── useWebSocket.ts
│   │   └── useRestaurantAuth.ts
│   ├── services/
│   │   ├── apiClient.ts
│   │   ├── webSocketClient.ts
│   │   └── eventBus.ts
│   ├── types/
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── restaurant.types.ts
│   └── utils/
│       ├── formatters.ts
│       ├── validators.ts
│       └── constants.ts
├── pages/
│   ├── MenuManagement.tsx
│   ├── OrderProcessing.tsx
│   ├── KitchenDashboard.tsx
│   ├── ReservationManagement.tsx
│   ├── InventoryManagement.tsx
│   └── RestaurantDashboard.tsx
└── App.tsx
```

### 2. Type System Architecture

#### Type-Safe IDs (Matching Go Backend)
```typescript
// src/shared/types/ids.ts
export type EntityMarker = string;

export interface ID<T extends EntityMarker> {
  value: string;
  __marker?: T;
}

export type MenuID = ID<'Menu'>;
export type OrderID = ID<'Order'>;
export type KitchenOrderID = ID<'KitchenOrder'>;
export type ReservationID = ID<'Reservation'>;
export type InventoryItemID = ID<'InventoryItem'>;

// ID generation matching Go backend pattern
export const createID = <T extends EntityMarker>(prefix: string): ID<T> => ({
  value: `${prefix}_${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}`
});
```

#### Domain Types (Exact Go Backend Match)
```typescript
// src/domains/menu/types/menu.types.ts
export interface Menu {
  id: MenuID;
  name: string;
  version: number;
  categories: MenuCategory[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
  displayOrder: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  category: string;
  allergens?: string[];
  nutritionalInfo?: NutritionalInfo;
}

// src/domains/orders/types/order.types.ts
export const OrderType = {
  DINE_IN: 'DINE_IN',
  TAKEOUT: 'TAKEOUT',
  DELIVERY: 'DELIVERY'
} as const;

export const OrderStatus = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  PREPARING: 'PREPARING',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type OrderType = typeof OrderType[keyof typeof OrderType];
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export interface Order {
  id: OrderID;
  customerID: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  taxAmount: number; // Always 10% as per backend
  tableID?: string; // Required for DINE_IN
  deliveryAddress?: string; // Required for DELIVERY
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. API Layer Architecture

#### Restaurant-Specific API Clients
```typescript
// src/shared/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 10000,
});

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// src/domains/menu/services/menuApi.ts
export const menuApi = {
  // Menu CRUD operations
  getMenus: (): Promise<ApiResponse<Menu[]>> =>
    apiClient.get('/menus').then(res => res.data),
  
  getActiveMenu: (): Promise<ApiResponse<Menu>> =>
    apiClient.get('/menus/active').then(res => res.data),
  
  createMenu: (data: CreateMenuRequest): Promise<ApiResponse<Menu>> =>
    apiClient.post('/menus', data).then(res => res.data),
  
  updateMenu: (id: MenuID, data: UpdateMenuRequest): Promise<ApiResponse<Menu>> =>
    apiClient.put(`/menus/${id.value}`, data).then(res => res.data),
  
  activateMenu: (id: MenuID): Promise<ApiResponse<void>> =>
    apiClient.post(`/menus/${id.value}/activate`).then(res => res.data),
  
  // Category operations
  addCategory: (menuId: MenuID, category: MenuCategoryRequest): Promise<ApiResponse<Menu>> =>
    apiClient.post(`/menus/${menuId.value}/categories`, category).then(res => res.data),
  
  // Menu item operations
  addMenuItem: (menuId: MenuID, categoryId: string, item: MenuItemRequest): Promise<ApiResponse<Menu>> =>
    apiClient.post(`/menus/${menuId.value}/categories/${categoryId}/items`, item).then(res => res.data),
  
  setItemAvailability: (menuId: MenuID, categoryId: string, itemId: string, available: boolean): Promise<ApiResponse<void>> =>
    apiClient.patch(`/menus/${menuId.value}/categories/${categoryId}/items/${itemId}/availability`, { available }).then(res => res.data)
};
```

#### React Query Integration
```typescript
// src/domains/menu/hooks/useMenus.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { menuApi } from '../services/menuApi';

export const useMenus = () => {
  return useQuery({
    queryKey: ['menus'],
    queryFn: menuApi.getMenus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useActiveMenu = () => {
  return useQuery({
    queryKey: ['menus', 'active'],
    queryFn: menuApi.getActiveMenu,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: menuApi.createMenu,
    onSuccess: () => {
      queryClient.invalidateQueries(['menus']);
    },
  });
};

export const useActivateMenu = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (menuId: MenuID) => menuApi.activateMenu(menuId),
    onSuccess: () => {
      queryClient.invalidateQueries(['menus']);
      queryClient.invalidateQueries(['menus', 'active']);
    },
  });
};
```

### 4. Component Design Patterns

#### Restaurant-Specific Components
```typescript
// src/domains/menu/components/MenuCard.tsx
interface MenuCardProps {
  menu: Menu;
  onActivate?: (menuId: MenuID) => void;
  onEdit?: (menuId: MenuID) => void;
  onClone?: (menuId: MenuID) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ menu, onActivate, onEdit, onClone }) => {
  return (
    <Card className="p-6 border-l-4 border-l-primary-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
          <p className="text-sm text-gray-600">Version {menu.version}</p>
        </div>
        <StatusBadge 
          status={menu.isActive ? 'active' : 'inactive'} 
          variant={menu.isActive ? 'success' : 'neutral'}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Categories</p>
          <p className="text-2xl font-bold text-primary-600">{menu.categories.length}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Items</p>
          <p className="text-2xl font-bold text-primary-600">
            {menu.categories.reduce((total, cat) => total + cat.items.length, 0)}
          </p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        {!menu.isActive && onActivate && (
          <Button variant="primary" size="sm" onClick={() => onActivate(menu.id)}>
            Activate
          </Button>
        )}
        {onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(menu.id)}>
            Edit
          </Button>
        )}
        {onClone && (
          <Button variant="outline" size="sm" onClick={() => onClone(menu.id)}>
            Clone
          </Button>
        )}
      </div>
    </Card>
  );
};

// src/domains/orders/components/OrderStatusBadge.tsx
interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<OrderStatus, { color: string; label: string; icon: string }> = {
  CREATED: { color: 'blue', label: 'Created', icon: '📝' },
  PAID: { color: 'green', label: 'Paid', icon: '💳' },
  PREPARING: { color: 'yellow', label: 'Preparing', icon: '👨‍🍳' },
  READY: { color: 'purple', label: 'Ready', icon: '✅' },
  COMPLETED: { color: 'gray', label: 'Completed', icon: '🎉' },
  CANCELLED: { color: 'red', label: 'Cancelled', icon: '❌' }
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = statusConfig[status];
  
  return (
    <StatusBadge
      status={status.toLowerCase()}
      variant={config.color}
      size={size}
      icon={config.icon}
    >
      {config.label}
    </StatusBadge>
  );
};
```

### 5. Real-Time Integration

#### WebSocket for Restaurant Events
```typescript
// src/shared/services/webSocketClient.ts
export class RestaurantWebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  
  connect() {
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }
  
  private handleMessage(message: { type: string; payload: any }) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.payload));
    }
  }
  
  subscribe(eventType: string, handler: Function) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }
  
  unsubscribe(eventType: string, handler: Function) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }
}

// src/shared/hooks/useWebSocket.ts
export const useWebSocket = () => {
  const [client] = useState(() => new RestaurantWebSocketClient());
  
  useEffect(() => {
    client.connect();
    
    return () => {
      client.disconnect();
    };
  }, [client]);
  
  return client;
};

// Usage in components
export const KitchenDashboard: React.FC = () => {
  const ws = useWebSocket();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  
  useEffect(() => {
    const handleOrderUpdate = (payload: KitchenOrder) => {
      setOrders(prev => 
        prev.map(order => 
          order.id === payload.id ? payload : order
        )
      );
    };
    
    ws.subscribe('kitchen:order_updated', handleOrderUpdate);
    
    return () => {
      ws.unsubscribe('kitchen:order_updated', handleOrderUpdate);
    };
  }, [ws]);
  
  // ... rest of component
};
```

### 6. Navigation & Routing

#### Restaurant-Specific Routing
```typescript
// src/App.tsx
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RestaurantLayout />}>
          <Route index element={<RestaurantDashboard />} />
          
          {/* Menu Management */}
          <Route path="menus" element={<MenuManagement />}>
            <Route index element={<MenuList />} />
            <Route path="create" element={<MenuCreator />} />
            <Route path=":menuId/edit" element={<MenuEditor />} />
          </Route>
          
          {/* Order Processing */}
          <Route path="orders" element={<OrderProcessing />}>
            <Route index element={<OrderList />} />
            <Route path="create" element={<OrderCreator />} />
            <Route path=":orderId" element={<OrderDetails />} />
          </Route>
          
          {/* Kitchen Dashboard */}
          <Route path="kitchen" element={<KitchenDashboard />} />
          
          {/* Reservations */}
          <Route path="reservations" element={<ReservationManagement />}>
            <Route index element={<ReservationCalendar />} />
            <Route path="create" element={<ReservationForm />} />
          </Route>
          
          {/* Inventory */}
          <Route path="inventory" element={<InventoryManagement />}>
            <Route index element={<InventoryDashboard />} />
            <Route path="items" element={<InventoryItemList />} />
            <Route path="suppliers" element={<SupplierManagement />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

// src/shared/components/layout/RestaurantSidebar.tsx
const navigationItems = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: '📊',
    description: 'Restaurant overview'
  },
  { 
    name: 'Menus', 
    href: '/menus', 
    icon: '📋',
    description: 'Menu management'
  },
  { 
    name: 'Orders', 
    href: '/orders', 
    icon: '🛒',
    description: 'Order processing'
  },
  { 
    name: 'Kitchen', 
    href: '/kitchen', 
    icon: '👨‍🍳',
    description: 'Kitchen dashboard'
  },
  { 
    name: 'Reservations', 
    href: '/reservations', 
    icon: '📅',
    description: 'Table bookings'
  },
  { 
    name: 'Inventory', 
    href: '/inventory', 
    icon: '📦',
    description: 'Stock management'
  }
];
```

## Implementation Recommendations

### 1. Start with Clean Slate
- Remove all existing pages, components, and types
- Keep only package.json, Vite config, and basic setup
- Start with restaurant domain types first

### 2. Implement Domain by Domain
- Begin with Menu domain (most fundamental)
- Then Order domain (core business logic)
- Kitchen domain (operational workflow)
- Reservations (customer-facing)
- Inventory (business intelligence)

### 3. Follow Backend Patterns
- Match TypeScript types exactly to Go structs
- Use same validation rules and business logic
- Mirror status enums and transitions
- Implement same ID generation patterns

### 4. Progressive Enhancement
- Start with basic CRUD operations
- Add real-time features
- Implement advanced UI/UX
- Add analytics and reporting

This architecture ensures the frontend properly represents the restaurant domain model and provides the foundation for a scalable, maintainable restaurant management platform.