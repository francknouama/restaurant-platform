import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useTasks } from '@hooks/useTasks'
import { 
  UsersIcon, 
  ChartBarIcon, 
  CogIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { SystemMetrics } from '@components/ui/SystemMetrics'
import { HealthCheck } from '@components/ui/HealthCheck'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { tasks, stats, isLoading } = useTasks({ limit: 5 })

  const quickStats = [
    {
      name: 'Total Tasks',
      value: stats?.total || 0,
      icon: ClipboardDocumentListIcon,
      change: '+12%',
      changeType: 'increase',
      color: 'blue',
    },
    {
      name: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircleIcon,
      change: '+8%',
      changeType: 'increase',
      color: 'green',
    },
    {
      name: 'In Progress',
      value: stats?.in_progress || 0,
      icon: ClockIcon,
      change: '+5%',
      changeType: 'increase',
      color: 'yellow',
    },
    {
      name: 'Pending',
      value: stats?.pending || 0,
      icon: ExclamationTriangleIcon,
      change: '-2%',
      changeType: 'decrease',
      color: 'red',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your application today.
          </p>
        </div>

        {/* System Health */}
        <div className="mb-8">
          <HealthCheck showDetails={true} className="card" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${getColorClasses(stat.color)}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <div className="flex items-baseline">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <span
                      className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'increase'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
              <Link 
                to="/dashboard/tasks" 
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0">
                      {task.status === 'completed' ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : task.status === 'in_progress' ? (
                        <ClockIcon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{task.status.replace('_', ' ')}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No tasks yet</p>
                <Link 
                  to="/dashboard/tasks" 
                  className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                >
                  Create your first task
                </Link>
              </div>
            )}
          </div>

          {/* System Metrics */}
          <SystemMetrics showDetails={false} />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/dashboard/tasks"
              className="card hover:shadow-lg transition-shadow text-left p-4 block"
            >
              <ClipboardDocumentListIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Tasks</h3>
              <p className="text-sm text-gray-500 mt-1">Create and manage your tasks</p>
            </Link>
            
            <button className="card hover:shadow-lg transition-shadow text-left p-4">
              <ChartBarIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">Analyze performance metrics</p>
            </button>
            
            <Link 
              to="/dashboard/profile"
              className="card hover:shadow-lg transition-shadow text-left p-4 block"
            >
              <CogIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure your profile</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}