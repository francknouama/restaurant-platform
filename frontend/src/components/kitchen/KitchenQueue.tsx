import React, { useState } from 'react';
import { KitchenOrder, KitchenOrderID, KitchenOrderStatus, KitchenPriority } from '../../types';
import KitchenOrderCard from './KitchenOrderCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import Card from '../ui/Card';

export interface KitchenQueueProps {
  orders: KitchenOrder[];
  loading?: boolean;
  selectedStation?: string;
  stations?: string[];
  onStationSelect?: (station: string | undefined) => void;
  onStartPreparation?: (orderId: KitchenOrderID) => void;
  onMarkReady?: (orderId: KitchenOrderID) => void;
  onComplete?: (orderId: KitchenOrderID) => void;
  onCancel?: (orderId: KitchenOrderID) => void;
  onAssignStation?: (orderId: KitchenOrderID, station: string) => void;
  onUpdatePriority?: (orderId: KitchenOrderID, priority: KitchenPriority) => void;
  onItemAction?: (orderId: KitchenOrderID, itemId: string, action: 'start' | 'complete') => void;
  loadingOrderId?: string;
}

const KitchenQueue: React.FC<KitchenQueueProps> = ({
  orders,
  loading = false,
  selectedStation,
  stations = [],
  onStationSelect,
  onStartPreparation,
  onMarkReady,
  onComplete,
  onCancel,
  onAssignStation,
  onUpdatePriority,
  onItemAction,
  loadingOrderId,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<KitchenPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<KitchenOrderStatus | 'ALL'>('ALL');

  // Filter orders based on selected filters
  const filteredOrders = orders.filter(order => {
    if (priorityFilter !== 'ALL' && order.priority !== priorityFilter) return false;
    if (statusFilter !== 'ALL' && order.status !== statusFilter) return false;
    return true;
  });

  // Sort orders by priority and time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    // First by priority (URGENT > HIGH > NORMAL > LOW)
    const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by creation time (oldest first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Calculate queue statistics
  const queueStats = {
    total: orders.length,
    byStatus: {
      NEW: orders.filter(o => o.status === 'NEW').length,
      PREPARING: orders.filter(o => o.status === 'PREPARING').length,
      READY: orders.filter(o => o.status === 'READY').length,
    },
    byPriority: {
      URGENT: orders.filter(o => o.priority === 'URGENT').length,
      HIGH: orders.filter(o => o.priority === 'HIGH').length,
      NORMAL: orders.filter(o => o.priority === 'NORMAL').length,
      LOW: orders.filter(o => o.priority === 'LOW').length,
    },
    averageWaitTime: calculateAverageWaitTime(orders),
  };

  function calculateAverageWaitTime(orders: KitchenOrder[]): number {
    const preparingOrders = orders.filter(o => o.status === 'PREPARING' && o.startedAt);
    if (preparingOrders.length === 0) return 0;
    
    const totalMinutes = preparingOrders.reduce((sum, order) => {
      const startTime = new Date(order.startedAt!).getTime();
      const elapsed = (Date.now() - startTime) / (1000 * 60);
      return sum + elapsed;
    }, 0);
    
    return Math.round(totalMinutes / preparingOrders.length);
  }

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading kitchen queue..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Kitchen Queue
            {selectedStation && <span className="text-orange-600"> - {selectedStation}</span>}
          </h2>
          <p className="text-sm text-gray-600">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} in queue
            {queueStats.averageWaitTime > 0 && ` • ${queueStats.averageWaitTime}m avg wait time`}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{queueStats.byStatus.NEW}</div>
          <div className="text-sm text-gray-600">New Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{queueStats.byStatus.PREPARING}</div>
          <div className="text-sm text-gray-600">Preparing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{queueStats.byStatus.READY}</div>
          <div className="text-sm text-gray-600">Ready</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{queueStats.byPriority.URGENT}</div>
          <div className="text-sm text-gray-600">Urgent</div>
        </div>
      </div>

      {/* Station Filter */}
      {stations.length > 0 && onStationSelect && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Station:</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedStation === undefined ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onStationSelect(undefined)}
            >
              All Stations ({orders.length})
            </Button>
            {stations.map((station) => {
              const stationCount = orders.filter(o => o.assignedStation === station).length;
              return (
                <Button
                  key={station}
                  variant={selectedStation === station ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => onStationSelect(station)}
                >
                  {station} ({stationCount})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Priority and Status Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Priority:</h3>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'URGENT', 'HIGH', 'NORMAL', 'LOW'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setPriorityFilter(priority)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  priorityFilter === priority
                    ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority} ({priority === 'ALL' ? orders.length : queueStats.byPriority[priority as KitchenPriority] || 0})
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status:</h3>
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'NEW', 'PREPARING', 'READY'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({status === 'ALL' ? orders.length : queueStats.byStatus[status as KitchenOrderStatus] || 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🍳</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders in queue</h3>
          <p className="text-gray-600">
            {orders.length === 0 
              ? 'All caught up! No pending kitchen orders.'
              : 'No orders match your current filters. Try adjusting your filter criteria.'}
          </p>
          {(priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <Button 
              variant="outline" 
              size="sm"
              className="mt-4"
              onClick={() => {
                setPriorityFilter('ALL');
                setStatusFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedOrders.map((order) => (
            <KitchenOrderCard
              key={order.id.value}
              order={order}
              onStartPreparation={onStartPreparation}
              onMarkReady={onMarkReady}
              onComplete={onComplete}
              onCancel={onCancel}
              onAssignStation={onAssignStation}
              onUpdatePriority={onUpdatePriority}
              onItemAction={onItemAction}
              loading={loadingOrderId === order.id.value}
              stations={stations}
            />
          ))}
        </div>
      )}

      {loading && orders.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" text="Updating queue..." />
        </div>
      )}
    </div>
  );
};

export default KitchenQueue;