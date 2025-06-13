import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '@restaurant/shared-ui';

const MenuListPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Menu Management</h1>
          <p className="mt-2 text-neutral-600">Manage your restaurant menus and items</p>
        </div>
        <div className="flex space-x-3">
          <Link to="/menu/items">
            <Button variant="outline">Manage Items</Button>
          </Link>
          <Link to="/menu/categories">
            <Button variant="outline">Categories</Button>
          </Link>
          <Button variant="primary">Create Menu</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">1</div>
            <div className="text-sm text-neutral-600">Active Menu</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900">24</div>
            <div className="text-sm text-neutral-600">Menu Items</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-neutral-900">6</div>
            <div className="text-sm text-neutral-600">Categories</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">22</div>
            <div className="text-sm text-neutral-600">Available Items</div>
          </div>
        </Card>
      </div>

      {/* Menu List */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Current Menu</h2>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Link to="/menu/edit/current">Edit</Link>
              </Button>
              <Button variant="outline" size="sm">
                <Link to="/menu/preview/current">Preview</Link>
              </Button>
            </div>
          </div>
          
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Spring Menu 2024</h3>
                <p className="text-sm text-neutral-600">Active since March 1, 2024</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
                <span className="text-sm text-neutral-600">24 items</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/menu/items" className="block">
            <div className="text-center space-y-2">
              <div className="text-4xl">📋</div>
              <h3 className="font-medium">Manage Items</h3>
              <p className="text-sm text-neutral-600">Add, edit, or remove menu items</p>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/menu/categories" className="block">
            <div className="text-center space-y-2">
              <div className="text-4xl">🏷️</div>
              <h3 className="font-medium">Categories</h3>
              <p className="text-sm text-neutral-600">Organize menu categories</p>
            </div>
          </Link>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/menu/analytics" className="block">
            <div className="text-center space-y-2">
              <div className="text-4xl">📊</div>
              <h3 className="font-medium">Analytics</h3>
              <p className="text-sm text-neutral-600">View menu performance</p>
            </div>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default MenuListPage;