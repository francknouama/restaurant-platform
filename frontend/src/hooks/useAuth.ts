import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@api/auth'
import { useAuthStore } from '@store/authStore'
import { LoginCredentials, RegisterCredentials, GoUser, GoAuthResponse } from '@types/index'

// Helper function to convert Go user format to frontend format
const convertGoUser = (goUser: GoUser) => ({
  id: goUser.id,
  email: goUser.email,
  firstName: goUser.first_name,
  lastName: goUser.last_name,
  avatar: goUser.avatar_url,
  role: goUser.role as 'user' | 'admin' | 'moderator',
  isEmailVerified: goUser.is_email_verified,
  createdAt: goUser.created_at,
  updatedAt: goUser.updated_at,
  lastLoginAt: goUser.last_login_at,
})

export const useAuth = () => {
  const navigate = useNavigate()
  const { setAuth, clearAuth, setLoading, user, isAuthenticated, token, refreshToken } = useAuthStore()

  const loginMutation = useMutation(authApi.login, {
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (response) => {
      if (response.data) {
        const { user: goUser, token, refresh_token } = response.data
        
        // Convert Go user format to frontend format if needed
        const frontendUser = 'first_name' in goUser 
          ? convertGoUser(goUser as GoUser)
          : goUser
        
        setAuth(frontendUser, token, refresh_token)
        toast.success('Login successful!')
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed')
      setLoading(false)
    },
  })

  const registerMutation = useMutation(authApi.register, {
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (response) => {
      if (response.data) {
        const { user: goUser, token, refresh_token } = response.data
        
        // Convert Go user format to frontend format if needed
        const frontendUser = 'first_name' in goUser 
          ? convertGoUser(goUser as GoUser)
          : goUser
        
        setAuth(frontendUser, token, refresh_token)
        toast.success('Registration successful!')
        navigate('/dashboard')
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed')
      setLoading(false)
    },
  })

  const logoutMutation = useMutation(authApi.logout, {
    onSuccess: () => {
      clearAuth()
      toast.success('Logged out successfully')
      navigate('/')
    },
    onError: () => {
      // Clear auth anyway on logout
      clearAuth()
      navigate('/')
    },
  })

  // Query to verify current user
  const { data: currentUser, refetch: refetchUser } = useQuery(
    ['auth', 'me'],
    authApi.me,
    {
      enabled: isAuthenticated && !!user && !!token,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      onSuccess: (response) => {
        if (response.data) {
          const goUser = response.data
          const frontendUser = 'first_name' in goUser 
            ? convertGoUser(goUser as GoUser)
            : goUser
          
          // Update user data if it has changed
          if (JSON.stringify(user) !== JSON.stringify(frontendUser)) {
            setAuth(frontendUser, token!, refreshToken)
          }
        }
      },
      onError: (error: any) => {
        // Only clear auth if it's an authentication error
        if (error.statusCode === 401) {
          clearAuth()
        }
      },
    }
  )

  // Auto-refresh token
  const refreshTokenMutation = useMutation(authApi.refreshToken, {
    onSuccess: (response) => {
      if (response.data) {
        const { token: newToken, refresh_token: newRefreshToken } = response.data
        setAuth(user!, newToken, newRefreshToken || refreshToken)
      }
    },
    onError: () => {
      clearAuth()
      navigate('/login')
    },
  })

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials)
  }

  const register = (credentials: RegisterCredentials) => {
    registerMutation.mutate(credentials)
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  const refreshAuthToken = () => {
    if (refreshToken) {
      refreshTokenMutation.mutate(refreshToken)
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading: loginMutation.isLoading || registerMutation.isLoading,
    login,
    register,
    logout,
    refreshAuthToken,
    refetchUser,
    currentUser: currentUser?.data,
  }
}