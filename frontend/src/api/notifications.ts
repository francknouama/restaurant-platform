import { apiClient } from './client'
import { Notification, PaginatedResponse } from '@types/index'

export const notificationsApi = {
  async getNotifications(params?: {
    page?: number
    limit?: number
    read?: boolean
    type?: string
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.read !== undefined) queryParams.append('read', params.read.toString())
    if (params?.type) queryParams.append('type', params.type)

    return apiClient.get<PaginatedResponse<Notification>>(`/notifications?${queryParams.toString()}`)
  },

  async markAsRead(id: string) {
    return apiClient.post(`/notifications/${id}/read`)
  },

  async markAllAsRead() {
    return apiClient.post('/notifications/read-all')
  },

  async deleteNotification(id: string) {
    return apiClient.delete(`/notifications/${id}`)
  },

  async getUnreadCount() {
    return apiClient.get<{ count: number }>('/notifications/unread-count')
  },
}