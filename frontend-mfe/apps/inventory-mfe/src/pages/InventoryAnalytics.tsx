import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: number[];
}

interface CategoryAnalytics {
  category: string;
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  turnoverRate: number;
  averageCost: number;
}

interface SupplierPerformance {
  supplierName: string;
  totalOrders: number;
  onTimeDelivery: number;
  qualityRating: number;
  totalSpent: number;
  averageOrderValue: number;
}

interface StockMovement {
  date: string;
  stockIn: number;
  stockOut: number;
  waste: number;
  adjustments: number;
}

const InventoryAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedView, setSelectedView] = useState<'overview' | 'categories' | 'suppliers' | 'movement' | 'costs'>('overview');
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [supplierPerformance, setSupplierPerformance] = useState<SupplierPerformance[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    // Generate mock analytics data
    const generateMockData = () => {
      // Mock metrics
      const mockMetrics: AnalyticsMetric[] = [
        {
          label: 'Total Inventory Value',
          value: '$124,750',
          change: 8.2,
          changeType: 'positive',
          trend: [110000, 115000, 118000, 120000, 122000, 124750]
        },
        {
          label: 'Inventory Turnover',
          value: '2.4x',
          change: 12.5,
          changeType: 'positive',
          trend: [2.1, 2.2, 2.2, 2.3, 2.3, 2.4]
        },
        {
          label: 'Stock Accuracy',
          value: '96.8%',
          change: 1.2,
          changeType: 'positive',
          trend: [95.2, 95.8, 96.1, 96.3, 96.5, 96.8]
        },
        {
          label: 'Carrying Cost',
          value: '$12,475',
          change: -5.8,
          changeType: 'positive',
          trend: [14000, 13500, 13200, 12800, 12600, 12475]
        },
        {
          label: 'Dead Stock',
          value: '3.2%',
          change: -15.2,
          changeType: 'positive',
          trend: [4.1, 3.8, 3.6, 3.4, 3.3, 3.2]
        },
        {
          label: 'Waste Percentage',
          value: '2.1%',
          change: -8.7,
          changeType: 'positive',
          trend: [2.6, 2.4, 2.3, 2.2, 2.1, 2.1]
        }
      ];
      setMetrics(mockMetrics);

      // Mock category analytics
      const mockCategories: CategoryAnalytics[] = [
        {
          category: 'Meat',
          totalItems: 45,
          totalValue: 35000,
          lowStockItems: 8,
          turnoverRate: 3.2,
          averageCost: 28.50
        },
        {
          category: 'Seafood',
          totalItems: 28,
          totalValue: 22000,
          lowStockItems: 5,
          turnoverRate: 4.1,
          averageCost: 31.20
        },
        {
          category: 'Vegetables',
          totalItems: 62,
          totalValue: 8500,
          lowStockItems: 12,
          turnoverRate: 6.8,
          averageCost: 4.25
        },
        {
          category: 'Dairy',
          totalItems: 34,
          totalValue: 12000,
          lowStockItems: 3,
          turnoverRate: 2.9,
          averageCost: 6.80
        },
        {
          category: 'Condiments',
          totalItems: 52,
          totalValue: 15000,
          lowStockItems: 7,
          turnoverRate: 1.8,
          averageCost: 12.30
        }
      ];
      setCategoryAnalytics(mockCategories);

      // Mock supplier performance
      const mockSuppliers: SupplierPerformance[] = [
        {
          supplierName: 'Premium Foods Co.',
          totalOrders: 156,
          onTimeDelivery: 96,
          qualityRating: 4.9,
          totalSpent: 125000,
          averageOrderValue: 801.28
        },
        {
          supplierName: 'Ocean Harvest',
          totalOrders: 89,
          onTimeDelivery: 98,
          qualityRating: 4.8,
          totalSpent: 78000,
          averageOrderValue: 876.40
        },
        {
          supplierName: 'Fresh Market Supply',
          totalOrders: 234,
          onTimeDelivery: 92,
          qualityRating: 4.6,
          totalSpent: 45000,
          averageOrderValue: 192.31
        },
        {
          supplierName: 'Specialty Imports',
          totalOrders: 67,
          onTimeDelivery: 88,
          qualityRating: 4.4,
          totalSpent: 34000,
          averageOrderValue: 507.46
        }
      ];
      setSupplierPerformance(mockSuppliers);

      // Mock stock movements
      const mockMovements: StockMovement[] = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        mockMovements.push({
          date: date.toISOString().split('T')[0],
          stockIn: Math.floor(Math.random() * 500) + 200,
          stockOut: Math.floor(Math.random() * 400) + 300,
          waste: Math.floor(Math.random() * 50) + 10,
          adjustments: Math.floor(Math.random() * 100) - 50
        });
      }
      setStockMovements(mockMovements);
    };

    generateMockData();
  }, [timeRange]);

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'positive': return '↗';
      case 'negative': return '↘';
      default: return '→';
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-neutral-600';
    }
  };

  const renderOverviewMetrics = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-value">{metric.value}</div>
          <div className="metric-label">{metric.label}</div>
          <div className={`metric-change ${metric.changeType}`}>
            <span className={getChangeColor(metric.changeType)}>
              {getChangeIcon(metric.changeType)} {Math.abs(metric.change)}%
            </span>
            <span className="text-neutral-500 ml-1">vs last period</span>
          </div>
          
          {/* Mini trend chart */}
          <div className="mt-2 flex items-end space-x-1 h-8">
            {metric.trend.map((value, i) => (
              <div
                key={i}
                className={`w-2 bg-blue-200 rounded-sm transition-all duration-300 ${
                  i === metric.trend.length - 1 ? 'bg-blue-500' : ''
                }`}
                style={{
                  height: `${(value / Math.max(...metric.trend)) * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCategoryAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Category Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Low Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Turnover Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Avg Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {categoryAnalytics.map(category => (
                <tr key={category.category} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-neutral-900">{category.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {category.totalItems}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    ${category.totalValue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm ${
                        category.lowStockItems > 10 ? 'text-red-600' :
                        category.lowStockItems > 5 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {category.lowStockItems}
                      </span>
                      <span className="text-xs text-neutral-500 ml-1">
                        ({Math.round((category.lowStockItems / category.totalItems) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    <div className="flex items-center">
                      <span className={`font-medium ${
                        category.turnoverRate > 5 ? 'text-green-600' :
                        category.turnoverRate > 3 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {category.turnoverRate}x
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    ${category.averageCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Category Value Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Category Value Distribution</h3>
        <div className="space-y-4">
          {categoryAnalytics.map(category => {
            const percentage = (category.totalValue / categoryAnalytics.reduce((sum, c) => sum + c.totalValue, 0)) * 100;
            return (
              <div key={category.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{category.category}</span>
                  <span className="text-neutral-600">
                    ${category.totalValue.toLocaleString()} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSupplierPerformance = () => (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h3 className="text-lg font-semibold">Supplier Performance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                On-Time %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Total Spent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Avg Order
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {supplierPerformance.map(supplier => (
              <tr key={supplier.supplierName} className="hover:bg-neutral-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-medium text-neutral-900">{supplier.supplierName}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  {supplier.totalOrders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 h-2 bg-neutral-200 rounded-full mr-2">
                      <div
                        className={`h-2 rounded-full ${
                          supplier.onTimeDelivery > 95 ? 'bg-green-500' :
                          supplier.onTimeDelivery > 90 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${supplier.onTimeDelivery}%` }}
                      />
                    </div>
                    <span className="text-sm text-neutral-900">{supplier.onTimeDelivery}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-amber-600">
                    {'★'.repeat(Math.floor(supplier.qualityRating))}
                    {'☆'.repeat(5 - Math.floor(supplier.qualityRating))}
                    <span className="text-sm text-neutral-600 ml-1">
                      {supplier.qualityRating.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  ${supplier.totalSpent.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                  ${supplier.averageOrderValue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStockMovement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Stock Movement Trends (Last 30 Days)</h3>
        
        {/* Simple line chart representation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Daily Stock In vs Out</h4>
            <div className="space-y-2">
              {stockMovements.slice(-7).map((movement, index) => {
                const maxValue = Math.max(
                  ...stockMovements.slice(-7).map(m => Math.max(m.stockIn, m.stockOut))
                );
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs text-neutral-600 w-12">
                      {new Date(movement.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <div className="flex-1 relative h-8">
                      <div
                        className="bg-green-200 h-3 rounded transition-all duration-300"
                        style={{ width: `${(movement.stockIn / maxValue) * 100}%` }}
                      />
                      <div
                        className="bg-red-200 h-3 rounded mt-1 transition-all duration-300"
                        style={{ width: `${(movement.stockOut / maxValue) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-neutral-600 w-20 text-right">
                      <div className="text-green-600">+{movement.stockIn}</div>
                      <div className="text-red-600">-{movement.stockOut}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center space-x-4 mt-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
                <span>Stock In</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-200 rounded mr-1"></div>
                <span>Stock Out</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Waste & Adjustments</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Waste (30 days)</span>
                  <span className="font-medium text-red-600">
                    {stockMovements.reduce((sum, m) => sum + m.waste, 0)} units
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Avg Daily Waste</span>
                  <span className="text-neutral-600">
                    {Math.round(stockMovements.reduce((sum, m) => sum + m.waste, 0) / stockMovements.length)} units
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Positive Adjustments</span>
                  <span className="font-medium text-green-600">
                    {stockMovements.reduce((sum, m) => sum + Math.max(0, m.adjustments), 0)} units
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negative Adjustments</span>
                  <span className="font-medium text-red-600">
                    {Math.abs(stockMovements.reduce((sum, m) => sum + Math.min(0, m.adjustments), 0))} units
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Movement Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value text-green-600">
            {stockMovements.reduce((sum, m) => sum + m.stockIn, 0)}
          </div>
          <div className="metric-label">Total Stock In</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-red-600">
            {stockMovements.reduce((sum, m) => sum + m.stockOut, 0)}
          </div>
          <div className="metric-label">Total Stock Out</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-amber-600">
            {stockMovements.reduce((sum, m) => sum + m.waste, 0)}
          </div>
          <div className="metric-label">Total Waste</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-blue-600">
            {stockMovements.reduce((sum, m) => sum + m.stockIn - m.stockOut, 0)}
          </div>
          <div className="metric-label">Net Movement</div>
        </div>
      </div>
    </div>
  );

  const renderCostAnalysis = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Purchase Cost', value: 89750, color: 'bg-blue-500' },
              { label: 'Carrying Cost', value: 12475, color: 'bg-green-500' },
              { label: 'Waste Cost', value: 4850, color: 'bg-red-500' },
              { label: 'Storage Cost', value: 7200, color: 'bg-amber-500' }
            ].map(cost => {
              const total = 89750 + 12475 + 4850 + 7200;
              const percentage = (cost.value / total) * 100;
              return (
                <div key={cost.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{cost.label}</span>
                    <span className="text-neutral-600">
                      ${cost.value.toLocaleString()} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className={`${cost.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Efficiency Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Cost per Unit Sold</span>
              <span className="font-medium">$3.42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Inventory Holding Cost</span>
              <span className="font-medium">12.8%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Waste Cost Ratio</span>
              <span className="font-medium text-red-600">4.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Purchase Price Variance</span>
              <span className="font-medium text-green-600">-2.1%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Storage Cost per Item</span>
              <span className="font-medium">$8.12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inventory Analytics</h1>
          <p className="text-neutral-600">
            Comprehensive insights and performance metrics
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <Button
            onClick={() => navigate('/inventory')}
            variant="outline"
          >
            View Inventory
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'categories', label: 'Categories', icon: '🏷️' },
            { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
            { id: 'movement', label: 'Stock Movement', icon: '📈' },
            { id: 'costs', label: 'Cost Analysis', icon: '💰' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                selectedView === tab.id
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

      {/* Content */}
      <div className="space-y-6">
        {selectedView === 'overview' && renderOverviewMetrics()}
        {selectedView === 'categories' && renderCategoryAnalytics()}
        {selectedView === 'suppliers' && renderSupplierPerformance()}
        {selectedView === 'movement' && renderStockMovement()}
        {selectedView === 'costs' && renderCostAnalysis()}
      </div>

      {/* Export Options */}
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-neutral-900">Export Analytics</h3>
            <p className="text-sm text-neutral-600">Download detailed reports for further analysis</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button variant="outline" size="sm">
              Export PDF
            </Button>
            <Button variant="outline" size="sm">
              Schedule Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryAnalytics;