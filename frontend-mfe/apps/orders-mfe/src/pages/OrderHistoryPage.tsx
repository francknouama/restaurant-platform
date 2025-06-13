import React, { useState, useEffect } from 'react';
import { Card, Button, Input, StatusBadge } from '@restaurant/shared-ui';
import { 
  Search, 
  Calendar, 
  Download, 
  Eye,
  TrendingUp,
  DollarSign,
  Clock,
  Percent
} from 'lucide-react';

interface HistoryOrder {
  id: string;
  orderNumber: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'COMPLETED' | 'CANCELLED';
  customerName: string;
  total: number;
  itemCount: number;
  completedAt: string;
  duration: number; // in minutes
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('today');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    setTimeout(() => {
      const mockOrders: HistoryOrder[] = [
        {
          id: '1',
          orderNumber: 'ORD-098',
          type: 'DINE_IN',
          status: 'COMPLETED',
          customerName: 'Alice Johnson',
          total: 67.50,
          itemCount: 3,
          completedAt: '2024-01-15T14:30:00Z',
          duration: 28
        },
        {
          id: '2',
          orderNumber: 'ORD-097',
          type: 'TAKEOUT',
          status: 'COMPLETED',
          customerName: 'Bob Smith',
          total: 24.99,
          itemCount: 2,
          completedAt: '2024-01-15T14:15:00Z',
          duration: 18
        },
        {
          id: '3',
          orderNumber: 'ORD-096',
          type: 'DELIVERY',
          status: 'CANCELLED',
          customerName: 'Carol Davis',
          total: 45.25,
          itemCount: 4,
          completedAt: '2024-01-15T13:45:00Z',
          duration: 0
        },
        {
          id: '4',
          orderNumber: 'ORD-095',
          type: 'DINE_IN',
          status: 'COMPLETED',
          customerName: 'David Wilson',
          total: 89.75,
          itemCount: 5,
          completedAt: '2024-01-15T13:20:00Z',
          duration: 35
        },
        {
          id: '5',
          orderNumber: 'ORD-094',
          type: 'TAKEOUT',
          status: 'COMPLETED',
          customerName: 'Eve Brown',
          total: 31.50,
          itemCount: 2,
          completedAt: '2024-01-15T12:55:00Z',
          duration: 22
        }
      ];
      setOrders(mockOrders);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    
    // Date filtering logic would go here
    // For now, just filtering by search, status, and type
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    totalOrders: filteredOrders.length,
    completedOrders: filteredOrders.filter(o => o.status === 'COMPLETED').length,
    cancelledOrders: filteredOrders.filter(o => o.status === 'CANCELLED').length,
    totalRevenue: filteredOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: filteredOrders.length > 0 
      ? filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length 
      : 0,
    averageDuration: filteredOrders
      .filter(o => o.status === 'COMPLETED' && o.duration > 0)
      .reduce((sum, o, _, arr) => sum + o.duration / arr.length, 0)
  };

  const completionRate = stats.totalOrders > 0 
    ? (stats.completedOrders / stats.totalOrders) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Order History</h1>
          <p className="mt-2 text-neutral-600">View completed and cancelled orders</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Orders</p>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalOrders}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Total Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Avg Duration</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.round(stats.averageDuration)}min
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Percent className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Completion Rate</p>
              <p className="text-2xl font-bold text-neutral-900">
                {Math.round(completionRate)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <Input
              placeholder="Search orders or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="DINE_IN">Dine In</option>
            <option value="TAKEOUT">Takeout</option>
            <option value="DELIVERY">Delivery</option>
          </select>
          
          <Button variant="outline" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Date Range</span>
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Order</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Items</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Total</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Duration</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Completed</th>
                <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <div className="text-neutral-500">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                        ? 'No orders found matching your filters.'
                        : 'No order history available.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{order.orderNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-neutral-900">{order.customerName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600">
                        {order.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge 
                        status={order.status.toLowerCase()} 
                        color={getStatusColor(order.status)}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-600">{order.itemCount} items</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-neutral-600">
                        {order.duration > 0 ? `${order.duration}min` : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600">
                        {formatDate(order.completedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default OrderHistoryPage;