import { apiClient, authServiceClient } from './client'
import { LoginCredentials, RegisterCredentials, User } from '@types/index'

export const authApi = {
  async login(credentials: LoginCredentials) {
    return apiClient.post<{ user: User; token: string; refresh_token?: string }>('/auth/login', credentials)
  },

  async register(credentials: RegisterCredentials) {
    return apiClient.post<{ user: User; token: string; refresh_token?: string }>('/auth/register', credentials)
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  async me() {
    return apiClient.get<User>('/auth/me')
  },

  async refreshToken(refreshToken?: string) {
    return apiClient.post<{ token: string; refresh_token?: string }>('/auth/refresh', {
      refresh_token: refreshToken
    })
  },

  async forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, password: string) {
    return apiClient.post('/auth/reset-password', { token, password })
  },

  async verifyEmail(token: string) {
    return apiClient.post('/auth/verify-email', { token })
  },

  async resendVerification(email: string) {
    return apiClient.post('/auth/resend-verification', { email })
  },

  // Health check for auth service
  async healthCheck() {
    return apiClient.get('/health')
  },
}

// Alternative auth API using dedicated auth service
export const authServiceApi = {
  async login(credentials: LoginCredentials) {
    return authServiceClient.post<{ user: User; token: string; refresh_token?: string }>('/login', credentials)
  },

  async register(credentials: RegisterCredentials) {
    return authServiceClient.post<{ user: User; token: string; refresh_token?: string }>('/register', credentials)
  },

  async logout() {
    return authServiceClient.post('/logout')
  },

  async me() {
    return authServiceClient.get<User>('/me')
  },

  async refreshToken(refreshToken?: string) {
    return authServiceClient.post<{ token: string; refresh_token?: string }>('/refresh', {
      refresh_token: refreshToken
    })
  },
}