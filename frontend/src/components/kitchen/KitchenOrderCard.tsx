import React from 'react';
import { KitchenOrder, KitchenOrderID, KitchenOrderStatus, KitchenPriority } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export interface KitchenOrderCardProps {
  order: KitchenOrder;
  onStatusUpdate?: (orderId: KitchenOrderID, status: KitchenOrderStatus) => void;
  onStartPreparation?: (orderId: KitchenOrderID) => void;
  onMarkReady?: (orderId: KitchenOrderID) => void;
  onComplete?: (orderId: KitchenOrderID) => void;
  onCancel?: (orderId: KitchenOrderID) => void;
  onAssignStation?: (orderId: KitchenOrderID, station: string) => void;
  onUpdatePriority?: (orderId: KitchenOrderID, priority: KitchenPriority) => void;
  onItemAction?: (orderId: KitchenOrderID, itemId: string, action: 'start' | 'complete') => void;
  loading?: boolean;
  stations?: string[];
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onStartPreparation,
  onMarkReady,
  onComplete,
  onCancel,
  onAssignStation,
  onUpdatePriority,
  onItemAction,
  loading = false,
  stations = [],
}) => {
  const getPriorityColor = (priority: KitchenPriority) => {
    const colors = {
      LOW: 'neutral',
      NORMAL: 'info',
      HIGH: 'warning',
      URGENT: 'danger',
    } as const;
    return colors[priority];
  };

  const getStatusColor = (status: KitchenOrderStatus) => {
    const colors = {
      NEW: 'info',
      PREPARING: 'warning',
      READY: 'success',
      COMPLETED: 'neutral',
      CANCELLED: 'danger',
    } as const;
    return colors[status];
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`;
  };

  const getProgressPercentage = () => {
    if (!order.startedAt) return 0;
    const startTime = new Date(order.startedAt).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / (1000 * 60); // minutes
    return Math.min((elapsed / order.estimatedTime) * 100, 100);
  };

  const isOverdue = () => {
    if (!order.startedAt || order.status === 'COMPLETED' || order.status === 'CANCELLED') return false;
    const startTime = new Date(order.startedAt).getTime();
    const now = Date.now();
    const elapsed = (now - startTime) / (1000 * 60); // minutes
    return elapsed > order.estimatedTime;
  };

  const completedItems = order.items.filter(item => item.status === 'COMPLETED').length;
  const allItemsCompleted = completedItems === order.items.length;

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        order.priority === 'URGENT' 
          ? 'ring-2 ring-red-500 bg-red-50' 
          : order.priority === 'HIGH'
          ? 'ring-2 ring-yellow-500 bg-yellow-50'
          : order.status === 'PREPARING'
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : order.status === 'READY'
          ? 'ring-2 ring-green-500 bg-green-50'
          : ''
      }`}
      padding="md"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Order #{order.orderID.toString().slice(-6)}
            </h3>
            <StatusBadge status={order.status} variant={getStatusColor(order.status)}>
              {order.status}
            </StatusBadge>
            <StatusBadge status={order.priority} variant={getPriorityColor(order.priority)}>
              {order.priority}
            </StatusBadge>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Table {order.tableID}</span>
            {order.assignedStation && <span>• {order.assignedStation}</span>}
            <span>• {order.items.length} items</span>
            <span>• {order.estimatedTime}m est.</span>
          </div>
        </div>
        
        {isOverdue() && (
          <div className="text-red-600 text-sm font-medium bg-red-100 px-2 py-1 rounded">
            OVERDUE
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {order.status === 'PREPARING' && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>
              {order.startedAt ? formatTime(order.startedAt) : 'Not started'} 
              {order.startedAt && ` • ${Math.floor(getProgressPercentage())}%`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                isOverdue() 
                  ? 'bg-red-500' 
                  : getProgressPercentage() > 80
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Items ({completedItems}/{order.items.length} completed):
        </h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div 
              key={item.id.value} 
              className={`flex items-center justify-between p-2 rounded-md ${
                item.status === 'COMPLETED' 
                  ? 'bg-green-50 border border-green-200' 
                  : item.status === 'PREPARING'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">
                    {item.quantity}x {item.menuItemName}
                  </span>
                  <StatusBadge status={item.status} size="sm">
                    {item.status}
                  </StatusBadge>
                </div>
                {item.specialInstructions && (
                  <p className="text-xs text-gray-600 mt-1">
                    Note: {item.specialInstructions}
                  </p>
                )}
                {item.station && (
                  <p className="text-xs text-gray-500">Station: {item.station}</p>
                )}
              </div>
              
              <div className="flex space-x-1">
                {item.status === 'PENDING' && onItemAction && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onItemAction(order.id, item.id.value, 'start')}
                    disabled={loading}
                  >
                    Start
                  </Button>
                )}
                
                {item.status === 'PREPARING' && onItemAction && (
                  <Button
                    variant="success"
                    size="xs"
                    onClick={() => onItemAction(order.id, item.id.value, 'complete')}
                    disabled={loading}
                  >
                    Done
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Station Assignment */}
      {!order.assignedStation && stations.length > 0 && onAssignStation && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign Station:
          </label>
          <div className="flex flex-wrap gap-1">
            {stations.map((station) => (
              <Button
                key={station}
                variant="outline"
                size="xs"
                onClick={() => onAssignStation(order.id, station)}
                disabled={loading}
              >
                {station}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm">
          <span className="font-medium text-blue-900">Notes: </span>
          <span className="text-blue-700">{order.notes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {order.status === 'NEW' && onStartPreparation && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onStartPreparation(order.id)}
            loading={loading}
          >
            Start Prep
          </Button>
        )}
        
        {order.status === 'PREPARING' && allItemsCompleted && onMarkReady && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onMarkReady(order.id)}
            loading={loading}
          >
            Mark Ready
          </Button>
        )}
        
        {order.status === 'READY' && onComplete && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onComplete(order.id)}
            loading={loading}
          >
            Complete
          </Button>
        )}
        
        {/* Priority Update */}
        {onUpdatePriority && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <div className="flex space-x-1">
            {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as KitchenPriority[])
              .filter(p => p !== order.priority)
              .map((priority) => (
                <Button
                  key={priority}
                  variant="outline"
                  size="xs"
                  onClick={() => onUpdatePriority(order.id, priority)}
                  disabled={loading}
                  className={`${
                    priority === 'URGENT' ? 'text-red-600 border-red-300' :
                    priority === 'HIGH' ? 'text-yellow-600 border-yellow-300' :
                    'text-gray-600'
                  }`}
                >
                  {priority}
                </Button>
              ))}
          </div>
        )}
        
        {onCancel && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
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

      {/* Time Information */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created: {formatTime(order.createdAt)}</span>
          {order.startedAt && (
            <span>Started: {formatTime(order.startedAt)}</span>
          )}
          {order.completedAt && (
            <span>Completed: {formatTime(order.completedAt)}</span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default KitchenOrderCard;