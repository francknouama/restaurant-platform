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

// Go backend specific types (snake_case from Go structs)
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
    last_check?: string
  }>
  database?: {
    status: 'connected' | 'disconnected'
    response_time?: string
  }
  redis?: {
    status: 'connected' | 'disconnected'
    response_time?: string
  }
}

// Task/Job related types (common in Go backends)
export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  assigned_to?: string
  created_by: string
  created_at: string
  updated_at: string
  due_date?: string
  completed_at?: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  assigned_to?: string
  due_date?: string
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority?: 'low' | 'medium' | 'high'
  assigned_to?: string
  due_date?: string
}

// Metrics and Analytics (common in Go services)
export interface ServiceMetrics {
  service_name: string
  uptime: string
  requests_total: number
  requests_per_second: number
  average_response_time: string
  error_rate: number
  memory_usage: string
  cpu_usage: string
  goroutines: number
  timestamp: string
}

// Configuration types
export interface AppConfig {
  app_name: string
  version: string
  environment: 'development' | 'staging' | 'production'
  debug: boolean
  cors_origins: string[]
  rate_limit: {
    requests_per_minute: number
    burst: number
  }
  jwt: {
    expires_in: string
    refresh_expires_in: string
  }
}

// WebSocket message types (if real-time features are needed)
export interface WebSocketMessage {
  type: 'notification' | 'task_update' | 'user_status' | 'system_alert'
  payload: any
  timestamp: string
  user_id?: string
}

// File upload types
export interface FileUploadResponse {
  file_id: string
  filename: string
  original_name: string
  size: number
  mime_type: string
  url: string
  uploaded_at: string
}

// Notification types
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
  expires_at?: string
}