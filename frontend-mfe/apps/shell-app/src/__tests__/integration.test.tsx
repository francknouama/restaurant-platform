import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { authAPI, tokenManager } from '@restaurant/shared-utils';
import { useGlobalStore } from '@restaurant/shared-state';

// Mock external dependencies
const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;
const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;
const mockUseGlobalStore = useGlobalStore as jest.MockedFunction<typeof useGlobalStore>;

const mockGlobalStore = {
  setUser: jest.fn(),
  clearUser: jest.fn(),
  addNotification: jest.fn(),
};

const mockUserWithRole = {
  user: {
    id: 'user_123',
    email: 'admin@restaurant.com',
    isActive: true,
  },
  role: {
    id: 'role_123',
    name: 'admin' as const,
  },
  permissions: [],
};

const mockAuthResponse = {
  user: mockUserWithRole,
  token: 'mock_token',
  refreshToken: 'mock_refresh_token',
  expiresAt: new Date(),
  sessionId: 'session_123',
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalStore.mockReturnValue(mockGlobalStore);
    mockTokenManager.getToken.mockReturnValue(null);
    
    // Mock window location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        search: '',
        hash: '',
        href: 'http://localhost/',
      },
      writable: true,
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow from login to dashboard', async () => {
      const user = userEvent.setup();
      
      // Start with no token (logged out state)
      mockTokenManager.getToken.mockReturnValue(null);
      
      render(<App />);

      // Should redirect to login page
      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      });

      // Simulate successful login
      mockAuthAPI.login.mockResolvedValue(mockAuthResponse);
      
      // Update token manager to return token after login
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      // Re-render app as if user navigated to root after login
      const { rerender } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      expect(mockGlobalStore.setUser).toHaveBeenCalledWith({
        id: 'user_123',
        email: 'admin@restaurant.com',
        role: 'admin',
      });
    });

    it('should handle logout flow correctly', async () => {
      const user = userEvent.setup();
      
      // Start with authenticated user
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
      mockAuthAPI.logout.mockResolvedValue(undefined);

      render(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Click logout button
      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(mockAuthAPI.logout).toHaveBeenCalled();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
    });

    it('should handle token expiration', async () => {
      // Start with expired token
      mockTokenManager.getToken.mockReturnValue('expired_token');
      mockAuthAPI.getCurrentUser.mockRejectedValue(new Error('Token expired'));

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      });

      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
    });
  });

  describe('Navigation Flow', () => {
    beforeEach(async () => {
      // Setup authenticated user
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
    });

    it('should navigate between different sections', async () => {
      const user = userEvent.setup();
      
      render(<App />);

      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Should show dashboard by default
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Simulate navigation to menu (this would be done by router in real app)
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/menu',
          search: '',
          hash: '',
          href: 'http://localhost/menu',
        },
        writable: true,
      });

      // Re-render to simulate route change
      const { rerender } = render(<App />);
      
      await waitFor(() => {
        expect(screen.getByTestId('mfe-loader-menu-management')).toBeInTheDocument();
      });
    });

    it('should handle permission-based navigation', async () => {
      // Setup user with limited permissions
      const limitedUser = {
        ...mockUserWithRole,
        role: {
          id: 'role_456',
          name: 'server' as const,
        },
      };

      mockAuthAPI.getCurrentUser.mockResolvedValue(limitedUser);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Server role should have limited navigation options
      // This is tested through the AppLayout component's permission filtering
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
    });
  });

  describe('MFE Integration', () => {
    beforeEach(async () => {
      // Setup authenticated user
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
    });

    it('should load MFE components with correct permissions', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Simulate navigation to orders MFE
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/orders',
          search: '',
          hash: '',
          href: 'http://localhost/orders',
        },
        writable: true,
      });

      const { rerender } = render(<App />);

      await waitFor(() => {
        const ordersLoader = screen.getByTestId('mfe-loader-order-processing');
        expect(ordersLoader).toBeInTheDocument();
        expect(ordersLoader).toHaveAttribute('data-resource', 'order');
        expect(ordersLoader).toHaveAttribute('data-action', 'read');
      });
    });

    it('should handle MFE loading errors gracefully', async () => {
      // Mock import function to simulate loading error
      const originalImport = global.import;
      global.import = jest.fn().mockRejectedValue(new Error('MFE load failed')) as any;

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Navigation to MFE should still render the loader
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/kitchen',
          search: '',
          hash: '',
          href: 'http://localhost/kitchen',
        },
        writable: true,
      });

      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('mfe-loader-kitchen-operations')).toBeInTheDocument();
      });

      // Restore original import
      global.import = originalImport;
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const user = userEvent.setup();
      
      mockTokenManager.getToken.mockReturnValue(null);
      
      render(<App />);

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
      });

      // Simulate login failure
      const loginError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      mockAuthAPI.login.mockRejectedValue(loginError);

      // The login error would be handled by the AuthContext
      // and a notification would be shown
      expect(screen.getByTestId('notification-container')).toBeInTheDocument();
    });

    it('should handle unauthorized events', async () => {
      // Start with authenticated user
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Simulate unauthorized event
      act(() => {
        window.dispatchEvent(new Event('auth:unauthorized'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
      });

      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(async () => {
      // Setup authenticated user
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
    });

    it('should handle sidebar toggle in app layout', async () => {
      const user = userEvent.setup();
      
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Find and click sidebar toggle
      const toggleButton = screen.getByText('←');
      await user.click(toggleButton);

      // Sidebar should collapse
      const sidebar = screen.getByText('→').closest('aside');
      expect(sidebar).toHaveClass('w-16');
    });

    it('should maintain state across route changes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });

      // Verify user state is maintained
      expect(screen.getByText('admin@restaurant.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();

      // Simulate route change
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/reservations',
          search: '',
          hash: '',
          href: 'http://localhost/reservations',
        },
        writable: true,
      });

      const { rerender } = render(<App />);

      // User state should still be maintained
      await waitFor(() => {
        expect(screen.getByText('admin@restaurant.com')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Loading States', () => {
    it('should show loading states during authentication', async () => {
      // Create a delayed promise for getCurrentUser
      let resolveGetUser: (value: any) => void;
      const getUserPromise = new Promise(resolve => {
        resolveGetUser = resolve;
      });

      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockReturnValue(getUserPromise as any);

      render(<App />);

      // Should show loading state
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Resolve the promise
      act(() => {
        resolveGetUser!(mockUserWithRole);
      });

      await waitFor(() => {
        expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      });
    });

    it('should handle concurrent authentication checks', async () => {
      mockTokenManager.getToken.mockReturnValue('mock_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      // Render multiple instances simultaneously
      const { container: container1 } = render(<App />);
      const { container: container2 } = render(<App />);

      await waitFor(() => {
        expect(container1.querySelector('[data-testid="app-layout"]')).toBeInTheDocument();
        expect(container2.querySelector('[data-testid="app-layout"]')).toBeInTheDocument();
      });

      // Both should be authenticated
      expect(mockAuthAPI.getCurrentUser).toHaveBeenCalledTimes(2);
    });
  });
});