import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface StationOrder {
  id: string;
  orderNumber: string;
  itemName: string;
  quantity: number;
  specialInstructions?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'preparing' | 'ready';
  estimatedTime: number;
  startedAt?: string;
  customerName?: string;
  tableNumber?: number;
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
}

interface Chef {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'break';
  currentOrder?: string;
  station: string;
  shift: 'morning' | 'evening' | 'night';
  performance: {
    ordersCompleted: number;
    averageTime: number;
    efficiency: number;
  };
}

interface KitchenStation {
  id: string;
  name: string;
  type: 'grill' | 'prep' | 'salad' | 'dessert' | 'drinks';
  status: 'operational' | 'busy' | 'overloaded' | 'maintenance';
  capacity: number;
  currentLoad: number;
  orders: StationOrder[];
  assignedChefs: Chef[];
  equipment: string[];
  averageOrderTime: number;
  todayStats: {
    ordersCompleted: number;
    totalTime: number;
    efficiency: number;
  };
}

const StationManagementPage: React.FC = () => {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { onOrderCreated, emitOrderUpdated } = useRestaurantEvents();
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<string | null>(stationId || null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Mock data for development
  useEffect(() => {
    const mockStations: KitchenStation[] = [
      {
        id: 'grill',
        name: 'Grill Station',
        type: 'grill',
        status: 'busy',
        capacity: 8,
        currentLoad: 6,
        averageOrderTime: 12,
        equipment: ['Gas Grill', 'Char Broiler', 'Salamander'],
        orders: [
          {
            id: 'order_001_item_001',
            orderNumber: '#1001',
            itemName: 'Grilled Salmon',
            quantity: 1,
            priority: 'high',
            status: 'preparing',
            estimatedTime: 8,
            startedAt: new Date(Date.now() - 5 * 60000).toISOString(),
            customerName: 'John Doe',
            tableNumber: 5,
            orderType: 'DINE_IN',
            specialInstructions: 'Medium rare'
          },
          {
            id: 'order_002_item_003',
            orderNumber: '#1002',
            itemName: 'Chicken Burger',
            quantity: 2,
            priority: 'medium',
            status: 'pending',
            estimatedTime: 12,
            customerName: 'Jane Smith',
            orderType: 'TAKEOUT'
          },
          {
            id: 'order_003_item_005',
            orderNumber: '#1003',
            itemName: 'Margherita Pizza',
            quantity: 1,
            priority: 'low',
            status: 'pending',
            estimatedTime: 18,
            customerName: 'Mike Johnson',
            orderType: 'DELIVERY'
          }
        ],
        assignedChefs: [
          {
            id: 'chef_001',
            name: 'Marco Rodriguez',
            status: 'busy',
            currentOrder: 'order_001_item_001',
            station: 'grill',
            shift: 'morning',
            performance: {
              ordersCompleted: 23,
              averageTime: 11.5,
              efficiency: 95
            }
          },
          {
            id: 'chef_002',
            name: 'Sarah Chen',
            status: 'available',
            station: 'grill',
            shift: 'morning',
            performance: {
              ordersCompleted: 18,
              averageTime: 13.2,
              efficiency: 88
            }
          }
        ],
        todayStats: {
          ordersCompleted: 41,
          totalTime: 487,
          efficiency: 92
        }
      },
      {
        id: 'prep',
        name: 'Prep Station',
        type: 'prep',
        status: 'operational',
        capacity: 6,
        currentLoad: 3,
        averageOrderTime: 8,
        equipment: ['Food Processor', 'Mandoline', 'Prep Tables'],
        orders: [
          {
            id: 'order_002_item_004',
            orderNumber: '#1002',
            itemName: 'Fries',
            quantity: 2,
            priority: 'medium',
            status: 'pending',
            estimatedTime: 8,
            customerName: 'Jane Smith',
            orderType: 'TAKEOUT'
          }
        ],
        assignedChefs: [
          {
            id: 'chef_003',
            name: 'David Kim',
            status: 'available',
            station: 'prep',
            shift: 'morning',
            performance: {
              ordersCompleted: 31,
              averageTime: 7.8,
              efficiency: 97
            }
          }
        ],
        todayStats: {
          ordersCompleted: 56,
          totalTime: 438,
          efficiency: 94
        }
      },
      {
        id: 'salad',
        name: 'Salad Station',
        type: 'salad',
        status: 'operational',
        capacity: 4,
        currentLoad: 1,
        averageOrderTime: 5,
        equipment: ['Salad Spinner', 'Prep Bowls', 'Refrigerated Units'],
        orders: [
          {
            id: 'order_001_item_002',
            orderNumber: '#1001',
            itemName: 'Caesar Salad',
            quantity: 1,
            priority: 'high',
            status: 'ready',
            estimatedTime: 5,
            customerName: 'John Doe',
            tableNumber: 5,
            orderType: 'DINE_IN'
          }
        ],
        assignedChefs: [
          {
            id: 'chef_004',
            name: 'Lisa Martinez',
            status: 'available',
            station: 'salad',
            shift: 'morning',
            performance: {
              ordersCompleted: 27,
              averageTime: 4.9,
              efficiency: 99
            }
          }
        ],
        todayStats: {
          ordersCompleted: 34,
          totalTime: 167,
          efficiency: 98
        }
      },
      {
        id: 'dessert',
        name: 'Dessert Station',
        type: 'dessert',
        status: 'operational',
        capacity: 3,
        currentLoad: 1,
        averageOrderTime: 4,
        equipment: ['Ice Cream Machine', 'Pastry Display', 'Freezer'],
        orders: [
          {
            id: 'order_003_item_006',
            orderNumber: '#1003',
            itemName: 'Tiramisu',
            quantity: 1,
            priority: 'low',
            status: 'pending',
            estimatedTime: 3,
            customerName: 'Mike Johnson',
            orderType: 'DELIVERY'
          }
        ],
        assignedChefs: [
          {
            id: 'chef_005',
            name: 'Emma Thompson',
            status: 'available',
            station: 'dessert',
            shift: 'morning',
            performance: {
              ordersCompleted: 19,
              averageTime: 3.8,
              efficiency: 96
            }
          }
        ],
        todayStats: {
          ordersCompleted: 22,
          totalTime: 84,
          efficiency: 96
        }
      },
      {
        id: 'drinks',
        name: 'Beverage Station',
        type: 'drinks',
        status: 'operational',
        capacity: 2,
        currentLoad: 0,
        averageOrderTime: 2,
        equipment: ['Coffee Machine', 'Juice Dispenser', 'Blender'],
        orders: [],
        assignedChefs: [
          {
            id: 'chef_006',
            name: 'Alex Rivera',
            status: 'break',
            station: 'drinks',
            shift: 'morning',
            performance: {
              ordersCompleted: 15,
              averageTime: 2.1,
              efficiency: 94
            }
          }
        ],
        todayStats: {
          ordersCompleted: 28,
          totalTime: 59,
          efficiency: 95
        }
      }
    ];
    setStations(mockStations);
  }, []);

  // Listen for new orders
  useEffect(() => {
    const unsubscribe = onOrderCreated((event) => {
      // Distribute order items to appropriate stations
      // This is a simplified version - in reality, you'd parse the order items
      // and assign them to the correct stations based on item type
    });

    return unsubscribe;
  }, [onOrderCreated]);

  const handleStartOrder = (stationId: string, orderId: string) => {
    setStations(prev => prev.map(station => 
      station.id === stationId
        ? {
            ...station,
            orders: station.orders.map(order =>
              order.id === orderId
                ? { ...order, status: 'preparing' as const, startedAt: new Date().toISOString() }
                : order
            )
          }
        : station
    ));

    emitOrderUpdated({
      orderId: orderId,
      status: 'PREPARING',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });
  };

  const handleCompleteOrder = (stationId: string, orderId: string) => {
    setStations(prev => prev.map(station => 
      station.id === stationId
        ? {
            ...station,
            orders: station.orders.map(order =>
              order.id === orderId
                ? { ...order, status: 'ready' as const }
                : order
            ),
            currentLoad: station.currentLoad - 1
          }
        : station
    ));

    emitOrderUpdated({
      orderId: orderId,
      status: 'READY',
      updatedBy: 'kitchen',
      timestamp: new Date().toISOString()
    });
  };

  const handleAssignChef = (stationId: string, chefId: string, orderId: string) => {
    setStations(prev => prev.map(station => 
      station.id === stationId
        ? {
            ...station,
            assignedChefs: station.assignedChefs.map(chef =>
              chef.id === chefId
                ? { ...chef, status: 'busy' as const, currentOrder: orderId }
                : chef
            )
          }
        : station
    ));
  };

  const getStationStatusColor = (status: string): string => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-amber-600 bg-amber-100';
      case 'overloaded': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-gray-600 bg-gray-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getChefStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-blue-600 bg-blue-100';
      case 'break': return 'text-orange-600 bg-orange-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getOrderElapsedTime = (startedAt?: string): string => {
    if (!startedAt) return '';
    const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
    return `${elapsed}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Station Management</h1>
          <p className="text-neutral-600">
            {stations.reduce((acc, station) => acc + station.orders.length, 0)} active orders across {stations.length} stations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'overview' | 'detailed')}
            className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed View</option>
          </select>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
          >
            Back to Queue
          </Button>

          <Button
            onClick={() => navigate('/analytics')}
            variant="outline"
          >
            Analytics
          </Button>
        </div>
      </div>

      {/* Station Overview Cards */}
      <div className="kitchen-stations">
        {stations.map((station) => (
          <div
            key={station.id}
            className={`kitchen-station ${station.status} cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedStation === station.id ? 'ring-2 ring-blue-400' : ''
            }`}
            onClick={() => setSelectedStation(selectedStation === station.id ? null : station.id)}
          >
            {/* Station Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`station-indicator ${station.type}`}></span>
                <h3 className="font-semibold">{station.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStationStatusColor(station.status)}`}>
                {station.status}
              </span>
            </div>

            {/* Capacity and Load */}
            <div className="mb-3">
              <div className="flex justify-between text-sm text-neutral-600 mb-1">
                <span>Capacity</span>
                <span>{station.currentLoad}/{station.capacity}</span>
              </div>
              <div className="bg-neutral-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    station.currentLoad / station.capacity > 0.8 
                      ? 'bg-red-500' 
                      : station.currentLoad / station.capacity > 0.6 
                      ? 'bg-amber-500' 
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((station.currentLoad / station.capacity) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Active Orders Count */}
            <div className="flex justify-between text-sm mb-3">
              <span className="text-neutral-600">Active Orders:</span>
              <span className="font-medium">{station.orders.length}</span>
            </div>

            {/* Assigned Chefs */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-neutral-700">Assigned Chefs:</div>
              {station.assignedChefs.map((chef) => (
                <div key={chef.id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{chef.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getChefStatusColor(chef.status)}`}>
                    {chef.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Today's Performance */}
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-neutral-900">{station.todayStats.ordersCompleted}</div>
                  <div className="text-neutral-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-neutral-900">{station.todayStats.efficiency}%</div>
                  <div className="text-neutral-600">Efficiency</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Station View */}
      {selectedStation && viewMode === 'detailed' && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          {(() => {
            const station = stations.find(s => s.id === selectedStation);
            if (!station) return null;

            return (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">{station.name} - Detailed View</h2>
                  <Button
                    onClick={() => setSelectedStation(null)}
                    variant="outline"
                    size="sm"
                  >
                    Close Details
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Orders */}
                  <div>
                    <h3 className="font-semibold mb-4">Active Orders ({station.orders.length})</h3>
                    <div className="space-y-3">
                      {station.orders.map((order) => (
                        <div key={order.id} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{order.orderNumber}</span>
                              <span className={`priority-indicator ${order.priority}`}>
                                {order.priority}
                              </span>
                            </div>
                            <span className={`item-prep-status ${order.status}`}>
                              <span className="status-dot"></span>
                              <span className="capitalize">{order.status}</span>
                            </span>
                          </div>

                          <div className="text-sm text-neutral-600 mb-2">
                            {order.quantity}x {order.itemName}
                            {order.startedAt && (
                              <span className="ml-2 text-amber-600">
                                ({getOrderElapsedTime(order.startedAt)} elapsed)
                              </span>
                            )}
                          </div>

                          {order.specialInstructions && (
                            <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2 mb-3">
                              {order.specialInstructions}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-neutral-500">
                              {order.customerName} • {order.orderType}
                              {order.tableNumber && ` • Table ${order.tableNumber}`}
                            </div>
                            
                            <div className="flex space-x-2">
                              {order.status === 'pending' && (
                                <Button
                                  onClick={() => handleStartOrder(station.id, order.id)}
                                  size="sm"
                                  className="quick-action-btn start"
                                >
                                  Start
                                </Button>
                              )}
                              {order.status === 'preparing' && (
                                <Button
                                  onClick={() => handleCompleteOrder(station.id, order.id)}
                                  size="sm"
                                  className="quick-action-btn ready"
                                >
                                  Ready
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {station.orders.length === 0 && (
                        <div className="text-center py-8 text-neutral-500">
                          No active orders for this station
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Station Information */}
                  <div>
                    <h3 className="font-semibold mb-4">Station Information</h3>
                    
                    {/* Equipment */}
                    <div className="mb-6">
                      <h4 className="font-medium text-neutral-700 mb-2">Equipment</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {station.equipment.map((equipment, index) => (
                          <div key={index} className="bg-neutral-50 border border-neutral-200 rounded p-2 text-sm">
                            {equipment}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chef Management */}
                    <div className="mb-6">
                      <h4 className="font-medium text-neutral-700 mb-2">Chef Management</h4>
                      <div className="space-y-3">
                        {station.assignedChefs.map((chef) => (
                          <div key={chef.id} className="border border-neutral-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{chef.name}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${getChefStatusColor(chef.status)}`}>
                                {chef.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 text-xs text-neutral-600">
                              <div>
                                <div className="font-medium">{chef.performance.ordersCompleted}</div>
                                <div>Orders</div>
                              </div>
                              <div>
                                <div className="font-medium">{chef.performance.averageTime}m</div>
                                <div>Avg Time</div>
                              </div>
                              <div>
                                <div className="font-medium">{chef.performance.efficiency}%</div>
                                <div>Efficiency</div>
                              </div>
                            </div>

                            {chef.currentOrder && (
                              <div className="mt-2 text-xs text-blue-600">
                                Working on: {chef.currentOrder}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div>
                      <h4 className="font-medium text-neutral-700 mb-2">Today's Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="performance-metric">
                          <div className="metric-value">{station.todayStats.ordersCompleted}</div>
                          <div className="metric-label">Orders Completed</div>
                        </div>
                        <div className="performance-metric">
                          <div className="metric-value">{Math.round(station.todayStats.totalTime / station.todayStats.ordersCompleted || 0)}m</div>
                          <div className="metric-label">Avg Order Time</div>
                        </div>
                        <div className="performance-metric">
                          <div className="metric-value">{station.todayStats.efficiency}%</div>
                          <div className="metric-label">Efficiency</div>
                        </div>
                        <div className="performance-metric">
                          <div className="metric-value">{station.currentLoad}/{station.capacity}</div>
                          <div className="metric-label">Current Load</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default StationManagementPage;