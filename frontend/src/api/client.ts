import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@store/authStore'
import { ApiError, ApiResponse } from '@types/index'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        
        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId()
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Handle Go backend response format
        if (response.data && typeof response.data === 'object') {
          // If the response has a 'data' field, use it
          if ('data' in response.data) {
            return {
              ...response,
              data: {
                success: response.data.success !== false,
                message: response.data.message || 'Success',
                data: response.data.data,
              }
            }
          }
          
          // Otherwise, wrap the response
          return {
            ...response,
            data: {
              success: true,
              message: 'Success',
              data: response.data,
            }
          }
        }
        
        return response
      },
      (error) => {
        const apiError: ApiError = {
          message: error.response?.data?.message || error.response?.data?.error || 'An error occurred',
          errors: error.response?.data?.errors || error.response?.data?.details,
          statusCode: error.response?.status || 500,
        }

        // Handle authentication errors
        if (error.response?.status === 401) {
          useAuthStore.getState().clearAuth()
          toast.error('Session expired. Please login again.')
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }

        // Handle forbidden errors
        if (error.response?.status === 403) {
          toast.error('Access denied. You do not have permission to perform this action.')
        }

        // Handle server errors
        if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        }

        // Handle network errors
        if (!error.response) {
          toast.error('Network error. Please check your connection.')
        }

        return Promise.reject(apiError)
      }
    )
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // Method to update base URL for different services
  setBaseURL(url: string) {
    this.client.defaults.baseURL = url
  }

  // Method to get current base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || ''
  }
}

export const apiClient = new ApiClient()

// Create separate clients for different services if needed
export const authServiceClient = new ApiClient()
authServiceClient.setBaseURL(import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:8081')

export const userServiceClient = new ApiClient()
userServiceClient.setBaseURL(import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8082')