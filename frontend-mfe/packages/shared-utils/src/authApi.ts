import { apiClient } from './api';
import { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  UserWithRole,
  User
} from './types';
import { tokenManager, TokenRefreshManager } from './token';

class AuthenticationAPI {
  private baseURL = '/auth';
  private refreshManager: TokenRefreshManager | null = null;

  /**
   * Initialize the authentication API with automatic token refresh
   */
  initialize() {
    this.refreshManager = new TokenRefreshManager(
      async (refreshToken) => this.refreshToken({ refreshToken }),
      (error) => this.handleAuthError(error)
    );
    
    // Start refresh manager if we have tokens
    if (tokenManager.getToken()) {
      this.refreshManager.start();
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(`${this.baseURL}/login`, credentials);
      
      if (response.data) {
        // Store tokens
        tokenManager.setTokens(
          response.data.token,
          response.data.refreshToken,
          response.data.expiresAt
        );
        
        // Start automatic refresh
        this.refreshManager?.start();
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint if available
      await apiClient.post(`${this.baseURL}/logout`);
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      this.clearSession();
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(`${this.baseURL}/refresh`, request);
    return response.data;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<UserWithRole> {
    const response = await apiClient.get<UserWithRole>(`${this.baseURL}/me`);
    return response.data;
  }

  /**
   * Verify if the current session is valid
   */
  async verifySession(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseURL}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await apiClient.post(`${this.baseURL}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiClient.post(`${this.baseURL}/reset-password`, {
      token,
      newPassword,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`${this.baseURL}/profile`, updates);
    return response.data;
  }

  /**
   * Clear the current session
   */
  private clearSession() {
    // Stop refresh manager
    this.refreshManager?.stop();
    
    // Clear tokens
    tokenManager.clearTokens();
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(error: Error) {
    console.error('Authentication error:', error);
    
    // Clear session
    this.clearSession();
    
    // Emit auth error event for global handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:error', { detail: error }));
    }
  }
}

// Export singleton instance
export const authAPI = new AuthenticationAPI();

// Authentication hooks for React components
export const useAuthAPI = () => {
  return {
    login: authAPI.login.bind(authAPI),
    logout: authAPI.logout.bind(authAPI),
    getCurrentUser: authAPI.getCurrentUser.bind(authAPI),
    verifySession: authAPI.verifySession.bind(authAPI),
    changePassword: authAPI.changePassword.bind(authAPI),
    requestPasswordReset: authAPI.requestPasswordReset.bind(authAPI),
    resetPassword: authAPI.resetPassword.bind(authAPI),
    updateProfile: authAPI.updateProfile.bind(authAPI),
  };
};