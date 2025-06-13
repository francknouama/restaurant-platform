import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ApiError } from '../types';

// Create the main API client instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    config.headers['X-Request-ID'] = generateRequestId();

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - remove token and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    // Transform error to our ApiError format
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      code: error.response?.data?.error || error.code,
      details: error.response?.data?.errors || error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

// Utility function to generate request IDs
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function for handling API responses
export const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (!response.data.success) {
    throw new Error(response.data.message || 'API request failed');
  }
  return response.data.data as T;
};

// Helper function for making authenticated requests
export const authenticatedRequest = <T>(
  requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  return requestFn().then(handleApiResponse);
};

// Export configured axios instance for use in domain-specific API modules
export default apiClient;