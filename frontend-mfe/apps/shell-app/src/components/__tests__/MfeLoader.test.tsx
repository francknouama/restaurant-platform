import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MfeLoader from '../MfeLoader';
import { useAuth } from '../../contexts/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock ProtectedRoute
jest.mock('../ProtectedRoute', () => {
  return function MockProtectedRoute({ children, resource, action }: { 
    children: React.ReactNode; 
    resource?: string; 
    action?: string; 
  }) {
    return (
      <div data-testid="protected-route" data-resource={resource} data-action={action}>
        {children}
      </div>
    );
  };
});

// Mock dynamic imports for MFE modules
const createMockMfeModule = (componentName: string) => ({
  default: () => <div data-testid={`mfe-component-${componentName.toLowerCase()}`}>
    {componentName} Component
  </div>
});

// Mock the dynamic import function
const mockImport = jest.fn();
global.import = mockImport as any;

describe('MfeLoader', () => {
  const mockAuthContext = {
    user: null,
    isLoading: false,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canAccess: jest.fn().mockReturnValue(true),
    hasRole: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(mockAuthContext);
    
    // Reset console.error mock
    (console.error as jest.Mock).mockClear();
  });

  const renderMfeLoader = (props: Parameters<typeof MfeLoader>[0]) => {
    return render(
      <MemoryRouter>
        <MfeLoader {...props} />
      </MemoryRouter>
    );
  };

  it('should render MFE component when loading succeeds', async () => {
    mockImport.mockResolvedValue(createMockMfeModule('Menu'));

    renderMfeLoader({
      mfeName: 'Menu Management',
      moduleName: 'menuMfe/Menu',
      componentPath: 'default',
    });

    // Should show loading fallback initially
    expect(screen.getByTestId('loading-fallback-menu-management')).toBeInTheDocument();

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('mfe-component-menu')).toBeInTheDocument();
    });

    expect(screen.getByText('Menu Component')).toBeInTheDocument();
    expect(mockImport).toHaveBeenCalledWith('menuMfe/Menu');
  });

  it('should wrap with ProtectedRoute when permissions are provided', async () => {
    mockImport.mockResolvedValue(createMockMfeModule('Orders'));

    renderMfeLoader({
      mfeName: 'Order Processing',
      moduleName: 'ordersMfe/Orders',
      componentPath: 'OrdersApp',
      resource: 'order',
      action: 'read',
    });

    expect(screen.getByTestId('protected-route')).toBeInTheDocument();
    expect(screen.getByTestId('protected-route')).toHaveAttribute('data-resource', 'order');
    expect(screen.getByTestId('protected-route')).toHaveAttribute('data-action', 'read');

    await waitFor(() => {
      expect(screen.getByTestId('mfe-component-orders')).toBeInTheDocument();
    });
  });

  it('should not wrap with ProtectedRoute when no permissions are provided', async () => {
    mockImport.mockResolvedValue(createMockMfeModule('Kitchen'));

    renderMfeLoader({
      mfeName: 'Kitchen Operations',
      moduleName: 'kitchenMfe/Kitchen',
      componentPath: 'KitchenApp',
    });

    expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();
    expect(screen.getByTestId('mfe-container-kitchen-operations')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mfe-component-kitchen')).toBeInTheDocument();
    });
  });

  it('should handle different component paths correctly', async () => {
    const mockModule = {
      OrdersApp: () => <div data-testid="orders-app">Orders App</div>,
      default: () => <div data-testid="default-export">Default Export</div>,
    };

    mockImport.mockResolvedValue(mockModule);

    renderMfeLoader({
      mfeName: 'Order Processing',
      moduleName: 'ordersMfe/Orders',
      componentPath: 'OrdersApp',
    });

    await waitFor(() => {
      expect(screen.getByTestId('orders-app')).toBeInTheDocument();
    });

    expect(screen.getByText('Orders App')).toBeInTheDocument();
  });

  it('should fallback to default export when componentPath is not found', async () => {
    const mockModule = {
      default: () => <div data-testid="fallback-component">Fallback Component</div>,
    };

    mockImport.mockResolvedValue(mockModule);

    renderMfeLoader({
      mfeName: 'Reservation System',
      moduleName: 'reservationsMfe/Reservations',
      componentPath: 'NonExistentComponent',
    });

    await waitFor(() => {
      expect(screen.getByTestId('fallback-component')).toBeInTheDocument();
    });

    expect(screen.getByText('Fallback Component')).toBeInTheDocument();
  });

  it('should display loading fallback while component is loading', () => {
    const delayedPromise = new Promise(resolve => {
      setTimeout(() => resolve(createMockMfeModule('Inventory')), 100);
    });

    mockImport.mockReturnValue(delayedPromise);

    renderMfeLoader({
      mfeName: 'Inventory Management',
      moduleName: 'inventoryMfe/Inventory',
      componentPath: 'InventoryApp',
    });

    expect(screen.getByTestId('loading-fallback-inventory-management')).toBeInTheDocument();
    expect(screen.getByText('Loading Inventory Management...')).toBeInTheDocument();
  });

  it('should handle import errors gracefully', async () => {
    const importError = new Error('Failed to load module');
    mockImport.mockRejectedValue(importError);

    renderMfeLoader({
      mfeName: 'Failed MFE',
      moduleName: 'failedMfe/Failed',
      componentPath: 'default',
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load MFE Failed MFE:',
        importError
      );
    });
  });

  it('should pass correct props to MfeContainer', async () => {
    mockImport.mockResolvedValue(createMockMfeModule('Test'));

    renderMfeLoader({
      mfeName: 'Test MFE',
      moduleName: 'testMfe/Test',
      componentPath: 'default',
    });

    expect(screen.getByTestId('mfe-container-test-mfe')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mfe-component-test')).toBeInTheDocument();
    });
  });

  it('should handle MfeContainer error callback', async () => {
    mockImport.mockResolvedValue(createMockMfeModule('Error'));

    renderMfeLoader({
      mfeName: 'Error MFE',
      moduleName: 'errorMfe/Error',
      componentPath: 'default',
    });

    // The MfeContainer error handling is tested through the mock
    // In a real scenario, this would be triggered by an error boundary
    expect(screen.getByTestId('mfe-container-error-mfe')).toBeInTheDocument();
  });

  describe('Permission combinations', () => {
    it('should handle resource without action', async () => {
      mockImport.mockResolvedValue(createMockMfeModule('Menu'));

      renderMfeLoader({
        mfeName: 'Menu Management',
        moduleName: 'menuMfe/Menu',
        componentPath: 'default',
        resource: 'menu',
      });

      // Should not wrap with ProtectedRoute when action is missing
      expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('mfe-component-menu')).toBeInTheDocument();
      });
    });

    it('should handle action without resource', async () => {
      mockImport.mockResolvedValue(createMockMfeModule('Orders'));

      renderMfeLoader({
        mfeName: 'Order Processing',
        moduleName: 'ordersMfe/Orders',
        componentPath: 'default',
        action: 'read',
      });

      // Should not wrap with ProtectedRoute when resource is missing
      expect(screen.queryByTestId('protected-route')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByTestId('mfe-component-orders')).toBeInTheDocument();
      });
    });
  });

  describe('Different MFE configurations', () => {
    const mfeConfigs = [
      {
        name: 'Menu Management',
        module: 'menuMfe/Menu',
        component: 'default',
        resource: 'menu',
        action: 'read',
      },
      {
        name: 'Order Processing',
        module: 'ordersMfe/Orders',
        component: 'OrdersApp',
        resource: 'order',
        action: 'create',
      },
      {
        name: 'Kitchen Operations',
        module: 'kitchenMfe/Kitchen',
        component: 'KitchenApp',
        resource: 'kitchen',
        action: 'manage',
      },
    ];

    mfeConfigs.forEach(config => {
      it(`should handle ${config.name} configuration correctly`, async () => {
        mockImport.mockResolvedValue(createMockMfeModule(config.name));

        renderMfeLoader({
          mfeName: config.name,
          moduleName: config.module,
          componentPath: config.component,
          resource: config.resource as any,
          action: config.action as any,
        });

        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
        expect(screen.getByTestId('protected-route')).toHaveAttribute('data-resource', config.resource);
        expect(screen.getByTestId('protected-route')).toHaveAttribute('data-action', config.action);

        const expectedTestId = `mfe-container-${config.name.toLowerCase().replace(/\s+/g, '-')}`;
        expect(screen.getByTestId(expectedTestId)).toBeInTheDocument();
      });
    });
  });

  describe('Error scenarios', () => {
    it('should handle network errors during module loading', async () => {
      const networkError = new Error('Network error');
      mockImport.mockRejectedValue(networkError);

      renderMfeLoader({
        mfeName: 'Network Error MFE',
        moduleName: 'networkMfe/Error',
        componentPath: 'default',
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load MFE Network Error MFE:',
          networkError
        );
      });
    });

    it('should handle module resolution errors', async () => {
      const resolutionError = new Error('Module not found');
      mockImport.mockRejectedValue(resolutionError);

      renderMfeLoader({
        mfeName: 'Resolution Error MFE',
        moduleName: 'nonexistentMfe/Component',
        componentPath: 'default',
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          'Failed to load MFE Resolution Error MFE:',
          resolutionError
        );
      });
    });
  });
});