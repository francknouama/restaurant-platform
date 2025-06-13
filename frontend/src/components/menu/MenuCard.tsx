import React from 'react';
import { Menu, MenuID } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export interface MenuCardProps {
  menu: Menu;
  onActivate?: (menuId: MenuID) => void;
  onEdit?: (menuId: MenuID) => void;
  onClone?: (menuId: MenuID) => void;
  onDelete?: (menuId: MenuID) => void;
  loading?: boolean;
}

const MenuCard: React.FC<MenuCardProps> = ({
  menu,
  onActivate,
  onEdit,
  onClone,
  onDelete,
  loading = false,
}) => {
  const totalItems = menu.categories.reduce((total, category) => total + category.items.length, 0);
  const availableItems = menu.categories.reduce(
    (total, category) => total + category.items.filter(item => item.isAvailable).length,
    0
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-lg ${menu.is_active ? 'ring-2 ring-orange-500 bg-orange-50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{menu.name}</h3>
            <StatusBadge status={menu.is_active ? 'active' : 'inactive'}>
              {menu.is_active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <span>Version {menu.version}</span>
            <span>•</span>
            <span>Since {formatDate(menu.start_date)}</span>
            {menu.end_date && (
              <>
                <span>•</span>
                <span>Until {formatDate(menu.end_date)}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{menu.categories.length} categories</span>
            <span>•</span>
            <span>{totalItems} items</span>
            <span>•</span>
            <span className="text-green-600">{availableItems} available</span>
          </div>
        </div>
      </div>

      {/* Menu Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{menu.categories.length}</div>
          <div className="text-xs text-gray-600">Categories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
          <div className="text-xs text-gray-600">Total Items</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{availableItems}</div>
          <div className="text-xs text-gray-600">Available</div>
        </div>
      </div>

      {/* Categories Preview */}
      {menu.categories.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categories:</h4>
          <div className="flex flex-wrap gap-1">
            {menu.categories.slice(0, 4).map((category) => (
              <span
                key={category.id.value}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {category.name} ({category.items.length})
              </span>
            ))}
            {menu.categories.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{menu.categories.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {!menu.is_active && onActivate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onActivate(menu.id)}
            loading={loading}
          >
            Activate
          </Button>
        )}
        
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(menu.id)}
            disabled={loading}
          >
            Edit
          </Button>
        )}
        
        {onClone && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClone(menu.id)}
            disabled={loading}
          >
            Clone
          </Button>
        )}
        
        {onDelete && !menu.is_active && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(menu.id)}
            disabled={loading}
          >
            Delete
          </Button>
        )}
      </div>
      
      {menu.is_active && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <span className="text-green-600 text-sm">✓</span>
            <span className="ml-2 text-sm text-green-700 font-medium">
              This is your active menu visible to customers
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MenuCard;