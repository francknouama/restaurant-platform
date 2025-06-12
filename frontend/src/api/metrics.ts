import { apiClient } from './client'
import { ServiceMetrics, AppConfig } from '@types/index'

export const metricsApi = {
  async getServiceMetrics() {
    return apiClient.get<ServiceMetrics>('/metrics')
  },

  async getAppConfig() {
    return apiClient.get<AppConfig>('/config')
  },

  async getSystemInfo() {
    return apiClient.get<{
      version: string
      build_time: string
      go_version: string
      git_commit: string
      uptime: string
    }>('/info')
  },

  async getPerformanceMetrics() {
    return apiClient.get<{
      requests_per_second: number
      average_response_time: number
      error_rate: number
      active_connections: number
      memory_usage: {
        allocated: string
        total_allocated: string
        system: string
        gc_runs: number
      }
      goroutines: number
    }>('/metrics/performance')
  },
}