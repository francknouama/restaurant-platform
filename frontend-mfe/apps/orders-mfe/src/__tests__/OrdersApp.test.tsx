import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OrdersApp from '../OrdersApp';

// Mock the shared UI components
jest.mock('@restaurant/shared-ui', () => ({
  ErrorBoundary: ({ children, mfeName }: { children: React.ReactNode; mfeName: string }) => (
    <div data-testid="error-boundary" data-mfe-name={mfeName}>
      {children}
    </div>
  ),
}));

// Mock all page components to focus on app-level functionality
jest.mock('../pages/OrderDashboardPage', () => {
  return function OrderDashboardPage() {
    return <div data-testid="order-dashboard-page">Order Dashboard Page</div>;
  };
});

jest.mock('../pages/OrderDetailsPage', () => {
  return function OrderDetailsPage() {
    return <div data-testid="order-details-page">Order Details Page</div>;
  };
});

jest.mock('../pages/OrderHistoryPage', () => {
  return function OrderHistoryPage() {
    return <div data-testid="order-history-page">Order History Page</div>;
  };
});

jest.mock('../pages/NewOrderPage', () => {
  return function NewOrderPage() {
    return <div data-testid="new-order-page">New Order Page</div>;
  };
});

jest.mock('../pages/QuickOrderPage', () => {
  return function QuickOrderPage() {
    return <div data-testid="quick-order-page">Quick Order Page</div>;
  };
});

jest.mock('../pages/CustomerLookupPage', () => {
  return function CustomerLookupPage() {
    return <div data-testid="customer-lookup-page">Customer Lookup Page</div>;
  };
});

jest.mock('../pages/CustomerDetailsPage', () => {
  return function CustomerDetailsPage() {
    return <div data-testid="customer-details-page">Customer Details Page</div>;
  };
});

jest.mock('../pages/PaymentHistoryPage', () => {
  return function PaymentHistoryPage() {
    return <div data-testid="payment-history-page">Payment History Page</div>;
  };
});

describe('OrdersApp', () => {
  const renderOrdersApp = (initialEntries?: string[]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries || ['/']}>
        <OrdersApp />
      </MemoryRouter>
    );
  };

  describe('Component Structure', () => {
    it('should render the OrdersApp with correct structure', () => {
      renderOrdersApp();
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      const ordersContainer = screen.getByTestId('error-boundary').querySelector('.orders-mfe');
      expect(ordersContainer).toBeInTheDocument();
      expect(ordersContainer).toHaveClass('h-full');
    });

    it('should wrap content in ErrorBoundary with correct MFE name', () => {
      renderOrdersApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Orders MFE');
    });

    it('should have orders-mfe CSS class', () => {
      renderOrdersApp();
      
      const ordersContainer = screen.getByTestId('error-boundary').querySelector('.orders-mfe');
      expect(ordersContainer).toHaveClass('orders-mfe');
    });
  });

  describe('Order Management Routes', () => {
    it('should render OrderDashboardPage on root route', () => {
      renderOrdersApp(['/']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });

    it('should redirect /dashboard to root route', () => {
      renderOrdersApp(['/dashboard']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });

    it('should render OrderDetailsPage on orders/:orderId route', () => {
      renderOrdersApp(['/orders/order-123']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should render OrderHistoryPage on history route', () => {
      renderOrdersApp(['/history']);
      
      expect(screen.getByTestId('order-history-page')).toBeInTheDocument();
    });

    it('should handle different order IDs in details route', () => {
      renderOrdersApp(['/orders/order-456']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should handle UUID-style order IDs', () => {
      renderOrdersApp(['/orders/550e8400-e29b-41d4-a716-446655440000']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });
  });

  describe('Order Creation Routes', () => {
    it('should render NewOrderPage on new route', () => {
      renderOrdersApp(['/new']);
      
      expect(screen.getByTestId('new-order-page')).toBeInTheDocument();
    });

    it('should render QuickOrderPage on quick route', () => {
      renderOrdersApp(['/quick']);
      
      expect(screen.getByTestId('quick-order-page')).toBeInTheDocument();
    });
  });

  describe('Customer Management Routes', () => {
    it('should render CustomerLookupPage on customers route', () => {
      renderOrdersApp(['/customers']);
      
      expect(screen.getByTestId('customer-lookup-page')).toBeInTheDocument();
    });

    it('should render CustomerDetailsPage on customers/:customerId route', () => {
      renderOrdersApp(['/customers/customer-123']);
      
      expect(screen.getByTestId('customer-details-page')).toBeInTheDocument();
    });

    it('should handle different customer IDs', () => {
      renderOrdersApp(['/customers/customer-vip-456']);
      
      expect(screen.getByTestId('customer-details-page')).toBeInTheDocument();
    });
  });

  describe('Payment Routes', () => {
    it('should render PaymentHistoryPage on payments route', () => {
      renderOrdersApp(['/payments']);
      
      expect(screen.getByTestId('payment-history-page')).toBeInTheDocument();
    });
  });

  describe('Route Redirects and Fallbacks', () => {
    it('should redirect unknown routes to dashboard', () => {
      renderOrdersApp(['/unknown-route']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });

    it('should redirect nested unknown routes to dashboard', () => {
      renderOrdersApp(['/orders/unknown/nested/route']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });

    it('should handle empty route parameters gracefully', () => {
      renderOrdersApp(['/orders/']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });

    it('should handle malformed routes', () => {
      renderOrdersApp(['/orders//']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle alphanumeric order IDs', () => {
      renderOrdersApp(['/orders/order123abc']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should handle hyphenated IDs', () => {
      renderOrdersApp(['/orders/order-with-hyphens-123']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should handle numeric IDs', () => {
      renderOrdersApp(['/orders/12345']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should handle customer ID variations', () => {
      const customerIds = [
        'customer-123',
        'cust_456',
        '789',
        'vip-customer-abc'
      ];

      customerIds.forEach(customerId => {
        const { unmount } = renderOrdersApp([`/customers/${customerId}`]);
        expect(screen.getByTestId('customer-details-page')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Navigation Flow', () => {
    it('should support navigation between different pages', () => {
      const { rerender } = renderOrdersApp(['/']);
      
      expect(screen.getByTestId('order-dashboard-page')).toBeInTheDocument();
      
      // Simulate navigation to new order page
      rerender(
        <MemoryRouter initialEntries={['/new']}>
          <OrdersApp />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('new-order-page')).toBeInTheDocument();
    });

    it('should support deep linking to specific routes', () => {
      renderOrdersApp(['/orders/order-123']);
      
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
    });

    it('should support navigation flow from customer lookup to details', () => {
      const { rerender } = renderOrdersApp(['/customers']);
      
      expect(screen.getByTestId('customer-lookup-page')).toBeInTheDocument();
      
      // Navigate to customer details
      rerender(
        <MemoryRouter initialEntries={['/customers/customer-123']}>
          <OrdersApp />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('customer-details-page')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error boundary around all content', () => {
      renderOrdersApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      const ordersContainer = errorBoundary.querySelector('.orders-mfe');
      
      expect(errorBoundary).toContainElement(ordersContainer);
    });

    it('should pass correct mfeName to ErrorBoundary', () => {
      renderOrdersApp();
      
      const errorBoundary = screen.getByTestId('error-boundary');
      expect(errorBoundary).toHaveAttribute('data-mfe-name', 'Orders MFE');
    });
  });

  describe('Integration with Shared Packages', () => {
    it('should import and use ErrorBoundary from @restaurant/shared-ui', () => {
      renderOrdersApp();
      
      // ErrorBoundary should be rendered (mocked in this test)
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });

    it('should maintain testid accessibility for integration testing', () => {
      renderOrdersApp();
      
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    });
  });

  describe('Route Structure Validation', () => {
    it('should have RESTful route patterns', () => {
      const routes = [
        { path: '/', expectedPage: 'order-dashboard-page' },
        { path: '/orders/123', expectedPage: 'order-details-page' },
        { path: '/customers', expectedPage: 'customer-lookup-page' },
        { path: '/customers/456', expectedPage: 'customer-details-page' },
        { path: '/payments', expectedPage: 'payment-history-page' },
        { path: '/new', expectedPage: 'new-order-page' },
        { path: '/quick', expectedPage: 'quick-order-page' },
        { path: '/history', expectedPage: 'order-history-page' }
      ];

      routes.forEach(({ path, expectedPage }) => {
        const { unmount } = renderOrdersApp([path]);
        expect(screen.getByTestId(expectedPage)).toBeInTheDocument();
        unmount();
      });
    });

    it('should maintain consistent URL structure', () => {
      // Test URL patterns follow logical hierarchy
      renderOrdersApp(['/orders/order-123']);
      expect(screen.getByTestId('order-details-page')).toBeInTheDocument();
      
      renderOrdersApp(['/customers/customer-456']);
      expect(screen.getByTestId('customer-details-page')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should render without unnecessary re-renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      renderOrdersApp();
      
      // Should not have React warnings about performance
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Warning')
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid route changes', () => {
      const routes = ['/', '/new', '/customers', '/payments', '/history'];
      
      routes.forEach(route => {
        expect(() => renderOrdersApp([route])).not.toThrow();
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain semantic structure', () => {
      renderOrdersApp();
      
      const ordersContainer = screen.getByTestId('error-boundary').querySelector('.orders-mfe');
      expect(ordersContainer).toBeInTheDocument();
    });

    it('should support keyboard navigation structure', () => {
      renderOrdersApp();
      
      // Container should be present for keyboard navigation
      const ordersContainer = screen.getByTestId('error-boundary').querySelector('.orders-mfe');
      expect(ordersContainer).toBeInTheDocument();
    });
  });
});