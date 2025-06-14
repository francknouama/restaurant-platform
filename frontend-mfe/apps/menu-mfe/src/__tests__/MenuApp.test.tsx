import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuApp from '../MenuApp';

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  ErrorBoundary: ({ children, mfeName }: { children: React.ReactNode; mfeName: string }) => (
    <div data-testid="error-boundary" data-mfe-name={mfeName}>
      {children}
    </div>
  ),
}));

// Mock all page components to focus on app-level functionality
jest.mock('../pages/MenuListPage', () => {
  return function MenuListPage() {
    return <div data-testid="menu-list-page">Menu List Page</div>;
  };
});

jest.mock('../pages/MenuEditorPage', () => {
  return function MenuEditorPage() {
    return <div data-testid="menu-editor-page">Menu Editor Page</div>;
  };
});

jest.mock('../pages/ItemListPage', () => {
  return function ItemListPage() {
    return <div data-testid="item-list-page">Item List Page</div>;
  };
});

jest.mock('../pages/ItemCreationPage', () => {
  return function ItemCreationPage() {
    return <div data-testid="item-creation-page">Item Creation Page</div>;
  };
});

jest.mock('../pages/CategoryListPage', () => {
  return function CategoryListPage() {
    return <div data-testid="category-list-page">Category List Page</div>;
  };
});

jest.mock('../pages/MenuAnalyticsPage', () => {
  return function MenuAnalyticsPage() {
    return <div data-testid="menu-analytics-page">Menu Analytics Page</div>;
  };
});

// Mock other page components
jest.mock('../pages/MenuPreviewPage', () => () => <div data-testid="menu-preview-page">Preview</div>);
jest.mock('../pages/ItemEditorPage', () => () => <div data-testid="item-editor-page">Item Editor</div>);
jest.mock('../pages/CategoryEditorPage', () => () => <div data-testid="category-editor-page">Category Editor</div>);

describe('MenuApp', () => {
  const renderMenuApp = (basePath?: string, initialEntries?: string[]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries || ['/menu']}>
        <MenuApp basePath={basePath} />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    // Reset window location mock
    delete (window as any).location;
    (window as any).location = { pathname: '/menu' };
  });

  describe('Component Structure', () => {
    it('should render the MenuApp with correct structure', () => {
      renderMenuApp();
      
      expect(screen.getByTestId('menu-mfe')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('should wrap content in ErrorBoundary with correct MFE name', () => {
      renderMenuApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Menu MFE');
    });

    it('should have menu-mfe CSS class', () => {
      renderMenuApp();
      
      const menuMfe = screen.getByTestId('menu-mfe');
      expect(menuMfe).toHaveClass('menu-mfe');
    });
  });

  describe('Routing Configuration', () => {
    it('should render MenuListPage on /menu route', () => {
      renderMenuApp('/menu', ['/menu']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });

    it('should redirect from root to /menu', () => {
      renderMenuApp('/menu', ['/']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });

    it('should render MenuEditorPage on edit route', () => {
      renderMenuApp('/menu', ['/menu/edit/123']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should render ItemListPage on items route', () => {
      renderMenuApp('/menu', ['/menu/items']);
      
      expect(screen.getByTestId('item-list-page')).toBeInTheDocument();
    });

    it('should render ItemCreationPage on new item route', () => {
      renderMenuApp('/menu', ['/menu/items/new']);
      
      expect(screen.getByTestId('item-creation-page')).toBeInTheDocument();
    });

    it('should render CategoryListPage on categories route', () => {
      renderMenuApp('/menu', ['/menu/categories']);
      
      expect(screen.getByTestId('category-list-page')).toBeInTheDocument();
    });

    it('should render MenuAnalyticsPage on analytics route', () => {
      renderMenuApp('/menu', ['/menu/analytics']);
      
      expect(screen.getByTestId('menu-analytics-page')).toBeInTheDocument();
    });

    it('should redirect unknown routes to menu list', () => {
      renderMenuApp('/menu', ['/menu/unknown-route']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });
  });

  describe('Base Path Configuration', () => {
    it('should use default base path when not provided', () => {
      renderMenuApp();
      
      // Should render without errors with default '/menu' base path
      expect(screen.getByTestId('menu-mfe')).toBeInTheDocument();
    });

    it('should accept custom base path', () => {
      renderMenuApp('/custom-menu');
      
      // Should render without errors with custom base path
      expect(screen.getByTestId('menu-mfe')).toBeInTheDocument();
    });
  });

  describe('Standalone vs Shell Mode', () => {
    it('should handle standalone mode when window location starts with /menu', () => {
      // Mock window location for standalone mode
      (window as any).location = { pathname: '/menu/items' };
      
      renderMenuApp();
      
      expect(screen.getByTestId('menu-mfe')).toBeInTheDocument();
    });

    it('should handle shell mode when window location does not start with /menu', () => {
      // Mock window location for shell mode
      (window as any).location = { pathname: '/dashboard/menu' };
      
      renderMenuApp();
      
      expect(screen.getByTestId('menu-mfe')).toBeInTheDocument();
    });

    it('should handle server-side rendering when window is undefined', () => {
      // Mock undefined window
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        renderMenuApp();
      }).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Route Parameters', () => {
    it('should handle menu ID parameter in edit route', () => {
      renderMenuApp('/menu', ['/menu/edit/menu-123']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should handle item ID parameter in item edit route', () => {
      renderMenuApp('/menu', ['/menu/items/edit/item-456']);
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });

    it('should handle category ID parameter in category edit route', () => {
      renderMenuApp('/menu', ['/menu/categories/edit/category-789']);
      
      expect(screen.getByTestId('category-editor-page')).toBeInTheDocument();
    });

    it('should handle menu ID parameter in preview route', () => {
      renderMenuApp('/menu', ['/menu/preview/menu-preview-123']);
      
      expect(screen.getByTestId('menu-preview-page')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error boundary around all content', () => {
      renderMenuApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      const menuMfe = screen.getByTestId('menu-mfe');
      
      expect(errorBoundary).toContainElement(menuMfe);
    });

    it('should pass correct mfeName to ErrorBoundary', () => {
      renderMenuApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Menu MFE');
    });
  });

  describe('Integration with Shared Packages', () => {
    it('should import and use ErrorBoundary from @restaurant/shared-ui', () => {
      renderMenuApp();
      
      // ErrorBoundary should be rendered (mocked in this test)
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('should maintain testid for integration testing', () => {
      renderMenuApp();
      
      const menuMfe = screen.getByTestId('menu-mfe');
      expect(menuMfe).toBeInTheDocument();
      expect(menuMfe).toHaveAttribute('data-testid', 'menu-mfe');
    });
  });

  describe('Navigation Flow', () => {
    it('should support navigation between different pages', () => {
      const { rerender } = renderMenuApp('/menu', ['/menu']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
      
      // Simulate navigation to items page
      rerender(
        <MemoryRouter initialEntries={['/menu/items']}>
          <MenuApp basePath="/menu" />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('item-list-page')).toBeInTheDocument();
    });

    it('should support deep linking to specific routes', () => {
      renderMenuApp('/menu', ['/menu/items/edit/item-123']);
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });
  });
});