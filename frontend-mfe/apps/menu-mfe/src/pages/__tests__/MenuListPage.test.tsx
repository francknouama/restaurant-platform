import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import MenuListPage from '../MenuListPage';

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
}));

describe('MenuListPage', () => {
  const renderMenuListPage = () => {
    return render(
      <MemoryRouter>
        <MenuListPage />
      </MemoryRouter>
    );
  };

  describe('Page Structure', () => {
    it('should render the page title and description', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Menu Management')).toBeInTheDocument();
      expect(screen.getByText('Manage your restaurant menus and items')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      renderMenuListPage();
      
      const mainTitle = screen.getByRole('heading', { level: 1 });
      expect(mainTitle).toHaveTextContent('Menu Management');
      
      const sectionTitle = screen.getByRole('heading', { level: 2 });
      expect(sectionTitle).toHaveTextContent('Current Menu');
    });

    it('should use proper semantic structure with containers', () => {
      renderMenuListPage();
      
      // Main container should have proper spacing classes
      const mainContainer = screen.getByText('Menu Management').closest('div');
      expect(mainContainer?.parentElement).toHaveClass('p-6', 'space-y-6');
    });
  });

  describe('Quick Stats Dashboard', () => {
    it('should display all four stat cards', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Active Menu')).toBeInTheDocument();
      expect(screen.getByText('Menu Items')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Available Items')).toBeInTheDocument();
    });

    it('should display correct stat values', () => {
      renderMenuListPage();
      
      // Check stat values
      expect(screen.getByText('1')).toBeInTheDocument(); // Active Menu
      expect(screen.getByText('24')).toBeInTheDocument(); // Menu Items
      expect(screen.getByText('6')).toBeInTheDocument(); // Categories
      expect(screen.getByText('22')).toBeInTheDocument(); // Available Items
    });

    it('should use Card components for stats', () => {
      renderMenuListPage();
      
      const cards = screen.getAllByTestId('card');
      // Should have 6 cards total: 4 stats + 1 current menu + 3 quick actions
      expect(cards).toHaveLength(6);
    });

    it('should apply correct styling to stat values', () => {
      renderMenuListPage();
      
      // Primary color for active menu count
      const activeMenuStat = screen.getByText('1');
      expect(activeMenuStat).toHaveClass('text-3xl', 'font-bold', 'text-primary-600');
      
      // Green color for available items
      const availableItemsStat = screen.getByText('22');
      expect(availableItemsStat).toHaveClass('text-3xl', 'font-bold', 'text-green-600');
    });
  });

  describe('Navigation Buttons', () => {
    it('should render all navigation buttons in header', () => {
      renderMenuListPage();
      
      const manageItemsLink = screen.getByRole('link', { name: /manage items/i });
      const categoriesLink = screen.getByRole('link', { name: /categories/i });
      const createMenuButton = screen.getByRole('button', { name: /create menu/i });
      
      expect(manageItemsLink).toBeInTheDocument();
      expect(categoriesLink).toBeInTheDocument();
      expect(createMenuButton).toBeInTheDocument();
    });

    it('should have correct links for navigation buttons', () => {
      renderMenuListPage();
      
      const manageItemsLink = screen.getByRole('link', { name: /manage items/i });
      const categoriesLink = screen.getByRole('link', { name: /categories/i });
      
      expect(manageItemsLink).toHaveAttribute('href', '/menu/items');
      expect(categoriesLink).toHaveAttribute('href', '/menu/categories');
    });

    it('should use correct button variants', () => {
      renderMenuListPage();
      
      const buttons = screen.getAllByTestId('button');
      
      // Find specific buttons by text content
      const manageItemsButton = buttons.find(button => 
        button.textContent?.includes('Manage Items')
      );
      const categoriesButton = buttons.find(button => 
        button.textContent?.includes('Categories')
      );
      const createMenuButton = buttons.find(button => 
        button.textContent?.includes('Create Menu')
      );
      
      expect(manageItemsButton).toHaveAttribute('data-variant', 'outline');
      expect(categoriesButton).toHaveAttribute('data-variant', 'outline');
      expect(createMenuButton).toHaveAttribute('data-variant', 'primary');
    });
  });

  describe('Current Menu Section', () => {
    it('should display current menu information', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Current Menu')).toBeInTheDocument();
      expect(screen.getByText('Spring Menu 2024')).toBeInTheDocument();
      expect(screen.getByText('Active since March 1, 2024')).toBeInTheDocument();
    });

    it('should show menu status and item count', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('24 items')).toBeInTheDocument();
    });

    it('should display menu action buttons', () => {
      renderMenuListPage();
      
      const editLink = screen.getByRole('link', { name: /edit/i });
      const previewLink = screen.getByRole('link', { name: /preview/i });
      
      expect(editLink).toBeInTheDocument();
      expect(previewLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute('href', '/menu/edit/current');
      expect(previewLink).toHaveAttribute('href', '/menu/preview/current');
    });

    it('should style status badge correctly', () => {
      renderMenuListPage();
      
      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveClass(
        'inline-flex',
        'items-center', 
        'px-2.5',
        'py-0.5',
        'rounded-full',
        'text-xs',
        'font-medium',
        'bg-green-100',
        'text-green-800'
      );
    });
  });

  describe('Quick Actions Section', () => {
    it('should display all three quick action cards', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Manage Items')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should display action descriptions', () => {
      renderMenuListPage();
      
      expect(screen.getByText('Add, edit, or remove menu items')).toBeInTheDocument();
      expect(screen.getByText('Organize menu categories')).toBeInTheDocument();
      expect(screen.getByText('View menu performance')).toBeInTheDocument();
    });

    it('should display action icons/emojis', () => {
      renderMenuListPage();
      
      expect(screen.getByText('📋')).toBeInTheDocument(); // Items
      expect(screen.getByText('🏷️')).toBeInTheDocument(); // Categories
      expect(screen.getByText('📊')).toBeInTheDocument(); // Analytics
    });

    it('should have correct navigation links for quick actions', () => {
      renderMenuListPage();
      
      // Get all links that contain the action texts
      const itemsActionLink = screen.getByRole('link', { name: /manage items.*add, edit, or remove menu items/i });
      const categoriesActionLink = screen.getByRole('link', { name: /categories.*organize menu categories/i });
      const analyticsActionLink = screen.getByRole('link', { name: /analytics.*view menu performance/i });
      
      expect(itemsActionLink).toHaveAttribute('href', '/menu/items');
      expect(categoriesActionLink).toHaveAttribute('href', '/menu/categories');
      expect(analyticsActionLink).toHaveAttribute('href', '/menu/analytics');
    });

    it('should apply hover effects to action cards', () => {
      renderMenuListPage();
      
      const cards = screen.getAllByTestId('card');
      // Last 3 cards should be the quick action cards
      const quickActionCards = cards.slice(-3);
      
      quickActionCards.forEach(card => {
        expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow', 'cursor-pointer');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should use responsive grid classes for stats', () => {
      renderMenuListPage();
      
      // Stats container should have responsive grid
      const statsSection = screen.getByText('Active Menu').closest('.grid');
      expect(statsSection).toHaveClass('grid-cols-1', 'md:grid-cols-4');
    });

    it('should use responsive grid classes for quick actions', () => {
      renderMenuListPage();
      
      // Quick actions container should have responsive grid
      const quickActionsSection = screen.getByText('📋').closest('.grid');
      expect(quickActionsSection).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });

    it('should handle button layout responsively', () => {
      renderMenuListPage();
      
      // Header buttons should be in a flex container
      const buttonContainer = screen.getByRole('button', { name: /create menu/i }).closest('.flex');
      expect(buttonContainer).toHaveClass('flex', 'space-x-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderMenuListPage();
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3s = screen.getAllByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3s).toHaveLength(4); // Menu title + 3 quick actions
    });

    it('should have accessible link text', () => {
      renderMenuListPage();
      
      // All links should have descriptive text
      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
        expect(link.textContent).toBeTruthy();
      });
    });

    it('should maintain color contrast for status indicators', () => {
      renderMenuListPage();
      
      // Status badge should have good contrast
      const statusBadge = screen.getByText('Active');
      expect(statusBadge).toHaveClass('text-green-800'); // Dark text on light background
    });
  });

  describe('Integration with Shared Components', () => {
    it('should use Card components from shared UI', () => {
      renderMenuListPage();
      
      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should use Button components from shared UI', () => {
      renderMenuListPage();
      
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should pass correct props to shared components', () => {
      renderMenuListPage();
      
      // Check that button variants are passed correctly
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

  describe('User Interactions', () => {
    it('should handle click events on buttons', async () => {
      const user = userEvent.setup();
      renderMenuListPage();
      
      const createMenuButton = screen.getByRole('button', { name: /create menu/i });
      
      // Should be clickable without errors
      await expect(user.click(createMenuButton)).resolves.not.toThrow();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderMenuListPage();
      
      // Tab through interactive elements
      await user.tab();
      
      // Should focus on first interactive element
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  describe('Layout and Styling', () => {
    it('should use consistent spacing', () => {
      renderMenuListPage();
      
      // Main container spacing
      const mainContainer = screen.getByText('Menu Management').closest('.space-y-6');
      expect(mainContainer).toHaveClass('p-6', 'space-y-6');
    });

    it('should apply proper text styling', () => {
      renderMenuListPage();
      
      const title = screen.getByText('Menu Management');
      expect(title).toHaveClass('text-3xl', 'font-bold', 'text-neutral-900');
      
      const subtitle = screen.getByText('Manage your restaurant menus and items');
      expect(subtitle).toHaveClass('mt-2', 'text-neutral-600');
    });
  });
});