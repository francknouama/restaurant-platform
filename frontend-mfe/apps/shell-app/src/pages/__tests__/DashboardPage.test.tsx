import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DashboardPage from '../DashboardPage';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurantEvents, useNotifications } from '@restaurant/shared-state';

// Mock the contexts and utilities
jest.mock('../../contexts/AuthContext');
jest.mock('@restaurant/shared-state');
jest.mock('@restaurant/shared-utils', () => ({
  ...jest.requireActual('@restaurant/shared-utils'),
  getRoleDisplayName: jest.fn((role: string) => role.charAt(0).toUpperCase() + role.slice(1)),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRestaurantEvents = useRestaurantEvents as jest.MockedFunction<typeof useRestaurantEvents>;
const mockUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

describe('DashboardPage', () => {
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

  const mockShowNotification = jest.fn();
  const mockOnInventoryLowStock = jest.fn();
  const mockOnReservationCreated = jest.fn();
  const mockCanAccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isLoading: false,
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      refreshUser: jest.fn(),
      canAccess: mockCanAccess,
      hasRole: jest.fn(),
    });

    mockUseNotifications.mockReturnValue({
      notifications: [],
      showNotification: mockShowNotification,
    });

    mockUseRestaurantEvents.mockReturnValue({
      onInventoryLowStock: mockOnInventoryLowStock,
      onReservationCreated: mockOnReservationCreated,
    });

    // Default: user can access all resources
    mockCanAccess.mockReturnValue(true);
  });

  it('should render welcome message with user email', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Welcome back, john.doe!')).toBeInTheDocument();
    expect(screen.getByText(/You're logged in as/)).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should render all stats when user has all permissions', () => {
    render(<DashboardPage />);

    expect(screen.getByText("Today's Orders")).toBeInTheDocument();
    expect(screen.getByText('Active Tables')).toBeInTheDocument();
    expect(screen.getByText('Kitchen Queue')).toBeInTheDocument();
    expect(screen.getByText('Low Stock Items')).toBeInTheDocument();
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
  });

  it('should filter stats based on user permissions', () => {
    mockCanAccess.mockImplementation((resource: string, action: string) => {
      return resource === 'order' && action === 'read';
    });

    render(<DashboardPage />);

    // Should show order-related stats
    expect(screen.getByText("Today's Orders")).toBeInTheDocument();
    expect(screen.getByText("Today's Revenue")).toBeInTheDocument();

    // Should not show other stats
    expect(screen.queryByText('Active Tables')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen Queue')).not.toBeInTheDocument();
    expect(screen.queryByText('Low Stock Items')).not.toBeInTheDocument();
  });

  it('should render quick actions section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Create Order')).toBeInTheDocument();
    expect(screen.getByText('View Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Manage Menu')).toBeInTheDocument();
  });

  it('should filter quick actions based on user permissions', () => {
    mockCanAccess.mockImplementation((resource: string, action: string) => {
      return resource === 'kitchen' && action === 'read';
    });

    render(<DashboardPage />);

    // Should show kitchen action
    expect(screen.getByText('View Kitchen')).toBeInTheDocument();

    // Should not show other actions
    expect(screen.queryByText('Create Order')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Menu')).not.toBeInTheDocument();
  });

  it('should render recent activity section', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New order #1234')).toBeInTheDocument();
    expect(screen.getByText('Order completed')).toBeInTheDocument();
    expect(screen.getByText('Low stock alert')).toBeInTheDocument();
    expect(screen.getByText('New reservation')).toBeInTheDocument();
  });

  it('should display correct stat values', () => {
    render(<DashboardPage />);

    expect(screen.getByText('42')).toBeInTheDocument(); // Today's Orders
    expect(screen.getByText('8/12')).toBeInTheDocument(); // Active Tables
    expect(screen.getByText('5')).toBeInTheDocument(); // Kitchen Queue
    expect(screen.getByText('23')).toBeInTheDocument(); // Low Stock Items
    expect(screen.getByText('$2,847')).toBeInTheDocument(); // Today's Revenue
  });

  it('should setup event listeners on mount', () => {
    const mockUnsubscribeLowStock = jest.fn();
    const mockUnsubscribeReservation = jest.fn();

    mockOnInventoryLowStock.mockReturnValue(mockUnsubscribeLowStock);
    mockOnReservationCreated.mockReturnValue(mockUnsubscribeReservation);

    render(<DashboardPage />);

    expect(mockOnInventoryLowStock).toHaveBeenCalledWith(expect.any(Function));
    expect(mockOnReservationCreated).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle low stock events', () => {
    let lowStockHandler: ((event: any) => void) | undefined;

    mockOnInventoryLowStock.mockImplementation((handler) => {
      lowStockHandler = handler;
      return jest.fn();
    });

    render(<DashboardPage />);

    const lowStockEvent = {
      payload: {
        itemId: 'item_123',
        itemName: 'Fresh Salmon',
        currentStock: 5,
        priority: 'urgent',
      },
    };

    act(() => {
      if (lowStockHandler) {
        lowStockHandler(lowStockEvent);
      }
    });

    expect(mockShowNotification).toHaveBeenCalledWith({
      id: 'low-stock-item_123',
      type: 'error',
      title: 'Low Stock Alert',
      message: 'Fresh Salmon is running low (5 remaining)',
      duration: 5000,
      timestamp: expect.any(Number),
    });

    // Low stock count should be updated
    expect(screen.getByText('24')).toBeInTheDocument(); // Was 23, now 24
  });

  it('should handle reservation events', () => {
    let reservationHandler: ((event: any) => void) | undefined;

    mockOnReservationCreated.mockImplementation((handler) => {
      reservationHandler = handler;
      return jest.fn();
    });

    render(<DashboardPage />);

    const reservationEvent = {
      payload: {
        reservationId: 'res_123',
        customerName: 'Jane Smith',
        partySize: 4,
        time: '7:30 PM',
      },
    };

    act(() => {
      if (reservationHandler) {
        reservationHandler(reservationEvent);
      }
    });

    expect(mockShowNotification).toHaveBeenCalledWith({
      id: 'reservation-res_123',
      type: 'info',
      title: 'New Reservation',
      message: 'Jane Smith - Party of 4 at 7:30 PM',
      duration: 5000,
      timestamp: expect.any(Number),
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const mockUnsubscribeLowStock = jest.fn();
    const mockUnsubscribeReservation = jest.fn();

    mockOnInventoryLowStock.mockReturnValue(mockUnsubscribeLowStock);
    mockOnReservationCreated.mockReturnValue(mockUnsubscribeReservation);

    const { unmount } = render(<DashboardPage />);

    unmount();

    expect(mockUnsubscribeLowStock).toHaveBeenCalled();
    expect(mockUnsubscribeReservation).toHaveBeenCalled();
  });

  it('should handle warning priority low stock events', () => {
    let lowStockHandler: ((event: any) => void) | undefined;

    mockOnInventoryLowStock.mockImplementation((handler) => {
      lowStockHandler = handler;
      return jest.fn();
    });

    render(<DashboardPage />);

    const lowStockEvent = {
      payload: {
        itemId: 'item_456',
        itemName: 'Chicken Breast',
        currentStock: 10,
        priority: 'low',
      },
    };

    act(() => {
      if (lowStockHandler) {
        lowStockHandler(lowStockEvent);
      }
    });

    expect(mockShowNotification).toHaveBeenCalledWith({
      id: 'low-stock-item_456',
      type: 'warning',
      title: 'Low Stock Alert',
      message: 'Chicken Breast is running low (10 remaining)',
      duration: 5000,
      timestamp: expect.any(Number),
    });
  });

  it('should render with minimal user data', () => {
    const minimalUser = {
      user: {
        id: 'user_456',
        email: 'user@test.com',
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
      logout: jest.fn(),
      refreshUser: jest.fn(),
      canAccess: mockCanAccess,
      hasRole: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Welcome back, user!')).toBeInTheDocument();
    expect(screen.getByText('Server')).toBeInTheDocument();
  });

  it('should handle user with no permissions', () => {
    mockCanAccess.mockReturnValue(false);

    render(<DashboardPage />);

    // Should not show any stats
    expect(screen.queryByText("Today's Orders")).not.toBeInTheDocument();
    expect(screen.queryByText('Active Tables')).not.toBeInTheDocument();

    // Should not show any quick actions
    expect(screen.queryByText('Create Order')).not.toBeInTheDocument();
    expect(screen.queryByText('View Kitchen')).not.toBeInTheDocument();

    // Should still show the welcome message and section headers
    expect(screen.getByText('Welcome back, john.doe!')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  describe('Quick action links', () => {
    it('should render correct paths for quick actions', () => {
      render(<DashboardPage />);

      const createOrderLink = screen.getByText('Create Order').closest('a');
      const viewKitchenLink = screen.getByText('View Kitchen').closest('a');
      const manageMenuLink = screen.getByText('Manage Menu').closest('a');

      expect(createOrderLink).toHaveAttribute('href', '/orders/new');
      expect(viewKitchenLink).toHaveAttribute('href', '/kitchen');
      expect(manageMenuLink).toHaveAttribute('href', '/menu');
    });
  });

  describe('Responsive design elements', () => {
    it('should apply correct CSS classes for responsive grid', () => {
      render(<DashboardPage />);

      const statsGrid = screen.getByText("Today's Orders").closest('.grid');
      expect(statsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');

      const actionsGrid = screen.getByText('Create Order').closest('.grid');
      expect(actionsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    });
  });
});