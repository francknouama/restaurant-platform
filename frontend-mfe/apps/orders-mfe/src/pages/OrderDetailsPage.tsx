import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, StatusBadge } from '@restaurant/shared-ui';
import {
  ArrowLeft,
  Edit,
  Printer,
  Clock,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';

interface OrderDetails {
  id: string;
  orderNumber: string;
  type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
    status: 'PENDING' | 'PREPARING' | 'READY';
  }>;
  payment: {
    method: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount: number;
    transactionId?: string;
  };
  timeline: Array<{
    timestamp: string;
    status: string;
    note?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  estimatedTime: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
}

const OrderDetailsPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data fetch
    setTimeout(() => {
      const mockOrder: OrderDetails = {
        id: orderId || '1',
        orderNumber: 'ORD-001',
        type: 'DINE_IN',
        status: 'PREPARING',
        customer: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, City, State 12345'
        },
        items: [
          {
            id: '1',
            name: 'Margherita Pizza',
            quantity: 1,
            price: 18.99,
            specialInstructions: 'Extra cheese, light sauce',
            status: 'PREPARING'
          },
          {
            id: '2',
            name: 'Caesar Salad',
            quantity: 2,
            price: 13.50,
            status: 'READY'
          },
          {
            id: '3',
            name: 'Garlic Bread',
            quantity: 1,
            price: 6.99,
            status: 'PENDING'
          }
        ],
        payment: {
          method: 'Credit Card',
          status: 'COMPLETED',
          amount: 45.99,
          transactionId: 'TXN-12345'
        },
        timeline: [
          { timestamp: '2024-01-15T10:30:00Z', status: 'Order Placed' },
          { timestamp: '2024-01-15T10:32:00Z', status: 'Payment Confirmed' },
          { timestamp: '2024-01-15T10:35:00Z', status: 'Kitchen Started Preparation' },
        ],
        subtotal: 39.48,
        tax: 6.51,
        total: 45.99,
        createdAt: '2024-01-15T10:30:00Z',
        estimatedTime: 25,
        priority: 'HIGH',
        notes: 'Customer requested table near the window'
      };
      setOrder(mockOrder);
      setIsLoading(false);
    }, 500);
  }, [orderId]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-neutral-200 rounded"></div>
              <div className="h-48 bg-neutral-200 rounded"></div>
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

  if (!order) {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Order not found</h3>
            <p className="text-neutral-600 mb-4">
              The order you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/orders')} variant="primary">
              Back to Orders
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
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{order.orderNumber}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <StatusBadge 
                status={order.status.toLowerCase()} 
                color={getStatusColor(order.status)}
              />
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-600">{order.type.replace('_', ' ')}</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-600">Placed {formatTime(order.createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Order Items</h2>
            </div>
            
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{item.name}</span>
                      <StatusBadge 
                        status={item.status.toLowerCase()} 
                        color={getStatusColor(item.status)}
                        size="sm"
                      />
                    </div>
                    <div className="text-sm text-neutral-600 mt-1">
                      Quantity: {item.quantity} × {formatCurrency(item.price)}
                    </div>
                    {item.specialInstructions && (
                      <div className="text-sm text-amber-600 mt-1">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="border-t border-neutral-200 pt-4 mt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-neutral-200 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Timeline */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">Order Timeline</h2>
            </div>
            
            <div className="order-timeline">
              {order.timeline.map((event, index) => (
                <div key={index} className="order-timeline-step completed">
                  <div className="timeline-marker"></div>
                  <div className="flex-1">
                    <div className="font-medium">{event.status}</div>
                    <div className="text-sm text-neutral-600">{formatTime(event.timestamp)}</div>
                    {event.note && (
                      <div className="text-sm text-neutral-600 mt-1">{event.note}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Customer Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="customer-avatar">
                  {order.customer.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium">{order.customer.name}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-neutral-600">
                <Mail className="w-4 h-4" />
                <span>{order.customer.email}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-sm text-neutral-600">
                <Phone className="w-4 h-4" />
                <span>{order.customer.phone}</span>
              </div>
              
              {order.customer.address && (
                <div className="flex items-start space-x-3 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{order.customer.address}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Information */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Payment Information</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Method</span>
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>{order.payment.method}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Status</span>
                <StatusBadge 
                  status={order.payment.status.toLowerCase()} 
                  color={order.payment.status === 'COMPLETED' ? 'green' : 'amber'}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Amount</span>
                <span className="font-semibold">{formatCurrency(order.payment.amount)}</span>
              </div>
              
              {order.payment.transactionId && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Transaction ID</span>
                  <span className="text-sm font-mono">{order.payment.transactionId}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Order Actions */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Actions</h2>
            </div>
            
            <div className="space-y-3">
              {order.status === 'PREPARING' && (
                <Button variant="primary" className="w-full flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Ready</span>
                </Button>
              )}
              
              {order.status === 'READY' && (
                <Button variant="success" className="w-full flex items-center justify-center space-x-2">
                  <Package className="w-4 h-4" />
                  <span>Complete Order</span>
                </Button>
              )}
              
              <Button variant="outline" className="w-full">
                Modify Order
              </Button>
              
              {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <Button variant="danger" className="w-full flex items-center justify-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Order</span>
                </Button>
              )}
            </div>
          </Card>

          {/* Special Notes */}
          {order.notes && (
            <Card>
              <div className="border-b border-neutral-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-neutral-900">Special Notes</h2>
              </div>
              <p className="text-sm text-neutral-600">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;