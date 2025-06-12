import { apiClient, userServiceClient } from './client'
import { User, PaginatedResponse } from '@types/index'

export const usersApi = {
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy)
    if (params?.sortOrder) queryParams.append('sort_order', params.sortOrder)

    return apiClient.get<PaginatedResponse<User>>(`/users?${queryParams.toString()}`)
  },

  async getUser(id: string) {
    return apiClient.get<User>(`/users/${id}`)
  },

  async updateUser(id: string, data: Partial<User>) {
    return apiClient.put<User>(`/users/${id}`, data)
  },

  async deleteUser(id: string) {
    return apiClient.delete(`/users/${id}`)
  },

  async updateProfile(data: Partial<User>) {
    return apiClient.put<User>('/users/profile', data)
  },

  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }) {
    return apiClient.post('/users/change-password', data)
  },

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    
    return apiClient.post<{ avatar_url: string }>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Alternative users API using dedicated user service
export const userServiceApi = {
  async getUsers(params?: {
    page?: number
    limit?: number
    search?: string
    role?: string
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.role) queryParams.append('role', params.role)

    return userServiceClient.get<PaginatedResponse<User>>(`/users?${queryParams.toString()}`)
  },

  async getUser(id: string) {
    return userServiceClient.get<User>(`/users/${id}`)
  },

  async updateUser(id: string, data: Partial<User>) {
    return userServiceClient.put<User>(`/users/${id}`, data)
  },
}