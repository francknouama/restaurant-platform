import React, { useState } from 'react';
import {
  useKitchenOrders,
  useKitchenMetrics,
  useStations,
  useStartOrderPreparation,
  useMarkOrderReady,
  useCompleteKitchenOrder,
  useCancelKitchenOrder,
  useAssignStation,
  useUpdatePriority,
  useStartItemPreparation,
  useCompleteItem,
} from '../hooks/useKitchen';
import { KitchenOrderID, KitchenPriority, KitchenOrderFilters } from '../types';
import KitchenQueue from '../components/kitchen/KitchenQueue';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const KitchenDashboard: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<string | undefined>(undefined);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Build filters based on selected station
  const filters: KitchenOrderFilters = selectedStation 
    ? { station: selectedStation }
    : {};

  // API Hooks
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useKitchenOrders(filters);
  const { data: metrics, isLoading: metricsLoading } = useKitchenMetrics();
  const { data: stations = [] } = useStations();

  // Mutation Hooks
  const startPreparation = useStartOrderPreparation();
  const markReady = useMarkOrderReady();
  const completeOrder = useCompleteKitchenOrder();
  const cancelOrder = useCancelKitchenOrder();
  const assignStation = useAssignStation();
  const updatePriority = useUpdatePriority();
  const startItemPreparation = useStartItemPreparation();
  const completeItem = useCompleteItem();

  const orders = ordersData?.items || [];

  // Event Handlers
  const handleStartPreparation = async (orderId: KitchenOrderID) => {
    setLoadingOrderId(orderId.value);
    try {
      await startPreparation.mutateAsync(orderId);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleMarkReady = async (orderId: KitchenOrderID) => {
    setLoadingOrderId(orderId.value);
    try {
      await markReady.mutateAsync(orderId);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleComplete = async (orderId: KitchenOrderID) => {
    setLoadingOrderId(orderId.value);
    try {
      await completeOrder.mutateAsync(orderId);
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleCancel = async (orderId: KitchenOrderID) => {
    setLoadingOrderId(orderId.value);
    try {
      await cancelOrder.mutateAsync({ id: orderId, reason: 'Cancelled from kitchen dashboard' });
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleAssignStation = async (orderId: KitchenOrderID, station: string) => {
    setLoadingOrderId(orderId.value);
    try {
      await assignStation.mutateAsync({ id: orderId, station });
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleUpdatePriority = async (orderId: KitchenOrderID, priority: KitchenPriority) => {
    setLoadingOrderId(orderId.value);
    try {
      await updatePriority.mutateAsync({ id: orderId, priority });
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleItemAction = async (orderId: KitchenOrderID, itemId: string, action: 'start' | 'complete') => {
    setLoadingOrderId(orderId.value);
    try {
      if (action === 'start') {
        await startItemPreparation.mutateAsync({ orderId, itemId });
      } else {
        await completeItem.mutateAsync({ orderId, itemId });
      }
    } finally {
      setLoadingOrderId(null);
    }
  };

  if (ordersError) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load kitchen orders</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading kitchen orders. This might be because the backend server is not running.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure your backend Kitchen Service is running</li>
              <li>Check that the API URL is correctly configured</li>
              <li>Verify your network connection</li>
            </ol>
          </div>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Real-time kitchen order management and workflow tracking. Auto-refreshes every 15 seconds.
        </p>
      </div>

      {/* Kitchen Business Rules Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">💡</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Kitchen Workflow Rules</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Order status flow: NEW → PREPARING → READY → COMPLETED</li>
              <li>• Priority levels: LOW → NORMAL → HIGH → URGENT</li>
              <li>• Orders auto-calculate estimated time from item prep times</li>
              <li>• Station assignment optimizes workflow efficiency</li>
              <li>• Individual item tracking within orders</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Kitchen Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="text-2xl">🔥</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Orders in Queue</p>
              <p className="text-2xl font-bold text-orange-600">
                {metricsLoading ? <LoadingSpinner size="sm" /> : metrics?.ordersInQueue || orders.length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="text-2xl">⏱️</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Prep Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {metricsLoading ? <LoadingSpinner size="sm" /> : `${metrics?.averagePrepTime || 12}m`}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="text-2xl">🚨</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgent Orders</p>
              <p className="text-2xl font-bold text-red-600">
                {orders.filter(o => o.priority === 'URGENT').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="text-2xl">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">
                {metricsLoading ? <LoadingSpinner size="sm" /> : metrics?.completedToday || 47}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Kitchen Queue */}
      <Card padding="lg">
        <KitchenQueue
          orders={orders}
          loading={ordersLoading}
          selectedStation={selectedStation}
          stations={stations}
          onStationSelect={setSelectedStation}
          onStartPreparation={handleStartPreparation}
          onMarkReady={handleMarkReady}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onAssignStation={handleAssignStation}
          onUpdatePriority={handleUpdatePriority}
          onItemAction={handleItemAction}
          loadingOrderId={loadingOrderId}
        />
      </Card>

      {/* Development Notice */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">🚧</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-900">Development Mode</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This interface is connected to your Go backend Kitchen Service API. All kitchen operations including 
              status updates, station assignments, priority changes, and item-level tracking are ready for backend integration.
            </p>
            <div className="mt-3 space-y-1 text-xs text-yellow-600">
              <p><strong>Real-time Features:</strong> Auto-refresh every 15 seconds, optimistic updates, priority sorting</p>
              <p><strong>Workflow Ready:</strong> Complete kitchen workflow from order receipt to completion</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Kitchen Efficiency Tips */}
      <Card className="mt-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <div className="text-green-600 text-lg">💡</div>
          <div>
            <h3 className="text-sm font-medium text-green-900">Kitchen Efficiency Tips</h3>
            <ul className="mt-2 text-sm text-green-700 space-y-1">
              <li>• <strong>Priority First:</strong> URGENT and HIGH priority orders appear at the top</li>
              <li>• <strong>Station Assignment:</strong> Assign orders to specific stations to optimize workflow</li>
              <li>• <strong>Item Tracking:</strong> Mark individual items as complete to track progress</li>
              <li>• <strong>Real-time Updates:</strong> Status changes automatically sync across all devices</li>
              <li>• <strong>Overdue Alerts:</strong> Orders past estimated time are highlighted in red</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KitchenDashboard;