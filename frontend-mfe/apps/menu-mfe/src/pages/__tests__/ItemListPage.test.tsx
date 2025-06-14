import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ItemListPage from '../ItemListPage';

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Button: ({ children, variant, size, ...props }: { children: React.ReactNode; variant?: string; size?: string; [key: string]: any }) => (
    <button data-testid="button" data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
  StatusBadge: ({ children, status, variant }: { children: React.ReactNode; status?: string; variant?: string }) => (
    <span data-testid="status-badge" data-status={status} data-variant={variant}>
      {children}
    </span>
  ),
}));

describe('ItemListPage', () => {
  const renderItemListPage = () => {
    return render(
      <MemoryRouter>
        <ItemListPage />
      </MemoryRouter>
    );
  };

  describe('Page Structure', () => {
    it('should render the page title and description', () => {
      renderItemListPage();
      
      expect(screen.getByText('Menu Items')).toBeInTheDocument();
      expect(screen.getByText('Manage individual menu items')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderItemListPage();
      
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('Menu Items');
    });

    it('should render Add New Item button', () => {
      renderItemListPage();
      
      const addButton = screen.getByRole('link', { name: /add new item/i });
      expect(addButton).toBeInTheDocument();
      expect(addButton).toHaveAttribute('href', '/menu/items/new');
    });
  });

  describe('Filter Functionality', () => {
    it('should render all filter buttons', () => {
      renderItemListPage();
      
      expect(screen.getByRole('button', { name: /all items \(4\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /available \(3\)/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /unavailable \(1\)/i })).toBeInTheDocument();
    });

    it('should have "All Items" filter active by default', () => {
      renderItemListPage();
      
      const allItemsButton = screen.getByRole('button', { name: /all items \(4\)/i });
      expect(allItemsButton).toHaveClass('bg-primary-600', 'text-white');
    });

    it('should filter items when Available filter is clicked', async () => {
      const user = userEvent.setup();
      renderItemListPage();
      
      const availableButton = screen.getByRole('button', { name: /available \(3\)/i });
      await user.click(availableButton);
      
      // Should show only available items
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Beef Tenderloin')).toBeInTheDocument();
      expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument();
      
      // Button should be active
      expect(availableButton).toHaveClass('bg-primary-600', 'text-white');
    });

    it('should filter items when Unavailable filter is clicked', async () => {
      const user = userEvent.setup();
      renderItemListPage();
      
      const unavailableButton = screen.getByRole('button', { name: /unavailable \(1\)/i });
      await user.click(unavailableButton);
      
      // Should show only unavailable items
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.queryByText('Grilled Salmon')).not.toBeInTheDocument();
      expect(screen.queryByText('Caesar Salad')).not.toBeInTheDocument();
      expect(screen.queryByText('Beef Tenderloin')).not.toBeInTheDocument();
      
      // Button should be active
      expect(unavailableButton).toHaveClass('bg-primary-600', 'text-white');
    });

    it('should return to all items when All Items filter is clicked', async () => {
      const user = userEvent.setup();
      renderItemListPage();
      
      // First filter to available
      await user.click(screen.getByRole('button', { name: /available \(3\)/i }));
      
      // Then click All Items
      const allItemsButton = screen.getByRole('button', { name: /all items \(4\)/i });
      await user.click(allItemsButton);
      
      // Should show all items again
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.getByText('Beef Tenderloin')).toBeInTheDocument();
    });

    it('should update filter button styling correctly', async () => {
      const user = userEvent.setup();
      renderItemListPage();
      
      const allItemsButton = screen.getByRole('button', { name: /all items \(4\)/i });
      const availableButton = screen.getByRole('button', { name: /available \(3\)/i });
      
      // Initially, All Items should be active
      expect(allItemsButton).toHaveClass('bg-primary-600', 'text-white');
      expect(availableButton).toHaveClass('bg-neutral-100', 'text-neutral-700');
      
      // Click Available
      await user.click(availableButton);
      
      // Available should be active, All Items should be inactive
      expect(availableButton).toHaveClass('bg-primary-600', 'text-white');
      expect(allItemsButton).toHaveClass('bg-neutral-100', 'text-neutral-700');
    });
  });

  describe('Item Display', () => {
    it('should display all menu items by default', () => {
      renderItemListPage();
      
      // Check all mock items are displayed
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.getByText('Caesar Salad')).toBeInTheDocument();
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
      expect(screen.getByText('Beef Tenderloin')).toBeInTheDocument();
    });

    it('should display item details correctly', () => {
      renderItemListPage();
      
      // Check first item details
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.getByText('Main Course')).toBeInTheDocument();
      expect(screen.getByText('$24.99')).toBeInTheDocument();
    });

    it('should display item categories', () => {
      renderItemListPage();
      
      expect(screen.getByText('Main Course')).toBeInTheDocument();
      expect(screen.getByText('Appetizers')).toBeInTheDocument();
      expect(screen.getByText('Desserts')).toBeInTheDocument();
    });

    it('should display item prices with correct formatting', () => {
      renderItemListPage();
      
      expect(screen.getByText('$24.99')).toBeInTheDocument();
      expect(screen.getByText('$12.99')).toBeInTheDocument();
      expect(screen.getByText('$8.99')).toBeInTheDocument();
      expect(screen.getByText('$32.99')).toBeInTheDocument();
    });

    it('should use Card components for item display', () => {
      renderItemListPage();
      
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(4); // One for each mock item
    });

    it('should apply hover effects to item cards', () => {
      renderItemListPage();
      
      const cards = screen.getAllByTestId('card');
      cards.forEach(card => {
        expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
      });
    });
  });

  describe('Status Badges', () => {
    it('should display status badges for all items', () => {
      renderItemListPage();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges).toHaveLength(4);
    });

    it('should display correct status text', () => {
      renderItemListPage();
      
      // Should have 3 "Available" and 1 "Unavailable"
      const availableBadges = screen.getAllByText('Available');
      const unavailableBadges = screen.getAllByText('Unavailable');
      
      expect(availableBadges).toHaveLength(3);
      expect(unavailableBadges).toHaveLength(1);
    });

    it('should use correct status and variant props', () => {
      renderItemListPage();
      
      const statusBadges = screen.getAllByTestId('status-badge');
      
      // Find badges by their text content
      const availableBadges = statusBadges.filter(badge => 
        badge.textContent === 'Available'
      );
      const unavailableBadges = statusBadges.filter(badge => 
        badge.textContent === 'Unavailable'
      );
      
      // Check available badges
      availableBadges.forEach(badge => {
        expect(badge).toHaveAttribute('data-status', 'available');
        expect(badge).toHaveAttribute('data-variant', 'success');
      });
      
      // Check unavailable badges
      unavailableBadges.forEach(badge => {
        expect(badge).toHaveAttribute('data-status', 'unavailable');
        expect(badge).toHaveAttribute('data-variant', 'danger');
      });
    });
  });

  describe('Item Actions', () => {
    it('should display Edit buttons for all items', () => {
      renderItemListPage();
      
      const editButtons = screen.getAllByRole('link', { name: /edit/i });
      expect(editButtons).toHaveLength(4);
    });

    it('should have correct edit links', () => {
      renderItemListPage();
      
      const editButtons = screen.getAllByRole('link', { name: /edit/i });
      
      expect(editButtons[0]).toHaveAttribute('href', '/menu/items/edit/1');
      expect(editButtons[1]).toHaveAttribute('href', '/menu/items/edit/2');
      expect(editButtons[2]).toHaveAttribute('href', '/menu/items/edit/3');
      expect(editButtons[3]).toHaveAttribute('href', '/menu/items/edit/4');
    });

    it('should display Enable/Disable buttons based on availability', () => {
      renderItemListPage();
      
      const disableButtons = screen.getAllByRole('button', { name: /disable/i });
      const enableButtons = screen.getAllByRole('button', { name: /enable/i });
      
      expect(disableButtons).toHaveLength(3); // For available items
      expect(enableButtons).toHaveLength(1); // For unavailable items
    });

    it('should use correct button variants for Enable/Disable', () => {
      renderItemListPage();
      
      const buttons = screen.getAllByTestId('button');
      
      // Find disable and enable buttons
      const disableButtons = buttons.filter(btn => 
        btn.textContent === 'Disable'
      );
      const enableButtons = buttons.filter(btn => 
        btn.textContent === 'Enable'
      );
      
      // Disable buttons should be outline variant
      disableButtons.forEach(button => {
        expect(button).toHaveAttribute('data-variant', 'outline');
      });
      
      // Enable buttons should be success variant
      enableButtons.forEach(button => {
        expect(button).toHaveAttribute('data-variant', 'success');
      });
    });

    it('should use small size for action buttons', () => {
      renderItemListPage();
      
      const actionButtons = screen.getAllByTestId('button').filter(btn => 
        btn.textContent === 'Edit' || btn.textContent === 'Disable' || btn.textContent === 'Enable'
      );
      
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('data-size', 'sm');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive grid for items', () => {
      renderItemListPage();
      
      // Find the items grid container
      const itemsGrid = screen.getByText('Grilled Salmon').closest('.grid');
      expect(itemsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('should handle layout for different screen sizes', () => {
      renderItemListPage();
      
      // Header should be flexible
      const headerContainer = screen.getByText('Menu Items').closest('.flex');
      expect(headerContainer).toHaveClass('flex', 'items-center', 'justify-between');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderItemListPage();
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Menu Items');
    });

    it('should have accessible filter buttons', () => {
      renderItemListPage();
      
      const filterButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent?.includes('Items') || 
        btn.textContent?.includes('Available') || 
        btn.textContent?.includes('Unavailable')
      );
      
      filterButtons.forEach(button => {
        expect(button.textContent).toBeTruthy();
        expect(button).toBeEnabled();
      });
    });

    it('should have accessible action buttons', () => {
      renderItemListPage();
      
      const actionButtons = screen.getAllByRole('button').filter(btn => 
        btn.textContent === 'Disable' || btn.textContent === 'Enable'
      );
      
      actionButtons.forEach(button => {
        expect(button.textContent).toBeTruthy();
        expect(button).toBeEnabled();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderItemListPage();
      
      // Tab should move through interactive elements
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Integration with Shared Components', () => {
    it('should use shared UI components correctly', () => {
      renderItemListPage();
      
      // Should use Card, Button, and StatusBadge from shared UI
      expect(screen.getAllByTestId('card')).toHaveLength(4);
      expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      expect(screen.getAllByTestId('status-badge')).toHaveLength(4);
    });

    it('should pass correct props to shared components', () => {
      renderItemListPage();
      
      // Check Button component props
      const primaryButton = screen.getAllByTestId('button').find(btn => 
        btn.getAttribute('data-variant') === 'primary'
      );
      const outlineButtons = screen.getAllByTestId('button').filter(btn => 
        btn.getAttribute('data-variant') === 'outline'
      );
      
      expect(primaryButton).toBeInTheDocument();
      expect(outlineButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Data Handling', () => {
    it('should handle empty filter results gracefully', async () => {
      // This test would be more relevant with dynamic data
      // For now, we test that filter logic works with existing mock data
      const user = userEvent.setup();
      renderItemListPage();
      
      await user.click(screen.getByRole('button', { name: /unavailable \(1\)/i }));
      
      // Should show only the one unavailable item
      const cards = screen.getAllByTestId('card');
      expect(cards).toHaveLength(1);
    });

    it('should display correct item counts in filter buttons', () => {
      renderItemListPage();
      
      // Counts should match mock data
      expect(screen.getByText(/all items \(4\)/i)).toBeInTheDocument();
      expect(screen.getByText(/available \(3\)/i)).toBeInTheDocument();
      expect(screen.getByText(/unavailable \(1\)/i)).toBeInTheDocument();
    });
  });
});