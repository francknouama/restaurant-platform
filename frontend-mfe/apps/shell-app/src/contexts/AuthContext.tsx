import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  User, 
  UserWithRole, 
  LoginRequest, 
  authAPI, 
  tokenManager,
  canUserAccess,
  PermissionResource,
  PermissionAction,
  RestaurantRole
} from '@restaurant/shared-utils';
import { useGlobalStore } from '@restaurant/shared-state';

interface AuthContextType {
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  canAccess: (resource: PermissionResource, action: PermissionAction) => boolean;
  hasRole: (role: RestaurantRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setUser: setGlobalUser, clearUser: clearGlobalUser, addNotification } = useGlobalStore();

  // Load user on mount
  useEffect(() => {
    loadUser();

    // Listen for auth events
    const handleUnauthorized = () => {
      clearAuth();
      addNotification({
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired. Please login again.',
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have a token
      if (!tokenManager.getToken()) {
        return;
      }

      // Verify session and get user data
      const userWithRole = await authAPI.getCurrentUser();
      setUser(userWithRole);
      
      // Update global store
      setGlobalUser({
        id: userWithRole.user.id,
        email: userWithRole.user.email,
        role: userWithRole.role.name,
      });
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear tokens if session is invalid
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
      
      // Update global store
      setGlobalUser({
        id: response.user.user.id,
        email: response.user.user.email,
        role: response.user.role.name,
      });

      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${response.user.user.email}!`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: error.response?.data?.message || 'Invalid credentials',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      clearAuth();
      addNotification({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out successfully.',
      });
    }
  };

  const clearAuth = () => {
    setUser(null);
    clearGlobalUser();
    tokenManager.clearTokens();
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const canAccess = useCallback((resource: PermissionResource, action: PermissionAction): boolean => {
    return canUserAccess(user, resource, action);
  }, [user]);

  const hasRole = useCallback((role: RestaurantRole): boolean => {
    return user?.role.name === role;
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    canAccess,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};