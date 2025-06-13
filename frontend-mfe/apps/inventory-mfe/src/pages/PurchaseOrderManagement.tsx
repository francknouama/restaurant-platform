import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  orderDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  receivedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const PurchaseOrderManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { orderId } = useParams<{ orderId: string }>();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | PurchaseOrder['status']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  
  // New order form state
  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [] as Omit<PurchaseOrderItem, 'id' | 'totalCost'>[],
    shipping: 0,
    tax: 0
  });

  useEffect(() => {
    // Generate mock purchase orders
    const generateMockOrders = (): PurchaseOrder[] => {
      const statuses: PurchaseOrder['status'][] = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
      const suppliers = [
        { id: 'sup_1', name: 'Premium Foods Co.' },
        { id: 'sup_2', name: 'Fresh Market Supply' },
        { id: 'sup_3', name: 'Ocean Harvest' },
        { id: 'sup_4', name: 'Specialty Imports' }
      ];
      
      const mockOrders: PurchaseOrder[] = [];
      
      for (let i = 1; i <= 25; i++) {
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const orderDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const expectedDeliveryDate = new Date(orderDate.getTime() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
        
        const items: PurchaseOrderItem[] = [];
        const numItems = Math.floor(Math.random() * 5) + 1;
        
        const itemNames = [
          'Premium Beef Tenderloin', 'Fresh Salmon Fillet', 'Organic Baby Spinach',
          'Aged Parmesan Cheese', 'Truffle Oil', 'Wild Rice', 'Jumbo Shrimp'
        ];
        
        for (let j = 0; j < numItems; j++) {
          const itemName = itemNames[Math.floor(Math.random() * itemNames.length)];
          const quantity = Math.floor(Math.random() * 20) + 1;
          const unitCost = Math.random() * 50 + 5;
          
          items.push({
            id: `poi_${i}_${j}`,
            itemName,
            sku: `SKU${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
            quantity,
            unit: ['lbs', 'kg', 'pcs', 'bottles'][Math.floor(Math.random() * 4)],
            unitCost,
            totalCost: quantity * unitCost
          });
        }
        
        const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
        const tax = subtotal * 0.08;
        const shipping = Math.random() * 50 + 10;
        
        mockOrders.push({
          id: `po_${i}`,
          orderNumber: `PO-2024-${String(i).padStart(3, '0')}`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          status,
          orderDate: orderDate.toISOString(),
          expectedDeliveryDate: expectedDeliveryDate.toISOString(),
          actualDeliveryDate: status === 'received' ? expectedDeliveryDate.toISOString() : undefined,
          items,
          subtotal,
          tax,
          shipping,
          total: subtotal + tax + shipping,
          notes: Math.random() > 0.7 ? 'Urgent delivery required' : undefined,
          createdBy: 'Current User',
          approvedBy: status !== 'draft' ? 'Manager' : undefined,
          receivedBy: status === 'received' ? 'Warehouse Staff' : undefined,
          createdAt: orderDate.toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return mockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    setOrders(generateMockOrders());
    
    // Handle URL params
    const supplierParam = searchParams.get('supplier');
    const itemParam = searchParams.get('item');
    
    if (supplierParam || itemParam) {
      setNewOrder(prev => ({
        ...prev,
        supplierId: supplierParam || '',
        items: itemParam ? [{
          itemName: itemParam,
          sku: '',
          quantity: 1,
          unit: 'pcs',
          unitCost: 0,
          notes: ''
        }] : []
      }));
      setShowCreateModal(true);
    }
    
    if (orderId) {
      const order = generateMockOrders().find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetails(true);
      }
    }
  }, [searchParams, orderId]);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: PurchaseOrder['status']): string => {
    switch (status) {
      case 'draft': return 'bg-neutral-100 text-neutral-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-amber-100 text-amber-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const handleCreateOrder = () => {
    if (!newOrder.supplierId || newOrder.items.length === 0) return;
    
    const items: PurchaseOrderItem[] = newOrder.items.map((item, index) => ({
      id: `poi_new_${index}`,
      ...item,
      totalCost: item.quantity * item.unitCost
    }));
    
    const subtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
    const total = subtotal + newOrder.tax + newOrder.shipping;
    
    const order: PurchaseOrder = {
      id: `po_${Date.now()}`,
      orderNumber: `PO-2024-${String(orders.length + 1).padStart(3, '0')}`,
      supplierId: newOrder.supplierId,
      supplierName: 'Selected Supplier', // Would lookup from suppliers
      status: 'draft',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: newOrder.expectedDeliveryDate,
      items,
      subtotal,
      tax: newOrder.tax,
      shipping: newOrder.shipping,
      total,
      notes: newOrder.notes || undefined,
      createdBy: 'Current User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setOrders(prev => [order, ...prev]);
    setShowCreateModal(false);
    setNewOrder({
      supplierId: '',
      expectedDeliveryDate: '',
      notes: '',
      items: [],
      shipping: 0,
      tax: 0
    });
    
    // Navigate to the new order
    navigate(`/purchase-orders/${order.id}`);
  };

  const handleStatusChange = (orderId: string, newStatus: PurchaseOrder['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, {
        itemName: '',
        sku: '',
        quantity: 1,
        unit: 'pcs',
        unitCost: 0,
        notes: ''
      }]
    }));
  };

  const removeOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index: number, updates: Partial<Omit<PurchaseOrderItem, 'id' | 'totalCost'>>) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, ...updates } : item)
    }));
  };

  const orderStats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    pending: orders.filter(o => ['sent', 'confirmed'].includes(o.status)).length,
    received: orders.filter(o => o.status === 'received').length,
    totalValue: orders.reduce((sum, o) => sum + o.total, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Purchase Orders</h1>
          <p className="text-neutral-600">
            {filteredOrders.length} orders • ${orderStats.totalValue.toLocaleString()} total value
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Create Order
          </Button>
          
          <Button
            onClick={() => navigate('/suppliers')}
            variant="outline"
          >
            Manage Suppliers
          </Button>
        </div>
      </div>

      {/* Order Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="metric-card">
          <div className="metric-value text-blue-600">{orderStats.total}</div>
          <div className="metric-label">Total Orders</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-neutral-600">{orderStats.draft}</div>
          <div className="metric-label">Draft</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-amber-600">{orderStats.pending}</div>
          <div className="metric-label">Pending</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-green-600">{orderStats.received}</div>
          <div className="metric-label">Received</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-purple-600">${(orderStats.totalValue / 1000).toFixed(0)}K</div>
          <div className="metric-label">Total Value</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search orders by number or supplier..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="confirmed">Confirmed</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredOrders.map(order => (
                <tr 
                  key={order.id} 
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderDetails(true);
                    navigate(`/purchase-orders/${order.id}`);
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-neutral-900">{order.orderNumber}</div>
                      <div className="text-sm text-neutral-500">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-neutral-500">
                        By {order.createdBy}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">
                      {order.supplierName}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-neutral-500">
                      {order.items.slice(0, 2).map(item => item.itemName).join(', ')}
                      {order.items.length > 2 && '...'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">
                      ${order.total.toFixed(2)}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Subtotal: ${order.subtotal.toFixed(2)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      Expected: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                    </div>
                    {order.actualDeliveryDate && (
                      <div className="text-sm text-green-600">
                        Delivered: {new Date(order.actualDeliveryDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {order.status === 'draft' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, 'sent');
                          }}
                          size="sm"
                        >
                          Send
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(order.id, 'received');
                          }}
                          size="sm"
                        >
                          Receive
                        </Button>
                      )}
                      
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="text-neutral-400 text-lg mb-2">No purchase orders found</div>
            <div className="text-neutral-500 text-sm">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter settings'
                : 'Create your first purchase order to get started'
              }
            </div>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Create First Order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4">
              <h3 className="text-lg font-semibold">Create Purchase Order</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Supplier *
                  </label>
                  <select
                    value={newOrder.supplierId}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select supplier...</option>
                    <option value="sup_1">Premium Foods Co.</option>
                    <option value="sup_2">Fresh Market Supply</option>
                    <option value="sup_3">Ocean Harvest</option>
                    <option value="sup_4">Specialty Imports</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Expected Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={newOrder.expectedDeliveryDate.split('T')[0]}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-neutral-900">Order Items</h4>
                  <Button onClick={addOrderItem} size="sm">
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {newOrder.items.map((item, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Item Name
                          </label>
                          <input
                            type="text"
                            value={item.itemName}
                            onChange={(e) => updateOrderItem(index, { itemName: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Item name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Unit
                          </label>
                          <select
                            value={item.unit}
                            onChange={(e) => updateOrderItem(index, { unit: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="pcs">Pieces</option>
                            <option value="lbs">Pounds</option>
                            <option value="kg">Kilograms</option>
                            <option value="bottles">Bottles</option>
                            <option value="cans">Cans</option>
                            <option value="boxes">Boxes</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Unit Cost
                          </label>
                          <input
                            type="number"
                            value={item.unitCost}
                            onChange={(e) => updateOrderItem(index, { unitCost: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            onClick={() => removeOrderItem(index)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 w-full"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-sm font-medium text-neutral-900">
                          Total: ${(item.quantity * item.unitCost).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {newOrder.items.length === 0 && (
                    <div className="text-center py-8 text-neutral-500">
                      <div className="text-lg mb-2">📦</div>
                      <div>No items added yet</div>
                      <Button onClick={addOrderItem} size="sm" className="mt-2">
                        Add First Item
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Additional Costs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Shipping
                  </label>
                  <input
                    type="number"
                    value={newOrder.shipping}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tax
                  </label>
                  <input
                    type="number"
                    value={newOrder.tax}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-md font-medium">
                    ${(
                      newOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0) + 
                      newOrder.shipping + 
                      newOrder.tax
                    ).toFixed(2)}
                  </div>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes or special instructions..."
                />
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewOrder({
                      supplierId: '',
                      expectedDeliveryDate: '',
                      notes: '',
                      items: [],
                      shipping: 0,
                      tax: 0
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newOrder.supplierId || !newOrder.expectedDeliveryDate || newOrder.items.length === 0}
                >
                  Create Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">{selectedOrder.orderNumber}</h2>
                  <p className="text-neutral-600">{selectedOrder.supplierName}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                  <Button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setSelectedOrder(null);
                      navigate('/purchase-orders');
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                    <div><strong>Expected Delivery:</strong> {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</div>
                    {selectedOrder.actualDeliveryDate && (
                      <div><strong>Actual Delivery:</strong> {new Date(selectedOrder.actualDeliveryDate).toLocaleDateString()}</div>
                    )}
                    <div><strong>Created By:</strong> {selectedOrder.createdBy}</div>
                    {selectedOrder.approvedBy && (
                      <div><strong>Approved By:</strong> {selectedOrder.approvedBy}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${selectedOrder.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${selectedOrder.tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 font-semibold flex justify-between">
                      <span>Total:</span>
                      <span>${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-neutral-900 mb-3">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                          SKU
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                          Unit Cost
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-sm">{item.itemName}</td>
                          <td className="px-4 py-2 text-sm text-neutral-500">{item.sku}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-sm">${item.unitCost.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-medium">${item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-3">Notes</h3>
                  <p className="text-sm text-neutral-600">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {selectedOrder.status === 'draft' && (
                    <Button
                      onClick={() => handleStatusChange(selectedOrder.id, 'sent')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Send to Supplier
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'confirmed' && (
                    <Button
                      onClick={() => handleStatusChange(selectedOrder.id, 'received')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Mark as Received
                    </Button>
                  )}
                  
                  <Button variant="outline">
                    Print/Export
                  </Button>
                </div>
                
                <div className="text-sm text-neutral-500">
                  Last updated: {new Date(selectedOrder.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagement;