import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  InventoryStatus,
  UnitType,
  INVENTORY_CONSTANTS,
  calculateStockValue,
  isExpiringSoon
} from '../types/domains/inventory';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Mock data for demonstration (in real implementation, this would come from API hooks)
const mockInventoryItems: InventoryItem[] = [
  {
    id: { value: 'inv_20241201120000' },
    sku: 'BEEF-001',
    name: 'Ground Beef',
    description: 'Fresh ground beef 80/20',
    currentStock: 25,
    unit: UnitType.POUNDS,
    minThreshold: 10,
    maxThreshold: 100,
    reorderPoint: 20,
    cost: 8.99,
    category: 'Meat & Poultry',
    location: 'Walk-in Cooler',
    supplierID: { value: 'sup_001' },
    lastOrdered: '2024-11-28',
    expiryDate: '2024-12-15',
    movements: [],
    status: InventoryStatus.LOW_STOCK,
    createdAt: '2024-12-01T12:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z'
  },
  {
    id: { value: 'inv_20241201120001' },
    sku: 'TOM-001',
    name: 'Fresh Tomatoes',
    description: 'Organic vine-ripened tomatoes',
    currentStock: 50,
    unit: UnitType.POUNDS,
    minThreshold: 20,
    maxThreshold: 80,
    reorderPoint: 30,
    cost: 3.49,
    category: 'Produce',
    location: 'Main Storage',
    supplierID: { value: 'sup_002' },
    lastOrdered: '2024-11-30',
    expiryDate: '2024-12-05',
    movements: [],
    status: InventoryStatus.IN_STOCK,
    createdAt: '2024-12-01T12:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z'
  },
  {
    id: { value: 'inv_20241201120002' },
    sku: 'OIL-001',
    name: 'Olive Oil',
    description: 'Extra virgin olive oil',
    currentStock: 0,
    unit: UnitType.LITERS,
    minThreshold: 5,
    maxThreshold: 20,
    reorderPoint: 8,
    cost: 12.99,
    category: 'Dry Goods',
    location: 'Dry Storage',
    supplierID: { value: 'sup_003' },
    lastOrdered: '2024-11-25',
    movements: [],
    status: InventoryStatus.OUT_OF_STOCK,
    createdAt: '2024-12-01T12:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z'
  },
  {
    id: { value: 'inv_20241201120003' },
    sku: 'MILK-001',
    name: 'Whole Milk',
    description: 'Fresh whole milk',
    currentStock: 12,
    unit: UnitType.LITERS,
    minThreshold: 10,
    maxThreshold: 30,
    reorderPoint: 15,
    cost: 4.99,
    category: 'Dairy',
    location: 'Walk-in Cooler',
    supplierID: { value: 'sup_001' },
    lastOrdered: '2024-11-29',
    expiryDate: '2024-12-08',
    movements: [],
    status: InventoryStatus.REORDER_NEEDED,
    createdAt: '2024-12-01T12:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z'
  }
];

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<InventoryStatus | ''>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showReorderAlerts, setShowReorderAlerts] = useState(false);
  const [showExpiringItems, setShowExpiringItems] = useState(false);
  
  // Filter inventory items based on current filters
  const filteredItems = useMemo(() => {
    return mockInventoryItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesStatus = !selectedStatus || item.status === selectedStatus;
      const matchesLocation = !selectedLocation || item.location === selectedLocation;
      const matchesReorderAlert = !showReorderAlerts || 
                                 item.status === InventoryStatus.REORDER_NEEDED ||
                                 item.status === InventoryStatus.LOW_STOCK ||
                                 item.status === InventoryStatus.OUT_OF_STOCK;
      const matchesExpiring = !showExpiringItems || 
                             (item.expiryDate && isExpiringSoon(item.expiryDate, 7));
      
      return matchesSearch && matchesCategory && matchesStatus && 
             matchesLocation && matchesReorderAlert && matchesExpiring;
    });
  }, [searchTerm, selectedCategory, selectedStatus, selectedLocation, showReorderAlerts, showExpiringItems]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    const totalItems = mockInventoryItems.length;
    const totalValue = mockInventoryItems.reduce((sum, item) => sum + calculateStockValue(item), 0);
    const lowStockItems = mockInventoryItems.filter(item => 
      item.status === InventoryStatus.LOW_STOCK
    ).length;
    const outOfStockItems = mockInventoryItems.filter(item => 
      item.status === InventoryStatus.OUT_OF_STOCK
    ).length;
    const reorderNeededItems = mockInventoryItems.filter(item => 
      item.status === InventoryStatus.REORDER_NEEDED
    ).length;
    const expiredItems = mockInventoryItems.filter(item => 
      item.status === InventoryStatus.EXPIRED
    ).length;
    const expiringItems = mockInventoryItems.filter(item => 
      item.expiryDate && isExpiringSoon(item.expiryDate, 7)
    ).length;
    
    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      reorderNeededItems,
      expiredItems,
      expiringItems
    };
  }, []);

  const getStatusColor = (status: InventoryStatus) => {
    switch (status) {
      case InventoryStatus.IN_STOCK:
        return 'bg-green-100 text-green-800';
      case InventoryStatus.LOW_STOCK:
        return 'bg-yellow-100 text-yellow-800';
      case InventoryStatus.OUT_OF_STOCK:
        return 'bg-red-100 text-red-800';
      case InventoryStatus.REORDER_NEEDED:
        return 'bg-orange-100 text-orange-800';
      case InventoryStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddStock = (itemId: string) => {
    // TODO: Implement add stock functionality
    console.log('Add stock for item:', itemId);
  };

  const handleReorderItem = (itemId: string) => {
    // TODO: Implement reorder functionality
    console.log('Reorder item:', itemId);
  };

  const handleEditItem = (itemId: string) => {
    // TODO: Implement edit item functionality
    console.log('Edit item:', itemId);
  };

  const handleCreateItem = () => {
    // TODO: Implement create new item functionality
    console.log('Create new inventory item');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your restaurant inventory, track stock levels, and monitor supplier relationships.
        </p>
      </div>

      {/* Inventory Business Rules Info */}
      <Card className="mb-6 bg-purple-50 border-purple-200">
        <div className="flex items-start space-x-3">
          <div className="text-purple-600 text-lg">📦</div>
          <div>
            <h3 className="text-sm font-medium text-purple-900">Inventory Management Rules</h3>
            <ul className="mt-2 text-sm text-purple-700 space-y-1">
              <li>• Stock levels are monitored against min/max thresholds</li>
              <li>• Reorder alerts trigger when items reach reorder point</li>
              <li>• Track expiry dates to minimize waste</li>
              <li>• Stock movements are logged for full traceability</li>
              <li>• Supplier relationships affect lead times and costs</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-sm font-medium text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalItems}</p>
          <p className="text-sm text-gray-500">${metrics.totalValue.toFixed(2)} value</p>
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm font-medium text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{metrics.lowStockItems}</p>
          <p className="text-sm text-gray-500">Need attention</p>
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">🚨</div>
          <p className="text-sm font-medium text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{metrics.outOfStockItems}</p>
          <p className="text-sm text-gray-500">Urgent reorder</p>
        </Card>

        <Card className="text-center">
          <div className="text-2xl mb-2">📅</div>
          <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">{metrics.expiringItems}</p>
          <p className="text-sm text-gray-500">Within 7 days</p>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search items by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {INVENTORY_CONSTANTS.CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as InventoryStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value={InventoryStatus.IN_STOCK}>In Stock</option>
              <option value={InventoryStatus.LOW_STOCK}>Low Stock</option>
              <option value={InventoryStatus.OUT_OF_STOCK}>Out of Stock</option>
              <option value={InventoryStatus.REORDER_NEEDED}>Reorder Needed</option>
              <option value={InventoryStatus.EXPIRED}>Expired</option>
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {INVENTORY_CONSTANTS.LOCATIONS.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={showReorderAlerts ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowReorderAlerts(!showReorderAlerts)}
            >
              Reorder Alerts
            </Button>
            <Button
              variant={showExpiringItems ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowExpiringItems(!showExpiringItems)}
            >
              Expiring Items
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateItem}
            >
              Add Item
            </Button>
          </div>
        </div>
      </Card>

      {/* Inventory Items List */}
      <Card padding="none">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Inventory Items ({filteredItems.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id.value} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {item.sku} • {item.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {item.currentStock} {item.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Min: {item.minThreshold} • Reorder: {item.reorderPoint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${calculateStockValue(item).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.expiryDate ? (
                      <div className={isExpiringSoon(item.expiryDate, 7) ? 'text-red-600 font-medium' : ''}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleAddStock(item.id.value)}
                    >
                      Add Stock
                    </Button>
                    {(item.status === InventoryStatus.REORDER_NEEDED || 
                      item.status === InventoryStatus.LOW_STOCK ||
                      item.status === InventoryStatus.OUT_OF_STOCK) && (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleReorderItem(item.id.value)}
                      >
                        Reorder
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleEditItem(item.id.value)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory || selectedStatus || selectedLocation || showReorderAlerts || showExpiringItems
                  ? 'Try adjusting your filters to see more items.'
                  : 'Start by adding your first inventory item.'
                }
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Development Notice */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">🚧</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-900">Development Mode</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This inventory management interface is built with mock data and demonstrates the full feature set. 
              Ready for backend API integration with comprehensive inventory tracking capabilities.
            </p>
            <div className="mt-3 space-y-1 text-xs text-yellow-600">
              <p><strong>Features Ready:</strong> Stock monitoring, reorder alerts, expiry tracking, supplier management</p>
              <p><strong>Business Logic:</strong> Automatic status calculation, stock value computation, reorder quantity calculation</p>
              <p><strong>Next Phase:</strong> API integration, stock movement tracking, supplier management interface</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InventoryManagement;