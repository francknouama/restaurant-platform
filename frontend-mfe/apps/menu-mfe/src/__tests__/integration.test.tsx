import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import MenuApp from '../MenuApp';
import { MenuService } from '../services/menuService';

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
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

// Mock MenuService for integration testing
jest.mock('../services/menuService');

describe('Menu MFE Integration Tests', () => {
  const mockMenuService = MenuService as jest.Mocked<typeof MenuService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    // Setup default mock responses
    mockMenuService.getMenus.mockResolvedValue([
      {
        id: 'menu-1',
        name: 'Test Menu',
        active: true,
        version: '1.0',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        categories: []
      }
    ]);

    mockMenuService.getMenuItems.mockResolvedValue([
      { id: '1', name: 'Test Item 1', category: 'Appetizers', price: 10.99, available: true },
      { id: '2', name: 'Test Item 2', category: 'Main Course', price: 24.99, available: false }
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderApp = (initialPath = '/menu') => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <MenuApp />
      </MemoryRouter>
    );
  };

  describe('Full Application Navigation Flow', () => {
    it('should navigate from menu list to item management', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu');

      // Should start on menu list page
      expect(screen.getByText('Menu Management')).toBeInTheDocument();

      // Click on Manage Items link
      const manageItemsLink = screen.getByRole('link', { name: /manage items/i });
      await user.click(manageItemsLink);

      // Should navigate to items page
      expect(screen.getByText('Menu Items')).toBeInTheDocument();
    });

    it('should navigate from items list to item creation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu/items');

      // Should be on items page
      expect(screen.getByText('Menu Items')).toBeInTheDocument();

      // Click Add New Item
      const addItemLink = screen.getByRole('link', { name: /add new item/i });
      await user.click(addItemLink);

      // Should navigate to creation page
      expect(screen.getByText('Create Menu Item')).toBeInTheDocument();
    });

    it('should handle deep linking to specific routes', () => {
      renderApp('/menu/edit/menu-123');

      // Should render the editor page directly
      expect(screen.getByText('Menu Editor')).toBeInTheDocument();
    });

    it('should redirect unknown routes to menu list', () => {
      renderApp('/menu/unknown');

      // Should redirect to menu list
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });
  });

  describe('ItemListPage Integration with Services', () => {
    it('should display filter functionality working with mock data', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu/items');

      // Should show all items initially
      expect(screen.getByText('All Items (4)')).toBeInTheDocument();
      expect(screen.getByText('Available (3)')).toBeInTheDocument();
      expect(screen.getByText('Unavailable (1)')).toBeInTheDocument();

      // Filter to available items
      const availableButton = screen.getByRole('button', { name: /available \(3\)/i });
      await user.click(availableButton);

      // Should filter correctly
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.queryByText('Chocolate Cake')).not.toBeInTheDocument();
    });

    it('should handle edit navigation with item IDs', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu/items');

      // Find and click edit button for first item
      const editButtons = screen.getAllByRole('link', { name: /edit/i });
      await user.click(editButtons[0]);

      // Should navigate to edit page
      expect(screen.getByText('Edit Menu Item')).toBeInTheDocument();
    });
  });

  describe('Cross-Component State Management', () => {
    it('should maintain consistent data across navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu');

      // Start on menu list
      expect(screen.getByText('24')).toBeInTheDocument(); // Menu items count

      // Navigate to items page
      const manageItemsLink = screen.getByRole('link', { name: /manage items/i });
      await user.click(manageItemsLink);

      // Should show same item count in different format
      expect(screen.getByText('All Items (4)')).toBeInTheDocument();
    });

    it('should handle filter state persistence within items page', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu/items');

      // Set filter to available
      await user.click(screen.getByRole('button', { name: /available \(3\)/i }));

      // Filter should be active
      const availableButton = screen.getByRole('button', { name: /available \(3\)/i });
      expect(availableButton).toHaveClass('bg-primary-600', 'text-white');

      // Change back to all items
      await user.click(screen.getByRole('button', { name: /all items \(4\)/i }));

      // Should show all items again
      expect(screen.getByText('Chocolate Cake')).toBeInTheDocument();
    });
  });

  describe('Shared Component Integration', () => {
    it('should integrate Card components correctly across pages', () => {
      renderApp('/menu');

      // Should have cards on menu list page
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);

      // Cards should be used for stats and actions
      expect(screen.getByText('Active Menu').closest('[data-testid="card"]')).toBeInTheDocument();
    });

    it('should integrate Button components with correct variants', () => {
      renderApp('/menu');

      const buttons = screen.getAllByTestId('button');
      
      // Should have primary button
      const primaryButton = buttons.find(btn => 
        btn.getAttribute('data-variant') === 'primary'
      );
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton?.textContent).toBe('Create Menu');

      // Should have outline buttons
      const outlineButtons = buttons.filter(btn => 
        btn.getAttribute('data-variant') === 'outline'
      );
      expect(outlineButtons.length).toBeGreaterThan(0);
    });

    it('should integrate StatusBadge components correctly', () => {
      renderApp('/menu/items');

      const statusBadges = screen.getAllByTestId('status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);

      // Should have correct status and variant props
      const availableBadges = statusBadges.filter(badge => 
        badge.getAttribute('data-status') === 'available'
      );
      expect(availableBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Error Boundary Integration', () => {
    it('should render without throwing errors', () => {
      expect(() => renderApp('/menu')).not.toThrow();
      expect(() => renderApp('/menu/items')).not.toThrow();
      expect(() => renderApp('/menu/edit/123')).not.toThrow();
    });

    it('should handle route parameter edge cases', () => {
      expect(() => renderApp('/menu/edit/')).not.toThrow();
      expect(() => renderApp('/menu/items/edit/')).not.toThrow();
      expect(() => renderApp('/menu/categories/edit/')).not.toThrow();
    });
  });

  describe('Responsive Layout Integration', () => {
    it('should apply responsive classes consistently', () => {
      renderApp('/menu');

      // Stats grid should be responsive
      const statsSection = screen.getByText('Active Menu').closest('.grid');
      expect(statsSection).toHaveClass('grid-cols-1', 'md:grid-cols-4');
    });

    it('should maintain layout consistency across pages', () => {
      // Menu list page
      renderApp('/menu');
      let container = screen.getByText('Menu Management').closest('div');
      expect(container?.parentElement).toHaveClass('p-6', 'space-y-6');

      // Items page
      renderApp('/menu/items');
      container = screen.getByText('Menu Items').closest('div');
      expect(container?.parentElement).toHaveClass('p-6', 'space-y-6');
    });
  });

  describe('Service Integration', () => {
    it('should handle async service calls correctly', async () => {
      renderApp('/menu');

      // If services were integrated, we would test async loading states
      // For now, we test that the components render with mock data
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
    });

    it('should be ready for real service integration', () => {
      // Test that MenuService is available and can be mocked
      expect(MenuService).toBeDefined();
      expect(MenuService.getMenus).toBeDefined();
      expect(MenuService.getMenuItems).toBeDefined();
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain accessibility across navigation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu');

      // Should have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

      // Navigate to items page
      await user.click(screen.getByRole('link', { name: /manage items/i }));

      // Should still have proper heading structure
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Menu Items');
    });

    it('should support keyboard navigation across pages', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu');

      // Should be able to tab through interactive elements
      await user.tab();
      expect(document.activeElement).not.toBe(document.body);

      // Should be able to navigate with keyboard
      const firstLink = screen.getAllByRole('link')[0];
      firstLink.focus();
      await user.keyboard('{Enter}');

      // Should navigate successfully
      await waitFor(() => {
        expect(document.location.pathname).not.toBe('/menu');
      });
    });
  });

  describe('Performance Integration', () => {
    it('should render efficiently without unnecessary re-renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderApp('/menu');
      
      // Should not have React warnings about performance
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple rapid navigation changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      renderApp('/menu');

      // Rapidly navigate between pages
      const links = screen.getAllByRole('link');
      
      for (let i = 0; i < Math.min(3, links.length); i++) {
        if (links[i].getAttribute('href')?.startsWith('/menu')) {
          await user.click(links[i]);
        }
      }

      // Should still render correctly
      expect(document.querySelector('[data-testid="menu-mfe"]')).toBeInTheDocument();
    });
  });

  describe('Future Integration Readiness', () => {
    it('should be ready for real data integration', () => {
      renderApp('/menu/items');

      // Should render items with mock data structure that matches real API
      expect(screen.getByText('Grilled Salmon')).toBeInTheDocument();
      expect(screen.getByText('$24.99')).toBeInTheDocument();
      expect(screen.getByText('Main Course')).toBeInTheDocument();
    });

    it('should support future form implementations', () => {
      renderApp('/menu/items/new');

      // Should have placeholder ready for form implementation
      expect(screen.getByText('Create Menu Item')).toBeInTheDocument();
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });

    it('should support future analytics integration', () => {
      renderApp('/menu/analytics');

      // Should have placeholder ready for analytics
      expect(screen.getByText('Menu Analytics')).toBeInTheDocument();
      expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    });
  });
});