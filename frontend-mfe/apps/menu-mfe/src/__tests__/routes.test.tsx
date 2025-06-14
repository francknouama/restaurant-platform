import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuRoutes from '../routes';

// Mock all page components
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

jest.mock('../pages/MenuPreviewPage', () => {
  return function MenuPreviewPage() {
    return <div data-testid="menu-preview-page">Menu Preview Page</div>;
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

jest.mock('../pages/ItemEditorPage', () => {
  return function ItemEditorPage() {
    return <div data-testid="item-editor-page">Item Editor Page</div>;
  };
});

jest.mock('../pages/CategoryListPage', () => {
  return function CategoryListPage() {
    return <div data-testid="category-list-page">Category List Page</div>;
  };
});

jest.mock('../pages/CategoryEditorPage', () => {
  return function CategoryEditorPage() {
    return <div data-testid="category-editor-page">Category Editor Page</div>;
  };
});

jest.mock('../pages/MenuAnalyticsPage', () => {
  return function MenuAnalyticsPage() {
    return <div data-testid="menu-analytics-page">Menu Analytics Page</div>;
  };
});

describe('MenuRoutes', () => {
  const renderWithRouter = (initialEntries: string[]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <MenuRoutes />
      </MemoryRouter>
    );
  };

  describe('Default Routes', () => {
    it('should redirect from root "/" to "/menu"', () => {
      renderWithRouter(['/']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });

    it('should render MenuListPage on "/menu" route', () => {
      renderWithRouter(['/menu']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });
  });

  describe('Menu Management Routes', () => {
    it('should render MenuEditorPage on "/menu/edit/:menuId" route', () => {
      renderWithRouter(['/menu/edit/menu-123']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should render MenuPreviewPage on "/menu/preview/:menuId" route', () => {
      renderWithRouter(['/menu/preview/menu-456']);
      
      expect(screen.getByTestId('menu-preview-page')).toBeInTheDocument();
    });

    it('should handle different menu IDs in edit route', () => {
      renderWithRouter(['/menu/edit/another-menu-id']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should handle different menu IDs in preview route', () => {
      renderWithRouter(['/menu/preview/preview-menu-789']);
      
      expect(screen.getByTestId('menu-preview-page')).toBeInTheDocument();
    });
  });

  describe('Item Management Routes', () => {
    it('should render ItemListPage on "/menu/items" route', () => {
      renderWithRouter(['/menu/items']);
      
      expect(screen.getByTestId('item-list-page')).toBeInTheDocument();
    });

    it('should render ItemCreationPage on "/menu/items/new" route', () => {
      renderWithRouter(['/menu/items/new']);
      
      expect(screen.getByTestId('item-creation-page')).toBeInTheDocument();
    });

    it('should render ItemEditorPage on "/menu/items/edit/:itemId" route', () => {
      renderWithRouter(['/menu/items/edit/item-123']);
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });

    it('should handle different item IDs in edit route', () => {
      renderWithRouter(['/menu/items/edit/special-item-456']);
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });
  });

  describe('Category Management Routes', () => {
    it('should render CategoryListPage on "/menu/categories" route', () => {
      renderWithRouter(['/menu/categories']);
      
      expect(screen.getByTestId('category-list-page')).toBeInTheDocument();
    });

    it('should render CategoryEditorPage on "/menu/categories/edit/:categoryId" route', () => {
      renderWithRouter(['/menu/categories/edit/category-123']);
      
      expect(screen.getByTestId('category-editor-page')).toBeInTheDocument();
    });

    it('should handle different category IDs in edit route', () => {
      renderWithRouter(['/menu/categories/edit/appetizers-category']);
      
      expect(screen.getByTestId('category-editor-page')).toBeInTheDocument();
    });
  });

  describe('Analytics Routes', () => {
    it('should render MenuAnalyticsPage on "/menu/analytics" route', () => {
      renderWithRouter(['/menu/analytics']);
      
      expect(screen.getByTestId('menu-analytics-page')).toBeInTheDocument();
    });
  });

  describe('Catch-All Routes', () => {
    it('should redirect unknown routes to menu list', () => {
      renderWithRouter(['/menu/unknown-route']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });

    it('should redirect wildcard routes to menu list', () => {
      renderWithRouter(['/menu/some/deep/unknown/path']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });

    it('should redirect non-menu routes to menu list', () => {
      renderWithRouter(['/completely-different-route']);
      
      expect(screen.getByTestId('menu-list-page')).toBeInTheDocument();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle alphanumeric menu IDs', () => {
      renderWithRouter(['/menu/edit/menu123abc']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should handle hyphenated IDs', () => {
      renderWithRouter(['/menu/items/edit/menu-item-with-hyphens']);
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });

    it('should handle UUID-style IDs', () => {
      renderWithRouter(['/menu/categories/edit/550e8400-e29b-41d4-a716-446655440000']);
      
      expect(screen.getByTestId('category-editor-page')).toBeInTheDocument();
    });

    it('should handle numeric IDs', () => {
      renderWithRouter(['/menu/preview/12345']);
      
      expect(screen.getByTestId('menu-preview-page')).toBeInTheDocument();
    });
  });

  describe('Route Navigation Flow', () => {
    it('should support navigation from list to edit pages', () => {
      const { rerender } = renderWithRouter(['/menu/items']);
      
      expect(screen.getByTestId('item-list-page')).toBeInTheDocument();
      
      // Simulate navigation to edit
      rerender(
        <MemoryRouter initialEntries={['/menu/items/edit/item-123']}>
          <MenuRoutes />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });

    it('should support navigation from edit to preview', () => {
      const { rerender } = renderWithRouter(['/menu/edit/menu-123']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
      
      // Simulate navigation to preview
      rerender(
        <MemoryRouter initialEntries={['/menu/preview/menu-123']}>
          <MenuRoutes />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('menu-preview-page')).toBeInTheDocument();
    });
  });

  describe('Deep Linking Support', () => {
    it('should support direct access to edit pages via URL', () => {
      renderWithRouter(['/menu/edit/direct-access-menu']);
      
      expect(screen.getByTestId('menu-editor-page')).toBeInTheDocument();
    });

    it('should support direct access to item creation page', () => {
      renderWithRouter(['/menu/items/new']);
      
      expect(screen.getByTestId('item-creation-page')).toBeInTheDocument();
    });

    it('should support direct access to analytics page', () => {
      renderWithRouter(['/menu/analytics']);
      
      expect(screen.getByTestId('menu-analytics-page')).toBeInTheDocument();
    });
  });

  describe('Route Structure Validation', () => {
    it('should have consistent route patterns for CRUD operations', () => {
      // List routes
      renderWithRouter(['/menu/items']);
      expect(screen.getByTestId('item-list-page')).toBeInTheDocument();
      
      // Create routes  
      renderWithRouter(['/menu/items/new']);
      expect(screen.getByTestId('item-creation-page')).toBeInTheDocument();
      
      // Edit routes with ID parameter
      renderWithRouter(['/menu/items/edit/123']);
      expect(screen.getByTestId('item-editor-page')).toBeInTheDocument();
    });

    it('should maintain RESTful route conventions', () => {
      // Resource collections
      renderWithRouter(['/menu/categories']);
      expect(screen.getByTestId('category-list-page')).toBeInTheDocument();
      
      // Resource editing
      renderWithRouter(['/menu/categories/edit/appetizers']);
      expect(screen.getByTestId('category-editor-page')).toBeInTheDocument();
    });
  });
});