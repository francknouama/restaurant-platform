import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useOrders, useUpdateOrderStatus, useCancelOrder } from '../hooks/useOrders';
import { OrderID, OrderStatus, OrderFilters } from '../types';
import OrderList from '../components/order/OrderList';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Order Processing main page
const OrderProcessingMain: React.FC = () => {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  const { data: ordersData, isLoading, error } = useOrders(filters);
  const updateOrderStatus = useUpdateOrderStatus();
  const cancelOrder = useCancelOrder();

  const orders = ordersData?.items || [];

  const handleUpdateStatus = async (orderId: OrderID, status: OrderStatus) => {
    setLoadingOrderId(orderId.value);
    try {
      await updateOrderStatus.mutateAsync({ id: orderId, status });
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId: OrderID) => {
    setLoadingOrderId(orderId.value);
    try {
      await cancelOrder.mutateAsync({ id: orderId, reason: 'Cancelled by staff' });
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleViewOrder = (orderId: OrderID) => {
    // TODO: Navigate to order details
    console.log('View order:', orderId.value);
  };

  const handleEditOrder = (orderId: OrderID) => {
    // TODO: Navigate to order editor
    console.log('Edit order:', orderId.value);
  };

  const handleCreateNew = () => {
    // TODO: Navigate to order creator
    console.log('Create new order');
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load orders</h3>
          <p className="text-gray-600 mb-4">
            There was an error loading restaurant orders. This might be because the backend server is not running.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Make sure your backend server is running</li>
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
        <h1 className="text-3xl font-bold text-gray-900">Order Processing</h1>
        <p className="text-gray-600 mt-2">
          Manage and track all restaurant orders. Orders follow the workflow: Created → Paid → Preparing → Ready → Completed.
        </p>
      </div>

      {/* Order Business Rules Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 text-lg">💡</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Order Processing Rules</h3>
            <ul className="mt-2 text-sm text-blue-700 space-y-1">
              <li>• Orders automatically calculate 10% tax</li>
              <li>• Status transitions: CREATED → PAID → PREPARING → READY → COMPLETED</li>
              <li>• DINE_IN orders require a table ID</li>
              <li>• DELIVERY orders require a delivery address</li>
              <li>• Orders can be cancelled before completion</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      <Card padding="lg">
        <OrderList
          orders={orders}
          loading={isLoading}
          onUpdateStatus={handleUpdateStatus}
          onView={handleViewOrder}
          onEdit={handleEditOrder}
          onCancel={handleCancelOrder}
          onCreateNew={handleCreateNew}
          loadingOrderId={loadingOrderId}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </Card>

      {/* Development Notice */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-600 text-lg">🚧</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-900">Development Mode</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This interface is connected to your Go backend Order Service API. Status updates, cancellations, 
              and all order operations are ready for backend integration.
            </p>
            <div className="mt-3 space-y-1 text-xs text-yellow-600">
              <p><strong>Next Phase:</strong> Order creation form, item management, and detailed order views</p>
              <p><strong>Features Ready:</strong> Status transitions, filtering, real-time updates, business rule validation</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Order Status Flow Diagram */}
      <Card className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Flow</h3>
        <div className="flex items-center justify-center space-x-4 overflow-x-auto">
          {[
            { status: 'CREATED', icon: '📝', color: 'bg-blue-100 text-blue-800' },
            { status: 'PAID', icon: '💳', color: 'bg-green-100 text-green-800' },
            { status: 'PREPARING', icon: '👨‍🍳', color: 'bg-yellow-100 text-yellow-800' },
            { status: 'READY', icon: '✅', color: 'bg-purple-100 text-purple-800' },
            { status: 'COMPLETED', icon: '🎉', color: 'bg-gray-100 text-gray-800' },
          ].map((step, index) => (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${step.color} mb-2`}>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{step.status}</span>
              </div>
              {index < 4 && (
                <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300 mt-8"></div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Orders can be cancelled at any point before completion
          </p>
        </div>
      </Card>
    </div>
  );
};

// Order Details (placeholder for Phase 2 continuation)
const OrderDetails: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Details</h3>
          <p className="text-gray-600">
            Detailed order view with item management coming next in Phase 2...
          </p>
        </div>
      </Card>
    </div>
  );
};

// Order Creator (placeholder for Phase 2 continuation)
const OrderCreator: React.FC = () => {
  return (
    <div className="p-6">
      <Card>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">➕</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Order</h3>
          <p className="text-gray-600">
            Order creation form with menu item selection coming next in Phase 2...
          </p>
        </div>
      </Card>
    </div>
  );
};

// Main Order Processing component with routing
const OrderProcessing: React.FC = () => {
  return (
    <Routes>
      <Route index element={<OrderProcessingMain />} />
      <Route path="details/:orderId" element={<OrderDetails />} />
      <Route path="create" element={<OrderCreator />} />
    </Routes>
  );
};

export default OrderProcessing;