# Restaurant Platform MFE - Detailed Views Specification

## Overview

This document provides a comprehensive breakdown of all views, components, and features needed for each micro-frontend (MFE) in the Restaurant Platform. Each MFE is designed to be domain-focused and independent while maintaining seamless integration with the overall system.

---

## 🏠 **Shell Application (Port 3000)**

**Owner**: Platform Team  
**Purpose**: Main host application providing authentication, navigation, and MFE orchestration

### Core Views

#### 1. **Authentication Views**
- **Login Page** (`/login`)
  - Email/password form
  - Role-based demo credentials
  - Password reset link
  - Session persistence options

- **Logout Confirmation** (Modal)
  - Confirm logout action
  - Session cleanup notification

#### 2. **Dashboard Views**
- **Main Dashboard** (`/`)
  - Role-based statistics cards
  - Quick action buttons
  - Recent activity feed
  - Restaurant overview metrics

#### 3. **Layout Components**
- **App Layout**
  - Sidebar navigation (collapsible)
  - Header with notifications
  - User profile section
  - Role-based menu filtering

- **Protected Route Wrapper**
  - Permission-based access control
  - Loading states
  - Error boundaries

#### 4. **Global Components**
- **Notification Container**
  - Toast notifications
  - System alerts
  - Cross-MFE communication status

---

## 📋 **Menu MFE (Port 3001)**

**Owner**: Menu Team  
**Purpose**: Menu management, item configuration, and availability control

### Core Views

#### 1. **Menu Management Views**
- **Menu List** (`/menu`)
  - Active menu display
  - Menu version history
  - Quick stats (total items, categories)
  - Bulk actions toolbar

- **Menu Editor** (`/menu/edit/:menuId`)
  - Drag-and-drop category organization
  - Item preview panel
  - Version control actions
  - Publishing controls

- **Menu Preview** (`/menu/preview/:menuId`)
  - Customer-facing menu view
  - Responsive preview modes
  - Print-friendly layouts

#### 2. **Item Management Views**
- **Item List** (`/menu/items`)
  - Searchable/filterable item grid
  - Availability status indicators
  - Bulk edit capabilities
  - Category grouping

- **Item Editor** (`/menu/items/edit/:itemId`)
  - Item details form
  - Image upload/management
  - Pricing configuration
  - Allergen information
  - Availability settings

- **Item Creation** (`/menu/items/new`)
  - Step-by-step item creation wizard
  - Template selection
  - Image upload
  - Category assignment

#### 3. **Category Management Views**
- **Category List** (`/menu/categories`)
  - Category hierarchy view
  - Drag-and-drop reordering
  - Item count per category

- **Category Editor** (`/menu/categories/edit/:categoryId`)
  - Category details form
  - Display order settings
  - Visibility controls

#### 4. **Analytics Views**
- **Menu Performance** (`/menu/analytics`)
  - Popular items dashboard
  - Category performance metrics
  - Sales data integration
  - Customer feedback integration

### Key Components
- `MenuCard` - Individual menu display
- `MenuItemCard` - Item display with actions
- `CategoryManager` - Category CRUD operations
- `MenuVersionControl` - Version history and publishing
- `AvailabilityToggle` - Real-time availability control
- `MenuImageUploader` - Image management
- `MenuPrintLayout` - Print-optimized view

### Data Integration
- Real-time inventory sync for availability
- Order history for popularity metrics
- Customer feedback integration
- Kitchen prep time integration

---

## 🛍️ **Orders MFE (Port 3002)**

**Owner**: Orders Team  
**Purpose**: Order creation, management, and customer service

### Core Views

#### 1. **Order Management Views**
- **Order Dashboard** (`/orders`)
  - Active orders grid
  - Order status filters
  - Search and filtering
  - Quick stats cards

- **Order Details** (`/orders/:orderId`)
  - Complete order information
  - Customer details
  - Item breakdown with modifications
  - Status timeline
  - Payment information
  - Action buttons (modify, cancel, refund)

- **Order History** (`/orders/history`)
  - Completed orders archive
  - Date range filtering
  - Export capabilities
  - Customer lookup

#### 2. **Order Creation Views**
- **New Order** (`/orders/new`)
  - Order type selection (Dine-in, Takeout, Delivery)
  - Table/customer selection
  - Menu item browser with search
  - Shopping cart sidebar
  - Special instructions
  - Payment processing

- **Quick Order** (`/orders/quick`)
  - Streamlined interface for common orders
  - Preset configurations
  - Rapid checkout

#### 3. **Customer Management Views**
- **Customer Lookup** (`/orders/customers`)
  - Customer search and selection
  - Order history per customer
  - Contact information management
  - Loyalty program integration

- **Customer Details** (`/orders/customers/:customerId`)
  - Customer profile
  - Order history
  - Preferences and notes
  - Contact management

#### 4. **Payment Views**
- **Payment Processing** (Modal/Embedded)
  - Payment method selection
  - Card processing interface
  - Split payment handling
  - Receipt generation

- **Payment History** (`/orders/payments`)
  - Transaction log
  - Refund management
  - Payment method analytics

### Key Components
- `OrderCard` - Order summary display
- `OrderForm` - Order creation/editing
- `OrderTimeline` - Status progression
- `MenuItemSelector` - Menu browsing for orders
- `PaymentProcessor` - Payment handling
- `CustomerSelector` - Customer lookup/selection
- `OrderModificationModal` - Edit existing orders
- `OrderReceiptPrinter` - Receipt generation

### Real-time Features
- Live order status updates
- Kitchen communication
- Customer notifications
- Payment status tracking

---

## 👨‍🍳 **Kitchen MFE (Port 3003)**

**Owner**: Kitchen Team  
**Purpose**: Order preparation, kitchen workflow, and real-time coordination

### Core Views

#### 1. **Kitchen Dashboard Views**
- **Kitchen Queue** (`/kitchen`)
  - Active orders queue
  - Priority sorting
  - Timer displays
  - Station assignment
  - Preparation status

- **Order Preparation** (`/kitchen/orders/:orderId`)
  - Detailed preparation view
  - Item-by-item checklist
  - Special instructions display
  - Timer management
  - Quality notes

#### 2. **Station Management Views**
- **Station Overview** (`/kitchen/stations`)
  - All kitchen stations status
  - Staff assignments
  - Equipment status
  - Capacity monitoring

- **Station Details** (`/kitchen/stations/:stationId`)
  - Station-specific orders
  - Staff management
  - Equipment controls
  - Performance metrics

#### 3. **Workflow Views**
- **Prep Schedule** (`/kitchen/prep`)
  - Daily prep requirements
  - Ingredient preparation
  - Advance preparation tasks
  - Inventory requirements

- **Kitchen Analytics** (`/kitchen/analytics`)
  - Preparation time metrics
  - Station efficiency
  - Order throughput
  - Staff performance

#### 4. **Communication Views**
- **Kitchen Notes** (`/kitchen/notes`)
  - Inter-shift communication
  - Equipment issues
  - Special requirements
  - Supplier notes

### Key Components
- `KitchenOrderCard` - Order display for kitchen
- `KitchenQueue` - Queue management
- `PreparationTimer` - Order timing
- `StationAssignment` - Station management
- `KitchenStatusBoard` - Overall status display
- `OrderModificationAlert` - Change notifications
- `KitchenChat` - Team communication
- `PrepChecklist` - Preparation tracking

### Real-time Features
- Live order updates from orders MFE
- Kitchen-to-orders status communication
- Timer synchronization
- Staff coordination

---

## 📅 **Reservations MFE (Port 3004)**

**Owner**: Reservations Team  
**Purpose**: Table booking, customer management, and seating coordination

### Core Views

#### 1. **Reservation Management Views**
- **Reservations Dashboard** (`/reservations`)
  - Today's reservations
  - Table status overview
  - Upcoming reservations
  - Walk-in management

- **Reservation Calendar** (`/reservations/calendar`)
  - Monthly/weekly/daily views
  - Time slot availability
  - Booking density visualization
  - Special events display

- **Reservation Details** (`/reservations/:reservationId`)
  - Customer information
  - Party details
  - Special requirements
  - Table assignment
  - Status management

#### 2. **Table Management Views**
- **Table Layout** (`/reservations/tables`)
  - Interactive floor plan
  - Real-time table status
  - Seating capacity display
  - Table assignment drag-and-drop

- **Table Details** (`/reservations/tables/:tableId`)
  - Table information
  - Current reservation
  - Service history
  - Maintenance notes

#### 3. **Customer Views**
- **Guest Management** (`/reservations/guests`)
  - Customer database
  - Reservation history
  - Preferences and notes
  - VIP management

- **Waitlist Management** (`/reservations/waitlist`)
  - Current waitlist
  - Estimated wait times
  - Notification management
  - Priority handling

#### 4. **Booking Views**
- **New Reservation** (`/reservations/new`)
  - Customer information form
  - Date/time selection
  - Party size and requirements
  - Table preference
  - Special requests

- **Walk-in Booking** (`/reservations/walkin`)
  - Quick booking interface
  - Immediate availability check
  - Queue management

### Key Components
- `ReservationCard` - Reservation display
- `ReservationCalendar` - Calendar interface
- `TableLayout` - Floor plan management
- `GuestProfile` - Customer information
- `WaitlistManager` - Queue management
- `AvailabilityChecker` - Real-time availability
- `ReservationForm` - Booking interface
- `TableAssignment` - Seating management

### Integration Features
- Real-time table status from orders
- Customer order history integration
- Kitchen timing coordination
- Event planning integration

---

## 📦 **Inventory MFE (Port 3005)**

**Owner**: Inventory Team  
**Purpose**: Stock management, supplier coordination, and cost control

### Core Views

#### 1. **Inventory Dashboard Views**
- **Inventory Overview** (`/inventory`)
  - Stock level summary
  - Low stock alerts
  - Recent movements
  - Supplier status

- **Stock Levels** (`/inventory/stock`)
  - Item-by-item inventory
  - Stock level indicators
  - Reorder points
  - Usage trends

#### 2. **Item Management Views**
- **Inventory Items** (`/inventory/items`)
  - Complete item catalog
  - Stock tracking
  - Cost management
  - Supplier information

- **Item Details** (`/inventory/items/:itemId`)
  - Item specifications
  - Stock movement history
  - Supplier details
  - Cost analysis
  - Reorder management

#### 3. **Supplier Management Views**
- **Supplier List** (`/inventory/suppliers`)
  - Supplier directory
  - Performance metrics
  - Contract information
  - Order history

- **Supplier Details** (`/inventory/suppliers/:supplierId`)
  - Supplier profile
  - Current orders
  - Performance analytics
  - Contract management

#### 4. **Analytics Views**
- **Usage Analytics** (`/inventory/analytics`)
  - Consumption patterns
  - Cost analysis
  - Waste tracking
  - Forecasting

- **Purchase Orders** (`/inventory/orders`)
  - Active purchase orders
  - Order history
  - Delivery tracking
  - Invoice management

#### 5. **Stock Operations Views**
- **Stock Movements** (`/inventory/movements`)
  - Incoming stock
  - Usage tracking
  - Waste recording
  - Transfer management

- **Stock Take** (`/inventory/stocktake`)
  - Physical inventory counting
  - Variance reporting
  - Adjustment processing

### Key Components
- `InventoryGrid` - Stock display grid
- `StockLevelIndicator` - Visual stock status
- `SupplierCard` - Supplier information
- `PurchaseOrderForm` - Order creation
- `StockMovementTracker` - Movement logging
- `UsageAnalytics` - Consumption charts
- `ReorderAlert` - Low stock notifications
- `CostTracker` - Cost analysis tools

### Integration Features
- Real-time menu item availability sync
- Kitchen usage tracking
- Automatic reorder triggers
- Cost-based pricing suggestions

---

## 🔄 **Cross-MFE Integration Patterns**

### Event Bus Communications
1. **Order Events**
   - `order:created` → Kitchen, Inventory
   - `order:modified` → Kitchen, Menu
   - `order:completed` → Reservations, Analytics

2. **Menu Events**
   - `menu:item-unavailable` → Orders, Kitchen
   - `menu:updated` → Orders, Kitchen

3. **Kitchen Events**
   - `kitchen:order-ready` → Orders, Reservations
   - `kitchen:prep-time-updated` → Orders, Menu

4. **Reservation Events**
   - `reservation:seated` → Orders
   - `reservation:cancelled` → Orders

5. **Inventory Events**
   - `inventory:low-stock` → Menu, Kitchen
   - `inventory:restock` → Menu, Kitchen

### Shared State Management
- User authentication status
- Current restaurant configuration
- Real-time notifications
- System-wide alerts

### Data Synchronization
- Menu availability (Inventory → Menu → Orders)
- Order status (Orders → Kitchen → Reservations)
- Customer information (Orders ↔ Reservations)
- Stock levels (Inventory → Menu → Kitchen)

---

## 📱 **Responsive Design Requirements**

### Desktop (1024px+)
- Full sidebar navigation
- Multi-column layouts
- Advanced data grids
- Rich interactive components

### Tablet (768px - 1023px)
- Collapsible sidebar
- Two-column layouts
- Touch-optimized controls
- Modal-based editing

### Mobile (320px - 767px)
- Bottom navigation
- Single-column stacked layouts
- Swipe gestures
- Simplified interfaces

---

## 🎨 **Design System Integration**

### Component Hierarchy
1. **Shared UI Components** (`@restaurant/shared-ui`)
   - Basic UI elements (Button, Card, Input)
   - Layout components
   - Navigation elements

2. **Domain-Specific Components** (Per MFE)
   - Business logic components
   - Domain data displays
   - Specialized forms

### Theming
- Restaurant brand colors
- Typography scale
- Spacing system
- Animation library

---

## 🔒 **Security & Permissions**

### Role-Based Access Control
- **Admin**: Full access to all MFEs
- **Manager**: Access to all except user management
- **Kitchen Staff**: Kitchen + limited Orders access
- **Wait Staff**: Orders + Reservations access
- **Host**: Reservations + limited Orders access
- **Cashier**: Orders (payment focus) + basic Menu access

### Feature-Level Permissions
- Create/Edit/Delete operations
- View sensitive information
- Export data
- System configuration

---

## 🚀 **Performance Requirements**

### Loading Performance
- Initial MFE load: < 2 seconds
- Route navigation: < 500ms
- Real-time updates: < 100ms latency

### Bundle Size Targets
- Shell app: < 200KB gzipped
- Individual MFE: < 150KB gzipped
- Shared packages: < 100KB gzipped

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode

---

---

## 📊 **Quick Reference: MFE Views Summary**

| MFE | Core Views | Key Components | Primary Features |
|-----|------------|----------------|------------------|
| **Shell** | Login, Dashboard, Layout | AuthContext, ProtectedRoute, AppLayout | Authentication, Navigation, Global State |
| **Menu** | Menu List/Editor, Item Management, Analytics | MenuCard, MenuEditor, CategoryManager | Menu CRUD, Item Management, Performance Tracking |
| **Orders** | Order Dashboard, Creation, Customer Management | OrderCard, OrderForm, PaymentProcessor | Order Processing, Customer Service, Payments |
| **Kitchen** | Kitchen Queue, Station Management, Analytics | KitchenQueue, PreparationTimer, StationAssignment | Order Preparation, Real-time Updates, Workflow |
| **Reservations** | Calendar, Table Layout, Guest Management | ReservationCalendar, TableLayout, WaitlistManager | Booking Management, Table Control, Customer Relations |
| **Inventory** | Stock Levels, Supplier Management, Analytics | InventoryGrid, StockLevelIndicator, PurchaseOrderForm | Stock Control, Supplier Relations, Cost Management |

### Total Development Scope
- **6 MFE Applications** (including Shell)
- **35+ Core Views** across all domains
- **100+ Specialized Components**
- **Real-time Integration** across 15+ event types
- **Role-based Access Control** for 6 user types
- **Cross-MFE Communication** via event bus
- **Responsive Design** for desktop, tablet, mobile

This detailed specification provides the foundation for implementing each MFE with clear boundaries, comprehensive functionality, and seamless integration across the entire Restaurant Platform ecosystem.