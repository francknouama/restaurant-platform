# Restaurant Platform - Frontend Reimplementation Plan

## Overview

This document outlines the complete reimplementation plan for the restaurant platform frontend. The current frontend was scaffolded by Bolt.new but doesn't align with our Go backend's restaurant domain model. We need to rebuild it properly.

## Current State Analysis

### Issues with Current Bolt.new Frontend
- **Domain Misalignment**: Generic task/user management instead of restaurant domains
- **Wrong Entity Types**: User/Task entities instead of Menu/Order/Kitchen/Reservation/Inventory
- **Incorrect API Services**: Tasks/auth services instead of restaurant-specific services  
- **Wrong Page Structure**: Dashboard/Profile/Tasks instead of Menu/Orders/Kitchen pages
- **Generic Routing**: Auth-focused routing instead of restaurant workflow routing
- **Missing Business Logic**: No restaurant-specific validation or business rules

### Required Migration
- **From**: Generic task management SPA with React 18 + TypeScript + Tailwind
- **To**: Restaurant-specific domain-driven frontend aligned with Go backend microservices

## Target Architecture

### Micro Frontend Structure
```
restaurant-platform-frontend/
├── packages/
│   ├── shell-app/                # Host application (port 3000)
│   ├── menu-mfe/                 # Menu Management (port 3001)
│   ├── orders-mfe/               # Order Management (port 3002)
│   ├── kitchen-mfe/              # Kitchen Dashboard (port 3003)
│   ├── reservations-mfe/         # Reservations (port 3004)
│   ├── inventory-mfe/            # Inventory Management (port 3005)
│   ├── shared-ui/                # Design system & components
│   └── shared-utils/             # API clients & utilities
├── pnpm-workspace.yaml
├── tailwind.config.js
└── tsconfig.json
```

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Headless UI components
- **Module Federation**: Webpack 5 Module Federation
- **State Management**: Zustand (per-MFE) + React Query
- **API Layer**: Axios + React Query
- **Build Tool**: Webpack 5
- **Package Manager**: pnpm with workspaces
- **Testing**: Jest + React Testing Library

### Service Mapping
| Backend Service | Frontend MFE | Port | Responsibilities |
|----------------|--------------|------|------------------|
| Menu Service | menu-mfe | 3001 | Menu CRUD, items, categories, availability |
| Order Service | orders-mfe | 3002 | Order lifecycle, customer orders, payments |
| Kitchen Service | kitchen-mfe | 3003 | Kitchen dashboard, prep workflow, queue |
| Reservation Service | reservations-mfe | 3004 | Table booking, customer management |
| Inventory Service | inventory-mfe | 3005 | Stock management, suppliers, reports |
| Gateway | shell-app | 3000 | Host, routing, auth, global layout |

## Implementation Phases

## Phase 1: Clean Slate & Foundation (Week 1-2)

### Objectives
- Remove existing Bolt.new frontend completely
- Create restaurant-specific domain foundation
- Implement proper TypeScript types aligned with Go backend
- Setup development environment for restaurant platform

### Tasks

#### 1.1 Clean Slate
- [ ] Remove all existing frontend code (pages, components, types, API services)
- [ ] Keep only package.json dependencies and build configuration
- [ ] Preserve Vite setup but remove all application code
- [ ] Clean up unused imports and references

#### 1.2 Restaurant Domain Types
- [ ] Create TypeScript types matching Go backend domain models:
  - Menu types (Menu, MenuCategory, MenuItem, MenuID)
  - Order types (Order, OrderItem, OrderStatus, OrderType)
  - Kitchen types (KitchenOrder, KitchenItem, KitchenStatus, Priority)
  - Reservation types (Reservation, ReservationStatus)
  - Inventory types (InventoryItem, StockMovement, Supplier)
- [ ] Add type-safe ID system matching Go generics pattern
- [ ] Create API response types for each domain service
- [ ] Add status enum types and validation

#### 1.3 Restaurant API Layer
- [ ] Create domain-specific API clients:
  - MenuService API client
  - OrderService API client 
  - KitchenService API client
  - ReservationService API client
  - InventoryService API client
- [ ] Setup React Query hooks for each domain
- [ ] Add proper error handling for restaurant business rules
- [ ] Configure API routing to match microservices architecture

#### 1.4 Restaurant Navigation & Routing
- [ ] Design restaurant-specific page structure:
  - `/menus` - Menu management
  - `/orders` - Order processing
  - `/kitchen` - Kitchen dashboard
  - `/reservations` - Table bookings
  - `/inventory` - Stock management
- [ ] Create restaurant workflow-based navigation
- [ ] Remove generic auth/dashboard routing
- [ ] Add role-based routing (admin, kitchen staff, waiters)

### Deliverables
- Clean codebase with no generic/task management code
- Complete restaurant domain TypeScript types
- Restaurant-specific API layer
- Proper routing structure for restaurant operations
- Foundation for restaurant business workflows

---

## Phase 2: Core Restaurant Features (Week 3-4)

### Objectives
- Implement essential restaurant operations: menu management and order processing
- Create restaurant-specific UI components and workflows
- Establish proper business rule validation

### Tasks

#### 2.1 Menu Management System
- [ ] Create Menu management pages:
  - Menu list view with active/inactive status
  - Menu editor with category management
  - Menu item CRUD with pricing and descriptions
  - Menu versioning and cloning functionality
- [ ] Implement business rule validation:
  - Only one active menu at a time
  - Unique category/item names within scope
  - Menu item availability tracking
- [ ] Add menu organization features:
  - Category ordering and management
  - Item availability toggles
  - Price management and updates
- [ ] Create menu display components for customer view

#### 2.2 Order Processing System  
- [ ] Create Order management interface:
  - Order creation with menu item selection
  - Order type handling (DINE_IN, TAKEOUT, DELIVERY)
  - Order status tracking (CREATED → PAID → PREPARING → READY → COMPLETED)
  - Customer information management
- [ ] Implement order business logic:
  - Automatic tax calculation (10%)
  - Order total calculation
  - Status transition validation
  - Type-specific requirements (table ID, delivery address)
- [ ] Add order workflow features:
  - Order modification before payment
  - Order cancellation with business rules
  - Real-time status updates
  - Order history and filtering

#### 2.3 Restaurant UI Components
- [ ] Create restaurant-specific components:
  - MenuCard with item details and pricing
  - OrderCard with status badges and actions
  - StatusBadge with restaurant status colors
  - RestaurantTable for data display
  - RestaurantModal for order/menu editing
- [ ] Add restaurant theming:
  - Restaurant color palette
  - Food/hospitality focused icons
  - Order status color coding
  - Professional restaurant styling

### Deliverables
- Complete menu management system
- Full order processing workflow
- Restaurant-specific UI component library
- Business rule validation throughout
- Professional restaurant application interface

---

## Phase 3: Kitchen & Reservation Operations (Week 5-6)

### Objectives
- Implement kitchen workflow management with real-time updates
- Add complete reservation system
- Enable full restaurant operational capabilities

### Tasks

#### 3.1 Kitchen Dashboard System
- [ ] Create Kitchen order management:
  - Real-time kitchen order queue display
  - Order priority management (LOW, NORMAL, HIGH, URGENT)
  - Kitchen order status tracking (NEW → PREPARING → READY → COMPLETED)
  - Station assignment for workflow optimization
- [ ] Implement kitchen workflow features:
  - Prep time estimation and tracking
  - Order completion timers
  - Item-level preparation status
  - Kitchen performance metrics
- [ ] Add kitchen-specific UI:
  - Large, clear order displays for kitchen staff
  - Touch-friendly interfaces for busy kitchen environment
  - Color-coded priority and status indicators
  - Audio notifications for new orders
- [ ] Setup real-time integration:
  - WebSocket connections for live order updates
  - Automatic order synchronization with order service
  - Kitchen completion notifications to waitstaff

#### 3.2 Reservation Management System
- [ ] Create Reservation booking interface:
  - Table booking with date/time selection
  - Party size management and validation
  - Customer information capture
  - Reservation status tracking (PENDING → CONFIRMED → COMPLETED)
- [ ] Implement reservation business logic:
  - Future date validation
  - Table availability checking
  - Reservation conflict detection
  - No-show tracking and management
- [ ] Add reservation workflow features:
  - Calendar view for reservation management
  - Daily reservation dashboard
  - Customer history and preferences
  - Waitlist management
- [ ] Create table management:
  - Visual table layout representation
  - Table assignment and optimization
  - Reservation-to-table linking

#### 3.3 Operational Integration
- [ ] Add cross-domain functionality:
  - Order-to-kitchen workflow integration
  - Reservation-to-order conversion
  - Menu availability impact on reservations
  - Inventory alerts affecting kitchen operations
- [ ] Create operational dashboards:
  - Daily operations overview
  - Real-time restaurant status
  - Performance metrics and KPIs
  - Staff workflow optimization

### Deliverables
- Complete kitchen dashboard with real-time updates
- Full reservation management system
- Operational integration between all restaurant domains
- Real-time communication and notifications
- Professional restaurant operations interface

---

## Phase 4: Inventory & Advanced Features (Week 7-8)

### Objectives
- Complete inventory management system
- Add restaurant analytics and reporting
- Implement advanced restaurant-specific features

### Tasks

#### 4.1 Inventory Management System
- [ ] Create Inventory tracking interface:
  - Stock level monitoring with visual indicators
  - Inventory item CRUD with SKU management
  - Supplier information and contact management
  - Stock movement tracking (RECEIVED, USED, WASTED, ADJUSTED)
- [ ] Implement inventory business logic:
  - Threshold-based reorder alerts
  - Stock validation for menu item availability
  - Waste tracking and cost analysis
  - Supplier performance tracking
- [ ] Add inventory workflow features:
  - Purchase order creation and management
  - Receiving workflow with quantity verification
  - Inventory usage tracking from kitchen orders
  - Automated menu item availability updates
- [ ] Create inventory analytics:
  - Cost analysis and profit margins
  - Waste reduction insights
  - Supplier performance metrics
  - Inventory turnover reports

#### 4.2 Restaurant Analytics & Reporting
- [ ] Create business intelligence dashboards:
  - Daily/weekly/monthly sales reports
  - Menu item performance analysis
  - Kitchen efficiency metrics
  - Customer ordering patterns
- [ ] Add operational analytics:
  - Order completion times
  - Kitchen station performance
  - Peak hours and capacity planning
  - Staff productivity metrics
- [ ] Implement financial reporting:
  - Revenue tracking by order type
  - Cost of goods sold (COGS) analysis
  - Profit margin analysis by menu item
  - Inventory cost tracking

#### 4.3 Advanced Restaurant Features
- [ ] Add restaurant-specific enhancements:
  - Customer loyalty program integration
  - Menu recommendation engine
  - Seasonal menu planning
  - Special dietary requirement handling
- [ ] Implement mobile optimization:
  - Mobile-first design for staff tablets
  - Touch-optimized interfaces for kitchen
  - Mobile customer ordering interface
  - Responsive design for all screen sizes
- [ ] Add accessibility features:
  - Screen reader support for staff interfaces
  - High contrast mode for kitchen displays
  - Keyboard navigation for efficiency
  - Multi-language support

### Deliverables
- Complete inventory management system
- Comprehensive restaurant analytics
- Advanced restaurant-specific features
- Mobile-optimized interfaces
- Accessibility-compliant design

---

## Phase 5: Production Optimization (Week 9-10)

### Objectives
- Optimize for production deployment
- Implement monitoring and analytics
- Ensure scalability and performance

### Tasks

#### 5.1 Performance Optimization
- [ ] Implement code splitting and lazy loading
- [ ] Optimize bundle sizes and dependencies
- [ ] Setup CDN deployment for MFEs
- [ ] Implement service worker for caching
- [ ] Add performance monitoring
- [ ] Optimize images and assets

#### 5.2 Production Infrastructure
- [ ] Setup CI/CD pipelines for each MFE
- [ ] Configure environment-specific builds
- [ ] Implement automated testing pipelines
- [ ] Setup error tracking and monitoring
- [ ] Configure production logging
- [ ] Setup health checks and monitoring

#### 5.3 Documentation and Training
- [ ] Create deployment documentation
- [ ] Write development guidelines
- [ ] Document MFE communication patterns
- [ ] Create troubleshooting guides
- [ ] Setup development onboarding

### Deliverables
- Production-ready MFE architecture
- Complete CI/CD pipeline
- Performance monitoring setup
- Comprehensive documentation
- Deployment automation

---

## Technical Specifications

### Design System (Tailwind CSS)

#### Color Palette
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdecd3',
          200: '#fad5a5',
          300: '#f6b76d',
          400: '#f19533',
          500: '#f97316', // Main orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  }
}
```

#### Core Components
- Navigation components (Navbar, Sidebar, Breadcrumbs)
- Form components (Input, Select, Button, Checkbox)
- Data display (Table, Card, Badge, Avatar)
- Feedback (Modal, Toast, Alert, Loading)
- Layout components (Container, Grid, Stack)

### Module Federation Configuration

#### Shell App (Host)
```javascript
// webpack.config.js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    menu: 'menu@http://localhost:3001/remoteEntry.js',
    orders: 'orders@http://localhost:3002/remoteEntry.js',
    kitchen: 'kitchen@http://localhost:3003/remoteEntry.js',
    reservations: 'reservations@http://localhost:3004/remoteEntry.js',
    inventory: 'inventory@http://localhost:3005/remoteEntry.js'
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    '@shared-ui/components': { singleton: true }
  }
})
```

#### Individual MFE (Remote)
```javascript
// menu-mfe/webpack.config.js
new ModuleFederationPlugin({
  name: 'menu',
  filename: 'remoteEntry.js',
  exposes: {
    './App': './src/App',
    './MenuRoutes': './src/routes'
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true }
  }
})
```

### State Management Strategy

#### Global State (Shell)
- User authentication and permissions
- Theme preferences and settings
- Global notifications and alerts
- Navigation state and routing

#### Local State (Per MFE)
- Feature-specific data and forms
- UI state (modals, filters, pagination)
- Real-time updates and synchronization
- Local caching and optimization

### API Integration

#### Restaurant API Clients
```typescript
// Menu Service API
export const menuApi = {
  getMenus: () => apiClient.get('/menus'),
  getActiveMenu: () => apiClient.get('/menus/active'),
  createMenu: (data: CreateMenuRequest) => apiClient.post('/menus', data),
  updateMenu: (id: string, data: UpdateMenuRequest) => apiClient.put(`/menus/${id}`, data),
  activateMenu: (id: string) => apiClient.post(`/menus/${id}/activate`),
  addMenuItem: (menuId: string, categoryId: string, item: MenuItemRequest) => 
    apiClient.post(`/menus/${menuId}/categories/${categoryId}/items`, item)
};

// Order Service API
export const orderApi = {
  getOrders: (params?: OrderFilters) => apiClient.get('/orders', { params }),
  createOrder: (data: CreateOrderRequest) => apiClient.post('/orders', data),
  updateOrderStatus: (id: string, status: OrderStatus) => 
    apiClient.patch(`/orders/${id}/status`, { status }),
  cancelOrder: (id: string) => apiClient.patch(`/orders/${id}/cancel`)
};

// Kitchen Service API
export const kitchenApi = {
  getKitchenOrders: () => apiClient.get('/kitchen/orders'),
  startOrderPreparation: (id: string) => apiClient.post(`/kitchen/orders/${id}/start`),
  completeKitchenOrder: (id: string) => apiClient.post(`/kitchen/orders/${id}/complete`),
  assignStation: (id: string, station: string) => 
    apiClient.patch(`/kitchen/orders/${id}/station`, { station })
};
```

### Restaurant Real-time Communication

#### WebSocket Integration
- Order status updates (order service → kitchen/frontend)
- Kitchen queue changes (kitchen service → order management)
- Menu availability updates (inventory service → menu service)
- Reservation confirmations (reservation service → customer notifications)

#### Restaurant Event System
```typescript
// Restaurant-specific events
export const restaurantEvents = {
  // Order events
  ORDER_CREATED: 'order:created',
  ORDER_STATUS_CHANGED: 'order:status_changed',
  ORDER_PAID: 'order:paid',
  ORDER_COMPLETED: 'order:completed',
  
  // Kitchen events
  KITCHEN_ORDER_STARTED: 'kitchen:order_started',
  KITCHEN_ORDER_READY: 'kitchen:order_ready',
  KITCHEN_QUEUE_UPDATED: 'kitchen:queue_updated',
  
  // Menu events
  MENU_ITEM_AVAILABILITY_CHANGED: 'menu:item_availability_changed',
  MENU_ACTIVATED: 'menu:activated',
  
  // Inventory events
  INVENTORY_LOW_STOCK: 'inventory:low_stock',
  INVENTORY_OUT_OF_STOCK: 'inventory:out_of_stock'
};

// Usage
eventBus.emit(restaurantEvents.ORDER_CREATED, orderData);
eventBus.on(restaurantEvents.KITCHEN_ORDER_READY, handleOrderReady);
```

## Development Workflow

### Getting Started
```bash
# Clone and setup
git clone <repository>
cd restaurant-platform-frontend
pnpm install

# Start all MFEs in development
pnpm dev

# Start individual MFE
pnpm --filter @restaurant-platform/menu-mfe dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type checking
pnpm type-check
```

### File Structure
```
restaurant-platform-frontend/
├── packages/
│   ├── shell-app/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layout/
│   │   │   │   ├── Navigation/
│   │   │   │   └── ErrorBoundary/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Login.tsx
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── utils/
│   │   │   └── App.tsx
│   │   ├── public/
│   │   ├── webpack.config.js
│   │   └── package.json
│   ├── menu-mfe/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   └── App.tsx
│   │   ├── webpack.config.js
│   │   └── package.json
│   ├── orders-mfe/
│   ├── kitchen-mfe/
│   ├── reservations-mfe/
│   ├── inventory-mfe/
│   ├── shared-ui/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   └── Table/
│   │   │   ├── tokens/
│   │   │   │   ├── colors.ts
│   │   │   │   └── typography.ts
│   │   │   └── index.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── shared-utils/
│       ├── src/
│       │   ├── api/
│       │   ├── hooks/
│       │   ├── types/
│       │   └── utils/
│       └── package.json
├── .github/
│   └── workflows/
├── docs/
├── pnpm-workspace.yaml
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Success Metrics

### Restaurant Operations
- Order processing time reduced by 40%
- Kitchen efficiency improved with real-time queue management
- Menu management simplified with drag-and-drop interface
- Reservation conflicts eliminated with smart scheduling
- Inventory waste reduced through better tracking

### Performance
- Initial load time < 2 seconds
- Real-time updates < 100ms latency
- Mobile-optimized for kitchen tablets
- 95+ Lighthouse scores

### Staff Experience
- Intuitive interfaces for non-technical restaurant staff
- Touch-optimized for kitchen environment
- Role-based access (admin, kitchen, waitstaff)
- Minimal training required

### Business Impact
- Faster order-to-kitchen workflow
- Reduced food waste through inventory integration
- Improved customer satisfaction with accurate wait times
- Better profit margins through cost tracking
- Scalable to multiple restaurant locations

## Risk Mitigation

### Technical Risks
- **MFE Integration Complexity**: Use proven patterns and extensive testing
- **Performance Impact**: Implement lazy loading and optimization
- **State Synchronization**: Use event-driven architecture
- **Dependency Management**: Careful shared dependency management

### Timeline Risks
- **Learning Curve**: Provide training and documentation
- **Integration Issues**: Start with simple patterns and iterate
- **Testing Complexity**: Implement comprehensive test strategy

## Next Steps

1. **Phase 1**: Clean slate - Remove all Bolt.new code and create restaurant domain foundation
2. **Domain Alignment**: Implement TypeScript types matching Go backend exactly
3. **API Integration**: Build restaurant-specific API clients for each microservice
4. **Restaurant UI**: Create domain-specific components and workflows
5. **Stakeholder Review**: Demo restaurant-specific functionality

## Implementation Strategy

### Option A: Complete Rebuild (Recommended)
- Remove all existing frontend code
- Start fresh with restaurant domain model
- Faster development with proper foundation
- Clean architecture from the start

### Option B: Gradual Migration  
- Keep existing structure and gradually replace components
- Higher risk of architectural debt
- Longer timeline due to refactoring overhead

---

*This plan transforms the generic Bolt.new frontend into a professional restaurant management platform that properly aligns with the Go backend's clean architecture and domain-driven design.*