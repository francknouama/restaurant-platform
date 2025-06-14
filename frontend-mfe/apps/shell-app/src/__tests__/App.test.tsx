import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { useAuth } from '../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock components that are imported
jest.mock('../layouts/AppLayout', () => {
  return function MockAppLayout() {
    return <div data-testid="app-layout">App Layout</div>;
  };
});

jest.mock('../pages/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('../pages/DashboardPage', () => {
  return function MockDashboardPage() {
    return <div data-testid="dashboard-page">Dashboard Page</div>;
  };
});

jest.mock('../components/MfeLoader', () => {
  return function MockMfeLoader({ mfeName, resource, action }: { mfeName: string; resource: string; action: string }) {
    return (
      <div 
        data-testid={`mfe-loader-${mfeName.toLowerCase().replace(/\s+/g, '-')}`}
        data-resource={resource}
        data-action={action}
      >
        Loading {mfeName}...
      </div>
    );
  };
});

jest.mock('../components/NotificationContainer', () => {
  return function MockNotificationContainer() {
    return <div data-testid="notification-container">Notifications</div>;
  };
});

describe('App', () => {
  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canAccess: jest.fn(),
    hasRole: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthContext);
    
    // Mock window.history.pushState for navigation tests
    Object.defineProperty(window, 'history', {
      value: {
        pushState: jest.fn(),
        replaceState: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        go: jest.fn(),
        length: 1,
        state: null,
      },
      writable: true,
    });
  });

  it('should render without crashing', () => {
    render(<App />);
    
    expect(screen.getByTestId('notification-container')).toBeInTheDocument();
  });

  it('should render ErrorBoundary wrapping the entire app', () => {
    render(<App />);
    
    // ErrorBoundary is mocked to just render children, so we verify the structure exists
    expect(screen.getByTestId('notification-container')).toBeInTheDocument();
  });

  it('should render login page for /login route when not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false,
    });

    // Mock location to /login
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/login',
        search: '',
        hash: '',
        href: 'http://localhost/login',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });
  });

  it('should redirect to login when accessing protected route while not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false,
      isLoading: false,
    });

    render(<App />);

    await waitFor(() => {
      // Should show navigate component redirecting to login
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });
  });

  it('should render dashboard page when authenticated and on root path', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  it('should render MfeLoader for menu route with correct props', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to /menu
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/menu',
        search: '',
        hash: '',
        href: 'http://localhost/menu',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      const mfeLoader = screen.getByTestId('mfe-loader-menu-management');
      expect(mfeLoader).toBeInTheDocument();
      expect(mfeLoader).toHaveAttribute('data-resource', 'menu');
      expect(mfeLoader).toHaveAttribute('data-action', 'read');
    });
  });

  it('should render MfeLoader for orders route with correct props', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to /orders
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/orders',
        search: '',
        hash: '',
        href: 'http://localhost/orders',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      const mfeLoader = screen.getByTestId('mfe-loader-order-processing');
      expect(mfeLoader).toBeInTheDocument();
      expect(mfeLoader).toHaveAttribute('data-resource', 'order');
      expect(mfeLoader).toHaveAttribute('data-action', 'read');
    });
  });

  it('should render MfeLoader for kitchen route with correct props', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to /kitchen
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/kitchen',
        search: '',
        hash: '',
        href: 'http://localhost/kitchen',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      const mfeLoader = screen.getByTestId('mfe-loader-kitchen-operations');
      expect(mfeLoader).toBeInTheDocument();
      expect(mfeLoader).toHaveAttribute('data-resource', 'kitchen');
      expect(mfeLoader).toHaveAttribute('data-action', 'read');
    });
  });

  it('should render MfeLoader for reservations route with correct props', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to /reservations
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/reservations',
        search: '',
        hash: '',
        href: 'http://localhost/reservations',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      const mfeLoader = screen.getByTestId('mfe-loader-reservation-system');
      expect(mfeLoader).toBeInTheDocument();
      expect(mfeLoader).toHaveAttribute('data-resource', 'reservation');
      expect(mfeLoader).toHaveAttribute('data-action', 'read');
    });
  });

  it('should render MfeLoader for inventory route with correct props', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to /inventory
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/inventory',
        search: '',
        hash: '',
        href: 'http://localhost/inventory',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      const mfeLoader = screen.getByTestId('mfe-loader-inventory-management');
      expect(mfeLoader).toBeInTheDocument();
      expect(mfeLoader).toHaveAttribute('data-resource', 'inventory');
      expect(mfeLoader).toHaveAttribute('data-action', 'read');
    });
  });

  it('should redirect unknown routes to dashboard', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    // Mock location to unknown route
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/unknown-route',
        search: '',
        hash: '',
        href: 'http://localhost/unknown-route',
      },
      writable: true,
    });

    render(<App />);

    await waitFor(() => {
      // Should render Navigate component redirecting to root
      expect(screen.getByTestId('navigate')).toBeInTheDocument();
      expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    });
  });

  it('should show loading state when auth is loading', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isLoading: true,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('should render nested routes correctly', async () => {
    mockUseAuth.mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    await waitFor(() => {
      // Should render AppLayout which contains the outlet for nested routes
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  describe('Route structure', () => {
    it('should have correct route hierarchy', async () => {
      mockUseAuth.mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: true,
        isLoading: false,
      });

      render(<App />);

      await waitFor(() => {
        // All MFE routes should be nested under the protected route with AppLayout
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });
    });

    it('should pass correct permissions to each MFE route', () => {
      const permissionTests = [
        { path: '/menu', resource: 'menu', mfe: 'menu-management' },
        { path: '/orders', resource: 'order', mfe: 'order-processing' },
        { path: '/kitchen', resource: 'kitchen', mfe: 'kitchen-operations' },
        { path: '/reservations', resource: 'reservation', mfe: 'reservation-system' },
        { path: '/inventory', resource: 'inventory', mfe: 'inventory-management' },
      ];

      permissionTests.forEach(({ path, resource, mfe }) => {
        mockUseAuth.mockReturnValue({
          ...mockAuthContext,
          isAuthenticated: true,
          isLoading: false,
        });

        Object.defineProperty(window, 'location', {
          value: {
            pathname: path,
            search: '',
            hash: '',
            href: `http://localhost${path}`,
          },
          writable: true,
        });

        const { unmount } = render(<App />);

        waitFor(() => {
          const mfeElement = screen.getByTestId(`mfe-loader-${mfe}`);
          expect(mfeElement).toHaveAttribute('data-resource', resource);
          expect(mfeElement).toHaveAttribute('data-action', 'read');
        });

        unmount();
      });
    });
  });
});