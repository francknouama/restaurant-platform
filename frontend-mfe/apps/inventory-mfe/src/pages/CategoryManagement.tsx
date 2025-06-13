import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface Category {
  id: string;
  name: string;
  description: string;
  parentCategory?: string;
  itemCount: number;
  totalValue: number;
  color: string;
  icon: string;
  minimumStock: number;
  createdAt: string;
  isActive: boolean;
}

const CategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    parentCategory: '',
    color: '#3B82F6',
    icon: '🏷️',
    minimumStock: 0
  });

  useEffect(() => {
    // Mock data
    const mockCategories: Category[] = [
      {
        id: 'cat_1',
        name: 'Meat',
        description: 'Fresh and frozen meat products',
        itemCount: 45,
        totalValue: 12500,
        color: '#DC2626',
        icon: '🍖',
        minimumStock: 50,
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_2',
        name: 'Seafood',
        description: 'Fresh fish and shellfish',
        itemCount: 28,
        totalValue: 8750,
        color: '#0891B2',
        icon: '🐟',
        minimumStock: 30,
        createdAt: '2024-01-02T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_3',
        name: 'Vegetables',
        description: 'Fresh produce and vegetables',
        itemCount: 62,
        totalValue: 3200,
        color: '#16A34A',
        icon: '🥕',
        minimumStock: 100,
        createdAt: '2024-01-03T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_4',
        name: 'Dairy',
        description: 'Milk, cheese, and dairy products',
        itemCount: 34,
        totalValue: 4800,
        color: '#F59E0B',
        icon: '🧀',
        minimumStock: 40,
        createdAt: '2024-01-04T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_5',
        name: 'Grains',
        description: 'Rice, pasta, bread, and cereals',
        itemCount: 18,
        totalValue: 1500,
        color: '#D97706',
        icon: '🌾',
        minimumStock: 25,
        createdAt: '2024-01-05T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_6',
        name: 'Condiments',
        description: 'Sauces, oils, and seasonings',
        itemCount: 52,
        totalValue: 2800,
        color: '#7C3AED',
        icon: '🥬',
        minimumStock: 15,
        createdAt: '2024-01-06T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_7',
        name: 'Beverages',
        description: 'Drinks, juices, and alcoholic beverages',
        itemCount: 24,
        totalValue: 3600,
        color: '#EC4899',
        icon: '🍻',
        minimumStock: 50,
        createdAt: '2024-01-07T00:00:00Z',
        isActive: true
      },
      {
        id: 'cat_8',
        name: 'Spices',
        description: 'Herbs, spices, and seasonings',
        itemCount: 35,
        totalValue: 1200,
        color: '#059669',
        icon: '🌶️',
        minimumStock: 10,
        createdAt: '2024-01-08T00:00:00Z',
        isActive: true
      }
    ];
    
    setCategories(mockCategories);
  }, []);

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    
    const category: Category = {
      id: `cat_${Date.now()}`,
      name: newCategory.name,
      description: newCategory.description,
      parentCategory: newCategory.parentCategory || undefined,
      itemCount: 0,
      totalValue: 0,
      color: newCategory.color,
      icon: newCategory.icon,
      minimumStock: newCategory.minimumStock,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    setCategories(prev => [...prev, category]);
    setNewCategory({
      name: '',
      description: '',
      parentCategory: '',
      color: '#3B82F6',
      icon: '🏷️',
      minimumStock: 0
    });
    setShowAddModal(false);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description,
      parentCategory: category.parentCategory || '',
      color: category.color,
      icon: category.icon,
      minimumStock: category.minimumStock
    });
    setShowAddModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return;
    
    setCategories(prev => prev.map(cat => 
      cat.id === editingCategory.id
        ? {
            ...cat,
            name: newCategory.name,
            description: newCategory.description,
            parentCategory: newCategory.parentCategory || undefined,
            color: newCategory.color,
            icon: newCategory.icon,
            minimumStock: newCategory.minimumStock
          }
        : cat
    ));
    
    setEditingCategory(null);
    setNewCategory({
      name: '',
      description: '',
      parentCategory: '',
      color: '#3B82F6',
      icon: '🏷️',
      minimumStock: 0
    });
    setShowAddModal(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    if (category.itemCount > 0) {
      alert(`Cannot delete category "${category.name}" because it contains ${category.itemCount} items. Please move or delete the items first.`);
      return;
    }
    
    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  const handleToggleActive = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId
        ? { ...cat, isActive: !cat.isActive }
        : cat
    ));
  };

  const colorOptions = [
    '#DC2626', '#EA580C', '#D97706', '#CA8A04', '#65A30D',
    '#16A34A', '#059669', '#0891B2', '#0284C7', '#2563EB',
    '#4F46E5', '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
    '#E11D48'
  ];

  const iconOptions = [
    '🏷️', '🍖', '🐟', '🥕', '🧀', '🌾',
    '🥬', '🍻', '🌶️', '🥩', '🍞', '🍳',
    '🥚', '🍎', '🥐', '🍿'
  ];

  const totalItems = categories.reduce((sum, cat) => sum + cat.itemCount, 0);
  const totalValue = categories.reduce((sum, cat) => sum + cat.totalValue, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Category Management</h1>
          <p className="text-neutral-600">
            {categories.length} categories • {totalItems} total items • ${totalValue.toLocaleString()} total value
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Category
          </Button>
          
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
          >
            View Items
          </Button>
        </div>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-blue-600">{categories.length}</div>
          <div className="metric-label">Total Categories</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-green-600">{categories.filter(c => c.isActive).length}</div>
          <div className="metric-label">Active Categories</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-purple-600">{totalItems}</div>
          <div className="metric-label">Total Items</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-amber-600">${(totalValue / 1000).toFixed(0)}K</div>
          <div className="metric-label">Total Value</div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map(category => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">{category.name}</h3>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    category.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  className="text-neutral-400 hover:text-neutral-600 p-1"
                  onClick={() => {
                    const menu = document.getElementById(`menu-${category.id}`);
                    if (menu) {
                      menu.classList.toggle('hidden');
                    }
                  }}
                >
                  ⋮
                </button>
                <div 
                  id={`menu-${category.id}`}
                  className="hidden absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 w-32 z-10"
                >
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(category.id)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => navigate(`/inventory?category=${category.name}`)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    View Items
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-neutral-600 mb-4">{category.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-neutral-900">{category.itemCount}</div>
                <div className="text-neutral-500">Items</div>
              </div>
              <div>
                <div className="font-medium text-neutral-900">${category.totalValue.toLocaleString()}</div>
                <div className="text-neutral-500">Value</div>
              </div>
              <div>
                <div className="font-medium text-neutral-900">{category.minimumStock}</div>
                <div className="text-neutral-500">Min Stock</div>
              </div>
              <div>
                <div className="font-medium text-neutral-900">
                  {new Date(category.createdAt).toLocaleDateString()}
                </div>
                <div className="text-neutral-500">Created</div>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <Button
                onClick={() => navigate(`/inventory?category=${category.name}`)}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                View Items
              </Button>
              <Button
                onClick={() => handleEditCategory(category)}
                size="sm"
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
        
        {/* Add Category Card */}
        <div 
          onClick={() => setShowAddModal(true)}
          className="bg-neutral-50 border-2 border-dashed border-neutral-300 rounded-lg p-6 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xl mb-4">
            +
          </div>
          <div className="font-medium text-neutral-700">Add New Category</div>
          <div className="text-sm text-neutral-500 text-center mt-1">
            Create a new category to organize your inventory
          </div>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe this category..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Icon
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {iconOptions.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewCategory(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 border rounded-md flex items-center justify-center text-lg hover:bg-neutral-50 ${
                          newCategory.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-neutral-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded border-2 ${
                          newCategory.color === color ? 'border-neutral-900' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Default Minimum Stock
                </label>
                <input
                  type="number"
                  value={newCategory.minimumStock}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, minimumStock: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={newCategory.parentCategory}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, parentCategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No parent category</option>
                  {categories
                    .filter(cat => editingCategory ? cat.id !== editingCategory.id : true)
                    .map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setNewCategory({
                    name: '',
                    description: '',
                    parentCategory: '',
                    color: '#3B82F6',
                    icon: '🏷️',
                    minimumStock: 0
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newCategory.name.trim()}
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;