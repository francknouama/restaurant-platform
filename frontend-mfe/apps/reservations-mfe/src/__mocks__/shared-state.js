// Mock shared state management for Reservations MFE testing
const mockUseRestaurantEvents = () => ({
  // Reservation-specific event emitters
  emitReservationCreated: jest.fn((payload) => {
    console.log('[Mock] Reservation created event emitted:', payload);
  }),
  emitReservationUpdated: jest.fn((payload) => {
    console.log('[Mock] Reservation updated event emitted:', payload);
  }),
  emitReservationCancelled: jest.fn((payload) => {
    console.log('[Mock] Reservation cancelled event emitted:', payload);
  }),
  emitReservationConfirmed: jest.fn((payload) => {
    console.log('[Mock] Reservation confirmed event emitted:', payload);
  }),
  emitReservationSeated: jest.fn((payload) => {
    console.log('[Mock] Reservation seated event emitted:', payload);
  }),
  emitReservationCompleted: jest.fn((payload) => {
    console.log('[Mock] Reservation completed event emitted:', payload);
  }),
  emitReservationNoShow: jest.fn((payload) => {
    console.log('[Mock] Reservation no-show event emitted:', payload);
  }),
  emitTableStatusUpdated: jest.fn((payload) => {
    console.log('[Mock] Table status updated event emitted:', payload);
  }),
  emitWaitlistUpdated: jest.fn((payload) => {
    console.log('[Mock] Waitlist updated event emitted:', payload);
  }),

  // Cross-MFE event listeners (what Reservations MFE listens to)
  onOrderCreated: jest.fn((callback) => {
    console.log('[Mock] Listening for order created events');
    return () => console.log('[Mock] Unsubscribed from order created events');
  }),
  onKitchenOrderUpdate: jest.fn((callback) => {
    console.log('[Mock] Listening for kitchen order update events');
    return () => console.log('[Mock] Unsubscribed from kitchen order update events');
  }),
  onInventoryLowStock: jest.fn((callback) => {
    console.log('[Mock] Listening for inventory low stock events');
    return () => console.log('[Mock] Unsubscribed from inventory low stock events');
  }),
  onMenuItemUpdated: jest.fn((callback) => {
    console.log('[Mock] Listening for menu item updated events');
    return () => console.log('[Mock] Unsubscribed from menu item updated events');
  }),

  // Reservation event listeners (for internal updates)
  onReservationCreated: jest.fn((callback) => {
    console.log('[Mock] Listening for reservation created events');
    return () => console.log('[Mock] Unsubscribed from reservation created events');
  }),
  onReservationUpdated: jest.fn((callback) => {
    console.log('[Mock] Listening for reservation updated events');
    return () => console.log('[Mock] Unsubscribed from reservation updated events');
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

const mockUseReservationStore = () => ({
  // Reservation state
  reservations: [
    {
      id: 'res_1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      customerPhone: '(555) 123-4567',
      partySize: 4,
      date: '2024-02-15',
      time: '19:00',
      duration: 120,
      status: 'confirmed',
      tableNumber: 5,
      specialRequests: 'Anniversary dinner',
      confirmationCode: 'ABC123',
      source: 'online',
      priority: 'vip',
      createdAt: '2024-02-10T10:30:00Z'
    },
    {
      id: 'res_2',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.j@email.com',
      customerPhone: '(555) 987-6543',
      partySize: 2,
      date: '2024-02-15',
      time: '18:30',
      duration: 90,
      status: 'pending',
      tableNumber: 12,
      confirmationCode: 'DEF456',
      source: 'phone',
      priority: 'normal',
      createdAt: '2024-02-12T14:15:00Z'
    }
  ],
  
  // Table state
  tables: [
    {
      id: 'table_1',
      number: 1,
      capacity: 2,
      type: 'regular',
      location: 'main_dining',
      status: 'available',
      isActive: true
    },
    {
      id: 'table_2',
      number: 2,
      capacity: 4,
      type: 'regular',
      location: 'main_dining',
      status: 'occupied',
      isActive: true,
      currentReservation: 'res_1'
    },
    {
      id: 'table_3',
      number: 5,
      capacity: 6,
      type: 'booth',
      location: 'private_dining',
      status: 'reserved',
      isActive: true,
      currentReservation: 'res_3'
    }
  ],

  // Customer state
  customers: [
    {
      id: 'cust_1',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      preferences: {
        seating: 'booth',
        allergies: ['nuts'],
        specialOccasions: ['anniversary']
      },
      visitHistory: ['res_1'],
      vipStatus: true,
      notes: 'Prefers quiet tables'
    },
    {
      id: 'cust_2',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 987-6543',
      preferences: {
        seating: 'window',
        dietaryRestrictions: ['vegetarian']
      },
      visitHistory: ['res_2'],
      vipStatus: false
    }
  ],

  // Waitlist state
  waitlist: [
    {
      id: 'wait_1',
      customerName: 'Mike Wilson',
      customerPhone: '(555) 555-1234',
      partySize: 3,
      requestedDate: '2024-02-15',
      requestedTime: '19:30',
      addedAt: '2024-02-12T16:00:00Z',
      status: 'waiting',
      priority: 'normal',
      estimatedWait: 45
    }
  ],

  // State management functions
  loading: false,
  error: null,
  
  // Reservation functions
  fetchReservations: jest.fn(),
  createReservation: jest.fn(),
  updateReservation: jest.fn(),
  cancelReservation: jest.fn(),
  confirmReservation: jest.fn(),
  seatReservation: jest.fn(),
  completeReservation: jest.fn(),
  markNoShow: jest.fn(),
  
  // Table functions
  fetchTables: jest.fn(),
  updateTableStatus: jest.fn(),
  assignTableToReservation: jest.fn(),
  releaseTable: jest.fn(),
  createTable: jest.fn(),
  updateTable: jest.fn(),
  deactivateTable: jest.fn(),
  
  // Customer functions
  fetchCustomers: jest.fn(),
  createCustomer: jest.fn(),
  updateCustomer: jest.fn(),
  searchCustomers: jest.fn(),
  getCustomerHistory: jest.fn(),
  
  // Waitlist functions
  addToWaitlist: jest.fn(),
  removeFromWaitlist: jest.fn(),
  updateWaitlistPosition: jest.fn(),
  promoteFromWaitlist: jest.fn(),
  
  // Filter and search
  searchTerm: '',
  setSearchTerm: jest.fn(),
  statusFilter: 'all',
  setStatusFilter: jest.fn(),
  dateFilter: 'today',
  setDateFilter: jest.fn(),
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 20,
  totalItems: 50,
  setCurrentPage: jest.fn(),
  setItemsPerPage: jest.fn(),

  // Analytics data
  analytics: {
    totalReservations: 150,
    confirmationRate: 85.5,
    noShowRate: 8.2,
    averagePartySize: 3.4,
    busyHours: [
      { hour: '18:00', reservations: 25 },
      { hour: '19:00', reservations: 35 },
      { hour: '20:00', reservations: 28 }
    ],
    tableUtilization: [
      { tableNumber: 1, utilization: 78 },
      { tableNumber: 2, utilization: 92 },
      { tableNumber: 3, utilization: 65 }
    ],
    customerSegments: [
      { segment: 'VIP', count: 45, percentage: 30 },
      { segment: 'Regular', count: 75, percentage: 50 },
      { segment: 'New', count: 30, percentage: 20 }
    ]
  }
});

const mockUseAuth = () => ({
  user: {
    id: 'user_1',
    name: 'Maria Garcia',
    email: 'maria@restaurant.com',
    role: 'reservation_manager',
    permissions: ['reservations:read', 'reservations:write', 'reservations:admin', 'tables:manage']
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
      type: 'info',
      title: 'New Reservation',
      message: 'Table for 4 booked for tonight at 7:00 PM',
      timestamp: '2024-02-15T10:30:00Z',
      read: false
    },
    {
      id: 'notif_2',
      type: 'warning',
      title: 'Confirmation Needed',
      message: '5 reservations require confirmation for tomorrow',
      timestamp: '2024-02-15T09:15:00Z',
      read: false
    },
    {
      id: 'notif_3',
      type: 'error',
      title: 'No Show Alert',
      message: 'Reservation for John Doe marked as no-show',
      timestamp: '2024-02-15T08:45:00Z',
      read: true
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
  useReservationStore: mockUseReservationStore,
  useAuth: mockUseAuth,
  useNotifications: mockUseNotifications
};