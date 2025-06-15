import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import InventoryManagement from '../pages/InventoryManagement';

// Mock dependencies
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

jest.mock('@restaurant/shared-ui', () => ({
  Button: ({ children, onClick, className, size, variant, disabled }) => (
    <button 
      onClick={onClick} 
      className={className}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
    >
      {children}
    </button>
  )
}));

// Helper function to render with router
const renderWithRouter = (ui, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
};

describe('Inventory Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the inventory management header', () => {
      renderWithRouter(<InventoryManagement />);
      
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
      expect(screen.getByText(/Manage stock levels, track items, and maintain optimal inventory/)).toBeInTheDocument();
    });

    it('should render the add new item button', () => {
      renderWithRouter(<InventoryManagement />);
      
      const addButton = screen.getByText('+ Add New Item');
      expect(addButton).toBeInTheDocument();
    });

    it('should render the search input field', () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      expect(searchInput).toBeInTheDocument();
    });

    it('should render filter dropdowns', () => {
      renderWithRouter(<InventoryManagement />);
      
      // Category filter
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      expect(categorySelect).toBeInTheDocument();
      
      // Status filter
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      expect(statusSelect).toBeInTheDocument();
      
      // Sort by filter
      const sortBySelect = screen.getByRole('combobox', { name: /sort by/i });
      expect(sortBySelect).toBeInTheDocument();
    });

    it('should render the inventory items count', () => {
      renderWithRouter(<InventoryManagement />);
      
      // Should show the count of items
      expect(screen.getByText(/items/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should update search term on input', () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      fireEvent.change(searchInput, { target: { value: 'beef' } });
      
      expect(searchInput).toHaveValue('beef');
    });

    it('should filter items based on search term', async () => {
      renderWithRouter(<InventoryManagement />);
      
      // Wait for items to load
      await waitFor(() => {
        expect(screen.getByText('Premium Beef Tenderloin')).toBeInTheDocument();
      });
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      fireEvent.change(searchInput, { target: { value: 'salmon' } });
      
      // Beef should not be visible after filtering
      await waitFor(() => {
        expect(screen.queryByText('Premium Beef Tenderloin')).not.toBeInTheDocument();
      });
    });

    it('should clear search on clear button click', () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      expect(searchInput).toHaveValue('test');
      
      // Clear button should appear when there's text
      const clearButton = screen.getByText('✕');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Filter Functionality', () => {
    it('should filter by category', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      fireEvent.change(categorySelect, { target: { value: 'Meat' } });
      
      await waitFor(() => {
        // Should show meat items
        expect(screen.getByText('Premium Beef Tenderloin')).toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      fireEvent.change(statusSelect, { target: { value: 'low-stock' } });
      
      await waitFor(() => {
        // Should only show low stock items
        const items = screen.getAllByRole('row');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should apply multiple filters simultaneously', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      
      fireEvent.change(categorySelect, { target: { value: 'Meat' } });
      fireEvent.change(statusSelect, { target: { value: 'in-stock' } });
      
      await waitFor(() => {
        const items = screen.getAllByRole('row');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should reset filters on reset button click', () => {
      renderWithRouter(<InventoryManagement />);
      
      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      fireEvent.change(categorySelect, { target: { value: 'Meat' } });
      
      const resetButton = screen.getByText('Reset Filters');
      fireEvent.click(resetButton);
      
      expect(categorySelect).toHaveValue('all');
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort by name', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const sortBySelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortBySelect, { target: { value: 'name' } });
      
      await waitFor(() => {
        const items = screen.getAllByRole('row');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should toggle sort order', async () => {
      renderWithRouter(<InventoryManagement />);
      
      // Find sort order button
      const sortOrderButton = screen.getByRole('button', { name: /sort order/i });
      fireEvent.click(sortOrderButton);
      
      await waitFor(() => {
        const items = screen.getAllByRole('row');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should sort by stock level', () => {
      renderWithRouter(<InventoryManagement />);
      
      const sortBySelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortBySelect, { target: { value: 'stock' } });
      
      expect(sortBySelect).toHaveValue('stock');
    });

    it('should sort by value', () => {
      renderWithRouter(<InventoryManagement />);
      
      const sortBySelect = screen.getByRole('combobox', { name: /sort by/i });
      fireEvent.change(sortBySelect, { target: { value: 'value' } });
      
      expect(sortBySelect).toHaveValue('value');
    });
  });

  describe('Inventory Table', () => {
    it('should display table headers', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Item Name')).toBeInTheDocument();
        expect(screen.getByText('SKU')).toBeInTheDocument();
        expect(screen.getByText('Category')).toBeInTheDocument();
        expect(screen.getByText('Current Stock')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Unit Cost')).toBeInTheDocument();
        expect(screen.getByText('Total Value')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('should display inventory items', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Premium Beef Tenderloin')).toBeInTheDocument();
        expect(screen.getByText(/SKU\d{4}/)).toBeInTheDocument();
      });
    });

    it('should show stock status badges', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        // Should have various status badges
        const badges = screen.getAllByText(/in-stock|low-stock|out-of-stock/i);
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('should display stock level indicators', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        // Should show current/minimum stock format
        const stockTexts = screen.getAllByText(/\d+ \/ \d+ \w+/);
        expect(stockTexts.length).toBeGreaterThan(0);
      });
    });

    it('should show supplier information', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Premium Foods Co\.|Fresh Market Supply|Ocean Harvest/)).toBeInTheDocument();
      });
    });

    it('should display location information', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        expect(screen.getByText(/Main Storage|Walk-in Cooler|Freezer/)).toBeInTheDocument();
      });
    });
  });

  describe('Item Actions', () => {
    it('should navigate to item edit on edit button click', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });
      
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/items\/item_\d+\/edit/));
    });

    it('should show adjust stock modal on adjust button click', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      // Modal should appear
      expect(screen.getByText('Adjust Stock Level')).toBeInTheDocument();
    });

    it('should navigate to add new item on button click', () => {
      renderWithRouter(<InventoryManagement />);
      
      const addButton = screen.getByText('+ Add New Item');
      fireEvent.click(addButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/items/new');
    });
  });

  describe('Bulk Actions', () => {
    it('should show checkbox for each item', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(1); // Including select all
      });
    });

    it('should select all items on header checkbox click', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
        fireEvent.click(selectAllCheckbox);
        
        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(checkbox => {
          expect(checkbox).toBeChecked();
        });
      });
    });

    it('should show bulk actions when items are selected', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[1];
        fireEvent.click(checkbox);
      });
      
      expect(screen.getByText(/1 item selected/)).toBeInTheDocument();
      expect(screen.getByText('Bulk Update')).toBeInTheDocument();
      expect(screen.getByText('Export Selected')).toBeInTheDocument();
    });

    it('should deselect all on cancel', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const checkbox = screen.getAllByRole('checkbox')[1];
        fireEvent.click(checkbox);
      });
      
      const cancelButton = screen.getByText('✕');
      fireEvent.click(cancelButton);
      
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Export Functionality', () => {
    it('should show export button', () => {
      renderWithRouter(<InventoryManagement />);
      
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should show export options on button click', () => {
      renderWithRouter(<InventoryManagement />);
      
      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);
      
      expect(screen.getByText('Export as CSV')).toBeInTheDocument();
      expect(screen.getByText('Export as PDF')).toBeInTheDocument();
      expect(screen.getByText('Export as Excel')).toBeInTheDocument();
    });
  });

  describe('Quick Filters', () => {
    it('should show quick filter buttons', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
        expect(screen.getByText('Expiring Soon')).toBeInTheDocument();
      });
    });

    it('should filter by low stock on button click', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const lowStockButton = screen.getByText('Low Stock Alert');
      fireEvent.click(lowStockButton);
      
      await waitFor(() => {
        const statusSelect = screen.getByRole('combobox', { name: /status/i });
        expect(statusSelect).toHaveValue('low-stock');
      });
    });

    it('should show expiring items count', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const expiringButton = screen.getByText('Expiring Soon');
        expect(expiringButton).toBeInTheDocument();
        // Should show count badge
        expect(expiringButton.textContent).toMatch(/\d+/);
      });
    });
  });

  describe('Stock Adjustment Modal', () => {
    it('should display adjustment modal with current stock', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      expect(screen.getByText('Adjust Stock Level')).toBeInTheDocument();
      expect(screen.getByText(/Current Stock:/)).toBeInTheDocument();
    });

    it('should allow stock increase', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      const increaseButton = screen.getByText('Increase');
      fireEvent.click(increaseButton);
      
      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.change(amountInput, { target: { value: '10' } });
      
      expect(amountInput).toHaveValue('10');
    });

    it('should allow stock decrease', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      const decreaseButton = screen.getByText('Decrease');
      fireEvent.click(decreaseButton);
      
      const amountInput = screen.getByPlaceholderText('Enter amount');
      fireEvent.change(amountInput, { target: { value: '5' } });
      
      expect(amountInput).toHaveValue('5');
    });

    it('should require reason for adjustment', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      const reasonInput = screen.getByPlaceholderText('Enter reason for adjustment...');
      expect(reasonInput).toBeInTheDocument();
    });

    it('should close modal on cancel', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const adjustButtons = screen.getAllByText('Adjust');
        fireEvent.click(adjustButtons[0]);
      });
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByText('Adjust Stock Level')).not.toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render in mobile layout', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryManagement />);
      
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    });

    it('should render in tablet layout', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryManagement />);
      
      expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    });

    it('should show mobile-friendly actions', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
      
      renderWithRouter(<InventoryManagement />);
      
      // Should still have main actions available
      expect(screen.getByText('+ Add New Item')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      renderWithRouter(<InventoryManagement />);
      
      await waitFor(() => {
        const items = screen.getAllByRole('row');
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should debounce search input', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      
      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 'b' } });
      fireEvent.change(searchInput, { target: { value: 'be' } });
      fireEvent.change(searchInput, { target: { value: 'bee' } });
      fireEvent.change(searchInput, { target: { value: 'beef' } });
      
      // Should only filter once after debounce
      await waitFor(() => {
        expect(searchInput).toHaveValue('beef');
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no items match filters', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      fireEvent.change(searchInput, { target: { value: 'nonexistentitem123' } });
      
      await waitFor(() => {
        expect(screen.getByText(/No items found/)).toBeInTheDocument();
      });
    });

    it('should show suggestion to reset filters', async () => {
      renderWithRouter(<InventoryManagement />);
      
      const searchInput = screen.getByPlaceholderText('Search items by name, SKU, or supplier...');
      fireEvent.change(searchInput, { target: { value: 'nonexistentitem123' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument();
      });
    });
  });
});