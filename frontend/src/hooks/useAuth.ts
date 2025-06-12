import { useMutation, useQuery } from 'react-query'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

import { authApi } from '@api/auth'
import { useAuthStore } from '@store/authStore'
import { LoginCredentials, RegisterCredentials } from '@types/index'

export const useAuth = () => {
  const navigate = useNavigate()
  const { setAuth, clearAuth, setLoading, user, isAuthenticated } = useAuthStore()

  const loginMutation = useMutation(authApi.login, {
    onMutate: () => {
      setLoading(true)
    },
    onSuccess: (response) => {
      if (response.data) {
        setAuth(response.data.user, response.data.token)
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
        setAuth(response.data.user, response.data.token)
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
  const { data: currentUser } = useQuery(
    ['auth', 'me'],
    authApi.me,
    {
      enabled: isAuthenticated && !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: () => {
        clearAuth()
      },
    }
  )

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials)
  }

  const register = (credentials: RegisterCredentials) => {
    registerMutation.mutate(credentials)
  }

  const logout = () => {
    logoutMutation.mutate()
  }

  return {
    user,
    isAuthenticated,
    isLoading: loginMutation.isLoading || registerMutation.isLoading,
    login,
    register,
    logout,
    currentUser: currentUser?.data,
  }
}