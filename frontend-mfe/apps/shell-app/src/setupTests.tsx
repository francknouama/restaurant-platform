import '@testing-library/jest-dom';

// Mock shared packages
jest.mock('@restaurant/shared-utils', () => ({
  authAPI: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
    refreshToken: jest.fn(),
  },
  tokenManager: {
    getToken: jest.fn(),
    getRefreshToken: jest.fn(),
    clearTokens: jest.fn(),
    setTokens: jest.fn(),
  },
  canUserAccess: jest.fn(),
  getRoleDisplayName: jest.fn((role: string) => role),
  getRoleColor: jest.fn(() => 'bg-blue-100 text-blue-800'),
  PermissionResources: {
    MENU: 'menu',
    ORDER: 'order',
    KITCHEN: 'kitchen',
    RESERVATION: 'reservation',
    INVENTORY: 'inventory',
    USER: 'user',
  },
  PermissionActions: {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage',
  },
}));

jest.mock('@restaurant/shared-ui', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
  LoadingSpinner: ({ text }: { text?: string }) => <div data-testid="loading-spinner">{text || 'Loading...'}</div>,
  Card: ({ children, className, padding }: { children: React.ReactNode; className?: string; padding?: string }) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button onClick={onClick} className={className} data-testid="button">
      {children}
    </button>
  ),
  StatusBadge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="status-badge">{children}</span>
  ),
  MfeContainer: ({ children, name }: { children: React.ReactNode; name: string }) => (
    <div data-testid={`mfe-container-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      {children}
    </div>
  ),
  LoadingFallback: ({ name }: { name: string }) => (
    <div data-testid={`loading-fallback-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      Loading {name}...
    </div>
  ),
}));

jest.mock('@restaurant/shared-state', () => ({
  useGlobalStore: jest.fn(() => ({
    setUser: jest.fn(),
    clearUser: jest.fn(),
    addNotification: jest.fn(),
  })),
  useRestaurantEvents: jest.fn(() => ({
    onInventoryLowStock: jest.fn(() => jest.fn()),
    onReservationCreated: jest.fn(() => jest.fn()),
  })),
  useNotifications: jest.fn(() => ({
    notifications: [],
    showNotification: jest.fn(),
  })),
}));

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', state: null }),
}));

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};

// Window event listeners mock
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
});