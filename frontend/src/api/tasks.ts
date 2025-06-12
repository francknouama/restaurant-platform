import { apiClient } from './client'
import { Task, CreateTaskRequest, UpdateTaskRequest, PaginatedResponse } from '@types/index'

export const tasksApi = {
  async getTasks(params?: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    assigned_to?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order)

    return apiClient.get<PaginatedResponse<Task>>(`/tasks?${queryParams.toString()}`)
  },

  async getTask(id: string) {
    return apiClient.get<Task>(`/tasks/${id}`)
  },

  async createTask(data: CreateTaskRequest) {
    return apiClient.post<Task>('/tasks', data)
  },

  async updateTask(id: string, data: UpdateTaskRequest) {
    return apiClient.put<Task>(`/tasks/${id}`, data)
  },

  async deleteTask(id: string) {
    return apiClient.delete(`/tasks/${id}`)
  },

  async getMyTasks(params?: {
    status?: string
    priority?: string
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    return apiClient.get<PaginatedResponse<Task>>(`/tasks/my?${queryParams.toString()}`)
  },

  async assignTask(taskId: string, userId: string) {
    return apiClient.post(`/tasks/${taskId}/assign`, { user_id: userId })
  },

  async completeTask(id: string) {
    return apiClient.post(`/tasks/${id}/complete`)
  },

  async getTaskStats() {
    return apiClient.get<{
      total: number
      pending: number
      in_progress: number
      completed: number
      failed: number
      by_priority: Record<string, number>
    }>('/tasks/stats')
  },
}