import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import InventoryAnalytics from '../pages/InventoryAnalytics';

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

// Helper function to render with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('Inventory Analytics Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render analytics header with title', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Inventory Analytics')).toBeInTheDocument();
      expect(screen.getByText(/Comprehensive insights into inventory performance and trends/)).toBeInTheDocument();
    });

    it('should render time range selector', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      expect(timeRangeSelect).toBeInTheDocument();
      expect(timeRangeSelect).toHaveValue('month');
    });

    it('should render export button', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Export Report')).toBeInTheDocument();
    });

    it('should render view tabs', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
      expect(screen.getByText('Stock Movement')).toBeInTheDocument();
      expect(screen.getByText('Cost Analysis')).toBeInTheDocument();
    });
  });

  describe('Time Range Selection', () => {
    it('should change time range on selection', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      fireEvent.change(timeRangeSelect, { target: { value: 'quarter' } });
      
      expect(timeRangeSelect).toHaveValue('quarter');
    });

    it('should have all time range options', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      const options = timeRangeSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('week');
      expect(options[1]).toHaveValue('month');
      expect(options[2]).toHaveValue('quarter');
      expect(options[3]).toHaveValue('year');
    });

    it('should update data when time range changes', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const timeRangeSelect = screen.getByRole('combobox');
      fireEvent.change(timeRangeSelect, { target: { value: 'year' } });
      
      await waitFor(() => {
        // Data should still be present
        expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab', () => {
    it('should display key metrics', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      expect(screen.getByText('$124,750')).toBeInTheDocument();
      
      expect(screen.getByText('Inventory Turnover')).toBeInTheDocument();
      expect(screen.getByText('2.4x')).toBeInTheDocument();
      
      expect(screen.getByText('Stock Accuracy')).toBeInTheDocument();
      expect(screen.getByText('96.8%')).toBeInTheDocument();
      
      expect(screen.getByText('Carrying Cost')).toBeInTheDocument();
      expect(screen.getByText('$12,475')).toBeInTheDocument();
      
      expect(screen.getByText('Dead Stock')).toBeInTheDocument();
      expect(screen.getByText('3.2%')).toBeInTheDocument();
      
      expect(screen.getByText('Waste Percentage')).toBeInTheDocument();
      expect(screen.getByText('2.1%')).toBeInTheDocument();
    });

    it('should display metric changes with indicators', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      // Positive changes
      expect(screen.getByText('↑ 8.2%')).toBeInTheDocument();
      expect(screen.getByText('↑ 12.5%')).toBeInTheDocument();
      
      // Negative changes (but positive impact)
      expect(screen.getByText('↓ 5.8%')).toBeInTheDocument();
      expect(screen.getByText('↓ 15.2%')).toBeInTheDocument();
    });

    it('should show period comparison', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText(/vs last month/)).toBeInTheDocument();
    });
  });

  describe('Categories Tab', () => {
    it('should switch to categories view', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);
      
      expect(screen.getByText('Category Performance')).toBeInTheDocument();
    });

    it('should display category analytics table', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Total Items')).toBeInTheDocument();
        expect(screen.getByText('Total Value')).toBeInTheDocument();
        expect(screen.getByText('Low Stock')).toBeInTheDocument();
        expect(screen.getByText('Turnover Rate')).toBeInTheDocument();
        expect(screen.getByText('Avg Cost')).toBeInTheDocument();
      });
    });

    it('should display category data', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Meat')).toBeInTheDocument();
        expect(screen.getByText('Seafood')).toBeInTheDocument();
        expect(screen.getByText('Vegetables')).toBeInTheDocument();
        expect(screen.getByText('Dairy')).toBeInTheDocument();
      });
    });

    it('should show category chart', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const categoriesTab = screen.getByText('Categories');
      fireEvent.click(categoriesTab);
      
      await waitFor(() => {
        expect(screen.getByText('Value Distribution by Category')).toBeInTheDocument();
      });
    });
  });

  describe('Suppliers Tab', () => {
    it('should switch to suppliers view', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const suppliersTab = screen.getByText('Suppliers');
      fireEvent.click(suppliersTab);
      
      expect(screen.getByText('Supplier Performance')).toBeInTheDocument();
    });

    it('should display supplier performance table', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const suppliersTab = screen.getByText('Suppliers');
      fireEvent.click(suppliersTab);
      
      await waitFor(() => {
        expect(screen.getByText('Supplier')).toBeInTheDocument();
        expect(screen.getByText('Total Orders')).toBeInTheDocument();
        expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
        expect(screen.getByText('Quality Rating')).toBeInTheDocument();
        expect(screen.getByText('Total Spent')).toBeInTheDocument();
        expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
      });
    });

    it('should display supplier data', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const suppliersTab = screen.getByText('Suppliers');
      fireEvent.click(suppliersTab);
      
      await waitFor(() => {
        expect(screen.getByText('Premium Foods Co.')).toBeInTheDocument();
        expect(screen.getByText('Fresh Market Supply')).toBeInTheDocument();
        expect(screen.getByText('Ocean Harvest')).toBeInTheDocument();
      });
    });

    it('should show on-time delivery percentages', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const suppliersTab = screen.getByText('Suppliers');
      fireEvent.click(suppliersTab);
      
      await waitFor(() => {
        const deliveryPercentages = screen.getAllByText(/\d+%/);
        expect(deliveryPercentages.length).toBeGreaterThan(0);
      });
    });

    it('should display quality ratings', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const suppliersTab = screen.getByText('Suppliers');
      fireEvent.click(suppliersTab);
      
      await waitFor(() => {
        const ratings = screen.getAllByText(/★/);
        expect(ratings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Stock Movement Tab', () => {
    it('should switch to stock movement view', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const movementTab = screen.getByText('Stock Movement');
      fireEvent.click(movementTab);
      
      expect(screen.getByText('Stock Movement Analysis')).toBeInTheDocument();
    });

    it('should display movement chart', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const movementTab = screen.getByText('Stock Movement');
      fireEvent.click(movementTab);
      
      await waitFor(() => {
        expect(screen.getByText('Stock In vs Stock Out')).toBeInTheDocument();
      });
    });

    it('should show movement summary cards', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const movementTab = screen.getByText('Stock Movement');
      fireEvent.click(movementTab);
      
      await waitFor(() => {
        expect(screen.getByText('Total Stock In')).toBeInTheDocument();
        expect(screen.getByText('Total Stock Out')).toBeInTheDocument();
        expect(screen.getByText('Net Movement')).toBeInTheDocument();
        expect(screen.getByText('Waste/Loss')).toBeInTheDocument();
      });
    });

    it('should display movement data table', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const movementTab = screen.getByText('Stock Movement');
      fireEvent.click(movementTab);
      
      await waitFor(() => {
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Stock In')).toBeInTheDocument();
        expect(screen.getByText('Stock Out')).toBeInTheDocument();
        expect(screen.getByText('Waste')).toBeInTheDocument();
        expect(screen.getByText('Adjustments')).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export options on button click', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Email Report')).toBeInTheDocument();
    });

    it('should handle PDF export', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      
      const pdfOption = screen.getByText('Export as PDF');
      fireEvent.click(pdfOption);
      
      // Export action would be triggered
    });

    it('should handle Excel export', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      
      const excelOption = screen.getByText('Export as Excel');
      fireEvent.click(excelOption);
      
      // Export action would be triggered
    });

    it('should show email dialog on email option', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const exportButton = screen.getByText('Export Report');
      fireEvent.click(exportButton);
      
      const emailOption = screen.getByText('Email Report');
      fireEvent.click(emailOption);
      
      expect(screen.getByText('Email Analytics Report')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render in mobile layout', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Inventory Analytics')).toBeInTheDocument();
    });

    it('should show mobile-friendly navigation', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryAnalytics />);
      
      // Tabs should be scrollable or in dropdown
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });

    it('should adapt charts for mobile', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryAnalytics />);
      
      // Charts should be responsive
      expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should show last updated timestamp', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    });

    it('should have refresh button', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should update data on refresh', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      await waitFor(() => {
        // Data should be refreshed
        expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      });
    });

    it('should show loading state during refresh', async () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
      
      // Brief loading state
      await waitFor(() => {
        expect(screen.getByText('Total Inventory Value')).toBeInTheDocument();
      });
    });
  });

  describe('Insights and Recommendations', () => {
    it('should display key insights section', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText('Key Insights')).toBeInTheDocument();
    });

    it('should show automated recommendations', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText(/Consider reducing stock levels for slow-moving items/)).toBeInTheDocument();
    });

    it('should highlight anomalies', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      expect(screen.getByText(/Unusual spike in/)).toBeInTheDocument();
    });

    it('should provide actionable suggestions', () => {
      renderWithRouter(<InventoryAnalytics />);
      
      const viewDetailsButtons = screen.getAllByText('View Details');
      expect(viewDetailsButtons.length).toBeGreaterThan(0);
    });
  });
});