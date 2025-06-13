import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  description: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Restaurant overview'
  },
  {
    name: 'Menus',
    href: '/menus',
    icon: '📋',
    description: 'Menu management'
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: '🛒',
    description: 'Order processing',
    badge: 8
  },
  {
    name: 'Kitchen',
    href: '/kitchen',
    icon: '👨‍🍳',
    description: 'Kitchen dashboard',
    badge: 5
  },
  {
    name: 'Reservations',
    href: '/reservations',
    icon: '📅',
    description: 'Table bookings'
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: '📦',
    description: 'Stock management'
  }
];

const RestaurantSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white shadow-lg h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="text-2xl">🍽️</div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">Restaurant</h1>
            <p className="text-sm text-gray-600">Management Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-orange-100 text-orange-900 border-r-2 border-orange-500'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              end={item.href === '/'}
            >
              <span className="text-lg mr-3">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 px-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Today's Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Orders</span>
              <span className="font-medium text-gray-900">47</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue</span>
              <span className="font-medium text-green-600">$1,247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Avg Time</span>
              <span className="font-medium text-gray-900">12m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-600">Restaurant Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSidebar;