import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '@restaurant/shared-ui';
import { getRoleDisplayName, PermissionResources, PermissionActions } from '@restaurant/shared-utils';

const DashboardPage: React.FC = () => {
  const { user, canAccess } = useAuth();

  const stats = [
    {
      title: 'Today\'s Orders',
      value: '42',
      change: '+12%',
      icon: '🛍️',
      permission: { resource: PermissionResources.ORDER, action: PermissionActions.READ },
    },
    {
      title: 'Active Tables',
      value: '8/12',
      change: '67%',
      icon: '🪑',
      permission: { resource: PermissionResources.RESERVATION, action: PermissionActions.READ },
    },
    {
      title: 'Kitchen Queue',
      value: '5',
      change: 'orders',
      icon: '👨‍🍳',
      permission: { resource: PermissionResources.KITCHEN, action: PermissionActions.READ },
    },
    {
      title: 'Today\'s Revenue',
      value: '$2,847',
      change: '+8%',
      icon: '💰',
      permission: { resource: PermissionResources.ORDER, action: PermissionActions.READ },
    },
  ];

  const visibleStats = stats.filter(stat => 
    canAccess(stat.permission.resource, stat.permission.action)
  );

  const quickActions = [
    {
      title: 'Create Order',
      description: 'Start a new customer order',
      icon: '➕',
      path: '/orders/new',
      permission: { resource: PermissionResources.ORDER, action: PermissionActions.CREATE },
    },
    {
      title: 'View Kitchen',
      description: 'Check kitchen status',
      icon: '👀',
      path: '/kitchen',
      permission: { resource: PermissionResources.KITCHEN, action: PermissionActions.READ },
    },
    {
      title: 'Manage Menu',
      description: 'Update menu items',
      icon: '📝',
      path: '/menu',
      permission: { resource: PermissionResources.MENU, action: PermissionActions.UPDATE },
    },
    {
      title: 'Reservations',
      description: 'View today\'s bookings',
      icon: '📅',
      path: '/reservations',
      permission: { resource: PermissionResources.RESERVATION, action: PermissionActions.READ },
    },
  ];

  const visibleActions = quickActions.filter(action => 
    canAccess(action.permission.resource, action.permission.action)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900">
          Welcome back, {user?.user.email.split('@')[0]}!
        </h2>
        <p className="mt-1 text-neutral-600">
          You're logged in as <span className="font-medium">{getRoleDisplayName(user?.role.name || '')}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-neutral-900">{stat.value}</p>
                <p className="mt-1 text-sm text-green-600">{stat.change}</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
              padding="sm"
            >
              <a href={action.path} className="block">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{action.icon}</div>
                  <div>
                    <p className="font-medium text-neutral-900">{action.title}</p>
                    <p className="text-sm text-neutral-600">{action.description}</p>
                  </div>
                </div>
              </a>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-xl font-bold text-neutral-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🛍️</span>
              <div>
                <p className="font-medium">New order #1234</p>
                <p className="text-sm text-neutral-600">Table 5 • 2 minutes ago</p>
              </div>
            </div>
            <span className="text-green-600 font-medium">$45.80</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center space-x-3">
              <span className="text-xl">✅</span>
              <div>
                <p className="font-medium">Order completed</p>
                <p className="text-sm text-neutral-600">Table 3 • 5 minutes ago</p>
              </div>
            </div>
            <span className="text-neutral-600">Completed</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="font-medium">New reservation</p>
                <p className="text-sm text-neutral-600">Party of 4 • 7:30 PM</p>
              </div>
            </div>
            <span className="text-blue-600">Tonight</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;