import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface InventoryAlert {
  id: string;
  type: 'low-stock' | 'out-of-stock' | 'expiring' | 'waste' | 'price-change' | 'quality';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  itemName: string;
  category: string;
  currentStock?: number;
  minimumStock?: number;
  unit?: string;
  expiryDate?: string;
  location: string;
  supplier?: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
  actionRequired: boolean;
  estimatedImpact?: string;
}

const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<'all' | InventoryAlert['priority']>('all');
  const [selectedType, setSelectedType] = useState<'all' | InventoryAlert['type']>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | InventoryAlert['status']>('all');
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    // Generate mock alerts
    const generateMockAlerts = (): InventoryAlert[] => {
      const mockAlerts: InventoryAlert[] = [
        {
          id: 'alert_1',
          type: 'out-of-stock',
          priority: 'urgent',
          itemName: 'Premium Beef Tenderloin',
          category: 'Meat',
          currentStock: 0,
          minimumStock: 10,
          unit: 'lbs',
          location: 'Walk-in Cooler A',
          supplier: 'Premium Foods Co.',
          message: 'Critical: Premium Beef Tenderloin is completely out of stock. Immediate reorder required.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: 'active',
          actionRequired: true,
          estimatedImpact: 'High - affects 8 menu items'
        },
        {
          id: 'alert_2',
          type: 'low-stock',
          priority: 'high',
          itemName: 'Fresh Salmon Fillet',
          category: 'Seafood',
          currentStock: 3,
          minimumStock: 15,
          unit: 'lbs',
          location: 'Walk-in Cooler B',
          supplier: 'Ocean Harvest',
          message: 'Low stock alert: Fresh Salmon Fillet is below minimum threshold.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          actionRequired: true,
          estimatedImpact: 'Medium - affects 3 menu items'
        },
        {
          id: 'alert_3',
          type: 'expiring',
          priority: 'high',
          itemName: 'Organic Baby Spinach',
          category: 'Vegetables',
          currentStock: 12,
          unit: 'lbs',
          expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Walk-in Cooler A',
          supplier: 'Fresh Market Supply',
          message: 'Expiry warning: Organic Baby Spinach expires in 2 days. Use or waste expected.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          actionRequired: true,
          estimatedImpact: 'Low - limited menu impact'
        },
        {
          id: 'alert_4',
          type: 'waste',
          priority: 'medium',
          itemName: 'Jumbo Shrimp',
          category: 'Seafood',
          currentStock: 8,
          unit: 'lbs',
          location: 'Walk-in Cooler B',
          message: 'Waste alert: 5 lbs of Jumbo Shrimp disposed due to quality issues.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'acknowledged',
          actionRequired: false,
          estimatedImpact: 'Low - isolated incident'
        },
        {
          id: 'alert_5',
          type: 'price-change',
          priority: 'medium',
          itemName: 'Truffle Oil',
          category: 'Condiments',
          location: 'Dry Storage',
          supplier: 'Specialty Imports',
          message: 'Price increase: Truffle Oil supplier increased prices by 15%.',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          actionRequired: true,
          estimatedImpact: 'Medium - affects product margins'
        },
        {
          id: 'alert_6',
          type: 'quality',
          priority: 'high',
          itemName: 'Aged Parmesan Cheese',
          category: 'Dairy',
          currentStock: 6,
          unit: 'lbs',
          location: 'Walk-in Cooler A',
          supplier: 'Local Dairy Co.',
          message: 'Quality concern: Last delivery of Aged Parmesan Cheese showed inconsistent texture.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          actionRequired: true,
          estimatedImpact: 'Medium - potential customer complaints'
        },
        {
          id: 'alert_7',
          type: 'low-stock',
          priority: 'medium',
          itemName: 'Wild Rice',
          category: 'Grains',
          currentStock: 8,
          minimumStock: 20,
          unit: 'lbs',
          location: 'Dry Storage',
          supplier: 'Specialty Imports',
          message: 'Low stock: Wild Rice approaching minimum threshold.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'acknowledged',
          actionRequired: true,
          estimatedImpact: 'Low - specialty item'
        },
        {
          id: 'alert_8',
          type: 'out-of-stock',
          priority: 'urgent',
          itemName: 'Himalayan Pink Salt',
          category: 'Spices',
          currentStock: 0,
          minimumStock: 5,
          unit: 'containers',
          location: 'Dry Storage',
          supplier: 'Specialty Imports',
          message: 'Out of stock: Himalayan Pink Salt completely depleted.',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          status: 'resolved',
          actionRequired: false,
          estimatedImpact: 'Low - alternative available'
        }
      ];
      
      return mockAlerts.sort((a, b) => {
        // Sort by priority first, then timestamp
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    };

    setAlerts(generateMockAlerts());
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (!showResolved && alert.status === 'resolved') return false;
    if (selectedPriority !== 'all' && alert.priority !== selectedPriority) return false;
    if (selectedType !== 'all' && alert.type !== selectedType) return false;
    if (selectedStatus !== 'all' && alert.status !== selectedStatus) return false;
    return true;
  });

  const alertStats = {
    total: alerts.filter(a => a.status !== 'resolved').length,
    urgent: alerts.filter(a => a.priority === 'urgent' && a.status !== 'resolved').length,
    actionRequired: alerts.filter(a => a.actionRequired && a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length
  };

  const getPriorityColor = (priority: InventoryAlert['priority']): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-amber-600 bg-amber-100 border-amber-200';
      case 'medium': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-neutral-600 bg-neutral-100 border-neutral-200';
    }
  };

  const getTypeIcon = (type: InventoryAlert['type']): string => {
    switch (type) {
      case 'low-stock': return '⚠️';
      case 'out-of-stock': return '🚨';
      case 'expiring': return '⏰';
      case 'waste': return '🗑️';
      case 'price-change': return '💰';
      case 'quality': return '❓';
      default: return '🔔';
    }
  };

  const getTypeColor = (type: InventoryAlert['type']): string => {
    switch (type) {
      case 'low-stock': return 'text-amber-600 bg-amber-100';
      case 'out-of-stock': return 'text-red-600 bg-red-100';
      case 'expiring': return 'text-orange-600 bg-orange-100';
      case 'waste': return 'text-red-700 bg-red-200';
      case 'price-change': return 'text-purple-600 bg-purple-100';
      case 'quality': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStatusColor = (status: InventoryAlert['status']): string => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'acknowledged': return 'text-amber-600 bg-amber-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-neutral-600 bg-neutral-100';
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

  const handleAlertAction = (alertId: string, action: 'acknowledge' | 'resolve' | 'reorder' | 'adjust') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        switch (action) {
          case 'acknowledge':
            return { ...alert, status: 'acknowledged' as const };
          case 'resolve':
            return { ...alert, status: 'resolved' as const, actionRequired: false };
          case 'reorder':
            // Navigate to purchase order creation
            navigate(`/purchase-orders/new?item=${alert.itemName}`);
            return { ...alert, status: 'acknowledged' as const };
          case 'adjust':
            // Navigate to stock adjustment
            navigate(`/stock/adjust?item=${alert.itemName}`);
            return { ...alert, status: 'acknowledged' as const };
          default:
            return alert;
        }
      }
      return alert;
    }));
  };

  const handleBulkAction = (action: 'acknowledge-all' | 'resolve-all') => {
    setAlerts(prev => prev.map(alert => {
      if (alert.status === 'active') {
        switch (action) {
          case 'acknowledge-all':
            return { ...alert, status: 'acknowledged' as const };
          case 'resolve-all':
            return { ...alert, status: 'resolved' as const, actionRequired: false };
          default:
            return alert;
        }
      }
      return alert;
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Alerts</h1>
          <p className="text-neutral-600">
            {filteredAlerts.length} alerts • {alertStats.urgent} urgent • {alertStats.actionRequired} require action
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => handleBulkAction('acknowledge-all')}
            variant="outline"
            disabled={alertStats.actionRequired === 0}
          >
            Acknowledge All
          </Button>
          
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
          >
            View Inventory
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card border-l-4 border-red-500">
          <div className="metric-value text-red-600">{alertStats.urgent}</div>
          <div className="metric-label">Urgent Alerts</div>
        </div>
        
        <div className="metric-card border-l-4 border-amber-500">
          <div className="metric-value text-amber-600">{alertStats.actionRequired}</div>
          <div className="metric-label">Action Required</div>
        </div>
        
        <div className="metric-card border-l-4 border-blue-500">
          <div className="metric-value text-blue-600">{alertStats.acknowledged}</div>
          <div className="metric-label">Acknowledged</div>
        </div>
        
        <div className="metric-card border-l-4 border-green-500">
          <div className="metric-value text-green-600">{alertStats.total}</div>
          <div className="metric-label">Total Active</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="expiring">Expiring</option>
              <option value="waste">Waste</option>
              <option value="price-change">Price Change</option>
              <option value="quality">Quality</option>
            </select>
          </div>
          
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-neutral-300 rounded mr-2"
              />
              <span className="text-sm text-neutral-700">Show Resolved</span>
            </label>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div key={alert.id} className={`bg-white rounded-lg shadow-sm border-l-4 p-6 ${
            alert.priority === 'urgent' ? 'border-red-500' :
            alert.priority === 'high' ? 'border-amber-500' :
            alert.priority === 'medium' ? 'border-blue-500' :
            'border-green-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-neutral-900">{alert.itemName}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                      {alert.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(alert.type)}`}>
                      {alert.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                      {alert.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-neutral-700 mb-3">{alert.message}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-neutral-600">
                    <div>
                      <strong>Category:</strong> {alert.category}
                    </div>
                    <div>
                      <strong>Location:</strong> {alert.location}
                    </div>
                    {alert.currentStock !== undefined && (
                      <div>
                        <strong>Stock:</strong> {alert.currentStock} {alert.unit}
                        {alert.minimumStock && (
                          <span className="text-neutral-500"> / {alert.minimumStock} min</span>
                        )}
                      </div>
                    )}
                    {alert.supplier && (
                      <div>
                        <strong>Supplier:</strong> {alert.supplier}
                      </div>
                    )}
                  </div>
                  
                  {alert.expiryDate && (
                    <div className="text-sm text-amber-600 mt-2">
                      <strong>Expires:</strong> {new Date(alert.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                  
                  {alert.estimatedImpact && (
                    <div className="text-sm text-neutral-600 mt-2">
                      <strong>Impact:</strong> {alert.estimatedImpact}
                    </div>
                  )}
                  
                  <div className="text-xs text-neutral-500 mt-3">
                    Created {getTimeAgo(alert.timestamp)}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2 ml-4">
                {alert.status === 'active' && (
                  <>
                    {(alert.type === 'low-stock' || alert.type === 'out-of-stock') && (
                      <Button
                        onClick={() => handleAlertAction(alert.id, 'reorder')}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Reorder
                      </Button>
                    )}
                    
                    {alert.type === 'low-stock' && (
                      <Button
                        onClick={() => handleAlertAction(alert.id, 'adjust')}
                        size="sm"
                        variant="outline"
                      >
                        Adjust Stock
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                      size="sm"
                      variant="outline"
                    >
                      Acknowledge
                    </Button>
                  </>
                )}
                
                {alert.status === 'acknowledged' && (
                  <Button
                    onClick={() => handleAlertAction(alert.id, 'resolve')}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Resolve
                  </Button>
                )}
                
                {alert.status === 'resolved' && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">
              {showResolved || selectedPriority !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'No alerts match your filters'
                : 'No active alerts'
              }
            </div>
            <div className="text-neutral-500 text-sm">
              {showResolved || selectedPriority !== 'all' || selectedType !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filter settings'
                : 'All inventory alerts have been resolved'
              }
            </div>
          </div>
        )}
      </div>

      {/* Alert Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Alert Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-neutral-900 mb-2">Stock Thresholds</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Low stock warning:</span>
                <span className="font-medium">When below minimum</span>
              </div>
              <div className="flex justify-between">
                <span>Critical stock alert:</span>
                <span className="font-medium">When at 0</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-900 mb-2">Expiry Alerts</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Early warning:</span>
                <span className="font-medium">7 days before</span>
              </div>
              <div className="flex justify-between">
                <span>Final warning:</span>
                <span className="font-medium">2 days before</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-900 mb-2">Notifications</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Email alerts:</span>
                <span className="font-medium text-green-600">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span>SMS alerts:</span>
                <span className="font-medium text-amber-600">Urgent only</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Button variant="outline" size="sm">
            Configure Alert Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;