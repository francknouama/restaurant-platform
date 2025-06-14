import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from '../AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '@restaurant/shared-state';

// Mock the contexts and utilities
jest.mock('../../contexts/AuthContext');
jest.mock('@restaurant/shared-state');
jest.mock('@restaurant/shared-utils', () => ({
  ...jest.requireActual('@restaurant/shared-utils'),
  getRoleDisplayName: jest.fn((role: string) => role.charAt(0).toUpperCase() + role.slice(1)),
  getRoleColor: jest.fn(() => 'bg-blue-100 text-blue-800'),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Outlet: () => <div data-testid="outlet">Page Content</div>,
}));

describe('AppLayout', () => {
  const mockUser = {
    user: {
      id: 'user_123',
      email: 'john.doe@restaurant.com',
      isActive: true,
    },
    role: {
      id: 'role_123',
      name: 'admin' as const,
    },
    permissions: [],
  };

  const mockLogout = jest.fn();
  const mockCanAccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: mockLogout,
      refreshUser: jest.fn(),
      canAccess: mockCanAccess,
      hasRole: jest.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notifications: [],
      showNotification: jest.fn(),
    });

    // Default: user can access all resources
    mockCanAccess.mockReturnValue(true);
  });

  const renderAppLayout = (initialPath = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AppLayout />
      </MemoryRouter>
    );
  };

  it('should render the layout with sidebar and main content', () => {
    renderAppLayout();

    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('should display user information in sidebar', () => {
    renderAppLayout();

    expect(screen.getByText('Logged in as')).toBeInTheDocument();
    expect(screen.getByText('john.doe@restaurant.com')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should show all navigation items when user has full permissions', () => {
    renderAppLayout();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Menu Management')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Reservations')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('should filter navigation items based on permissions', () => {
    mockCanAccess.mockImplementation((resource: string, action: string) => {
      return resource === 'order' && action === 'read';
    });

    renderAppLayout();

    // Should show dashboard (no permission required) and orders
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();

    // Should not show other items
    expect(screen.queryByText('Menu Management')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen')).not.toBeInTheDocument();
    expect(screen.queryByText('Reservations')).not.toBeInTheDocument();
    expect(screen.queryByText('Inventory')).not.toBeInTheDocument();
  });

  it('should toggle sidebar when clicking the toggle button', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    const sidebar = screen.getByText('Restaurant').closest('aside');
    expect(sidebar).toHaveClass('w-64');

    const toggleButton = screen.getByText('←');
    await user.click(toggleButton);

    expect(sidebar).toHaveClass('w-16');
    expect(screen.queryByText('Restaurant')).not.toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('should handle logout functionality', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should show logout icon when sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    // Collapse sidebar
    const toggleButton = screen.getByText('←');
    await user.click(toggleButton);

    // Should show logout icon instead of button
    expect(screen.getByText('🚪')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should handle logout when sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    // Collapse sidebar
    const toggleButton = screen.getByText('←');
    await user.click(toggleButton);

    // Click logout icon
    const logoutIcon = screen.getByText('🚪');
    await user.click(logoutIcon);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should highlight active navigation item', () => {
    const useLocationMock = jest.fn();
    useLocationMock.mockReturnValue({ pathname: '/orders' });
    
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: useLocationMock,
    }));

    renderAppLayout('/orders');

    const ordersLink = screen.getByText('Orders').closest('a');
    expect(ordersLink).toHaveClass('bg-primary-600', 'text-white');
  });

  it('should show page title in header based on current route', () => {
    const useLocationMock = jest.fn();
    useLocationMock.mockReturnValue({ pathname: '/menu' });
    
    jest.doMock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useLocation: useLocationMock,
    }));

    renderAppLayout('/menu');

    expect(screen.getByText('Menu Management')).toBeInTheDocument();
  });

  it('should show notifications badge when notifications exist', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [
        { id: '1', type: 'info', title: 'Test', message: 'Test notification', timestamp: Date.now() },
        { id: '2', type: 'warning', title: 'Warning', message: 'Warning notification', timestamp: Date.now() },
      ],
      showNotification: jest.fn(),
    });

    renderAppLayout();

    expect(screen.getByText('🔔')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should not show notifications badge when no notifications', () => {
    renderAppLayout();

    expect(screen.queryByText('🔔')).not.toBeInTheDocument();
  });

  it('should render navigation icons correctly', () => {
    renderAppLayout();

    expect(screen.getByText('🏠')).toBeInTheDocument(); // Dashboard
    expect(screen.getByText('📋')).toBeInTheDocument(); // Menu
    expect(screen.getByText('🛍️')).toBeInTheDocument(); // Orders
    expect(screen.getByText('👨‍🍳')).toBeInTheDocument(); // Kitchen
    expect(screen.getByText('📅')).toBeInTheDocument(); // Reservations
    expect(screen.getByText('📦')).toBeInTheDocument(); // Inventory
  });

  it('should render correct links for navigation items', () => {
    renderAppLayout();

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    const menuLink = screen.getByText('Menu Management').closest('a');
    const ordersLink = screen.getByText('Orders').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/');
    expect(menuLink).toHaveAttribute('href', '/menu');
    expect(ordersLink).toHaveAttribute('href', '/orders');
  });

  it('should show icons only when sidebar is collapsed', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    // Initially expanded - should show text
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Menu Management')).toBeInTheDocument();

    // Collapse sidebar
    const toggleButton = screen.getByText('←');
    await user.click(toggleButton);

    // Should still show icons but not text
    expect(screen.getByText('🏠')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Menu Management')).not.toBeInTheDocument();
  });

  it('should apply correct CSS classes for responsive design', () => {
    renderAppLayout();

    const sidebar = screen.getByText('Restaurant').closest('aside');
    const mainContent = sidebar?.nextElementSibling;

    expect(sidebar).toHaveClass('bg-neutral-900', 'text-white', 'transition-all', 'duration-300');
    expect(mainContent).toHaveClass('flex-1', 'flex', 'flex-col');
  });

  it('should handle user with minimal data', () => {
    const minimalUser = {
      user: {
        id: 'user_456',
        email: 'test@example.com',
        isActive: true,
      },
      role: {
        id: 'role_456',
        name: 'server' as const,
      },
      permissions: [],
    };

    mockUseAuth.mockReturnValue({
      user: minimalUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: mockLogout,
      refreshUser: jest.fn(),
      canAccess: mockCanAccess,
      hasRole: jest.fn(),
    });

    renderAppLayout();

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();
  });

  describe('Header behavior', () => {
    it('should show default Dashboard title for unknown routes', () => {
      const useLocationMock = jest.fn();
      useLocationMock.mockReturnValue({ pathname: '/unknown-route' });
      
      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useLocation: useLocationMock,
      }));

      renderAppLayout('/unknown-route');

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper title attribute for logout icon when collapsed', async () => {
      const user = userEvent.setup();
      renderAppLayout();

      // Collapse sidebar
      const toggleButton = screen.getByText('←');
      await user.click(toggleButton);

      const logoutIcon = screen.getByText('🚪');
      expect(logoutIcon).toHaveAttribute('title', 'Logout');
    });
  });
});