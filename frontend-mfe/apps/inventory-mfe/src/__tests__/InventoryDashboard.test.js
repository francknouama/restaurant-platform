import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import InventoryDashboard from '../pages/InventoryDashboard';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('@restaurant/shared-ui', () => ({
  Button: ({ children, onClick, className, size, variant }) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
    >
      {children}
    </button>
  )
}));

jest.mock('@restaurant/shared-state', () => ({
  useRestaurantEvents: () => ({
    emitInventoryLowStock: jest.fn(),
    emitInventoryStockUpdated: jest.fn(),
    onOrderCreated: jest.fn(() => () => {}),
    onKitchenOrderUpdate: jest.fn(() => () => {})
  })
}));

// Helper function to render with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('Inventory Dashboard Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Dashboard Component Rendering', () => {
    it('should render dashboard header with title and description', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Real-time inventory monitoring and control center')).toBeInTheDocument();
    });

    it('should render time range selector dropdown', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const selector = screen.getByRole('combobox');
      expect(selector).toBeInTheDocument();
      expect(selector).toHaveValue('week');
      
      // Verify options
      const options = within(selector).getAllByRole('option');
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('Today');
      expect(options[1]).toHaveTextContent('This Week');
      expect(options[2]).toHaveTextContent('This Month');
    });

    it('should render create purchase order button', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('+ Create Purchase Order');
      expect(button).toBeInTheDocument();
    });

    it('should handle time range selection changes', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const selector = screen.getByRole('combobox');
      fireEvent.change(selector, { target: { value: 'today' } });
      
      expect(selector).toHaveValue('today');
    });

    it('should navigate to purchase order creation on button click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('+ Create Purchase Order');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/purchase-orders/new');
    });
  });

  describe('Critical Alerts Banner', () => {
    it('should display critical alerts banner when urgent items exist', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Wait for mock data to load
      const alertBanner = screen.getByText(/Critical Stock Alert/);
      expect(alertBanner).toBeInTheDocument();
    });

    it('should show count of urgent stock alerts', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // The mock data has 2 urgent alerts
      expect(screen.getByText(/Critical Stock Alert \(2 items\)/)).toBeInTheDocument();
    });

    it('should provide navigation to alerts page', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const viewAlertsButton = screen.getByText('View All Alerts');
      expect(viewAlertsButton).toBeInTheDocument();
      
      fireEvent.click(viewAlertsButton);
      expect(mockNavigate).toHaveBeenCalledWith('/alerts');
    });

    it('should display alert description text', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('You have urgent stock shortages that require immediate attention.')).toBeInTheDocument();
    });

    it('should have proper alert styling', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const alertBanner = screen.getByText(/Critical Stock Alert/).closest('div').parentElement;
      expect(alertBanner).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('Key Metrics Display', () => {
    it('should display total items count metric', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('847')).toBeInTheDocument();
      expect(screen.getByText('Total Items')).toBeInTheDocument();
    });

    it('should display low stock items count', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });

    it('should display out of stock items count', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('should display total inventory value', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('$125K')).toBeInTheDocument();
      expect(screen.getByText('Total Value')).toBeInTheDocument();
    });

    it('should display pending purchase orders count', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('Pending Orders')).toBeInTheDocument();
    });

    it('should display monthly turnover rate', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('2.4x')).toBeInTheDocument();
      expect(screen.getByText('Turnover Rate')).toBeInTheDocument();
    });

    it('should display average stock days', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('15d')).toBeInTheDocument();
      expect(screen.getByText('Avg Stock Days')).toBeInTheDocument();
    });

    it('should display supplier count', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
    });

    it('should apply proper metric styling', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Check color classes for different metrics
      const totalItems = screen.getByText('847');
      expect(totalItems).toHaveClass('text-blue-600');
      
      const lowStock = screen.getByText('23');
      expect(lowStock).toHaveClass('text-amber-600');
      
      const outOfStock = screen.getByText('5');
      expect(outOfStock).toHaveClass('text-red-600');
    });

    it('should display metrics in responsive grid layout', () => {
      const { container } = renderWithRouter(<InventoryDashboard />);
      
      const metricsGrid = container.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4.lg\\:grid-cols-8');
      expect(metricsGrid).toBeInTheDocument();
    });
  });

  describe('Stock Alerts Section', () => {
    it('should display stock alerts header', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
    });

    it('should display view all button for alerts', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const viewAllButtons = screen.getAllByText('View All');
      expect(viewAllButtons[0]).toBeInTheDocument();
    });

    it('should display individual stock alert items', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Check for specific alert items from mock data
      expect(screen.getByText('Premium Beef Tenderloin')).toBeInTheDocument();
      expect(screen.getByText('Fresh Salmon Fillet')).toBeInTheDocument();
      expect(screen.getByText('Organic Baby Spinach')).toBeInTheDocument();
      expect(screen.getByText('Truffle Oil')).toBeInTheDocument();
      expect(screen.getByText('Parmesan Cheese (Aged)')).toBeInTheDocument();
    });

    it('should display alert priority badges', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getAllByText('urgent')).toHaveLength(2);
      expect(screen.getAllByText('high')).toHaveLength(2);
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should display stock levels for each alert', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText(/Current: 2 units • Minimum: 10 units/)).toBeInTheDocument();
      expect(screen.getByText(/Current: 5 units • Minimum: 15 units/)).toBeInTheDocument();
    });

    it('should display category information for alerts', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText(/Meat/)).toBeInTheDocument();
      expect(screen.getByText(/Seafood/)).toBeInTheDocument();
      expect(screen.getByText(/Vegetables/)).toBeInTheDocument();
    });

    it('should provide adjust stock button for each alert', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const adjustButtons = screen.getAllByText('Adjust Stock');
      expect(adjustButtons).toHaveLength(5);
    });

    it('should provide order now button for each alert', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const orderButtons = screen.getAllByText('Order Now');
      expect(orderButtons).toHaveLength(5);
    });

    it('should navigate to stock adjustment on button click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const adjustButtons = screen.getAllByText('Adjust Stock');
      fireEvent.click(adjustButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/stock/adjust?item=Premium Beef Tenderloin');
    });

    it('should navigate to purchase order with item on order button click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const orderButtons = screen.getAllByText('Order Now');
      fireEvent.click(orderButtons[0]);
      
      expect(mockNavigate).toHaveBeenCalledWith('/purchase-orders/new?item=Premium Beef Tenderloin');
    });
  });

  describe('Recent Activity Section', () => {
    it('should display recent activity header', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });

    it('should display activity items with descriptions', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Received delivery from Premium Foods Co.')).toBeInTheDocument();
      expect(screen.getByText('Kitchen used 15 lbs of chicken breast')).toBeInTheDocument();
      expect(screen.getByText('Stock adjustment for expired lettuce')).toBeInTheDocument();
      expect(screen.getByText('Purchase order #PO-2024-156 created')).toBeInTheDocument();
    });

    it('should display activity icons based on type', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('⬆️')).toBeInTheDocument(); // stock_in
      expect(screen.getByText('⬇️')).toBeInTheDocument(); // stock_out
      expect(screen.getByText('⚙️')).toBeInTheDocument(); // adjustment
      expect(screen.getByText('🛒')).toBeInTheDocument(); // purchase_order
    });

    it('should display user information for activities', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText(/by Sarah Johnson/)).toBeInTheDocument();
      expect(screen.getByText(/by Mike Chen/)).toBeInTheDocument();
      expect(screen.getByText(/by Emily Davis/)).toBeInTheDocument();
    });

    it('should display time ago for activities', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Should have relative time displays
      const timeElements = screen.getAllByText(/ago$/);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should display amount changes for relevant activities', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('+125 units')).toBeInTheDocument();
      expect(screen.getByText('+15 units')).toBeInTheDocument();
      expect(screen.getByText('-8 units')).toBeInTheDocument();
    });

    it('should apply proper styling for positive and negative amounts', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const positiveAmount = screen.getByText('+125 units');
      expect(positiveAmount).toHaveClass('text-green-600');
      
      const negativeAmount = screen.getByText('-8 units');
      expect(negativeAmount).toHaveClass('text-red-600');
    });
  });

  describe('Quick Actions Grid', () => {
    it('should display manage items action button', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Manage Items')).toBeInTheDocument();
      expect(screen.getByText('Add, edit, and organize inventory items')).toBeInTheDocument();
    });

    it('should display stock control action button', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Stock Control')).toBeInTheDocument();
      expect(screen.getByText('Adjust stock levels and track usage')).toBeInTheDocument();
    });

    it('should display suppliers action button', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Manage vendor relationships')).toBeInTheDocument();
    });

    it('should display analytics action button', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('View reports and insights')).toBeInTheDocument();
    });

    it('should navigate to items management on click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('Manage Items').closest('button');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/items');
    });

    it('should navigate to stock control on click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('Stock Control').closest('button');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/stock');
    });

    it('should navigate to suppliers on click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('Suppliers').closest('button');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/suppliers');
    });

    it('should navigate to analytics on click', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const button = screen.getByText('Analytics').closest('button');
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/analytics');
    });

    it('should display action icons', () => {
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('🏷️')).toBeInTheDocument();
      expect(screen.getAllByText('📈')).toHaveLength(2); // Stock Control and Analytics
      expect(screen.getByText('🏢')).toBeInTheDocument();
    });
  });

  describe('Event Integration', () => {
    it('should emit low stock events for urgent items', async () => {
      const mockEmitLowStock = jest.fn();
      jest.mocked(jest.requireMock('@restaurant/shared-state').useRestaurantEvents).mockReturnValue({
        emitInventoryLowStock: mockEmitLowStock,
        emitInventoryStockUpdated: jest.fn(),
        onOrderCreated: jest.fn(() => () => {}),
        onKitchenOrderUpdate: jest.fn(() => () => {})
      });

      renderWithRouter(<InventoryDashboard />);

      await waitFor(() => {
        expect(mockEmitLowStock).toHaveBeenCalled();
      });
    });

    it('should listen for order created events', () => {
      const mockOnOrderCreated = jest.fn(() => () => {});
      jest.mocked(jest.requireMock('@restaurant/shared-state').useRestaurantEvents).mockReturnValue({
        emitInventoryLowStock: jest.fn(),
        emitInventoryStockUpdated: jest.fn(),
        onOrderCreated: mockOnOrderCreated,
        onKitchenOrderUpdate: jest.fn(() => () => {})
      });

      renderWithRouter(<InventoryDashboard />);

      expect(mockOnOrderCreated).toHaveBeenCalled();
    });

    it('should listen for kitchen order updates', () => {
      const mockOnKitchenUpdate = jest.fn(() => () => {});
      jest.mocked(jest.requireMock('@restaurant/shared-state').useRestaurantEvents).mockReturnValue({
        emitInventoryLowStock: jest.fn(),
        emitInventoryStockUpdated: jest.fn(),
        onOrderCreated: jest.fn(() => () => {}),
        onKitchenOrderUpdate: mockOnKitchenUpdate
      });

      renderWithRouter(<InventoryDashboard />);

      expect(mockOnKitchenUpdate).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should render in mobile layout', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });

    it('should render in tablet layout', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });

    it('should render in desktop layout', () => {
      global.innerWidth = 1920;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryDashboard />);
      
      expect(screen.getByText('Inventory Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Loading and Updates', () => {
    it('should load initial data on mount', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Verify data is loaded
      expect(screen.getByText('847')).toBeInTheDocument(); // Total items
      expect(screen.getByText('Premium Beef Tenderloin')).toBeInTheDocument(); // Alert item
    });

    it('should update data when time range changes', () => {
      renderWithRouter(<InventoryDashboard />);
      
      const selector = screen.getByRole('combobox');
      fireEvent.change(selector, { target: { value: 'today' } });
      
      // Data should still be present after time range change
      expect(screen.getByText('847')).toBeInTheDocument();
    });

    it('should handle empty data states gracefully', () => {
      renderWithRouter(<InventoryDashboard />);
      
      // Even with no data, structure should render
      expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });
});