export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'user' | 'admin' | 'moderator'
  isEmailVerified?: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken?: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCredentials {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
  meta?: {
    timestamp: string
    requestId: string
    version: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]> | string[]
  statusCode: number
  code?: string
  details?: any
}

// Go backend specific types
export interface GoApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  errors?: Record<string, string[]>
  timestamp?: string
  request_id?: string
}

export interface GoUser {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
  role: string
  is_email_verified: boolean
  created_at: string
  updated_at: string
  last_login_at?: string
}

export interface GoAuthResponse {
  user: GoUser
  token: string
  refresh_token?: string
  expires_at: string
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  services?: Record<string, {
    status: 'up' | 'down'
    response_time?: string
  }>
}