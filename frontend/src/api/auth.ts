import { apiClient } from './client'
import { LoginCredentials, RegisterCredentials, User } from '@types/index'

export const authApi = {
  async login(credentials: LoginCredentials) {
    return apiClient.post<{ user: User; token: string }>('/auth/login', credentials)
  },

  async register(credentials: RegisterCredentials) {
    return apiClient.post<{ user: User; token: string }>('/auth/register', credentials)
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  async me() {
    return apiClient.get<User>('/auth/me')
  },

  async refreshToken() {
    return apiClient.post<{ token: string }>('/auth/refresh')
  },

  async forgotPassword(email: string) {
    return apiClient.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, password: string) {
    return apiClient.post('/auth/reset-password', { token, password })
  },
}