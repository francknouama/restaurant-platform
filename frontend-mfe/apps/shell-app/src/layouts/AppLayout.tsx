import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, StatusBadge } from '@restaurant/shared-ui';
import { getRoleDisplayName, getRoleColor, PermissionResources, PermissionActions } from '@restaurant/shared-utils';
import { useNotifications } from '@restaurant/shared-state';

const AppLayout: React.FC = () => {
  const { user, logout, canAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { notifications } = useNotifications();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: '🏠',
      permission: null, // Everyone can see dashboard
    },
    {
      name: 'Menu Management',
      path: '/menu',
      icon: '📋',
      permission: { resource: PermissionResources.MENU, action: PermissionActions.READ },
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: '🛍️',
      permission: { resource: PermissionResources.ORDER, action: PermissionActions.READ },
    },
    {
      name: 'Kitchen',
      path: '/kitchen',
      icon: '👨‍🍳',
      permission: { resource: PermissionResources.KITCHEN, action: PermissionActions.READ },
    },
    {
      name: 'Reservations',
      path: '/reservations',
      icon: '📅',
      permission: { resource: PermissionResources.RESERVATION, action: PermissionActions.READ },
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: '📦',
      permission: { resource: PermissionResources.INVENTORY, action: PermissionActions.READ },
    },
  ];

  const visibleNavItems = navigationItems.filter(item => 
    !item.permission || canAccess(item.permission.resource, item.permission.action)
  );

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-neutral-900 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🍽️</span>
              {isSidebarOpen && (
                <span className="font-bold text-xl">Restaurant</span>
              )}
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-neutral-400 hover:text-white"
            >
              {isSidebarOpen ? '←' : '→'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {visibleNavItems.map(item => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-neutral-800">
          {user && (
            <div className={`${isSidebarOpen ? 'space-y-3' : 'space-y-2'}`}>
              {isSidebarOpen ? (
                <>
                  <div className="text-sm">
                    <p className="text-neutral-400">Logged in as</p>
                    <p className="font-medium truncate">{user.user.email}</p>
                  </div>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs ${getRoleColor(user.role.name)}`}>
                    {getRoleDisplayName(user.role.name)}
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="w-full text-center text-neutral-400 hover:text-white"
                  title="Logout"
                >
                  🚪
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-900">
              {visibleNavItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h1>
            
            {/* Notifications */}
            <div className="flex items-center space-x-4">
              {notifications.length > 0 && (
                <div className="relative">
                  <button className="text-neutral-600 hover:text-neutral-900">
                    🔔
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-neutral-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;