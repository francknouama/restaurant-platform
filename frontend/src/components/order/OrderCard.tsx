import React from 'react';
import { Order, OrderID, OrderStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export interface OrderCardProps {
  order: Order;
  onUpdateStatus?: (orderId: OrderID, status: OrderStatus) => void;
  onView?: (orderId: OrderID) => void;
  onEdit?: (orderId: OrderID) => void;
  onCancel?: (orderId: OrderID) => void;
  loading?: boolean;
  compact?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onView,
  onEdit,
  onCancel,
  loading = false,
  compact = false,
}) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      DINE_IN: '🍽️',
      TAKEOUT: '🥡',
      DELIVERY: '🚚',
    };
    return icons[type as keyof typeof icons] || '🍽️';
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors = {
      CREATED: 'info',
      PAID: 'success',
      PREPARING: 'warning',
      READY: 'info',
      COMPLETED: 'neutral',
      CANCELLED: 'danger',
    } as const;
    return colors[status] || 'neutral';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const transitions = {
      CREATED: 'PAID',
      PAID: 'PREPARING',
      PREPARING: 'READY',
      READY: 'COMPLETED',
    } as const;
    return transitions[currentStatus as keyof typeof transitions] || null;
  };

  const canCancel = (status: OrderStatus) => {
    return ['CREATED', 'PAID', 'PREPARING'].includes(status);
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        order.status === 'PREPARING' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 
        order.status === 'READY' ? 'ring-2 ring-green-500 bg-green-50' : ''
      }`}
      padding={compact ? 'sm' : 'md'}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-xl">{getTypeIcon(order.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">Order #{order.id.value.slice(-6)}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{order.type.replace('_', ' ')}</span>
              {order.tableID && <span>• Table {order.tableID}</span>}
              {order.deliveryAddress && <span>• Delivery</span>}
            </div>
          </div>
        </div>
        
        <StatusBadge 
          status={order.status} 
          variant={getStatusColor(order.status)}
          size={compact ? 'sm' : 'md'}
        >
          {order.status}
        </StatusBadge>
      </div>

      {/* Order Items */}
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Items ({order.items.length}):
        </h4>
        <div className="space-y-1">
          {order.items.slice(0, compact ? 2 : 3).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.menuItemName}
              </span>
              <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
          {order.items.length > (compact ? 2 : 3) && (
            <div className="text-sm text-gray-500">
              +{order.items.length - (compact ? 2 : 3)} more items
            </div>
          )}
        </div>
      </div>

      {/* Order Total */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(order.totalAmount - order.taxAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax (10%):</span>
          <span>{formatCurrency(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-1 mt-1">
          <span>Total:</span>
          <span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
          <span className="font-medium text-blue-900">Notes: </span>
          <span className="text-blue-700">{order.notes}</span>
        </div>
      )}

      {/* Time Info */}
      <div className="mb-4 text-sm text-gray-500">
        Created {formatTime(order.createdAt)}
        {order.updatedAt !== order.createdAt && (
          <span> • Updated {formatTime(order.updatedAt)}</span>
        )}
      </div>

      {/* Actions */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {nextStatus && onUpdateStatus && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUpdateStatus(order.id, nextStatus)}
              loading={loading}
            >
              Mark as {nextStatus}
            </Button>
          )}
          
          {onView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(order.id)}
              disabled={loading}
            >
              View Details
            </Button>
          )}
          
          {onEdit && order.status === 'CREATED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(order.id)}
              disabled={loading}
            >
              Edit
            </Button>
          )}
          
          {onCancel && canCancel(order.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(order.id)}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      )}

      {/* Status-specific indicators */}
      {order.status === 'PREPARING' && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center">
            <span className="text-yellow-600 text-sm">👨‍🍳</span>
            <span className="ml-2 text-sm text-yellow-700 font-medium">
              Currently being prepared in the kitchen
            </span>
          </div>
        </div>
      )}

      {order.status === 'READY' && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <span className="text-green-600 text-sm">✅</span>
            <span className="ml-2 text-sm text-green-700 font-medium">
              Ready for pickup/delivery
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OrderCard;