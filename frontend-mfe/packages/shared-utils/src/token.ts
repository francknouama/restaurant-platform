import { getTimeUntilExpiry, isSessionExpired } from './auth';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Token refresh configuration
const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const REFRESH_RETRY_DELAY = 1000; // 1 second
const MAX_REFRESH_RETRIES = 3;

export interface TokenManager {
  getToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (token: string, refreshToken: string, expiresAt: string) => void;
  clearTokens: () => void;
  isTokenExpired: () => boolean;
  shouldRefreshToken: () => boolean;
  getTokenExpiry: () => string | null;
}

// Create a token manager instance
export const tokenManager: TokenManager = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (token: string, refreshToken: string, expiresAt: string) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
  },

  clearTokens: () => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  isTokenExpired: () => {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return true;
    return isSessionExpired(expiry);
  },

  shouldRefreshToken: () => {
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return false;
    
    const timeUntilExpiry = getTimeUntilExpiry(expiry);
    return timeUntilExpiry <= REFRESH_THRESHOLD && timeUntilExpiry > 0;
  },

  getTokenExpiry: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_EXPIRY_KEY);
  },
};

// Token refresh manager with automatic refresh
export class TokenRefreshManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;
  private retryCount = 0;
  
  constructor(
    private refreshCallback: (refreshToken: string) => Promise<{
      token: string;
      refreshToken: string;
      expiresAt: string;
    }>,
    private onRefreshError?: (error: Error) => void
  ) {}

  start() {
    this.scheduleRefresh();
    
    // Check on visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkAndRefresh();
        }
      });
    }
  }

  stop() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private scheduleRefresh() {
    this.stop();
    
    const expiry = tokenManager.getTokenExpiry();
    if (!expiry) return;
    
    const timeUntilRefresh = getTimeUntilExpiry(expiry) - REFRESH_THRESHOLD;
    
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
    } else if (!tokenManager.isTokenExpired()) {
      // Token needs refresh now
      this.refreshToken();
    }
  }

  private async checkAndRefresh() {
    if (tokenManager.shouldRefreshToken() && !this.refreshPromise) {
      await this.refreshToken();
    } else if (!tokenManager.isTokenExpired()) {
      this.scheduleRefresh();
    }
  }

  private async refreshToken(): Promise<void> {
    // Prevent concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      this.handleRefreshError(new Error('No refresh token available'));
      return;
    }

    this.refreshPromise = this.performRefresh(refreshToken);
    
    try {
      await this.refreshPromise;
      this.retryCount = 0;
      this.scheduleRefresh();
    } catch (error) {
      this.handleRefreshError(error as Error);
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<void> {
    try {
      const response = await this.refreshCallback(refreshToken);
      tokenManager.setTokens(response.token, response.refreshToken, response.expiresAt);
    } catch (error) {
      if (this.retryCount < MAX_REFRESH_RETRIES) {
        this.retryCount++;
        await new Promise(resolve => setTimeout(resolve, REFRESH_RETRY_DELAY * this.retryCount));
        return this.performRefresh(refreshToken);
      }
      throw error;
    }
  }

  private handleRefreshError(error: Error) {
    console.error('Token refresh failed:', error);
    this.stop();
    
    if (this.onRefreshError) {
      this.onRefreshError(error);
    } else {
      // Default behavior: clear tokens and redirect to login
      tokenManager.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

// JWT decode utility (for client-side token inspection)
export const decodeJWT = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Get user info from token
export const getUserFromToken = (token?: string): { userId: string; email: string; role: string } | null => {
  const actualToken = token || tokenManager.getToken();
  if (!actualToken) return null;
  
  const decoded = decodeJWT(actualToken);
  if (!decoded) return null;
  
  return {
    userId: decoded.sub || decoded.userId,
    email: decoded.email,
    role: decoded.role,
  };
};