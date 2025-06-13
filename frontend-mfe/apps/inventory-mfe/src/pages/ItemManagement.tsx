import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface ItemDetails {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  unit: string;
  costPerUnit: number;
  sellingPrice?: number;
  supplier: string;
  alternativeSuppliers: string[];
  location: string;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  images: string[];
  specifications: Record<string, string>;
  storageInstructions?: string;
  allergens: string[];
  nutritionalInfo?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  lastOrderDate?: string;
  averageUsage: number;
  seasonality?: 'year-round' | 'seasonal';
  perishable: boolean;
  shelfLife?: number;
}

const ItemManagement: React.FC = () => {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'stock' | 'suppliers' | 'history'>('details');

  useEffect(() => {
    if (itemId && itemId !== 'new') {
      // Mock data for existing item
      const mockItem: ItemDetails = {
        id: itemId,
        name: 'Premium Beef Tenderloin',
        category: 'Meat',
        subcategory: 'Beef',
        sku: 'SKU0001',
        barcode: '123456789012',
        description: 'Premium grade beef tenderloin, grass-fed and aged for optimal tenderness and flavor.',
        currentStock: 15,
        minimumStock: 5,
        maximumStock: 50,
        reorderPoint: 8,
        unit: 'lbs',
        costPerUnit: 28.50,
        sellingPrice: 45.00,
        supplier: 'Premium Foods Co.',
        alternativeSuppliers: ['Quality Meats Inc.', 'Farm Direct Supply'],
        location: 'Walk-in Cooler A',
        status: 'active',
        tags: ['premium', 'grass-fed', 'aged'],
        images: ['/images/beef-tenderloin-1.jpg', '/images/beef-tenderloin-2.jpg'],
        specifications: {
          'Grade': 'USDA Prime',
          'Cut': 'Whole Tenderloin',
          'Weight Range': '4-6 lbs',
          'Aging': '21 days',
          'Source': 'Grass-Fed Cattle'
        },
        storageInstructions: 'Store at 32-36°F. Use within 7 days of delivery.',
        allergens: [],
        nutritionalInfo: {
          'Protein': '26g per 100g',
          'Fat': '8g per 100g',
          'Calories': '179 per 100g'
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        lastOrderDate: '2024-01-18T09:00:00Z',
        averageUsage: 3.2,
        seasonality: 'year-round',
        perishable: true,
        shelfLife: 7
      };
      setItem(mockItem);
    } else if (itemId === 'new') {
      // Initialize new item form
      setIsEditing(true);
      setItem({
        id: '',
        name: '',
        category: '',
        sku: '',
        description: '',
        currentStock: 0,
        minimumStock: 0,
        maximumStock: 0,
        reorderPoint: 0,
        unit: 'pcs',
        costPerUnit: 0,
        supplier: '',
        alternativeSuppliers: [],
        location: '',
        status: 'active',
        tags: [],
        images: [],
        specifications: {},
        allergens: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        averageUsage: 0,
        perishable: false
      });
    }
  }, [itemId]);

  if (!item) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-neutral-600">Loading item details...</span>
      </div>
    );
  }

  const handleSave = () => {
    // Implementation would save to backend
    console.log('Saving item:', item);
    setIsEditing(false);
    if (itemId === 'new') {
      navigate(`/items/${item.id || 'new-item-id'}`);
    }
  };

  const handleDelete = () => {
    // Implementation would delete from backend
    console.log('Deleting item:', item.id);
    navigate('/items');
  };

  const updateItem = (updates: Partial<ItemDetails>) => {
    setItem(prev => prev ? { ...prev, ...updates } : null);
  };

  const isNewItem = itemId === 'new';

  const tabs = [
    { id: 'details', label: 'Details', icon: '📝' },
    { id: 'stock', label: 'Stock Info', icon: '📦' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
    { id: 'history', label: 'History', icon: '📊' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
            size="sm"
          >
            ← Back to Inventory
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {isNewItem ? 'Add New Item' : item.name}
            </h1>
            {!isNewItem && (
              <p className="text-neutral-600">
                SKU: {item.sku} • {item.category}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {!isNewItem && !isEditing && (
            <>
              <Button
                onClick={() => navigate(`/stock/adjust?item=${item.id}`)}
                variant="outline"
              >
                Adjust Stock
              </Button>
              <Button
                onClick={() => navigate(`/purchase-orders/new?item=${item.id}`)}
                variant="outline"
              >
                Reorder
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Edit Item
              </Button>
            </>
          )}
          
          {isEditing && (
            <>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  if (isNewItem) navigate('/inventory');
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                {isNewItem ? 'Create Item' : 'Save Changes'}
              </Button>
            </>
          )}
          
          {!isNewItem && !isEditing && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {!isNewItem && (
        <div className={`rounded-lg p-4 ${
          item.currentStock === 0 ? 'bg-red-50 border border-red-200' :
          item.currentStock <= item.minimumStock ? 'bg-amber-50 border border-amber-200' :
          'bg-green-50 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-semibold ${
                item.currentStock === 0 ? 'text-red-800' :
                item.currentStock <= item.minimumStock ? 'text-amber-800' :
                'text-green-800'
              }`}>
                {item.currentStock === 0 ? 'Out of Stock' :
                 item.currentStock <= item.minimumStock ? 'Low Stock Alert' :
                 'In Stock'}
              </h3>
              <p className={`text-sm ${
                item.currentStock === 0 ? 'text-red-700' :
                item.currentStock <= item.minimumStock ? 'text-amber-700' :
                'text-green-700'
              }`}>
                Current stock: {item.currentStock} {item.unit} • Minimum: {item.minimumStock} {item.unit}
              </p>
            </div>
            {item.currentStock <= item.minimumStock && (
              <Button
                onClick={() => navigate(`/purchase-orders/new?item=${item.id}`)}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700"
              >
                Reorder Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {activeTab === 'details' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Item Name *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem({ name: e.target.value })}
                      className="form-input"
                      placeholder="Enter item name"
                    />
                  ) : (
                    <div className="text-neutral-900">{item.name}</div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Category *
                    </label>
                    {isEditing ? (
                      <select
                        value={item.category}
                        onChange={(e) => updateItem({ category: e.target.value })}
                        className="form-select"
                      >
                        <option value="">Select category</option>
                        <option value="Meat">Meat</option>
                        <option value="Seafood">Seafood</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains</option>
                        <option value="Condiments">Condiments</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Spices">Spices</option>
                      </select>
                    ) : (
                      <div className="text-neutral-900">{item.category}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      SKU *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.sku}
                        onChange={(e) => updateItem({ sku: e.target.value })}
                        className="form-input"
                        placeholder="SKU001"
                      />
                    ) : (
                      <div className="text-neutral-900">{item.sku}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  {isEditing ? (
                    <textarea
                      value={item.description}
                      onChange={(e) => updateItem({ description: e.target.value })}
                      rows={3}
                      className="form-input"
                      placeholder="Describe the item..."
                    />
                  ) : (
                    <div className="text-neutral-900">{item.description || 'No description'}</div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Unit *
                    </label>
                    {isEditing ? (
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem({ unit: e.target.value })}
                        className="form-select"
                      >
                        <option value="pcs">Pieces</option>
                        <option value="lbs">Pounds</option>
                        <option value="kg">Kilograms</option>
                        <option value="bottles">Bottles</option>
                        <option value="cans">Cans</option>
                        <option value="boxes">Boxes</option>
                        <option value="gallons">Gallons</option>
                        <option value="liters">Liters</option>
                      </select>
                    ) : (
                      <div className="text-neutral-900">{item.unit}</div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Status
                    </label>
                    {isEditing ? (
                      <select
                        value={item.status}
                        onChange={(e) => updateItem({ status: e.target.value as any })}
                        className="form-select"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'active' ? 'bg-green-100 text-green-800' :
                        item.status === 'inactive' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Pricing & Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing & Location</h3>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Cost per Unit *
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-500">$</span>
                      <input
                        type="number"
                        value={item.costPerUnit}
                        onChange={(e) => updateItem({ costPerUnit: parseFloat(e.target.value) || 0 })}
                        className="form-input pl-8"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <div className="text-neutral-900">${item.costPerUnit.toFixed(2)}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Selling Price
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-neutral-500">$</span>
                      <input
                        type="number"
                        value={item.sellingPrice || ''}
                        onChange={(e) => updateItem({ sellingPrice: parseFloat(e.target.value) || undefined })}
                        className="form-input pl-8"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <div className="text-neutral-900">
                      {item.sellingPrice ? `$${item.sellingPrice.toFixed(2)}` : 'Not set'}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Storage Location *
                  </label>
                  {isEditing ? (
                    <select
                      value={item.location}
                      onChange={(e) => updateItem({ location: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Select location</option>
                      <option value="Main Storage">Main Storage</option>
                      <option value="Walk-in Cooler">Walk-in Cooler</option>
                      <option value="Freezer A">Freezer A</option>
                      <option value="Freezer B">Freezer B</option>
                      <option value="Dry Storage">Dry Storage</option>
                      <option value="Wine Cellar">Wine Cellar</option>
                    </select>
                  ) : (
                    <div className="text-neutral-900">{item.location}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Primary Supplier *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={item.supplier}
                      onChange={(e) => updateItem({ supplier: e.target.value })}
                      className="form-input"
                      placeholder="Supplier name"
                    />
                  ) : (
                    <div className="text-neutral-900">{item.supplier}</div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={item.perishable}
                      onChange={(e) => updateItem({ perishable: e.target.checked })}
                      disabled={!isEditing}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Perishable item</span>
                  </label>
                </div>
                
                {item.perishable && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Shelf Life (days)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={item.shelfLife || ''}
                        onChange={(e) => updateItem({ shelfLife: parseInt(e.target.value) || undefined })}
                        className="form-input"
                        placeholder="7"
                      />
                    ) : (
                      <div className="text-neutral-900">{item.shelfLife || 'Not specified'} days</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {tag}
                    {isEditing && (
                      <button
                        onClick={() => updateItem({ tags: item.tags.filter(t => t !== tag) })}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {isEditing && (
                  <button
                    onClick={() => {
                      const tag = prompt('Enter tag name:');
                      if (tag && !item.tags.includes(tag)) {
                        updateItem({ tags: [...item.tags, tag] });
                      }
                    }}
                    className="px-3 py-1 border border-neutral-300 text-neutral-600 rounded-full text-sm hover:bg-neutral-50"
                  >
                    + Add Tag
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stock' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Stock Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="metric-card">
                <div className="metric-value text-blue-600">{item.currentStock}</div>
                <div className="metric-label">Current Stock</div>
                <div className="text-xs text-neutral-500 mt-1">{item.unit}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value text-amber-600">{item.minimumStock}</div>
                <div className="metric-label">Minimum Stock</div>
                <div className="text-xs text-neutral-500 mt-1">{item.unit}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value text-green-600">{item.maximumStock}</div>
                <div className="metric-label">Maximum Stock</div>
                <div className="text-xs text-neutral-500 mt-1">{item.unit}</div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value text-orange-600">{item.reorderPoint}</div>
                <div className="metric-label">Reorder Point</div>
                <div className="text-xs text-neutral-500 mt-1">{item.unit}</div>
              </div>
            </div>
            
            {isEditing && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Minimum Stock *
                  </label>
                  <input
                    type="number"
                    value={item.minimumStock}
                    onChange={(e) => updateItem({ minimumStock: parseInt(e.target.value) || 0 })}
                    className="form-input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maximum Stock *
                  </label>
                  <input
                    type="number"
                    value={item.maximumStock}
                    onChange={(e) => updateItem({ maximumStock: parseInt(e.target.value) || 0 })}
                    className="form-input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    value={item.reorderPoint}
                    onChange={(e) => updateItem({ reorderPoint: parseInt(e.target.value) || 0 })}
                    className="form-input"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    value={item.currentStock}
                    onChange={(e) => updateItem({ currentStock: parseInt(e.target.value) || 0 })}
                    className="form-input"
                    min="0"
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Stock Level Indicator</h4>
                <div className="w-full bg-neutral-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full transition-all duration-300 ${
                      item.currentStock === 0 ? 'bg-red-500' :
                      item.currentStock <= item.minimumStock ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((item.currentStock / item.maximumStock) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>0</span>
                  <span>Min: {item.minimumStock}</span>
                  <span>Max: {item.maximumStock}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Usage Statistics</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Average Daily Usage:</span>
                    <span className="font-medium">{item.averageUsage} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Days Until Reorder:</span>
                    <span className="font-medium">
                      {Math.max(0, Math.floor((item.currentStock - item.reorderPoint) / item.averageUsage))} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Last Order Date:</span>
                    <span className="font-medium">
                      {item.lastOrderDate ? new Date(item.lastOrderDate).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'suppliers' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Supplier Information</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Primary Supplier</h4>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="font-medium text-neutral-900">{item.supplier}</div>
                  <div className="text-sm text-neutral-600 mt-1">
                    Cost: ${item.costPerUnit.toFixed(2)} per {item.unit}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      Contact Supplier
                    </Button>
                    <Button size="sm" variant="outline">
                      View Orders
                    </Button>
                  </div>
                </div>
              </div>
              
              {item.alternativeSuppliers.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Alternative Suppliers</h4>
                  <div className="space-y-2">
                    {item.alternativeSuppliers.map(supplier => (
                      <div key={supplier} className="bg-neutral-50 rounded-lg p-3">
                        <div className="font-medium text-neutral-900">{supplier}</div>
                        <div className="flex space-x-2 mt-2">
                          <Button size="sm" variant="outline">
                            Set as Primary
                          </Button>
                          <Button size="sm" variant="outline">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button
                onClick={() => {
                  const supplier = prompt('Enter supplier name:');
                  if (supplier && !item.alternativeSuppliers.includes(supplier)) {
                    updateItem({ alternativeSuppliers: [...item.alternativeSuppliers, supplier] });
                  }
                }}
                variant="outline"
              >
                + Add Alternative Supplier
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Item History</h3>
            <div className="text-center py-8 text-neutral-500">
              <div className="text-lg mb-2">📊</div>
              <div>Stock movement history coming soon...</div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-red-800">Delete Item</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Item
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement;