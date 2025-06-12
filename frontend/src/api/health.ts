import { apiClient } from './client'
import { HealthCheckResponse } from '@types/index'

export const healthApi = {
  async checkHealth() {
    return apiClient.get<HealthCheckResponse>('/health')
  },

  async checkReadiness() {
    return apiClient.get<HealthCheckResponse>('/ready')
  },

  async checkLiveness() {
    return apiClient.get<HealthCheckResponse>('/live')
  },

  async getMetrics() {
    return apiClient.get('/metrics')
  },
}