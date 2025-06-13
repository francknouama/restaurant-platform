import React, { useState, useEffect } from 'react';
import { Card, Button, Input, StatusBadge } from '@restaurant/shared-ui';
import { 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Zap, 
  TrendingUp, 
  DollarSign,
  ShoppingCart,
  AlertTriangle
} from 'lucide-react';

// Mock data types
interface Order {
  id: string;
  orderNumber: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  customerName: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  estimatedTime: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

const OrderDashboardPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Mock data
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        type: 'DINE_IN',
        status: 'PREPARING',
        customerName: 'John Doe',
        total: 45.99,
        items: [
          { name: 'Margherita Pizza', quantity: 1, price: 18.99 },
          { name: 'Caesar Salad', quantity: 2, price: 13.50 }
        ],
        createdAt: '2024-01-15T10:30:00Z',
        estimatedTime: 25,
        priority: 'HIGH'
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        type: 'TAKEOUT',
        status: 'READY',
        customerName: 'Jane Smith',
        total: 32.50,
        items: [
          { name: 'Chicken Burger', quantity: 2, price: 16.25 }
        ],
        createdAt: '2024-01-15T10:45:00Z',
        estimatedTime: 15,
        priority: 'MEDIUM'
      },
      {
        id: '3',
        orderNumber: 'ORD-003',
        type: 'DELIVERY',
        status: 'CONFIRMED',
        customerName: 'Bob Wilson',
        total: 67.25,
        items: [
          { name: 'Family Pizza Combo', quantity: 1, price: 67.25 }
        ],
        createdAt: '2024-01-15T11:00:00Z',
        estimatedTime: 35,
        priority: 'MEDIUM'
      }
    ];
    setOrders(mockOrders);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'amber';
      case 'CONFIRMED': return 'emerald';
      case 'PREPARING': return 'blue';
      case 'READY': return 'purple';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'red';
      case 'MEDIUM': return 'amber';
      case 'LOW': return 'green';
      default: return 'gray';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Order Dashboard</h1>
          <p className="mt-2 text-neutral-600">Manage and track all restaurant orders</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Quick Order</span>
          </Button>
          <Button variant="primary" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Orders</p>
              <p className="text-2xl font-bold text-neutral-900">12</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-neutral-900">$1,247</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Avg Prep Time</p>
              <p className="text-2xl font-bold text-neutral-900">23min</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Orders Today</p>
              <p className="text-2xl font-bold text-neutral-900">47</p>
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="COMPLETED">Completed</option>
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
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </Button>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No orders found</h3>
              <p className="text-neutral-600">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more orders.'
                  : 'No orders have been placed yet today.'}
              </p>
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="order-card hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-lg">{order.orderNumber}</span>
                      <StatusBadge 
                        status={order.status.toLowerCase()} 
                        color={getStatusColor(order.status)}
                      />
                      <div className={`priority-indicator ${order.priority.toLowerCase()}`} />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-neutral-600">
                      <span>{order.customerName}</span>
                      <span>•</span>
                      <span>{order.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Ordered {formatTime(order.createdAt)}</span>
                      {order.status === 'PREPARING' && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 font-medium">
                            ~{order.estimatedTime}min remaining
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-lg">{formatCurrency(order.total)}</div>
                    <div className="text-sm text-neutral-600">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {order.status === 'READY' && (
                      <Button size="sm" variant="primary">
                        Complete
                      </Button>
                    )}
                    {order.status === 'PREPARING' && (
                      <Button size="sm" variant="secondary">
                        Mark Ready
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Items Preview */}
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-2 py-1 text-xs bg-neutral-100 rounded-md"
                    >
                      {item.quantity}x {item.name}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderDashboardPage;