import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';
import InventoryService, { DashboardMetrics, RecentActivity } from '../services/inventoryService';
import { useAlertStore } from '../store';

interface StockAlert {
  id: string;
  itemName: string;
  currentStock: number;
  minimumStock: number;
  category: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  lastUpdated: string;
}

const InventoryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    emitInventoryLowStock, 
    emitInventoryStockUpdated,
    onOrderCreated,
    onKitchenOrderUpdate 
  } = useRestaurantEvents();
  
  // Use the alert store for managing alerts
  const { alerts, loading: alertsLoading, fetchAlerts } = useAlertStore();
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0,
    pendingOrders: 0,
    monthlyTurnover: 0,
    averageStockDays: 0,
    supplierCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load metrics and alerts in parallel
        const [metricsData, activityData] = await Promise.all([
          InventoryService.getDashboardMetrics(),
          InventoryService.getRecentActivity()
        ]);
        
        setMetrics(metricsData);
        setRecentActivity(activityData);
        
        // Load alerts using the store
        await fetchAlerts();
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        console.error('Dashboard data loading failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedTimeRange, fetchAlerts]);

  // Listen for order events to update inventory
  useEffect(() => {
    // Listen for new orders to track inventory consumption
    const unsubscribeOrderCreated = onOrderCreated((event) => {
      console.log('[Inventory MFE] New order created:', event.payload);
      // In a real app, this would trigger inventory consumption tracking
    });

    // Listen for kitchen updates to track real-time usage
    const unsubscribeKitchenUpdate = onKitchenOrderUpdate((event) => {
      console.log('[Inventory MFE] Kitchen order update:', event.payload);
      // In a real app, this would update inventory based on items being prepared
    });

    return () => {
      unsubscribeOrderCreated();
      unsubscribeKitchenUpdate();
    };
  }, [onOrderCreated, onKitchenOrderUpdate]);

  // Emit low stock alerts when detected
  useEffect(() => {
    // Check for low stock items and emit events
    alerts.forEach(alert => {
      if ((alert.priority === 'urgent' || alert.priority === 'high') && alert.status === 'active') {
        emitInventoryLowStock({
          itemId: alert.id,
          itemName: alert.itemName,
          currentStock: 0, // Will be populated when we have full item details
          minimumStock: 0,  // Will be populated when we have full item details
          category: 'Unknown', // Will be populated when we have full item details
          priority: alert.priority
        });
      }
    });
  }, [alerts, emitInventoryLowStock]);

  const getAlertPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-amber-600 bg-amber-100';
      case 'medium': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'stock_in': return '⬆️';
      case 'stock_out': return '⬇️';
      case 'adjustment': return '⚙️';
      case 'purchase_order': return '🛒';
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

  // Handler for stock adjustments
  const handleStockAdjustment = (itemId: string, itemName: string, adjustment: number) => {
    // In a real app, this would make an API call
    console.log(`[Inventory MFE] Adjusting stock for ${itemName}: ${adjustment}`);
    
    // Emit stock updated event
    emitInventoryStockUpdated({
      itemId,
      itemName,
      previousStock: 10, // Mock previous stock
      newStock: 10 + adjustment,
      updateType: 'adjustment'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Dashboard</h1>
          <p className="text-neutral-600">
            Real-time inventory monitoring and control center
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <Button
            onClick={() => navigate('/purchase-orders/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-lg mr-2">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Data</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              className="ml-auto bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Critical Alerts Banner */}
      {!alertsLoading && alerts.filter(alert => alert.priority === 'urgent' && alert.status === 'active').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-lg mr-2">🚨</div>
            <div>
              <h3 className="font-semibold text-red-800">
                Critical Stock Alert ({alerts.filter(alert => alert.priority === 'urgent' && alert.status === 'active').length} items)
              </h3>
              <p className="text-red-700 text-sm">
                You have urgent stock shortages that require immediate attention.
              </p>
            </div>
            <Button
              onClick={() => navigate('/alerts')}
              size="sm"
              className="ml-auto bg-red-600 hover:bg-red-700"
            >
              View All Alerts
            </Button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="metric-card">
          <div className="metric-value text-blue-600">{metrics.totalItems}</div>
          <div className="metric-label">Total Items</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-amber-600">{metrics.lowStockItems}</div>
          <div className="metric-label">Low Stock</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-red-600">{metrics.outOfStockItems}</div>
          <div className="metric-label">Out of Stock</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-green-600">${(metrics.totalValue / 1000).toFixed(0)}K</div>
          <div className="metric-label">Total Value</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-purple-600">{metrics.pendingOrders}</div>
          <div className="metric-label">Pending Orders</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-indigo-600">{metrics.monthlyTurnover}x</div>
          <div className="metric-label">Turnover Rate</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-teal-600">{metrics.averageStockDays}d</div>
          <div className="metric-label">Avg Stock Days</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-orange-600">{metrics.supplierCount}</div>
          <div className="metric-label">Suppliers</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Alerts */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Stock Alerts</h2>
                <Button
                  onClick={() => navigate('/alerts')}
                  variant="outline"
                  size="sm"
                >
                  View All
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-neutral-200">
              {alertsLoading ? (
                <div className="p-8 text-center">
                  <div className="text-neutral-500">Loading alerts...</div>
                </div>
              ) : alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-neutral-500">No alerts at this time</div>
                </div>
              ) : (
                alerts.filter(alert => alert.status === 'active').slice(0, 5).map(alert => (
                  <div key={alert.id} className="p-4 hover:bg-neutral-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-neutral-900">{alert.itemName}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAlertPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600">
                          {alert.message}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {alert.type} • Updated {getTimeAgo(alert.timestamp)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => navigate(`/stock/adjust?item=${alert.itemName}`)}
                          size="sm"
                          variant="outline"
                        >
                          Adjust Stock
                        </Button>
                        <Button
                          onClick={() => navigate(`/purchase-orders/new?item=${alert.itemName}`)}
                          size="sm"
                        >
                          Order Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="card">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </div>
            
            <div className="divide-y divide-neutral-200">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-neutral-500">Loading activity...</div>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-neutral-500">No recent activity</div>
                </div>
              ) : (
                recentActivity.slice(0, 8).map(activity => (
                  <div key={activity.id} className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-neutral-900">
                          {activity.description}
                        </div>
                        <div className="text-xs text-neutral-500">
                          by {activity.user} • {getTimeAgo(activity.timestamp)}
                        </div>
                        {activity.amount && (
                          <div className={`text-xs font-medium ${
                            activity.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.amount > 0 ? '+' : ''}{activity.amount} units
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button
          onClick={() => navigate('/items')}
          className="p-6 h-auto flex-col bg-white border-2 border-neutral-200 hover:border-blue-300 text-neutral-700 hover:text-blue-700"
          variant="outline"
        >
          <div className="text-2xl mb-2">🏷️</div>
          <div className="font-medium">Manage Items</div>
          <div className="text-sm text-neutral-500">Add, edit, and organize inventory items</div>
        </Button>
        
        <Button
          onClick={() => navigate('/stock')}
          className="p-6 h-auto flex-col bg-white border-2 border-neutral-200 hover:border-green-300 text-neutral-700 hover:text-green-700"
          variant="outline"
        >
          <div className="text-2xl mb-2">📈</div>
          <div className="font-medium">Stock Control</div>
          <div className="text-sm text-neutral-500">Adjust stock levels and track usage</div>
        </Button>
        
        <Button
          onClick={() => navigate('/suppliers')}
          className="p-6 h-auto flex-col bg-white border-2 border-neutral-200 hover:border-purple-300 text-neutral-700 hover:text-purple-700"
          variant="outline"
        >
          <div className="text-2xl mb-2">🏢</div>
          <div className="font-medium">Suppliers</div>
          <div className="text-sm text-neutral-500">Manage vendor relationships</div>
        </Button>
        
        <Button
          onClick={() => navigate('/analytics')}
          className="p-6 h-auto flex-col bg-white border-2 border-neutral-200 hover:border-amber-300 text-neutral-700 hover:text-amber-700"
          variant="outline"
        >
          <div className="text-2xl mb-2">📈</div>
          <div className="font-medium">Analytics</div>
          <div className="text-sm text-neutral-500">View reports and insights</div>
        </Button>
      </div>
    </div>
  );
};

export default InventoryDashboard;