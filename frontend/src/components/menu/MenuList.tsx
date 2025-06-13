import React from 'react';
import { Menu, MenuID } from '../../types';
import MenuCard from './MenuCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

export interface MenuListProps {
  menus: Menu[];
  loading?: boolean;
  onActivate?: (menuId: MenuID) => void;
  onEdit?: (menuId: MenuID) => void;
  onClone?: (menuId: MenuID) => void;
  onDelete?: (menuId: MenuID) => void;
  onCreateNew?: () => void;
  loadingMenuId?: string;
}

const MenuList: React.FC<MenuListProps> = ({
  menus,
  loading = false,
  onActivate,
  onEdit,
  onClone,
  onDelete,
  onCreateNew,
  loadingMenuId,
}) => {
  // Sort menus: active first, then by version descending
  const sortedMenus = [...menus].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return b.version - a.version;
  });

  if (loading && menus.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading menus..." />
      </div>
    );
  }

  if (!loading && menus.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No menus yet</h3>
        <p className="text-gray-600 mb-6">
          Create your first menu to start managing your restaurant's offerings.
        </p>
        {onCreateNew && (
          <Button variant="primary" onClick={onCreateNew}>
            Create Your First Menu
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Menus</h2>
          <p className="text-sm text-gray-600">
            {menus.length} menu{menus.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {onCreateNew && (
          <Button variant="primary" onClick={onCreateNew}>
            Create New Menu
          </Button>
        )}
      </div>

      {/* Active Menu Section */}
      {sortedMenus.some(menu => menu.is_active) && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Active Menu
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedMenus
              .filter(menu => menu.is_active)
              .map((menu) => (
                <MenuCard
                  key={menu.id.value}
                  menu={menu}
                  onActivate={onActivate}
                  onEdit={onEdit}
                  onClone={onClone}
                  onDelete={onDelete}
                  loading={loadingMenuId === menu.id.value}
                />
              ))}
          </div>
        </div>
      )}

      {/* Inactive Menus Section */}
      {sortedMenus.some(menu => !menu.is_active) && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Inactive Menus
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedMenus
              .filter(menu => !menu.is_active)
              .map((menu) => (
                <MenuCard
                  key={menu.id.value}
                  menu={menu}
                  onActivate={onActivate}
                  onEdit={onEdit}
                  onClone={onClone}
                  onDelete={onDelete}
                  loading={loadingMenuId === menu.id.value}
                />
              ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{menus.length}</div>
          <div className="text-sm text-gray-600">Total Menus</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {menus.filter(m => m.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {menus.reduce((total, menu) => total + menu.categories.length, 0)}
          </div>
          <div className="text-sm text-gray-600">Total Categories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {menus.reduce(
              (total, menu) => 
                total + menu.categories.reduce((catTotal, cat) => catTotal + cat.items.length, 0),
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
      </div>
    </div>
  );
};

export default MenuList;