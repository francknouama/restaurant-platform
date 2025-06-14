import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { authAPI, tokenManager, canUserAccess } from '@restaurant/shared-utils';
import { useGlobalStore } from '@restaurant/shared-state';

// Mock the external dependencies
const mockAuthAPI = authAPI as jest.Mocked<typeof authAPI>;
const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>;
const mockCanUserAccess = canUserAccess as jest.MockedFunction<typeof canUserAccess>;
const mockUseGlobalStore = useGlobalStore as jest.MockedFunction<typeof useGlobalStore>;

// Test component to access the AuthContext
const TestComponent: React.FC = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{auth.isLoading.toString()}</div>
      <div data-testid="userEmail">{auth.user?.user.email || 'No user'}</div>
      <div data-testid="userRole">{auth.user?.role.name || 'No role'}</div>
      <button
        onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}
        data-testid="login-button"
      >
        Login
      </button>
      <button
        onClick={() => auth.logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
      <button
        onClick={() => auth.refreshUser()}
        data-testid="refresh-button"
      >
        Refresh
      </button>
      <div data-testid="canAccess">
        {auth.canAccess('menu', 'read').toString()}
      </div>
      <div data-testid="hasRole">
        {auth.hasRole('admin').toString()}
      </div>
    </div>
  );
};

const mockGlobalStore = {
  setUser: jest.fn(),
  clearUser: jest.fn(),
  addNotification: jest.fn(),
};

const mockUserWithRole = {
  user: {
    id: 'user_123',
    email: 'test@example.com',
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

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalStore.mockReturnValue(mockGlobalStore);
    mockTokenManager.getToken.mockReturnValue(null);
    mockCanUserAccess.mockReturnValue(true);
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });

  describe('AuthProvider', () => {
    it('should render children and provide auth context', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('isLoading')).toHaveTextContent('true');
      expect(screen.getByTestId('userEmail')).toHaveTextContent('No user');
    });

    it('should load user on mount when token exists', async () => {
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('userEmail')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('userRole')).toHaveTextContent('admin');
      expect(mockGlobalStore.setUser).toHaveBeenCalledWith({
        id: 'user_123',
        email: 'test@example.com',
        role: 'admin',
      });
    });

    it('should handle load user failure', async () => {
      mockTokenManager.getToken.mockReturnValue('invalid_token');
      mockAuthAPI.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
    });

    it('should handle login successfully', async () => {
      const user = userEvent.setup();
      mockAuthAPI.login.mockResolvedValue(mockAuthResponse);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      await act(async () => {
        await user.click(screen.getByTestId('login-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(mockAuthAPI.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(mockGlobalStore.setUser).toHaveBeenCalledWith({
        id: 'user_123',
        email: 'test@example.com',
        role: 'admin',
      });
      expect(mockGlobalStore.addNotification).toHaveBeenCalledWith({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back, test@example.com!',
      });
    });

    it('should handle login failure', async () => {
      const user = userEvent.setup();
      const loginError = {
        response: {
          data: {
            message: 'Invalid credentials',
          },
        },
      };
      mockAuthAPI.login.mockRejectedValue(loginError);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
      });

      await expect(async () => {
        await act(async () => {
          await user.click(screen.getByTestId('login-button'));
        });
      }).rejects.toEqual(loginError);

      expect(mockGlobalStore.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Login Failed',
        message: 'Invalid credentials',
      });
    });

    it('should handle logout successfully', async () => {
      const user = userEvent.setup();
      
      // Setup initial authenticated state
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
      mockAuthAPI.logout.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for user to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      await act(async () => {
        await user.click(screen.getByTestId('logout-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(mockAuthAPI.logout).toHaveBeenCalled();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
      expect(mockGlobalStore.addNotification).toHaveBeenCalledWith({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
      });
    });

    it('should handle logout failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Setup initial authenticated state
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);
      mockAuthAPI.logout.mockRejectedValue(new Error('Logout failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for user to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      await act(async () => {
        await user.click(screen.getByTestId('logout-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      // Should still clear auth even if logout API fails
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
    });

    it('should refresh user data', async () => {
      const user = userEvent.setup();
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Clear the mock to test refresh
      mockAuthAPI.getCurrentUser.mockClear();
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      await act(async () => {
        await user.click(screen.getByTestId('refresh-button'));
      });

      expect(mockAuthAPI.getCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('should check permissions correctly', async () => {
      mockCanUserAccess.mockReturnValue(true);
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('canAccess')).toHaveTextContent('true');
      expect(mockCanUserAccess).toHaveBeenCalledWith(mockUserWithRole, 'menu', 'read');
    });

    it('should check roles correctly', async () => {
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      expect(screen.getByTestId('hasRole')).toHaveTextContent('true');
    });

    it('should handle unauthorized events', async () => {
      mockTokenManager.getToken.mockReturnValue('existing_token');
      mockAuthAPI.getCurrentUser.mockResolvedValue(mockUserWithRole);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
      });

      // Simulate unauthorized event
      act(() => {
        window.dispatchEvent(new Event('auth:unauthorized'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
      });

      expect(mockGlobalStore.clearUser).toHaveBeenCalled();
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(mockGlobalStore.addNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please login again.',
      });
    });

    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('auth:unauthorized', expect.any(Function));
    });
  });
});