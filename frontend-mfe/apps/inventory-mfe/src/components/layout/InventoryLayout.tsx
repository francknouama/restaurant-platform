import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface InventoryLayoutProps {
  children: React.ReactNode;
}

const InventoryLayout: React.FC<InventoryLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/items', label: 'Items', icon: '🏷️' },
    { path: '/categories', label: 'Categories', icon: '📋' },
    { path: '/stock', label: 'Stock', icon: '📈' },
    { path: '/suppliers', label: 'Suppliers', icon: '🏢' },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: '🛒' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/alerts', label: 'Alerts', icon: '🚨' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-neutral-900">📦 Inventory Management</h1>
              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                    }`}
                  >
                    <span className="mr-1">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/alerts')}
                variant={isActive('/alerts') ? 'primary' : 'outline'}
                size="sm"
              >
                🚨 Alerts
              </Button>
              
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-shell'))}
                variant="outline"
                size="sm"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-neutral-200">
        <div className="px-4 py-2">
          <select
            value={location.pathname}
            onChange={(e) => navigate(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {navigationItems.map((item) => (
              <option key={item.path} value={item.path}>
                {item.icon} {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <Button
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            onClick={() => {
              const menu = document.getElementById('quick-actions-menu');
              if (menu) {
                menu.classList.toggle('hidden');
              }
            }}
          >
            ⚡
          </Button>
          
          <div
            id="quick-actions-menu"
            className="hidden absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 w-48"
          >
            <button
              onClick={() => navigate('/items/new')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              ➕ Add New Item
            </button>
            <button
              onClick={() => navigate('/purchase-orders/new')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              🛒 Create Purchase Order
            </button>
            <button
              onClick={() => navigate('/stock/adjust')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              📈 Adjust Stock
            </button>
            <button
              onClick={() => navigate('/suppliers/new')}
              className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
            >
              🏢 Add Supplier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLayout;