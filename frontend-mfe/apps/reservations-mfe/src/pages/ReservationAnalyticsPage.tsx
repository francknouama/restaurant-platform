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

interface ReservationTrend {
  date: string;
  reservations: number;
  completed: number;
  cancelled: number;
  noShows: number;
  revenue: number;
}

interface TableUtilization {
  tableNumber: number;
  utilizationRate: number;
  totalReservations: number;
  revenue: number;
  averageTurnover: number;
}

interface TimeSlotAnalysis {
  timeSlot: string;
  reservations: number;
  utilizationRate: number;
  averagePartySize: number;
  revenue: number;
}

const ReservationAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('week');
  const [selectedView, setSelectedView] = useState<'overview' | 'tables' | 'times' | 'customers'>('overview');

  // Mock analytics data
  const [overviewMetrics, setOverviewMetrics] = useState<AnalyticsMetric[]>([
    {
      label: 'Total Reservations',
      value: 1247,
      change: 8.2,
      changeType: 'positive',
      trend: [1100, 1150, 1180, 1200, 1220, 1247]
    },
    {
      label: 'Completion Rate',
      value: '87.5%',
      change: 2.3,
      changeType: 'positive',
      trend: [84, 85, 86, 86.5, 87, 87.5]
    },
    {
      label: 'Avg Party Size',
      value: 3.2,
      change: -0.1,
      changeType: 'negative',
      trend: [3.4, 3.3, 3.3, 3.2, 3.2, 3.2]
    },
    {
      label: 'Revenue per Reservation',
      value: '$124',
      change: 15.4,
      changeType: 'positive',
      trend: [105, 108, 112, 118, 121, 124]
    },
    {
      label: 'Table Utilization',
      value: '73%',
      change: 5.1,
      changeType: 'positive',
      trend: [68, 69, 70, 71, 72, 73]
    },
    {
      label: 'No-Show Rate',
      value: '4.2%',
      change: -1.8,
      changeType: 'positive',
      trend: [6.0, 5.5, 5.0, 4.8, 4.5, 4.2]
    }
  ]);

  const [reservationTrends, setReservationTrends] = useState<ReservationTrend[]>([]);
  const [tableUtilization, setTableUtilization] = useState<TableUtilization[]>([]);
  const [timeSlotAnalysis, setTimeSlotAnalysis] = useState<TimeSlotAnalysis[]>([]);

  useEffect(() => {
    // Generate mock trend data
    const trends: ReservationTrend[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const baseReservations = 150 + Math.floor(Math.random() * 50);
      const completed = Math.floor(baseReservations * (0.85 + Math.random() * 0.1));
      const cancelled = Math.floor(baseReservations * (0.08 + Math.random() * 0.04));
      const noShows = baseReservations - completed - cancelled;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        reservations: baseReservations,
        completed,
        cancelled,
        noShows,
        revenue: completed * (100 + Math.random() * 50)
      });
    }
    setReservationTrends(trends);

    // Generate table utilization data
    const tables: TableUtilization[] = [];
    for (let i = 1; i <= 25; i++) {
      tables.push({
        tableNumber: i,
        utilizationRate: Math.round((0.6 + Math.random() * 0.35) * 100),
        totalReservations: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        averageTurnover: Math.round((90 + Math.random() * 60) * 10) / 10
      });
    }
    setTableUtilization(tables.sort((a, b) => b.utilizationRate - a.utilizationRate));

    // Generate time slot analysis
    const timeSlots: TimeSlotAnalysis[] = [];
    const slots = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
    
    slots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0]);
      const isPeakTime = hour >= 18 && hour <= 20;
      const baseDemand = isPeakTime ? 0.8 : hour >= 12 && hour <= 13 ? 0.6 : 0.4;
      
      timeSlots.push({
        timeSlot: slot,
        reservations: Math.floor((baseDemand + Math.random() * 0.2) * 100),
        utilizationRate: Math.round((baseDemand + Math.random() * 0.2) * 100),
        averagePartySize: Math.round((2.5 + Math.random() * 2) * 10) / 10,
        revenue: Math.floor((baseDemand + Math.random() * 0.2) * 2000)
      });
    });
    setTimeSlotAnalysis(timeSlots);
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
      {overviewMetrics.map((metric, index) => (
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

  const renderReservationTrends = () => (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Reservation Trends</h3>
      <div className="space-y-4">
        {/* Simple bar chart representation */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h4 className="font-medium text-neutral-700 mb-2">Daily Reservations</h4>
            <div className="flex items-end space-x-2 h-32">
              {reservationTrends.map((data, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-full transition-all duration-300 hover:bg-blue-600"
                    style={{
                      height: `${(data.reservations / Math.max(...reservationTrends.map(d => d.reservations))) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`${new Date(data.date).toLocaleDateString()}: ${data.reservations} reservations`}
                  />
                  <div className="text-xs text-neutral-600 mt-1 transform -rotate-45 origin-center">
                    {new Date(data.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-neutral-700 mb-2">Completion Rate</h4>
              <div className="flex items-end space-x-1 h-20">
                {reservationTrends.map((data, index) => {
                  const completionRate = (data.completed / data.reservations) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-green-500 rounded-t w-full transition-all duration-300 hover:bg-green-600"
                        style={{
                          height: `${completionRate}%`,
                          minHeight: '4px'
                        }}
                        title={`${completionRate.toFixed(1)}%`}
                      />
                      <div className="text-xs text-neutral-600 mt-1">
                        {completionRate.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-700 mb-2">Cancellation Rate</h4>
              <div className="flex items-end space-x-1 h-20">
                {reservationTrends.map((data, index) => {
                  const cancellationRate = (data.cancelled / data.reservations) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-amber-500 rounded-t w-full transition-all duration-300 hover:bg-amber-600"
                        style={{
                          height: `${cancellationRate * 5}%`, // Multiply by 5 for visibility
                          minHeight: '4px'
                        }}
                        title={`${cancellationRate.toFixed(1)}%`}
                      />
                      <div className="text-xs text-neutral-600 mt-1">
                        {cancellationRate.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-700 mb-2">No-Show Rate</h4>
              <div className="flex items-end space-x-1 h-20">
                {reservationTrends.map((data, index) => {
                  const noShowRate = (data.noShows / data.reservations) * 100;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="bg-red-500 rounded-t w-full transition-all duration-300 hover:bg-red-600"
                        style={{
                          height: `${noShowRate * 10}%`, // Multiply by 10 for visibility
                          minHeight: '4px'
                        }}
                        title={`${noShowRate.toFixed(1)}%`}
                      />
                      <div className="text-xs text-neutral-600 mt-1">
                        {noShowRate.toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTableAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h3 className="text-lg font-semibold">Table Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Reservations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Avg Turnover
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {tableUtilization.slice(0, 10).map(table => (
                <tr key={table.tableNumber} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">Table {table.tableNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 h-2 bg-neutral-200 rounded-full mr-2">
                        <div
                          className={`h-2 rounded-full ${
                            table.utilizationRate > 80 ? 'bg-green-500' : 
                            table.utilizationRate > 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${table.utilizationRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-neutral-900">{table.utilizationRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {table.totalReservations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    ${table.revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {table.averageTurnover}min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTimeSlotAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Time Slot Performance</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Reservation Volume by Time</h4>
            <div className="space-y-2">
              {timeSlotAnalysis.map(slot => (
                <div key={slot.timeSlot} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-16">{slot.timeSlot}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full h-4 bg-neutral-200 rounded-full">
                      <div
                        className="h-4 bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${(slot.reservations / Math.max(...timeSlotAnalysis.map(s => s.reservations))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-neutral-600 w-12 text-right">{slot.reservations}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-neutral-700 mb-3">Revenue by Time Slot</h4>
            <div className="space-y-2">
              {timeSlotAnalysis.map(slot => (
                <div key={slot.timeSlot} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-16">{slot.timeSlot}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full h-4 bg-neutral-200 rounded-full">
                      <div
                        className="h-4 bg-green-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${(slot.revenue / Math.max(...timeSlotAnalysis.map(s => s.revenue))) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-neutral-600 w-16 text-right">${slot.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {timeSlotAnalysis.reduce((max, slot) => slot.reservations > max.reservations ? slot : max).timeSlot}
          </div>
          <div className="metric-label">Peak Hour</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(timeSlotAnalysis.reduce((acc, slot) => acc + slot.averagePartySize, 0) / timeSlotAnalysis.length * 10) / 10}
          </div>
          <div className="metric-label">Avg Party Size</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(timeSlotAnalysis.reduce((acc, slot) => acc + slot.utilizationRate, 0) / timeSlotAnalysis.length)}%
          </div>
          <div className="metric-label">Avg Utilization</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reservation Analytics</h1>
          <p className="text-neutral-600">Performance insights and operational metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>

          <Button
            onClick={() => navigate('/reservations')}
            variant="outline"
          >
            View Reservations
          </Button>

          <Button
            onClick={() => navigate('/tables')}
            variant="outline"
          >
            Table Management
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tables', label: 'Table Analytics' },
            { id: 'times', label: 'Time Slots' },
            { id: 'customers', label: 'Customer Insights' }
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
      <div className="space-y-6">
        {selectedView === 'overview' && (
          <>
            {renderOverviewMetrics()}
            {renderReservationTrends()}
          </>
        )}
        
        {selectedView === 'tables' && renderTableAnalytics()}
        {selectedView === 'times' && renderTimeSlotAnalytics()}
        
        {selectedView === 'customers' && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <div className="text-center py-12">
              <div className="text-neutral-400 text-lg mb-2">Customer Analytics</div>
              <div className="text-neutral-500 text-sm">
                Customer insights and behavior analysis coming soon...
              </div>
              <Button
                onClick={() => navigate('/customers')}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                View Customer Management
              </Button>
            </div>
          </div>
        )}
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

export default ReservationAnalyticsPage;