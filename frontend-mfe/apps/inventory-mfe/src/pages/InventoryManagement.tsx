import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useInventoryStore, InventoryItem } from '../store';

const InventoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use inventory store
  const { items, loading, error, fetchItems } = useInventoryStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'stock' | 'value'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load inventory items from API
  useEffect(() => {
    const loadItems = async () => {
      try {
        await fetchItems();
      } catch (err) {
        console.error('Failed to load inventory items:', err);
      }
    };

    loadItems();
    
    // Handle search params for filtering
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    if (category) setSelectedCategory(category);
    if (status) setSelectedStatus(status);
  }, [searchParams, fetchItems]);

  const categories = ['all', ...Array.from(new Set(items.map(item => item.category)))];
  const statuses = ['all', 'in-stock', 'low-stock', 'out-of-stock', 'discontinued'];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }).sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'category':
        compareValue = a.category.localeCompare(b.category);
        break;
      case 'stock':
        compareValue = a.currentStock - b.currentStock;
        break;
      case 'value':
        compareValue = (a.currentStock * a.costPerUnit) - (b.currentStock * b.costPerUnit);
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in-stock': return 'text-green-600 bg-green-100';
      case 'low-stock': return 'text-amber-600 bg-amber-100';
      case 'out-of-stock': return 'text-red-600 bg-red-100';
      case 'discontinued': return 'text-neutral-600 bg-neutral-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStockLevel = (item: InventoryItem): { percentage: number; color: string } => {
    const percentage = (item.currentStock / item.maximumStock) * 100;
    let color = 'bg-green-500';
    if (percentage <= 20) color = 'bg-red-500';
    else if (percentage <= 40) color = 'bg-amber-500';
    
    return { percentage, color };
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  const handleBulkAction = (action: 'update-stock' | 'change-status' | 'export' | 'delete') => {
    console.log(`Bulk action ${action} for items:`, selectedItems);
    // Implementation would depend on the action
    setSelectedItems([]);
    setShowBulkActions(false);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  useEffect(() => {
    setShowBulkActions(selectedItems.length > 0);
  }, [selectedItems]);

  // Handle loading state
  if (loading && items.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Inventory Management</h1>
            <p className="text-neutral-600">Loading inventory items...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Inventory Management</h1>
            <p className="text-red-600">Error: {error}</p>
          </div>
          <Button onClick={() => fetchItems()} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Management</h1>
          <p className="text-neutral-600">
            {filteredItems.length} items {selectedItems.length > 0 && `• ${selectedItems.length} selected`}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/items/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Item
          </Button>
          
          <Button
            onClick={() => navigate('/stock/adjust')}
            variant="outline"
          >
            Adjust Stock
          </Button>
          
          <Button
            onClick={() => navigate('/items/import')}
            variant="outline"
          >
            Import Items
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium text-blue-900">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedItems([])}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => handleBulkAction('update-stock')}
                size="sm"
                variant="outline"
              >
                Update Stock
              </Button>
              <Button
                onClick={() => handleBulkAction('change-status')}
                size="sm"
                variant="outline"
              >
                Change Status
              </Button>
              <Button
                onClick={() => handleBulkAction('export')}
                size="sm"
                variant="outline"
              >
                Export
              </Button>
              <Button
                onClick={() => handleBulkAction('delete')}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items, SKU, or category..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status.split('-').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStatus('all');
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Clear Filters
            </Button>
            <Button
              onClick={() => navigate('/analytics')}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                  />
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Item</span>
                    <span>{getSortIcon('name')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    <span>{getSortIcon('category')}</span>
                  </div>
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Stock Level</span>
                    <span>{getSortIcon('stock')}</span>
                  </div>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:bg-neutral-100"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Value</span>
                    <span>{getSortIcon('value')}</span>
                  </div>
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Location
                </th>
                
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredItems.map(item => {
                const stockLevel = getStockLevel(item);
                const totalValue = item.currentStock * item.costPerUnit;
                
                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-neutral-50 ${
                      selectedItems.includes(item.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-neutral-900">{item.name}</div>
                        <div className="text-sm text-neutral-500">
                          SKU: {item.sku} • {item.supplier}
                        </div>
                        {(item as any).tags && (item as any).tags.length > 0 && (
                          <div className="flex space-x-1 mt-1">
                            {(item as any).tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {item.category}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-neutral-900">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-xs text-neutral-500">
                            / {item.maximumStock}
                          </div>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2 mt-1">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${stockLevel.color}`}
                            style={{ width: `${Math.min(stockLevel.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                          Min: {item.minimumStock} {item.unit}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">
                          ${totalValue.toFixed(2)}
                        </div>
                        <div className="text-xs text-neutral-500">
                          ${item.costPerUnit.toFixed(2)} per {item.unit}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      <div>
                        <div>{item.location}</div>
                        {item.expiryDate && (
                          <div className="text-xs text-amber-600">
                            Expires: {new Date(item.expiryDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/items/${item.id}`)}
                          size="sm"
                          variant="outline"
                        >
                          View
                        </Button>
                        <Button
                          onClick={() => navigate(`/stock/adjust?item=${item.id}`)}
                          size="sm"
                        >
                          Adjust
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">No items found</div>
            <div className="text-neutral-500 text-sm">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Start by adding your first inventory item'
              }
            </div>
            {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
              <Button
                onClick={() => navigate('/items/new')}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Add First Item
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;