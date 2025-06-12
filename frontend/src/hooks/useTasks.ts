import { useMutation, useQuery, useQueryClient } from 'react-query'
import { toast } from 'react-hot-toast'
import { tasksApi } from '@api/tasks'
import { Task, CreateTaskRequest, UpdateTaskRequest } from '@types/index'

export const useTasks = (params?: {
  page?: number
  limit?: number
  status?: string
  priority?: string
  assigned_to?: string
  search?: string
}) => {
  const queryClient = useQueryClient()

  // Get tasks query
  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ['tasks', params],
    () => tasksApi.getTasks(params),
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  )

  // Get task stats
  const { data: statsData } = useQuery(
    ['tasks', 'stats'],
    tasksApi.getTaskStats,
    {
      staleTime: 60000, // 1 minute
    }
  )

  // Create task mutation
  const createTaskMutation = useMutation(tasksApi.createTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation(
    ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      tasksApi.updateTask(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task updated successfully!')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to update task')
      },
    }
  )

  // Delete task mutation
  const deleteTaskMutation = useMutation(tasksApi.deleteTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task deleted successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete task')
    },
  })

  // Complete task mutation
  const completeTaskMutation = useMutation(tasksApi.completeTask, {
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks'])
      toast.success('Task completed!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete task')
    },
  })

  // Assign task mutation
  const assignTaskMutation = useMutation(
    ({ taskId, userId }: { taskId: string; userId: string }) =>
      tasksApi.assignTask(taskId, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tasks'])
        toast.success('Task assigned successfully!')
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to assign task')
      },
    }
  )

  return {
    // Data
    tasks: tasksData?.data?.data || [],
    pagination: tasksData?.data?.pagination,
    stats: statsData?.data,
    
    // Loading states
    isLoading,
    isCreating: createTaskMutation.isLoading,
    isUpdating: updateTaskMutation.isLoading,
    isDeleting: deleteTaskMutation.isLoading,
    
    // Error
    error,
    
    // Actions
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    completeTask: completeTaskMutation.mutate,
    assignTask: assignTaskMutation.mutate,
    refetch,
  }
}

export const useTask = (id: string) => {
  return useQuery(
    ['tasks', id],
    () => tasksApi.getTask(id),
    {
      enabled: !!id,
      staleTime: 30000,
    }
  )
}

export const useMyTasks = (params?: {
  status?: string
  priority?: string
  page?: number
  limit?: number
}) => {
  return useQuery(
    ['tasks', 'my', params],
    () => tasksApi.getMyTasks(params),
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  )
}