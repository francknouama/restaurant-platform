import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface PrepStep {
  id: string;
  name: string;
  description: string;
  estimatedTime: number;
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
  station: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialInstructions?: string;
  station: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
  status: 'pending' | 'preparing' | 'ready';
  estimatedTime: number;
  prepSteps: PrepStep[];
  allergens?: string[];
  modifications?: string[];
}

interface DetailedOrder {
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
  assignedChef?: string;
  kitchenNotes?: string;
}

const OrderPreparationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { emitOrderUpdated } = useRestaurantEvents();
  const [order, setOrder] = useState<DetailedOrder | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, number>>({});

  // Mock detailed order data
  useEffect(() => {
    if (orderId) {
      const mockOrder: DetailedOrder = {
        id: orderId,
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
            specialInstructions: 'Medium rare, extra lemon',
            allergens: ['Fish'],
            modifications: ['No butter', 'Extra seasoning'],
            prepSteps: [
              {
                id: 'step_001',
                name: 'Season Salmon',
                description: 'Season with salt, pepper, and herbs',
                estimatedTime: 2,
                completed: true,
                station: 'prep',
                startedAt: new Date(Date.now() - 10 * 60000).toISOString(),
                completedAt: new Date(Date.now() - 8 * 60000).toISOString()
              },
              {
                id: 'step_002',
                name: 'Preheat Grill',
                description: 'Heat grill to medium-high',
                estimatedTime: 3,
                completed: true,
                station: 'grill',
                startedAt: new Date(Date.now() - 8 * 60000).toISOString(),
                completedAt: new Date(Date.now() - 5 * 60000).toISOString()
              },
              {
                id: 'step_003',
                name: 'Grill Salmon',
                description: 'Grill for 6-8 minutes per side',
                estimatedTime: 10,
                completed: false,
                station: 'grill'
              }
            ]
          },
          {
            id: 'item_002',
            name: 'Caesar Salad',
            quantity: 1,
            station: 'salad',
            status: 'ready',
            estimatedTime: 5,
            allergens: ['Gluten', 'Dairy'],
            prepSteps: [
              {
                id: 'step_004',
                name: 'Prepare Lettuce',
                description: 'Wash and chop romaine lettuce',
                estimatedTime: 2,
                completed: true,
                station: 'salad',
                startedAt: new Date(Date.now() - 7 * 60000).toISOString(),
                completedAt: new Date(Date.now() - 5 * 60000).toISOString()
              },
              {
                id: 'step_005',
                name: 'Add Dressing & Toppings',
                description: 'Add Caesar dressing, croutons, and parmesan',
                estimatedTime: 3,
                completed: true,
                station: 'salad',
                startedAt: new Date(Date.now() - 5 * 60000).toISOString(),
                completedAt: new Date(Date.now() - 2 * 60000).toISOString()
              }
            ]
          }
        ],
        priority: 'high',
        status: 'PREPARING',
        createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
        estimatedCompletionTime: new Date(Date.now() + 3 * 60000).toISOString(),
        totalEstimatedTime: 15,
        specialInstructions: 'Customer is allergic to shellfish',
        assignedChef: 'Chef Marco',
        kitchenNotes: 'VIP customer - priority handling'
      };
      setOrder(mockOrder);
    }
  }, [orderId]);

  // Timer management
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTimer) {
        setTimers(prev => ({
          ...prev,
          [activeTimer]: (prev[activeTimer] || 0) + 1
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStep = (stepId: string) => {
    if (!order) return;

    setOrder(prev => prev ? {
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        prepSteps: item.prepSteps.map(step =>
          step.id === stepId
            ? { ...step, startedAt: new Date().toISOString() }
            : step
        )
      }))
    } : null);

    setActiveTimer(stepId);
    setTimers(prev => ({ ...prev, [stepId]: 0 }));
  };

  const handleCompleteStep = (stepId: string) => {
    if (!order) return;

    setOrder(prev => prev ? {
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        prepSteps: item.prepSteps.map(step =>
          step.id === stepId
            ? { 
                ...step, 
                completed: true, 
                completedAt: new Date().toISOString() 
              }
            : step
        )
      }))
    } : null);

    if (activeTimer === stepId) {
      setActiveTimer(null);
    }

    // Check if all steps for an item are completed
    const updatedOrder = { ...order };
    updatedOrder.items.forEach(item => {
      const allStepsCompleted = item.prepSteps.every(step => 
        step.id === stepId ? true : step.completed
      );
      if (allStepsCompleted && item.status !== 'ready') {
        item.status = 'ready';
      }
    });

    setOrder(updatedOrder);
  };

  const handleCompleteItem = (itemId: string) => {
    if (!order) return;

    setOrder(prev => prev ? {
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, status: 'ready' as const }
          : item
      )
    } : null);

    emitOrderUpdated({
      orderId: order.id,
      status: 'PREPARING',
      itemId,
      itemStatus: 'ready',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });
  };

  const handleCompleteOrder = () => {
    if (!order) return;

    setOrder(prev => prev ? {
      ...prev,
      status: 'READY' as const
    } : null);

    emitOrderUpdated({
      orderId: order.id,
      status: 'READY',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });

    navigate('/');
  };

  const getStepDuration = (step: PrepStep): string => {
    if (step.completed && step.startedAt && step.completedAt) {
      const duration = Math.floor(
        (new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()) / 1000
      );
      return formatTime(duration);
    }
    if (step.startedAt && !step.completed) {
      const elapsed = Math.floor(
        (Date.now() - new Date(step.startedAt).getTime()) / 1000
      );
      return formatTime(elapsed);
    }
    return `${step.estimatedTime}m est.`;
  };

  const getStepStatus = (step: PrepStep): string => {
    if (step.completed) return 'completed';
    if (step.startedAt) return 'current';
    return 'pending';
  };

  const getOrderProgress = (): number => {
    if (!order) return 0;
    const totalSteps = order.items.reduce((acc, item) => acc + item.prepSteps.length, 0);
    const completedSteps = order.items.reduce(
      (acc, item) => acc + item.prepSteps.filter(step => step.completed).length,
      0
    );
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  };

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg">Order not found</div>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Queue
          </Button>
        </div>
      </div>
    );
  }

  const allItemsReady = order.items.every(item => item.status === 'ready');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="sm"
            >
              ← Back to Queue
            </Button>
            <h1 className="text-2xl font-bold text-neutral-900">
              Order {order.orderNumber}
            </h1>
            <span className={`order-status-badge ${order.status.toLowerCase()}`}>
              {order.status}
            </span>
            <span className={`priority-indicator ${order.priority}`}>
              {order.priority}
            </span>
          </div>
          <div className="mt-2 text-neutral-600">
            {order.customerName} • {order.orderType}
            {order.tableNumber && ` • Table ${order.tableNumber}`}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-900">
            {getOrderProgress()}% Complete
          </div>
          <div className="text-sm text-neutral-600">
            {order.items.filter(item => item.status === 'ready').length} of {order.items.length} items ready
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-neutral-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${getOrderProgress()}%` }}
        />
      </div>

      {/* Order Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <h3 className="font-semibold mb-3">Customer Information</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Name:</span> {order.customerName}</div>
            <div><span className="font-medium">Type:</span> {order.orderType}</div>
            {order.tableNumber && (
              <div><span className="font-medium">Table:</span> {order.tableNumber}</div>
            )}
            <div><span className="font-medium">Priority:</span> 
              <span className={`ml-2 priority-indicator ${order.priority}`}>
                {order.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Order Timing */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <h3 className="font-semibold mb-3">Timing</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Ordered:</span> 
              {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)}m ago
            </div>
            <div><span className="font-medium">Target:</span> 
              {Math.floor((new Date(order.estimatedCompletionTime).getTime() - Date.now()) / 60000)}m remaining
            </div>
            <div><span className="font-medium">Chef:</span> {order.assignedChef || 'Unassigned'}</div>
          </div>
        </div>

        {/* Special Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
          <h3 className="font-semibold mb-3">Special Instructions</h3>
          <div className="space-y-2 text-sm">
            {order.specialInstructions && (
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700">
                {order.specialInstructions}
              </div>
            )}
            {order.kitchenNotes && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                <span className="font-medium">Kitchen:</span> {order.kitchenNotes}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items and Preparation Steps */}
      <div className="space-y-6">
        {order.items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            {/* Item Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`station-indicator ${item.station}`}></span>
                <h3 className="text-lg font-semibold">
                  {item.quantity}x {item.name}
                </h3>
                <span className={`item-prep-status ${item.status}`}>
                  <span className="status-dot"></span>
                  <span className="capitalize">{item.status}</span>
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600 capitalize">
                  {item.station} Station
                </span>
                {item.status === 'preparing' && !item.prepSteps.every(step => step.completed) && (
                  <Button
                    onClick={() => handleCompleteItem(item.id)}
                    size="sm"
                    variant="outline"
                  >
                    Mark Ready
                  </Button>
                )}
              </div>
            </div>

            {/* Item Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {item.specialInstructions && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">Instructions:</span>
                  <div className="text-sm text-neutral-600 mt-1">{item.specialInstructions}</div>
                </div>
              )}
              
              {item.allergens && item.allergens.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-red-700">Allergens:</span>
                  <div className="text-sm text-red-600 mt-1">{item.allergens.join(', ')}</div>
                </div>
              )}

              {item.modifications && item.modifications.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-neutral-700">Modifications:</span>
                  <div className="text-sm text-neutral-600 mt-1">{item.modifications.join(', ')}</div>
                </div>
              )}
            </div>

            {/* Preparation Timeline */}
            <div className="kitchen-timeline">
              {item.prepSteps.map((step, index) => (
                <div key={step.id} className={`timeline-item ${getStepStatus(step)}`}>
                  <div className="timeline-marker"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900">{step.name}</h4>
                        <p className="text-sm text-neutral-600">{step.description}</p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <div className={`timer-display ${activeTimer === step.id ? 'current' : ''}`}>
                            {activeTimer === step.id 
                              ? formatTime(timers[step.id] || 0)
                              : getStepDuration(step)
                            }
                          </div>
                          <div className="text-xs text-neutral-500 text-center">
                            {step.station}
                          </div>
                        </div>
                        
                        {!step.completed && !step.startedAt && (
                          <Button
                            onClick={() => handleStartStep(step.id)}
                            size="sm"
                            className="quick-action-btn start"
                          >
                            Start
                          </Button>
                        )}
                        
                        {step.startedAt && !step.completed && (
                          <Button
                            onClick={() => handleCompleteStep(step.id)}
                            size="sm"
                            className="quick-action-btn complete"
                          >
                            Complete
                          </Button>
                        )}
                        
                        {step.completed && (
                          <div className="text-green-600 text-sm font-medium">
                            ✓ Done
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Order Actions */}
      {allItemsReady && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">Order Ready!</h3>
              <p className="text-sm text-green-700">All items have been prepared and are ready for service.</p>
            </div>
            <Button
              onClick={handleCompleteOrder}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark Order Complete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPreparationPage;