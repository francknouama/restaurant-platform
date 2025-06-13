import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface StockAdjustment {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  unit: string;
  reason: string;
  notes?: string;
  user: string;
  timestamp: string;
  referenceNumber?: string;
  cost?: number;
  location: string;
  batchNumber?: string;
}

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

const StockManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: 'adjustment' as StockAdjustment['type'],
    quantity: 0,
    reason: '',
    notes: '',
    referenceNumber: '',
    batchNumber: ''
  });
  const [filterType, setFilterType] = useState<'all' | StockAdjustment['type']>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    // Generate mock data
    const generateMockData = () => {
      // Mock stock items
      const mockItems: StockItem[] = [
        {
          id: 'item_1',
          name: 'Premium Beef Tenderloin',
          category: 'Meat',
          currentStock: 15,
          minimumStock: 10,
          unit: 'lbs',
          location: 'Walk-in Cooler A',
          lastUpdated: '2024-01-20T14:30:00Z',
          status: 'in-stock'
        },
        {
          id: 'item_2',
          name: 'Fresh Salmon Fillet',
          category: 'Seafood',
          currentStock: 5,
          minimumStock: 15,
          unit: 'lbs',
          location: 'Walk-in Cooler B',
          lastUpdated: '2024-01-20T12:15:00Z',
          status: 'low-stock'
        },
        {
          id: 'item_3',
          name: 'Organic Baby Spinach',
          category: 'Vegetables',
          currentStock: 0,
          minimumStock: 20,
          unit: 'lbs',
          location: 'Walk-in Cooler A',
          lastUpdated: '2024-01-20T10:00:00Z',
          status: 'out-of-stock'
        }
      ];
      setStockItems(mockItems);

      // Mock adjustments
      const mockAdjustments: StockAdjustment[] = [
        {
          id: 'adj_1',
          itemId: 'item_1',
          itemName: 'Premium Beef Tenderloin',
          category: 'Meat',
          type: 'in',
          quantity: 25,
          unit: 'lbs',
          reason: 'Delivery received',
          notes: 'Fresh delivery from Premium Foods Co.',
          user: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          referenceNumber: 'DEL-2024-001',
          cost: 712.50,
          location: 'Walk-in Cooler A',
          batchNumber: 'BT2024001'
        },
        {
          id: 'adj_2',
          itemId: 'item_1',
          itemName: 'Premium Beef Tenderloin',
          category: 'Meat',
          type: 'out',
          quantity: 8,
          unit: 'lbs',
          reason: 'Kitchen usage',
          notes: 'Used for dinner service',
          user: 'Mike Chen',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          location: 'Walk-in Cooler A'
        },
        {
          id: 'adj_3',
          itemId: 'item_2',
          itemName: 'Fresh Salmon Fillet',
          category: 'Seafood',
          type: 'waste',
          quantity: 3,
          unit: 'lbs',
          reason: 'Expired product',
          notes: 'Past use-by date, disposed of safely',
          user: 'Emily Davis',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          location: 'Walk-in Cooler B'
        },
        {
          id: 'adj_4',
          itemId: 'item_3',
          itemName: 'Organic Baby Spinach',
          category: 'Vegetables',
          type: 'adjustment',
          quantity: -5,
          unit: 'lbs',
          reason: 'Inventory correction',
          notes: 'Correcting discrepancy found during count',
          user: 'David Wilson',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          location: 'Walk-in Cooler A'
        },
        {
          id: 'adj_5',
          itemId: 'item_2',
          itemName: 'Fresh Salmon Fillet',
          category: 'Seafood',
          type: 'transfer',
          quantity: 10,
          unit: 'lbs',
          reason: 'Location transfer',
          notes: 'Moved from Freezer A to Walk-in Cooler B',
          user: 'Lisa Martinez',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          referenceNumber: 'TRF-2024-005',
          location: 'Walk-in Cooler B'
        }
      ];
      setAdjustments(mockAdjustments);
    };

    generateMockData();
    
    // Handle URL params for pre-selecting item
    const itemParam = searchParams.get('item');
    if (itemParam) {
      setSelectedItem(itemParam);
      setShowAdjustModal(true);
    }
  }, [searchParams]);

  const handleStockAdjustment = () => {
    if (!selectedItem || adjustmentForm.quantity === 0) return;
    
    const item = stockItems.find(i => i.id === selectedItem);
    if (!item) return;
    
    const adjustment: StockAdjustment = {
      id: `adj_${Date.now()}`,
      itemId: selectedItem,
      itemName: item.name,
      category: item.category,
      type: adjustmentForm.type,
      quantity: adjustmentForm.quantity,
      unit: item.unit,
      reason: adjustmentForm.reason,
      notes: adjustmentForm.notes || undefined,
      user: 'Current User', // Would be from auth context
      timestamp: new Date().toISOString(),
      referenceNumber: adjustmentForm.referenceNumber || undefined,
      location: item.location,
      batchNumber: adjustmentForm.batchNumber || undefined
    };
    
    setAdjustments(prev => [adjustment, ...prev]);
    
    // Update stock levels
    setStockItems(prev => prev.map(item => {
      if (item.id === selectedItem) {
        let newStock = item.currentStock;
        
        switch (adjustmentForm.type) {
          case 'in':
            newStock += adjustmentForm.quantity;
            break;
          case 'out':
          case 'waste':
            newStock -= adjustmentForm.quantity;
            break;
          case 'adjustment':
            newStock = adjustmentForm.quantity; // Set to absolute value
            break;
          case 'transfer':
            // For transfers, might need more complex logic
            break;
        }
        
        newStock = Math.max(0, newStock); // Ensure non-negative
        
        const status: StockItem['status'] = 
          newStock === 0 ? 'out-of-stock' :
          newStock <= item.minimumStock ? 'low-stock' :
          'in-stock';
        
        return {
          ...item,
          currentStock: newStock,
          status,
          lastUpdated: new Date().toISOString()
        };
      }
      return item;
    }));
    
    // Reset form
    setAdjustmentForm({
      type: 'adjustment',
      quantity: 0,
      reason: '',
      notes: '',
      referenceNumber: '',
      batchNumber: ''
    });
    setSelectedItem('');
    setShowAdjustModal(false);
  };

  const getAdjustmentTypeColor = (type: StockAdjustment['type']): string => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-100';
      case 'out': return 'text-blue-600 bg-blue-100';
      case 'adjustment': return 'text-amber-600 bg-amber-100';
      case 'waste': return 'text-red-600 bg-red-100';
      case 'transfer': return 'text-purple-600 bg-purple-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getAdjustmentIcon = (type: StockAdjustment['type']): string => {
    switch (type) {
      case 'in': return '⬆️';
      case 'out': return '⬇️';
      case 'adjustment': return '⚙️';
      case 'waste': return '🗑️';
      case 'transfer': return '🔄';
      default: return '📄';
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 24 * 60) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffMinutes / (24 * 60))}d ago`;
    }
  };

  const filteredAdjustments = adjustments.filter(adj => 
    filterType === 'all' || adj.type === filterType
  );

  const reasonOptions = {
    in: ['Delivery received', 'Purchase order', 'Transfer in', 'Return from kitchen', 'Emergency stock'],
    out: ['Kitchen usage', 'Sale', 'Transfer out', 'Customer order', 'Staff consumption'],
    adjustment: ['Inventory correction', 'Cycle count adjustment', 'System correction', 'Damage correction'],
    waste: ['Expired product', 'Damaged goods', 'Quality issue', 'Contamination', 'Over-cooked'],
    transfer: ['Location transfer', 'Storage optimization', 'Temperature requirement', 'Space management']
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Stock Management</h1>
          <p className="text-neutral-600">
            Track and manage all stock movements and adjustments
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowAdjustModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Stock Adjustment
          </Button>
          
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
          >
            View Inventory
          </Button>
        </div>
      </div>

      {/* Quick Stock Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stockItems.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-neutral-900">{item.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                item.status === 'low-stock' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {item.status.replace('-', ' ')}
              </span>
            </div>
            
            <div className="text-sm text-neutral-600 mb-2">
              {item.category} • {item.location}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-neutral-900">
                  {item.currentStock} {item.unit}
                </div>
                <div className="text-xs text-neutral-500">
                  Min: {item.minimumStock} {item.unit}
                </div>
              </div>
              
              <Button
                onClick={() => {
                  setSelectedItem(item.id);
                  setShowAdjustModal(true);
                }}
                size="sm"
              >
                Adjust
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="flex items-center space-x-4">
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustments</option>
              <option value="waste">Waste</option>
              <option value="transfer">Transfers</option>
            </select>
          </div>
          
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <Button
            onClick={() => {
              setFilterType('all');
              setDateRange('week');
            }}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Stock Adjustments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Recent Stock Movements</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Reference
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredAdjustments.map(adjustment => (
                <tr key={adjustment.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getAdjustmentIcon(adjustment.type)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAdjustmentTypeColor(adjustment.type)}`}>
                        {adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-neutral-900">{adjustment.itemName}</div>
                      <div className="text-sm text-neutral-500">
                        {adjustment.category} • {adjustment.location}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`font-medium ${
                      adjustment.type === 'in' ? 'text-green-600' :
                      (adjustment.type === 'out' || adjustment.type === 'waste') ? 'text-red-600' :
                      'text-neutral-900'
                    }`}>
                      {adjustment.type === 'in' ? '+' : 
                       (adjustment.type === 'out' || adjustment.type === 'waste') ? '-' : ''}
                      {adjustment.quantity} {adjustment.unit}
                    </div>
                    {adjustment.cost && (
                      <div className="text-sm text-neutral-500">
                        ${adjustment.cost.toFixed(2)}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-neutral-900">{adjustment.reason}</div>
                    {adjustment.notes && (
                      <div className="text-sm text-neutral-500">{adjustment.notes}</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {adjustment.user}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {getTimeAgo(adjustment.timestamp)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {adjustment.referenceNumber || '-'}
                    {adjustment.batchNumber && (
                      <div className="text-xs text-neutral-500">
                        Batch: {adjustment.batchNumber}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAdjustments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">No stock movements found</div>
            <div className="text-neutral-500 text-sm">
              {filterType !== 'all' ? 'Try changing your filter settings' : 'Stock movements will appear here'}
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Stock Adjustment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Select Item *
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose an item...</option>
                  {stockItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.currentStock} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, type: e.target.value as any, reason: '' }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in">Stock In (+)</option>
                  <option value="out">Stock Out (-)</option>
                  <option value="adjustment">Adjustment (Set to)</option>
                  <option value="waste">Waste (-)</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  value={adjustmentForm.quantity || ''}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Reason *
                </label>
                <select
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select reason...</option>
                  {reasonOptions[adjustmentForm.type]?.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                  <option value="other">Other (specify in notes)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={adjustmentForm.notes}
                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={adjustmentForm.referenceNumber}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="REF-001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={adjustmentForm.batchNumber}
                    onChange={(e) => setAdjustmentForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="BT001"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAdjustModal(false);
                  setSelectedItem('');
                  setAdjustmentForm({
                    type: 'adjustment',
                    quantity: 0,
                    reason: '',
                    notes: '',
                    referenceNumber: '',
                    batchNumber: ''
                  });
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockAdjustment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!selectedItem || !adjustmentForm.quantity || !adjustmentForm.reason}
              >
                Apply Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManagement;