import React, { useState } from 'react';
import { Order, OrderID, OrderStatus, OrderType, OrderFilters } from '../../types';
import OrderCard from './OrderCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

export interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  onUpdateStatus?: (orderId: OrderID, status: OrderStatus) => void;
  onView?: (orderId: OrderID) => void;
  onEdit?: (orderId: OrderID) => void;
  onCancel?: (orderId: OrderID) => void;
  onCreateNew?: () => void;
  loadingOrderId?: string;
  filters?: OrderFilters;
  onFiltersChange?: (filters: OrderFilters) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading = false,
  onUpdateStatus,
  onView,
  onEdit,
  onCancel,
  onCreateNew,
  loadingOrderId,
  filters,
  onFiltersChange,
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(
    filters?.status || []
  );
  const [selectedTypes, setSelectedTypes] = useState<OrderType[]>(
    filters?.type || []
  );

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    byStatus: {
      CREATED: orders.filter(o => o.status === 'CREATED').length,
      PAID: orders.filter(o => o.status === 'PAID').length,
      PREPARING: orders.filter(o => o.status === 'PREPARING').length,
      READY: orders.filter(o => o.status === 'READY').length,
      COMPLETED: orders.filter(o => o.status === 'COMPLETED').length,
      CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
    },
    byType: {
      DINE_IN: orders.filter(o => o.type === 'DINE_IN').length,
      TAKEOUT: orders.filter(o => o.type === 'TAKEOUT').length,
      DELIVERY: orders.filter(o => o.type === 'DELIVERY').length,
    },
    totalValue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleStatusFilter = (status: OrderStatus) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status];
    
    setSelectedStatuses(newStatuses);
    onFiltersChange?.({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleTypeFilter = (type: OrderType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    onFiltersChange?.({ ...filters, type: newTypes.length > 0 ? newTypes : undefined });
  };

  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedTypes([]);
    onFiltersChange?.({});
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Loading orders..." />
      </div>
    );
  }

  if (!loading && orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-600 mb-6">
          {selectedStatuses.length > 0 || selectedTypes.length > 0
            ? 'No orders match your current filters. Try adjusting your search criteria.'
            : 'Create your first order to start processing customer requests.'}
        </p>
        
        {(selectedStatuses.length > 0 || selectedTypes.length > 0) && (
          <Button variant="outline" onClick={clearFilters} className="mr-3">
            Clear Filters
          </Button>
        )}
        
        {onCreateNew && (
          <Button variant="primary" onClick={onCreateNew}>
            Create New Order
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-600">
            {orders.length} order{orders.length !== 1 ? 's' : ''} • {formatCurrency(orderStats.totalValue)} total value
          </p>
        </div>
        {onCreateNew && (
          <Button variant="primary" onClick={onCreateNew}>
            New Order
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{orderStats.byStatus.CREATED}</div>
          <div className="text-sm text-gray-600">New Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{orderStats.byStatus.PREPARING}</div>
          <div className="text-sm text-gray-600">Preparing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{orderStats.byStatus.READY}</div>
          <div className="text-sm text-gray-600">Ready</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{orderStats.byStatus.COMPLETED}</div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Status:</h3>
          <div className="flex flex-wrap gap-2">
            {(['CREATED', 'PAID', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatuses.includes(status)
                    ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({orderStats.byStatus[status]})
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Filter by Type:</h3>
          <div className="flex flex-wrap gap-2">
            {(['DINE_IN', 'TAKEOUT', 'DELIVERY'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeFilter(type)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTypes.includes(type)
                    ? 'bg-orange-100 text-orange-800 ring-1 ring-orange-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.replace('_', ' ')} ({orderStats.byType[type]})
              </button>
            ))}
          </div>
        </div>

        {(selectedStatuses.length > 0 || selectedTypes.length > 0) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard
            key={order.id.value}
            order={order}
            onUpdateStatus={onUpdateStatus}
            onView={onView}
            onEdit={onEdit}
            onCancel={onCancel}
            loading={loadingOrderId === order.id.value}
          />
        ))}
      </div>

      {loading && orders.length > 0 && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="md" text="Loading more orders..." />
        </div>
      )}
    </div>
  );
};

export default OrderList;