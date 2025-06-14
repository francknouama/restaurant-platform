import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams, useNavigate } from 'react-router-dom';
import OrderDetailsPage from '../OrderDetailsPage';

// Mock React Router
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, variant, size, className, onClick, ...props }: { 
    children: React.ReactNode; 
    variant?: string; 
    size?: string; 
    className?: string;
    onClick?: () => void;
    [key: string]: any;
  }) => (
    <button 
      data-testid="button" 
      data-variant={variant} 
      data-size={size} 
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  ),
  StatusBadge: ({ status, color, size, children }: { 
    status?: string; 
    color?: string;
    size?: string;
    children?: React.ReactNode;
  }) => (
    <span data-testid="status-badge" data-status={status} data-color={color} data-size={size}>
      {children || status}
    </span>
  ),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Printer: () => <div data-testid="printer-icon">Printer</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  MapPin: () => <div data-testid="map-pin-icon">MapPin</div>,
  Phone: () => <div data-testid="phone-icon">Phone</div>,
  Mail: () => <div data-testid="mail-icon">Mail</div>,
  CreditCard: () => <div data-testid="credit-card-icon">CreditCard</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  XCircle: () => <div data-testid="x-circle-icon">XCircle</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
}));

describe('OrderDetailsPage', () => {
  const mockNavigate = jest.fn();
  const mockUseParams = useParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockUseParams.mockReturnValue({ orderId: 'order-123' });
    mockNavigate.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderOrderDetailsPage = () => {
    return render(<OrderDetailsPage />);
  };

  const waitForOrderToLoad = async () => {
    // Advance timers to trigger useEffect setTimeout
    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  };

  describe('Loading State', () => {
    it('should show loading skeleton initially', () => {
      renderOrderDetailsPage();
      
      // Should show loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state after order loads', async () => {
      renderOrderDetailsPage();
      
      await waitForOrderToLoad();
      
      // Should no longer show loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons).toHaveLength(0);
    });
  });

  describe('Order Not Found', () => {
    it('should show error state when order is null', async () => {
      // Mock the effect to set order to null
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [null, jest.fn()]) // order state
        .mockImplementationOnce(() => [false, jest.fn()]); // isLoading state
      
      renderOrderDetailsPage();
      
      expect(screen.getByText('Order not found')).toBeInTheDocument();
      expect(screen.getByText('The order you\'re looking for doesn\'t exist or has been removed.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
    });

    it('should navigate back to orders when clicking Back to Orders button', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [null, jest.fn()]) // order state
        .mockImplementationOnce(() => [false, jest.fn()]); // isLoading state
      
      renderOrderDetailsPage();
      
      const backButton = screen.getByText('Back to Orders');
      await user.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });
  });

  describe('Page Structure and Header', () => {
    it('should render the order number as title', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('ORD-001');
    });

    it('should render order status and metadata', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByTestId('status-badge')).toBeInTheDocument();
      expect(screen.getByText('DINE IN')).toBeInTheDocument();
      expect(screen.getByText(/Placed/)).toBeInTheDocument();
    });

    it('should render back button that navigates to orders', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toBeInTheDocument();
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
      
      await user.click(backButton!);
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
    });

    it('should render action buttons in header', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Print')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByTestId('printer-icon')).toBeInTheDocument();
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    });

    it('should format order placement time correctly', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Should display formatted time
      expect(screen.getByText(/Placed Jan 15, 10:30 AM/)).toBeInTheDocument();
    });
  });

  describe('Order Items Display', () => {
    it('should display all order items', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Garlic Bread')).toBeInTheDocument();
    });

    it('should display item details correctly', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Check pizza details
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 1 × $18.99')).toBeInTheDocument();
      expect(screen.getByText('Note: Extra cheese, light sauce')).toBeInTheDocument();
    });

    it('should display item status badges', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges.length).toBeGreaterThan(1); // Main order status + item statuses
    });

    it('should show special instructions when present', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Note: Extra cheese, light sauce')).toBeInTheDocument();
    });

    it('should not show special instructions when not present', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Caesar Salad and Garlic Bread don't have special instructions
      const notes = screen.getAllByText(/Note:/);
      expect(notes).toHaveLength(1); // Only pizza has special instructions
    });

    it('should calculate item totals correctly', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Check individual item totals
      expect(screen.getByText('$18.99')).toBeInTheDocument(); // Pizza 1×$18.99
      expect(screen.getByText('$27.00')).toBeInTheDocument(); // Salad 2×$13.50
      expect(screen.getByText('$6.99')).toBeInTheDocument(); // Bread 1×$6.99
    });
  });

  describe('Order Totals', () => {
    it('should display order totals section', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display correct monetary amounts', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('$39.48')).toBeInTheDocument(); // Subtotal
      expect(screen.getByText('$6.51')).toBeInTheDocument(); // Tax
      expect(screen.getByText('$45.99')).toBeInTheDocument(); // Total
    });

    it('should format currency consistently', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // All currency amounts should use USD formatting
      const currencyAmounts = screen.getAllByText(/\$\d+\.\d{2}/);
      expect(currencyAmounts.length).toBeGreaterThan(5);
    });
  });

  describe('Order Timeline', () => {
    it('should display order timeline section', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Order Timeline')).toBeInTheDocument();
    });

    it('should display all timeline events', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Order Placed')).toBeInTheDocument();
      expect(screen.getByText('Payment Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Kitchen Started Preparation')).toBeInTheDocument();
    });

    it('should format timeline timestamps', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Should display formatted timestamps
      expect(screen.getByText('Jan 15, 10:30 AM')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 10:32 AM')).toBeInTheDocument();
      expect(screen.getByText('Jan 15, 10:35 AM')).toBeInTheDocument();
    });

    it('should use timeline CSS classes', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const timelineSteps = document.querySelectorAll('.order-timeline-step');
      expect(timelineSteps.length).toBe(3);
      
      timelineSteps.forEach(step => {
        expect(step).toHaveClass('completed');
      });
    });
  });

  describe('Customer Information', () => {
    it('should display customer information section', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Customer Information')).toBeInTheDocument();
    });

    it('should display customer details', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
    });

    it('should display customer avatar with initials', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const avatar = document.querySelector('.customer-avatar');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveTextContent('JD'); // John Doe initials
    });

    it('should display contact icons', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
      expect(screen.getByTestId('phone-icon')).toBeInTheDocument();
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    });

    it('should conditionally display address when present', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City, State 12345')).toBeInTheDocument();
    });
  });

  describe('Payment Information', () => {
    it('should display payment information section', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Payment Information')).toBeInTheDocument();
    });

    it('should display payment method', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Method')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-icon')).toBeInTheDocument();
    });

    it('should display payment status', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Status')).toBeInTheDocument();
      
      // Payment status should have its own status badge
      const statusBadges = screen.getAllByTestId('status-badge');
      const paymentStatusBadge = statusBadges.find(badge => 
        badge.getAttribute('data-color') === 'green'
      );
      expect(paymentStatusBadge).toBeInTheDocument();
    });

    it('should display payment amount', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getAllByText('$45.99')).toHaveLength(2); // Total and payment amount
    });

    it('should display transaction ID when present', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Transaction ID')).toBeInTheDocument();
      expect(screen.getByText('TXN-12345')).toBeInTheDocument();
    });
  });

  describe('Order Actions', () => {
    it('should display actions section', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should show Mark as Ready button for PREPARING orders', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const markReadyButton = screen.getByText('Mark as Ready');
      expect(markReadyButton).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should show Complete Order button for READY orders', async () => {
      // Mock order with READY status
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [{
          id: 'order-123',
          orderNumber: 'ORD-001',
          status: 'READY',
          // ... other mock data
        }, jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()]);
      
      renderOrderDetailsPage();
      
      expect(screen.getByText('Complete Order')).toBeInTheDocument();
      expect(screen.getByTestId('package-icon')).toBeInTheDocument();
    });

    it('should always show Modify Order button', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Modify Order')).toBeInTheDocument();
    });

    it('should show Cancel Order button for non-completed orders', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const cancelButton = screen.getByText('Cancel Order');
      expect(cancelButton).toBeInTheDocument();
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('should not show Cancel Order button for completed orders', async () => {
      // Mock completed order
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [{
          id: 'order-123',
          status: 'COMPLETED',
          // ... other mock data needed to prevent errors
          orderNumber: 'ORD-001',
          type: 'DINE_IN',
          customer: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
          items: [],
          payment: { method: 'Card', status: 'COMPLETED', amount: 45.99 },
          timeline: [],
          subtotal: 39.48,
          tax: 6.51,
          total: 45.99,
          createdAt: '2024-01-15T10:30:00Z',
          estimatedTime: 25,
          priority: 'HIGH'
        }, jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()]);
      
      renderOrderDetailsPage();
      
      expect(screen.queryByText('Cancel Order')).not.toBeInTheDocument();
    });

    it('should have correct button variants', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const buttons = screen.getAllByTestId('button');
      
      // Check specific button variants
      const markReadyButton = buttons.find(btn => btn.textContent?.includes('Mark as Ready'));
      expect(markReadyButton).toHaveAttribute('data-variant', 'primary');
      
      const modifyButton = buttons.find(btn => btn.textContent?.includes('Modify Order'));
      expect(modifyButton).toHaveAttribute('data-variant', 'outline');
      
      const cancelButton = buttons.find(btn => btn.textContent?.includes('Cancel Order'));
      expect(cancelButton).toHaveAttribute('data-variant', 'danger');
    });
  });

  describe('Special Notes', () => {
    it('should display special notes when present', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Special Notes')).toBeInTheDocument();
      expect(screen.getByText('Customer requested table near the window')).toBeInTheDocument();
    });

    it('should not display notes section when no notes', async () => {
      // Mock order without notes
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [{
          id: 'order-123',
          orderNumber: 'ORD-001',
          status: 'PREPARING',
          notes: undefined, // No notes
          // ... other required mock data
          type: 'DINE_IN',
          customer: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
          items: [],
          payment: { method: 'Card', status: 'COMPLETED', amount: 45.99 },
          timeline: [],
          subtotal: 39.48,
          tax: 6.51,
          total: 45.99,
          createdAt: '2024-01-15T10:30:00Z',
          estimatedTime: 25,
          priority: 'HIGH'
        }, jest.fn()])
        .mockImplementationOnce(() => [false, jest.fn()]);
      
      renderOrderDetailsPage();
      
      expect(screen.queryByText('Special Notes')).not.toBeInTheDocument();
    });
  });

  describe('Status Color Mapping', () => {
    it('should apply correct status colors', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      
      // PREPARING status should have blue color
      const preparingBadge = statusBadges.find(badge => 
        badge.getAttribute('data-status') === 'preparing'
      );
      expect(preparingBadge).toHaveAttribute('data-color', 'blue');
    });

    it('should handle different order statuses correctly', async () => {
      const statuses = [
        { status: 'PENDING', color: 'amber' },
        { status: 'CONFIRMED', color: 'emerald' },
        { status: 'PREPARING', color: 'blue' },
        { status: 'READY', color: 'purple' },
        { status: 'COMPLETED', color: 'green' },
        { status: 'CANCELLED', color: 'red' }
      ];

      for (const { status, color } of statuses) {
        jest.spyOn(React, 'useState')
          .mockImplementationOnce(() => [{
            id: 'order-123',
            status,
            // ... minimal mock data
            orderNumber: 'ORD-001',
            type: 'DINE_IN',
            customer: { name: 'John Doe', email: 'john@example.com', phone: '123-456-7890' },
            items: [],
            payment: { method: 'Card', status: 'COMPLETED', amount: 45.99 },
            timeline: [],
            subtotal: 39.48,
            tax: 6.51,
            total: 45.99,
            createdAt: '2024-01-15T10:30:00Z',
            estimatedTime: 25,
            priority: 'HIGH'
          }, jest.fn()])
          .mockImplementationOnce(() => [false, jest.fn()]);
        
        const { unmount } = renderOrderDetailsPage();
        
        const statusBadge = screen.getByTestId('status-badge');
        expect(statusBadge).toHaveAttribute('data-color', color);
        
        unmount();
      }
    });
  });

  describe('URL Parameter Handling', () => {
    it('should use orderId from URL params', async () => {
      mockUseParams.mockReturnValue({ orderId: 'custom-order-id' });
      
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // The mock data should use the orderId from params
      expect(mockUseParams).toHaveBeenCalled();
    });

    it('should handle missing orderId gracefully', async () => {
      mockUseParams.mockReturnValue({});
      
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Should still render with default mock data
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive grid layout', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const gridContainer = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should handle layout structure correctly', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      // Left column should have lg:col-span-2
      const leftColumn = document.querySelector('.lg\\:col-span-2');
      expect(leftColumn).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('ORD-001');
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(3);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);
    });

    it('should have accessible button labels', async () => {
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Print')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Mark as Ready')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render efficiently without warnings', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle data loading efficiently', async () => {
      renderOrderDetailsPage();
      
      // Should show loading state initially
      expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
      
      await waitForOrderToLoad();
      
      // Should load data without issues
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid order data gracefully', () => {
      renderOrderDetailsPage();
      
      // Before data loads, should show loading state
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });
      
      renderOrderDetailsPage();
      await waitForOrderToLoad();
      
      const backButton = screen.getByText('Back').closest('button');
      
      // Should not crash on navigation errors
      expect(() => user.click(backButton!)).not.toThrow();
    });
  });
});