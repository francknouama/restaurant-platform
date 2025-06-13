import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge } from '@restaurant/shared-ui';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Clock,
  Eye
} from 'lucide-react';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'COMPLETED' | 'CANCELLED';
  total: number;
  itemCount: number;
  date: string;
}

interface CustomerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  preferences: string[];
  notes?: string;
  orders: CustomerOrder[];
}

const CustomerDetailsPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      const mockCustomer: CustomerDetails = {
        id: customerId || '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, City, State 12345',
        totalOrders: 15,
        totalSpent: 425.75,
        averageOrderValue: 28.38,
        lastOrderDate: '2024-01-15T10:30:00Z',
        joinDate: '2023-08-15T09:00:00Z',
        status: 'ACTIVE',
        preferences: ['No onions', 'Extra cheese', 'Spicy food'],
        notes: 'Preferred customer - always tips well. Likes table near the window.',
        orders: [
          {
            id: '1',
            orderNumber: 'ORD-098',
            type: 'DINE_IN',
            status: 'COMPLETED',
            total: 45.99,
            itemCount: 3,
            date: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            orderNumber: 'ORD-087',
            type: 'TAKEOUT',
            status: 'COMPLETED',
            total: 32.50,
            itemCount: 2,
            date: '2024-01-12T14:20:00Z'
          },
          {
            id: '3',
            orderNumber: 'ORD-076',
            type: 'DELIVERY',
            status: 'COMPLETED',
            total: 67.25,
            itemCount: 4,
            date: '2024-01-08T19:15:00Z'
          },
          {
            id: '4',
            orderNumber: 'ORD-065',
            type: 'DINE_IN',
            status: 'CANCELLED',
            total: 0,
            itemCount: 0,
            date: '2024-01-05T12:00:00Z'
          },
          {
            id: '5',
            orderNumber: 'ORD-054',
            type: 'TAKEOUT',
            status: 'COMPLETED',
            total: 28.75,
            itemCount: 2,
            date: '2024-01-02T16:45:00Z'
          }
        ]
      };
      setCustomer(mockCustomer);
      setIsLoading(false);
    }, 500);
  }, [customerId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerType = () => {
    if (!customer) return { label: 'New', color: 'gray' };
    if (customer.totalOrders >= 20 || customer.totalSpent >= 500) return { label: 'VIP', color: 'purple' };
    if (customer.totalOrders >= 10 || customer.totalSpent >= 200) return { label: 'Regular', color: 'blue' };
    if (customer.totalOrders >= 5) return { label: 'Frequent', color: 'green' };
    return { label: 'New', color: 'gray' };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const completedOrders = customer?.orders.filter(order => order.status === 'COMPLETED') || [];
  const customerType = getCustomerType();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-neutral-200 rounded"></div>
              <div className="h-64 bg-neutral-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-neutral-200 rounded"></div>
              <div className="h-48 bg-neutral-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Customer not found</h3>
            <p className="text-neutral-600 mb-4">
              The customer you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/orders/customers')} variant="primary">
              Back to Customers
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/orders/customers')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{customer.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                customerType.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                customerType.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                customerType.color === 'green' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {customerType.label} Customer
              </span>
              <StatusBadge 
                status={customer.status.toLowerCase()} 
                color={customer.status === 'ACTIVE' ? 'green' : 'gray'}
              />
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-600">Member since {formatDate(customer.joinDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            variant="primary"
            onClick={() => navigate(`/orders/new?customer=${customer.id}`)}
          >
            New Order
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total Orders</p>
                  <p className="text-xl font-bold text-neutral-900">{customer.totalOrders}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Total Spent</p>
                  <p className="text-xl font-bold text-neutral-900">{formatCurrency(customer.totalSpent)}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Avg Order</p>
                  <p className="text-xl font-bold text-neutral-900">{formatCurrency(customer.averageOrderValue)}</p>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-neutral-600">Last Order</p>
                  <p className="text-xl font-bold text-neutral-900">{formatDate(customer.lastOrderDate)}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Order History */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Order History</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-2 font-medium text-neutral-600">Order</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Type</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Status</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Items</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Total</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Date</th>
                    <th className="text-left py-2 font-medium text-neutral-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="py-3">
                        <span className="font-medium">{order.orderNumber}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-neutral-600">
                          {order.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge 
                          status={order.status.toLowerCase()} 
                          color={getStatusColor(order.status)}
                        />
                      </td>
                      <td className="py-3">
                        <span className="text-neutral-600">{order.itemCount} items</span>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{formatCurrency(order.total)}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-neutral-600">
                          {formatDateTime(order.date)}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Contact Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="w-4 h-4 text-neutral-500" />
                <div>
                  <div className="text-neutral-900">{customer.email}</div>
                  <div className="text-neutral-500">Email</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="w-4 h-4 text-neutral-500" />
                <div>
                  <div className="text-neutral-900">{customer.phone}</div>
                  <div className="text-neutral-500">Phone</div>
                </div>
              </div>
              
              {customer.address && (
                <div className="flex items-start space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-neutral-500 mt-0.5" />
                  <div>
                    <div className="text-neutral-900">{customer.address}</div>
                    <div className="text-neutral-500">Address</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3 text-sm">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <div>
                  <div className="text-neutral-900">{formatDate(customer.joinDate)}</div>
                  <div className="text-neutral-500">Member Since</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Preferences */}
          {customer.preferences && customer.preferences.length > 0 && (
            <Card>
              <div className="border-b border-neutral-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Preferences</h2>
              </div>
              
              <div className="space-y-2">
                {customer.preferences.map((preference, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md mr-2 mb-2"
                  >
                    {preference}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {customer.notes && (
            <Card>
              <div className="border-b border-neutral-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Notes</h2>
              </div>
              
              <p className="text-sm text-neutral-600">{customer.notes}</p>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Quick Stats</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Completed Orders</span>
                <span className="font-medium">{completedOrders.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Cancelled Orders</span>
                <span className="font-medium">{customer.orders.filter(o => o.status === 'CANCELLED').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Success Rate</span>
                <span className="font-medium">
                  {customer.totalOrders > 0 
                    ? Math.round((completedOrders.length / customer.totalOrders) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Favorite Order Type</span>
                <span className="font-medium">
                  {(() => {
                    if (completedOrders.length === 0) return 'N/A';
                    const typeCounts = completedOrders.reduce((acc, order) => {
                      acc[order.type] = (acc[order.type] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    const mostFrequent = Object.entries(typeCounts)
                      .sort((a, b) => b[1] - a[1])[0];
                    return mostFrequent?.[0]?.replace('_', ' ') || 'N/A';
                  })()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsPage;