import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  trend: number[];
}

interface StationAnalytics {
  stationId: string;
  stationName: string;
  ordersCompleted: number;
  averageTime: number;
  efficiency: number;
  capacity: number;
  utilization: number;
  errors: number;
}

interface ChefAnalytics {
  chefId: string;
  chefName: string;
  station: string;
  ordersCompleted: number;
  averageTime: number;
  efficiency: number;
  accuracy: number;
  hoursWorked: number;
}

interface OrderTrendData {
  hour: string;
  orders: number;
  avgTime: number;
  errors: number;
}

const KitchenAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedView, setSelectedView] = useState<'overview' | 'stations' | 'chefs' | 'trends'>('overview');

  // Mock analytics data
  const [overviewMetrics, setOverviewMetrics] = useState<PerformanceMetric[]>([
    {
      label: 'Orders Completed',
      value: 247,
      change: 12.5,
      changeType: 'positive',
      trend: [180, 195, 210, 225, 240, 247]
    },
    {
      label: 'Average Order Time',
      value: '11.2m',
      change: -8.3,
      changeType: 'positive',
      trend: [13.5, 12.8, 12.1, 11.8, 11.5, 11.2]
    },
    {
      label: 'Kitchen Efficiency',
      value: '94%',
      change: 3.2,
      changeType: 'positive',
      trend: [88, 90, 91, 92, 93, 94]
    },
    {
      label: 'Order Accuracy',
      value: '98.5%',
      change: 1.1,
      changeType: 'positive',
      trend: [96.5, 97.1, 97.8, 98.1, 98.3, 98.5]
    },
    {
      label: 'Peak Hour Performance',
      value: '89%',
      change: -2.1,
      changeType: 'negative',
      trend: [92, 91, 90, 89, 88, 89]
    },
    {
      label: 'Customer Wait Time',
      value: '8.7m',
      change: -15.2,
      changeType: 'positive',
      trend: [12.1, 11.3, 10.5, 9.8, 9.1, 8.7]
    }
  ]);

  const [stationAnalytics, setStationAnalytics] = useState<StationAnalytics[]>([
    {
      stationId: 'grill',
      stationName: 'Grill Station',
      ordersCompleted: 78,
      averageTime: 12.5,
      efficiency: 92,
      capacity: 8,
      utilization: 85,
      errors: 2
    },
    {
      stationId: 'prep',
      stationName: 'Prep Station',
      ordersCompleted: 112,
      averageTime: 7.8,
      efficiency: 97,
      capacity: 6,
      utilization: 78,
      errors: 1
    },
    {
      stationId: 'salad',
      stationName: 'Salad Station',
      ordersCompleted: 45,
      averageTime: 4.9,
      efficiency: 99,
      capacity: 4,
      utilization: 65,
      errors: 0
    },
    {
      stationId: 'dessert',
      stationName: 'Dessert Station',
      ordersCompleted: 28,
      averageTime: 3.8,
      efficiency: 96,
      capacity: 3,
      utilization: 52,
      errors: 1
    },
    {
      stationId: 'drinks',
      stationName: 'Beverage Station',
      ordersCompleted: 67,
      averageTime: 2.1,
      efficiency: 95,
      capacity: 2,
      utilization: 88,
      errors: 0
    }
  ]);

  const [chefAnalytics, setChefAnalytics] = useState<ChefAnalytics[]>([
    {
      chefId: 'chef_001',
      chefName: 'Marco Rodriguez',
      station: 'Grill',
      ordersCompleted: 42,
      averageTime: 11.8,
      efficiency: 95,
      accuracy: 99,
      hoursWorked: 8
    },
    {
      chefId: 'chef_002',
      chefName: 'Sarah Chen',
      station: 'Grill',
      ordersCompleted: 36,
      averageTime: 13.2,
      efficiency: 88,
      accuracy: 97,
      hoursWorked: 8
    },
    {
      chefId: 'chef_003',
      chefName: 'David Kim',
      station: 'Prep',
      ordersCompleted: 58,
      averageTime: 7.5,
      efficiency: 98,
      accuracy: 99.5,
      hoursWorked: 8
    },
    {
      chefId: 'chef_004',
      chefName: 'Lisa Martinez',
      station: 'Salad',
      ordersCompleted: 45,
      averageTime: 4.9,
      efficiency: 99,
      accuracy: 100,
      hoursWorked: 8
    },
    {
      chefId: 'chef_005',
      chefName: 'Emma Thompson',
      station: 'Dessert',
      ordersCompleted: 28,
      averageTime: 3.8,
      efficiency: 96,
      accuracy: 98,
      hoursWorked: 8
    },
    {
      chefId: 'chef_006',
      chefName: 'Alex Rivera',
      station: 'Beverages',
      ordersCompleted: 67,
      averageTime: 2.1,
      efficiency: 95,
      accuracy: 99,
      hoursWorked: 8
    }
  ]);

  const [orderTrends, setOrderTrends] = useState<OrderTrendData[]>([
    { hour: '8:00', orders: 12, avgTime: 9.5, errors: 0 },
    { hour: '9:00', orders: 18, avgTime: 10.2, errors: 1 },
    { hour: '10:00', orders: 25, avgTime: 10.8, errors: 0 },
    { hour: '11:00', orders: 34, avgTime: 11.5, errors: 1 },
    { hour: '12:00', orders: 42, avgTime: 13.2, errors: 2 },
    { hour: '13:00', orders: 38, avgTime: 12.8, errors: 1 },
    { hour: '14:00', orders: 28, avgTime: 11.9, errors: 0 },
    { hour: '15:00', orders: 22, avgTime: 10.5, errors: 0 },
    { hour: '16:00', orders: 28, avgTime: 11.2, errors: 1 }
  ]);

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
      {overviewMetrics.map((metric, index) => (
        <div key={index} className="performance-metric">
          <div className="metric-value">{metric.value}</div>
          <div className="metric-label">{metric.label}</div>
          <div className={`metric-change ${metric.changeType}`}>
            <span className={getChangeColor(metric.changeType)}>
              {getChangeIcon(metric.changeType)} {Math.abs(metric.change)}%
            </span>
            <span className="text-neutral-500 ml-1">vs yesterday</span>
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

  const renderStationAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Station Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {stationAnalytics.map((station) => (
                <tr key={station.stationId} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`station-indicator ${station.stationId} mr-2`}></span>
                      <span className="font-medium text-neutral-900">{station.stationName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {station.ordersCompleted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {station.averageTime}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-2 bg-neutral-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${station.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-900">{station.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-2 bg-neutral-200 rounded-full mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            station.utilization > 80 ? 'bg-red-500' : 
                            station.utilization > 60 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${station.utilization}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-900">{station.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${station.errors === 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {station.errors}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderChefAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Chef Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Chef
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Station
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Efficiency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Hours
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {chefAnalytics.map((chef) => (
                <tr key={chef.chefId} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-neutral-900">{chef.chefName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                    {chef.station}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {chef.ordersCompleted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {chef.averageTime}m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-2 bg-neutral-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${chef.efficiency}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-900">{chef.efficiency}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-12 h-2 bg-neutral-200 rounded-full mr-2">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${chef.accuracy}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-900">{chef.accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {chef.hoursWorked}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrderTrends = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Order Volume & Performance Trends</h3>
        <div className="space-y-4">
          {/* Simple bar chart representation */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h4 className="font-medium text-neutral-700 mb-2">Orders per Hour</h4>
              <div className="flex items-end space-x-2 h-32">
                {orderTrends.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                      style={{
                        height: `${(data.orders / Math.max(...orderTrends.map(d => d.orders))) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`${data.hour}: ${data.orders} orders`}
                    />
                    <div className="text-xs text-neutral-600 mt-1 transform -rotate-45 origin-center">
                      {data.hour}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-700 mb-2">Average Order Time (minutes)</h4>
              <div className="flex items-end space-x-2 h-20">
                {orderTrends.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="bg-amber-500 rounded-t w-full transition-all duration-300 hover:bg-amber-600"
                      style={{
                        height: `${(data.avgTime / Math.max(...orderTrends.map(d => d.avgTime))) * 100}%`,
                        minHeight: '4px'
                      }}
                      title={`${data.hour}: ${data.avgTime}m avg`}
                    />
                    <div className="text-xs text-neutral-600 mt-1">
                      {data.avgTime}m
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Peak Hours Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="performance-metric">
            <div className="metric-value">12:00 PM</div>
            <div className="metric-label">Peak Hour</div>
            <div className="text-xs text-neutral-600 mt-1">42 orders</div>
          </div>
          <div className="performance-metric">
            <div className="metric-value">15:00 PM</div>
            <div className="metric-label">Fastest Service</div>
            <div className="text-xs text-neutral-600 mt-1">10.5m avg</div>
          </div>
          <div className="performance-metric">
            <div className="metric-value">12:00 PM</div>
            <div className="metric-label">Most Errors</div>
            <div className="text-xs text-neutral-600 mt-1">2 errors</div>
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
          <h1 className="text-2xl font-bold text-neutral-900">Kitchen Analytics</h1>
          <p className="text-neutral-600">Performance insights and operational metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Back to Queue
          </Button>

          <Button
            onClick={() => navigate('/stations')}
            variant="outline"
          >
            Station View
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'stations', label: 'Stations' },
            { id: 'chefs', label: 'Chefs' },
            { id: 'trends', label: 'Trends' }
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
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {selectedView === 'overview' && renderOverviewMetrics()}
        {selectedView === 'stations' && renderStationAnalytics()}
        {selectedView === 'chefs' && renderChefAnalytics()}
        {selectedView === 'trends' && renderOrderTrends()}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenAnalyticsPage;