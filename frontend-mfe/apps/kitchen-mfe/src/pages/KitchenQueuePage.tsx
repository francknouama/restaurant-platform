import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  station: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
  status: 'pending' | 'preparing' | 'ready';
  estimatedTime: number;
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  customerName?: string;
  tableNumber?: number;
  items: OrderItem[];
  priority: 'low' | 'medium' | 'high';
  status: 'CREATED' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED';
  createdAt: string;
  estimatedCompletionTime: string;
  totalEstimatedTime: number;
  specialInstructions?: string;
}

const KitchenQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { onOrderCreated, onOrderUpdated, emitOrderUpdated } = useRestaurantEvents();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [queueLayout, setQueueLayout] = useState<'single' | 'two' | 'three' | 'four'>('three');

  // Mock data for development
  useEffect(() => {
    const mockOrders: KitchenOrder[] = [
      {
        id: 'order_001',
        orderNumber: '#1001',
        orderType: 'DINE_IN',
        customerName: 'John Doe',
        tableNumber: 5,
        items: [
          {
            id: 'item_001',
            name: 'Grilled Salmon',
            quantity: 1,
            station: 'grill',
            status: 'preparing',
            estimatedTime: 15,
            specialInstructions: 'Medium rare'
          },
          {
            id: 'item_002',
            name: 'Caesar Salad',
            quantity: 1,
            station: 'salad',
            status: 'ready',
            estimatedTime: 5
          }
        ],
        priority: 'high',
        status: 'PREPARING',
        createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 7 * 60000).toISOString(),
        totalEstimatedTime: 15
      },
      {
        id: 'order_002',
        orderNumber: '#1002',
        orderType: 'TAKEOUT',
        customerName: 'Jane Smith',
        items: [
          {
            id: 'item_003',
            name: 'Chicken Burger',
            quantity: 2,
            station: 'grill',
            status: 'pending',
            estimatedTime: 12
          },
          {
            id: 'item_004',
            name: 'Fries',
            quantity: 2,
            station: 'prep',
            status: 'pending',
            estimatedTime: 8
          }
        ],
        priority: 'medium',
        status: 'PAID',
        createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 12 * 60000).toISOString(),
        totalEstimatedTime: 12
      },
      {
        id: 'order_003',
        orderNumber: '#1003',
        orderType: 'DELIVERY',
        customerName: 'Mike Johnson',
        items: [
          {
            id: 'item_005',
            name: 'Margherita Pizza',
            quantity: 1,
            station: 'grill',
            status: 'pending',
            estimatedTime: 18,
          },
          {
            id: 'item_006',
            name: 'Tiramisu',
            quantity: 1,
            station: 'dessert',
            status: 'pending',
            estimatedTime: 3
          }
        ],
        priority: 'low',
        status: 'PAID',
        createdAt: new Date(Date.now() - 1 * 60000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 18 * 60000).toISOString(),
        totalEstimatedTime: 18,
        specialInstructions: 'Extra crispy crust'
      }
    ];
    setOrders(mockOrders);
  }, []);

  // Listen for new orders from other MFEs
  useEffect(() => {
    const unsubscribe = onOrderCreated((event) => {
      // Add new order to kitchen queue
      const newOrder: KitchenOrder = {
        ...event.payload,
        priority: 'medium',
        status: 'PAID',
        estimatedCompletionTime: new Date(Date.now() + 15 * 60000).toISOString(),
        totalEstimatedTime: 15
      };
      setOrders(prev => [...prev, newOrder]);
    });

    return unsubscribe;
  }, [onOrderCreated]);

  const getElapsedTime = (createdAt: string): number => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  const getRemainingTime = (estimatedCompletionTime: string): number => {
    const remaining = Math.floor((new Date(estimatedCompletionTime).getTime() - Date.now()) / 60000);
    return Math.max(0, remaining);
  };

  const isOrderOverdue = (estimatedCompletionTime: string): boolean => {
    return new Date(estimatedCompletionTime).getTime() < Date.now();
  };

  const isOrderUrgent = (estimatedCompletionTime: string): boolean => {
    const remaining = getRemainingTime(estimatedCompletionTime);
    return remaining <= 5 && remaining > 0;
  };

  const handleStartOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'PREPARING' as const }
        : order
    ));

    // Emit order update event
    emitOrderUpdated({
      orderId,
      status: 'PREPARING',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'READY' as const }
        : order
    ));

    // Emit order update event
    emitOrderUpdated({
      orderId,
      status: 'READY',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/preparation/${orderId}`);
  };

  const filteredOrders = selectedStation === 'all' 
    ? orders 
    : orders.filter(order => 
        order.items.some(item => item.station === selectedStation)
      );

  const getOrderCardClasses = (order: KitchenOrder): string => {
    const baseClasses = 'kitchen-order-card bg-white rounded-lg shadow-sm border border-neutral-200 p-4';
    
    if (isOrderOverdue(order.estimatedCompletionTime)) {
      return `${baseClasses} overdue`;
    }
    if (isOrderUrgent(order.estimatedCompletionTime)) {
      return `${baseClasses} urgent`;
    }
    if (order.status === 'PAID') {
      return `${baseClasses} new`;
    }
    
    return baseClasses;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kitchen Queue</h1>
          <p className="text-neutral-600">
            {filteredOrders.length} orders • {filteredOrders.filter(o => o.status === 'PREPARING').length} in progress
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Station Filter */}
          <select
            value={selectedStation}
            onChange={(e) => setSelectedStation(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Stations</option>
            <option value="grill">Grill</option>
            <option value="prep">Prep</option>
            <option value="salad">Salad</option>
            <option value="dessert">Dessert</option>
            <option value="drinks">Drinks</option>
          </select>

          {/* Layout Toggle */}
          <select
            value={queueLayout}
            onChange={(e) => setQueueLayout(e.target.value as any)}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="single">1 Column</option>
            <option value="two">2 Columns</option>
            <option value="three">3 Columns</option>
            <option value="four">4 Columns</option>
          </select>

          <Button
            onClick={() => navigate('/stations')}
            variant="outline"
          >
            Station View
          </Button>

          <Button
            onClick={() => navigate('/analytics')}
            variant="outline"
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="performance-metric">
          <div className="metric-value">{orders.filter(o => o.status === 'PAID').length}</div>
          <div className="metric-label">Pending</div>
        </div>
        <div className="performance-metric">
          <div className="metric-value">{orders.filter(o => o.status === 'PREPARING').length}</div>
          <div className="metric-label">In Progress</div>
        </div>
        <div className="performance-metric">
          <div className="metric-value">{orders.filter(o => o.status === 'READY').length}</div>
          <div className="metric-label">Ready</div>
        </div>
        <div className="performance-metric">
          <div className="metric-value">
            {Math.round(orders.reduce((acc, order) => acc + order.totalEstimatedTime, 0) / orders.length || 0)}m
          </div>
          <div className="metric-label">Avg Time</div>
        </div>
      </div>

      {/* Orders Grid */}
      <div className={`kitchen-queue ${queueLayout}-columns`}>
        {filteredOrders.map((order) => (
          <div key={order.id} className={getOrderCardClasses(order)}>
            {/* Order Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg">{order.orderNumber}</span>
                <span className={`order-status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
                <span className={`priority-indicator ${order.priority}`}>
                  {order.priority}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {order.orderType === 'DINE_IN' && order.tableNumber && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Table {order.tableNumber}
                  </span>
                )}
                <span className={`timer-display ${
                  isOrderOverdue(order.estimatedCompletionTime) ? 'expired' : 
                  isOrderUrgent(order.estimatedCompletionTime) ? 'critical' : 
                  getRemainingTime(order.estimatedCompletionTime) <= 10 ? 'warning' : ''
                }`}>
                  {isOrderOverdue(order.estimatedCompletionTime) 
                    ? `+${getElapsedTime(order.estimatedCompletionTime) - order.totalEstimatedTime}m`
                    : `${getRemainingTime(order.estimatedCompletionTime)}m`
                  }
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-3">
              <div className="font-medium">{order.customerName}</div>
              <div className="text-sm text-neutral-600 flex items-center space-x-2">
                <span>{order.orderType}</span>
                <span>•</span>
                <span>{getElapsedTime(order.createdAt)}m ago</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`station-indicator ${item.station}`}></span>
                    <span>{item.quantity}x {item.name}</span>
                  </div>
                  <div className={`item-prep-status ${item.status}`}>
                    <span className="status-dot"></span>
                    <span className="capitalize">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                <span className="font-medium text-amber-800">Note: </span>
                <span className="text-amber-700">{order.specialInstructions}</span>
              </div>
            )}

            {/* Actions */}
            <div className="quick-action-grid">
              {order.status === 'PAID' && (
                <button
                  onClick={() => handleStartOrder(order.id)}
                  className="quick-action-btn start"
                >
                  Start
                </button>
              )}
              
              {order.status === 'PREPARING' && (
                <>
                  <button
                    onClick={() => handleCompleteOrder(order.id)}
                    className="quick-action-btn ready"
                  >
                    Mark Ready
                  </button>
                  <button
                    onClick={() => handleViewOrder(order.id)}
                    className="quick-action-btn complete"
                  >
                    View Details
                  </button>
                </>
              )}

              {order.status === 'READY' && (
                <button
                  onClick={() => handleViewOrder(order.id)}
                  className="quick-action-btn complete"
                >
                  Complete
                </button>
              )}

              <button
                onClick={() => handleViewOrder(order.id)}
                className="px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No orders in queue</div>
          <div className="text-neutral-500 text-sm">
            {selectedStation !== 'all' ? `No orders for ${selectedStation} station` : 'All caught up!'}
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenQueuePage;