// Mock shared state management for Inventory MFE testing
const mockUseRestaurantEvents = () => ({
  // Inventory-specific event emitters
  emitInventoryLowStock: jest.fn((payload) => {
    console.log('[Mock] Inventory low stock event emitted:', payload);
  }),
  emitInventoryStockUpdated: jest.fn((payload) => {
    console.log('[Mock] Inventory stock updated event emitted:', payload);
  }),
  emitInventoryItemAdded: jest.fn((payload) => {
    console.log('[Mock] Inventory item added event emitted:', payload);
  }),
  emitInventoryItemRemoved: jest.fn((payload) => {
    console.log('[Mock] Inventory item removed event emitted:', payload);
  }),
  emitInventoryPurchaseOrderCreated: jest.fn((payload) => {
    console.log('[Mock] Purchase order created event emitted:', payload);
  }),
  emitInventorySupplierUpdated: jest.fn((payload) => {
    console.log('[Mock] Supplier updated event emitted:', payload);
  }),

  // Cross-MFE event listeners (what Inventory MFE listens to)
  onOrderCreated: jest.fn((callback) => {
    console.log('[Mock] Listening for order created events');
    return () => console.log('[Mock] Unsubscribed from order created events');
  }),
  onOrderUpdated: jest.fn((callback) => {
    console.log('[Mock] Listening for order updated events');
    return () => console.log('[Mock] Unsubscribed from order updated events');
  }),
  onKitchenOrderUpdate: jest.fn((callback) => {
    console.log('[Mock] Listening for kitchen order update events');
    return () => console.log('[Mock] Unsubscribed from kitchen order update events');
  }),
  onMenuItemUpdated: jest.fn((callback) => {
    console.log('[Mock] Listening for menu item updated events');
    return () => console.log('[Mock] Unsubscribed from menu item updated events');
  }),
  onReservationCreated: jest.fn((callback) => {
    console.log('[Mock] Listening for reservation created events');
    return () => console.log('[Mock] Unsubscribed from reservation created events');
  }),

  // Analytics and reporting events
  emitAnalyticsEvent: jest.fn((payload) => {
    console.log('[Mock] Analytics event emitted:', payload);
  }),
  onUserAction: jest.fn((callback) => {
    console.log('[Mock] Listening for user action events');
    return () => console.log('[Mock] Unsubscribed from user action events');
  })
});

const mockUseInventoryStore = () => ({
  // Inventory state
  items: [
    {
      id: 'item_1',
      name: 'Premium Beef Tenderloin',
      category: 'Meat',
      currentStock: 25,
      minimumStock: 10,
      maximumStock: 100,
      unit: 'lbs',
      costPerUnit: 45.99,
      supplierId: 'supplier_1',
      location: 'Freezer A',
      expirationDate: '2024-02-15',
      batchNumber: 'BT2024001'
    },
    {
      id: 'item_2',
      name: 'Fresh Salmon Fillet',
      category: 'Seafood',
      currentStock: 15,
      minimumStock: 8,
      maximumStock: 50,
      unit: 'lbs',
      costPerUnit: 28.50,
      supplierId: 'supplier_2',
      location: 'Freezer B',
      expirationDate: '2024-02-10',
      batchNumber: 'SF2024002'
    }
  ],
  categories: ['Meat', 'Seafood', 'Vegetables', 'Dairy', 'Condiments', 'Beverages'],
  suppliers: [
    {
      id: 'supplier_1',
      name: 'Premium Foods Co.',
      contact: 'John Smith',
      phone: '555-0123',
      email: 'orders@premiumfoods.com'
    },
    {
      id: 'supplier_2',
      name: 'Fresh Seafood Supply',
      contact: 'Maria Garcia',
      phone: '555-0456',
      email: 'orders@freshseafood.com'
    }
  ],
  purchaseOrders: [
    {
      id: 'po_1',
      orderNumber: 'PO-2024-001',
      supplierId: 'supplier_1',
      status: 'pending',
      items: [{ itemId: 'item_1', quantity: 50, unitPrice: 45.99 }],
      totalAmount: 2299.50,
      orderDate: '2024-01-15',
      expectedDeliveryDate: '2024-01-18'
    }
  ],
  alerts: [
    {
      id: 'alert_1',
      type: 'low_stock',
      itemId: 'item_1',
      message: 'Premium Beef Tenderloin is running low',
      priority: 'high',
      timestamp: '2024-01-15T10:30:00Z'
    }
  ],

  // State management functions
  loading: false,
  error: null,
  fetchItems: jest.fn(),
  addItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  adjustStock: jest.fn(),
  fetchSuppliers: jest.fn(),
  addSupplier: jest.fn(),
  updateSupplier: jest.fn(),
  deleteSupplier: jest.fn(),
  createPurchaseOrder: jest.fn(),
  updatePurchaseOrder: jest.fn(),
  fetchPurchaseOrders: jest.fn(),
  acknowledgeAlert: jest.fn(),
  clearAlert: jest.fn(),
  
  // Filter and search
  searchTerm: '',
  setSearchTerm: jest.fn(),
  selectedCategory: 'all',
  setSelectedCategory: jest.fn(),
  stockFilter: 'all', // all, low, out, normal
  setStockFilter: jest.fn(),
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 150,
  setCurrentPage: jest.fn(),
  setItemsPerPage: jest.fn(),

  // Analytics data
  analytics: {
    totalValue: 125000,
    turnoverRate: 2.4,
    avgStockDays: 15,
    topCategories: [
      { category: 'Meat', value: 45000, percentage: 36 },
      { category: 'Seafood', value: 25000, percentage: 20 },
      { category: 'Vegetables', value: 20000, percentage: 16 }
    ],
    lowStockTrends: [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 8 },
      { date: '2024-01-03', count: 12 }
    ],
    consumptionPatterns: [
      { item: 'Beef Tenderloin', dailyUsage: 5.2, trend: 'increasing' },
      { item: 'Salmon Fillet', dailyUsage: 3.8, trend: 'stable' }
    ]
  }
});

const mockUseAuth = () => ({
  user: {
    id: 'user_1',
    name: 'Sarah Johnson',
    email: 'sarah@restaurant.com',
    role: 'inventory_manager',
    permissions: ['inventory:read', 'inventory:write', 'inventory:admin']
  },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  checkPermission: jest.fn((permission) => true),
  token: 'mock-jwt-token'
});

const mockUseNotifications = () => ({
  notifications: [
    {
      id: 'notif_1',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Premium Beef Tenderloin is running low (5 units remaining)',
      timestamp: '2024-01-15T10:30:00Z',
      read: false
    },
    {
      id: 'notif_2',
      type: 'info',
      title: 'Delivery Confirmed',
      message: 'Purchase order PO-2024-001 delivery confirmed for tomorrow',
      timestamp: '2024-01-15T09:15:00Z',
      read: false
    }
  ],
  unreadCount: 2,
  addNotification: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  removeNotification: jest.fn(),
  clearAll: jest.fn()
});

module.exports = {
  useRestaurantEvents: mockUseRestaurantEvents,
  useInventoryStore: mockUseInventoryStore,
  useAuth: mockUseAuth,
  useNotifications: mockUseNotifications
};