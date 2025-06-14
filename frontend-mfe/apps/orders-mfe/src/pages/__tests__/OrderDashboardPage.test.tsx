import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrderDashboardPage from '../OrderDashboardPage';

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, variant, size, className, ...props }: { 
    children: React.ReactNode; 
    variant?: string; 
    size?: string; 
    className?: string;
    [key: string]: any;
  }) => (
    <button 
      data-testid="button" 
      data-variant={variant} 
      data-size={size} 
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  Input: ({ placeholder, value, onChange, icon, ...props }: {
    placeholder?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon?: React.ReactNode;
    [key: string]: any;
  }) => (
    <div data-testid="input-container">
      {icon && <span data-testid="input-icon">{icon}</span>}
      <input 
        data-testid="input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  ),
  StatusBadge: ({ status, color, children }: { 
    status?: string; 
    color?: string;
    children: React.ReactNode;
  }) => (
    <span data-testid="status-badge" data-status={status} data-color={color}>
      {children}
    </span>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Zap: () => <div data-testid="zap-icon">Zap</div>,
  TrendingUp: () => <div data-testid="trending-up-icon">TrendingUp</div>,
  DollarSign: () => <div data-testid="dollar-sign-icon">DollarSign</div>,
  ShoppingCart: () => <div data-testid="shopping-cart-icon">ShoppingCart</div>,
  AlertTriangle: () => <div data-testid="alert-triangle-icon">AlertTriangle</div>,
}));

describe('OrderDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderOrderDashboard = () => {
    return render(<OrderDashboardPage />);
  };

  describe('Page Structure and Header', () => {
    it('should render the page title and description', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('Order Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage and track all restaurant orders')).toBeInTheDocument();
    });

    it('should render action buttons in header', () => {
      renderOrderDashboard();
      
      const quickOrderButton = screen.getByText('Quick Order').closest('button');
      const newOrderButton = screen.getByText('New Order').closest('button');
      
      expect(quickOrderButton).toBeInTheDocument();
      expect(newOrderButton).toBeInTheDocument();
      expect(quickOrderButton).toHaveAttribute('data-variant', 'outline');
      expect(newOrderButton).toHaveAttribute('data-variant', 'primary');
    });

    it('should display icons in action buttons', () => {
      renderOrderDashboard();
      
      expect(screen.getByTestId('zap-icon')).toBeInTheDocument();
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderOrderDashboard();
      
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('Order Dashboard');
    });
  });

  describe('Statistics Cards', () => {
    it('should display all four stat cards', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
      expect(screen.getByText('Avg Prep Time')).toBeInTheDocument();
      expect(screen.getByText('Orders Today')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('12')).toBeInTheDocument(); // Active Orders
      expect(screen.getByText('$1,247')).toBeInTheDocument(); // Today's Revenue
      expect(screen.getByText('23min')).toBeInTheDocument(); // Avg Prep Time
      expect(screen.getByText('47')).toBeInTheDocument(); // Orders Today
    });

    it('should display appropriate icons for each stat', () => {
      renderOrderDashboard();
      
      expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });

    it('should use Card components for stats', () => {
      renderOrderDashboard();
      
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThanOrEqual(4); // At least 4 stat cards
    });
  });

  describe('Filter Functionality', () => {
    it('should render search input with icon', () => {
      renderOrderDashboard();
      
      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      expect(searchInput).toBeInTheDocument();
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    it('should render status filter dropdown', () => {
      renderOrderDashboard();
      
      const statusSelect = screen.getByDisplayValue('All Status');
      expect(statusSelect).toBeInTheDocument();
      
      // Check all status options
      expect(screen.getByRole('option', { name: 'All Status' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Pending' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Confirmed' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Preparing' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Ready' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Completed' })).toBeInTheDocument();
    });

    it('should render type filter dropdown', () => {
      renderOrderDashboard();
      
      const typeSelect = screen.getByDisplayValue('All Types');
      expect(typeSelect).toBeInTheDocument();
      
      // Check all type options
      expect(screen.getByRole('option', { name: 'All Types' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Dine In' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Takeout' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Delivery' })).toBeInTheDocument();
    });

    it('should render More Filters button', () => {
      renderOrderDashboard();
      
      const moreFiltersButton = screen.getByText('More Filters');
      expect(moreFiltersButton).toBeInTheDocument();
      expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter orders by order number', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      await user.type(searchInput, 'ORD-001');

      // Should show only the matching order
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
      expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
    });

    it('should filter orders by customer name', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      await user.type(searchInput, 'Jane Smith');

      // Should show only Jane Smith's order
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      await user.type(searchInput, 'john doe');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show no results message when search has no matches', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      await user.type(searchInput, 'NonExistentOrder');

      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more orders.')).toBeInTheDocument();
    });
  });

  describe('Status Filter Functionality', () => {
    it('should filter orders by status', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'PREPARING');

      // Should show only PREPARING orders
      expect(screen.getByText('ORD-001')).toBeInTheDocument(); // PREPARING order
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument(); // READY order
      expect(screen.queryByText('ORD-003')).not.toBeInTheDocument(); // CONFIRMED order
    });

    it('should return to all orders when selecting "All Status"', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const statusSelect = screen.getByDisplayValue('All Status');
      
      // Filter to PREPARING
      await user.selectOptions(statusSelect, 'PREPARING');
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument();
      
      // Return to all
      await user.selectOptions(statusSelect, 'all');
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });
  });

  describe('Type Filter Functionality', () => {
    it('should filter orders by type', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const typeSelect = screen.getByDisplayValue('All Types');
      await user.selectOptions(typeSelect, 'DINE_IN');

      // Should show only DINE_IN orders
      expect(screen.getByText('ORD-001')).toBeInTheDocument(); // DINE_IN order
      expect(screen.queryByText('ORD-002')).not.toBeInTheDocument(); // TAKEOUT order
      expect(screen.queryByText('ORD-003')).not.toBeInTheDocument(); // DELIVERY order
    });

    it('should handle multiple filter combinations', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const statusSelect = screen.getByDisplayValue('All Status');
      const typeSelect = screen.getByDisplayValue('All Types');
      
      // Filter to READY status and TAKEOUT type
      await user.selectOptions(statusSelect, 'READY');
      await user.selectOptions(typeSelect, 'TAKEOUT');

      // Should show only ORD-002 (READY + TAKEOUT)
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.queryByText('ORD-001')).not.toBeInTheDocument();
      expect(screen.queryByText('ORD-003')).not.toBeInTheDocument();
    });
  });

  describe('Order Display', () => {
    it('should display all orders by default', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('ORD-003')).toBeInTheDocument();
    });

    it('should display order details correctly', () => {
      renderOrderDashboard();
      
      // Check first order details
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('DINE IN')).toBeInTheDocument();
      expect(screen.getByText('$45.99')).toBeInTheDocument();
    });

    it('should display status badges with correct status', () => {
      renderOrderDashboard();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);
      
      // Check status values are set correctly
      const preparingBadge = statusBadges.find(badge => 
        badge.getAttribute('data-status') === 'preparing'
      );
      expect(preparingBadge).toBeInTheDocument();
    });

    it('should display formatted currency amounts', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('$45.99')).toBeInTheDocument();
      expect(screen.getByText('$32.50')).toBeInTheDocument();
      expect(screen.getByText('$67.25')).toBeInTheDocument();
    });

    it('should display formatted time', () => {
      renderOrderDashboard();
      
      // Should display formatted times (exact format may vary by locale)
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}\s*(AM|PM)/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should display item counts correctly', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('2 items')).toBeInTheDocument(); // ORD-001
      expect(screen.getByText('1 item')).toBeInTheDocument(); // ORD-002, ORD-003
    });

    it('should display estimated time for preparing orders', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('~25min remaining')).toBeInTheDocument();
    });
  });

  describe('Order Item Preview', () => {
    it('should display order items preview', () => {
      renderOrderDashboard();
      
      expect(screen.getByText('1x Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('2x Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('2x Chicken Burger')).toBeInTheDocument();
      expect(screen.getByText('1x Family Pizza Combo')).toBeInTheDocument();
    });
  });

  describe('Order Actions', () => {
    it('should display View Details button for all orders', () => {
      renderOrderDashboard();
      
      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons).toHaveLength(3); // One for each order
    });

    it('should display Complete button for READY orders', () => {
      renderOrderDashboard();
      
      const completeButtons = screen.getAllByText('Complete');
      expect(completeButtons).toHaveLength(1); // Only for ORD-002 which is READY
    });

    it('should display Mark Ready button for PREPARING orders', () => {
      renderOrderDashboard();
      
      const markReadyButtons = screen.getAllByText('Mark Ready');
      expect(markReadyButtons).toHaveLength(1); // Only for ORD-001 which is PREPARING
    });

    it('should have correct button variants', () => {
      renderOrderDashboard();
      
      const buttons = screen.getAllByTestId('button');
      
      // View Details buttons should be outline
      const viewDetailsButtons = buttons.filter(btn => 
        btn.textContent?.includes('View Details')
      );
      viewDetailsButtons.forEach(btn => {
        expect(btn).toHaveAttribute('data-variant', 'outline');
        expect(btn).toHaveAttribute('data-size', 'sm');
      });
      
      // Complete buttons should be primary
      const completeButtons = buttons.filter(btn => 
        btn.textContent?.includes('Complete')
      );
      completeButtons.forEach(btn => {
        expect(btn).toHaveAttribute('data-variant', 'primary');
        expect(btn).toHaveAttribute('data-size', 'sm');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no orders match filters', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      // Filter to a status that has no orders
      const statusSelect = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusSelect, 'CANCELLED');

      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters to see more orders.')).toBeInTheDocument();
      expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive grid classes for stats', () => {
      renderOrderDashboard();
      
      const statsContainer = screen.getByText('Active Orders').closest('.grid');
      expect(statsContainer).toHaveClass('grid-cols-1', 'md:grid-cols-4');
    });

    it('should handle filter layout responsively', () => {
      renderOrderDashboard();
      
      const filtersContainer = screen.getByPlaceholderText('Search orders or customers...').closest('.flex');
      expect(filtersContainer).toHaveClass('flex-wrap');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderOrderDashboard();
      
      const statusSelect = screen.getByDisplayValue('All Status');
      const typeSelect = screen.getByDisplayValue('All Types');
      const searchInput = screen.getByPlaceholderText('Search orders or customers...');
      
      expect(statusSelect).toBeInTheDocument();
      expect(typeSelect).toBeInTheDocument();
      expect(searchInput).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();
      
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Business Logic', () => {
    it('should apply correct status colors', () => {
      renderOrderDashboard();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      
      // PREPARING should have blue color
      const preparingBadge = statusBadges.find(badge => 
        badge.getAttribute('data-status') === 'preparing'
      );
      expect(preparingBadge).toHaveAttribute('data-color', 'blue');
    });

    it('should handle priority indicators', () => {
      renderOrderDashboard();
      
      // Priority indicators should be present
      const priorityIndicators = screen.getAllByTestId('card').some(card =>
        card.innerHTML.includes('priority-indicator')
      );
      expect(priorityIndicators).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderOrderDashboard();
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle filter changes efficiently', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDashboard();

      const statusSelect = screen.getByDisplayValue('All Status');
      
      // Multiple rapid filter changes should not cause issues
      await user.selectOptions(statusSelect, 'PREPARING');
      await user.selectOptions(statusSelect, 'READY');
      await user.selectOptions(statusSelect, 'all');

      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });
});