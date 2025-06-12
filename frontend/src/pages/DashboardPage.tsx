import React from 'react'
import { useAuth } from '@hooks/useAuth'
import { 
  UsersIcon, 
  ChartBarIcon, 
  CogIcon,
  BellIcon 
} from '@heroicons/react/24/outline'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Total Users',
      value: '1,234',
      icon: UsersIcon,
      change: '+12%',
      changeType: 'increase',
    },
    {
      name: 'Revenue',
      value: '$12,345',
      icon: ChartBarIcon,
      change: '+8%',
      changeType: 'increase',
    },
    {
      name: 'Active Sessions',
      value: '456',
      icon: CogIcon,
      change: '-2%',
      changeType: 'decrease',
    },
    {
      name: 'Notifications',
      value: '23',
      icon: BellIcon,
      change: '+5%',
      changeType: 'increase',
    },
  ]

  const recentActivity = [
    { id: 1, action: 'User registration', user: 'john@example.com', time: '2 minutes ago' },
    { id: 2, action: 'Payment processed', user: 'jane@example.com', time: '5 minutes ago' },
    { id: 3, action: 'Data export', user: 'admin@example.com', time: '10 minutes ago' },
    { id: 4, action: 'User login', user: 'bob@example.com', time: '15 minutes ago' },
  ]

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg">
                    <stat.icon className="h-6 w-6 text-primary-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart Section */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Overview</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart placeholder</p>
                <p className="text-sm text-gray-400">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-600 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="card hover:shadow-lg transition-shadow text-left p-4">
              <UsersIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage user accounts</p>
            </button>
            
            <button className="card hover:shadow-lg transition-shadow text-left p-4">
              <ChartBarIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">View Reports</h3>
              <p className="text-sm text-gray-500 mt-1">Generate and view analytics reports</p>
            </button>
            
            <button className="card hover:shadow-lg transition-shadow text-left p-4">
              <CogIcon className="h-8 w-8 text-primary-600 mb-2" />
              <h3 className="font-medium text-gray-900">Settings</h3>
              <p className="text-sm text-gray-500 mt-1">Configure application settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}