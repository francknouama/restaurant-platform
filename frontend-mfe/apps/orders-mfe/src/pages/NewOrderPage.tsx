import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Search, 
  User, 
  MapPin, 
  CreditCard,
  ShoppingCart,
  Clock,
  AlertCircle
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  estimatedTime: number;
}

interface OrderItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
}

const NewOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const { emitOrderCreated, onMenuItemUpdated } = useRestaurantEvents();
  
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEOUT' | 'DELIVERY'>('DINE_IN');
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Mock menu data
  useEffect(() => {
    setTimeout(() => {
      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Margherita Pizza',
          description: 'Fresh tomato sauce, mozzarella, and basil',
          price: 18.99,
          category: 'Pizza',
          available: true,
          estimatedTime: 15
        },
        {
          id: '2',
          name: 'Caesar Salad',
          description: 'Romaine lettuce, croutons, parmesan, caesar dressing',
          price: 13.50,
          category: 'Salads',
          available: true,
          estimatedTime: 5
        },
        {
          id: '3',
          name: 'Chicken Burger',
          description: 'Grilled chicken breast with lettuce, tomato, and mayo',
          price: 16.25,
          category: 'Burgers',
          available: true,
          estimatedTime: 12
        },
        {
          id: '4',
          name: 'Pasta Carbonara',
          description: 'Spaghetti with eggs, pancetta, and parmesan',
          price: 19.75,
          category: 'Pasta',
          available: true,
          estimatedTime: 18
        },
        {
          id: '5',
          name: 'Fish & Chips',
          description: 'Beer-battered cod with french fries',
          price: 22.50,
          category: 'Mains',
          available: false,
          estimatedTime: 20
        }
      ];
      setMenuItems(mockMenuItems);
      setIsLoading(false);
    }, 500);
  }, []);

  // Listen for menu item updates from menu MFE
  useEffect(() => {
    const unsubscribe = onMenuItemUpdated((event) => {
      const { itemId, available, price, name } = event.payload;
      
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId 
            ? { 
                ...item, 
                available: available ?? item.available,
                price: price ?? item.price,
                name: name ?? item.name
              }
            : item
        )
      );
      
      console.log('Menu item updated:', event.payload);
    });

    return unsubscribe;
  }, [onMenuItemUpdated]);

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.available;
  });

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.menuItem.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, { menuItem, quantity: 1 }]);
    }
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setOrderItems(orderItems.filter(item => item.menuItem.id !== menuItemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item.menuItem.id === menuItemId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const updateSpecialInstructions = (menuItemId: string, instructions: string) => {
    setOrderItems(orderItems.map(item =>
      item.menuItem.id === menuItemId 
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.1; // 10% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const estimatedPrepTime = () => {
    return Math.max(...orderItems.map(item => item.menuItem.estimatedTime), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const handleSubmitOrder = () => {
    // Validation
    if (orderItems.length === 0) {
      alert('Please add items to your order');
      return;
    }

    if (!customer.name || !customer.phone) {
      alert('Please provide customer name and phone number');
      return;
    }

    if (orderType === 'DELIVERY' && !customer.address) {
      alert('Please provide delivery address');
      return;
    }

    // Generate order ID and number
    const orderId = `order_${Date.now()}`;
    const orderNumber = `ORD-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    // Create order (mock)
    const orderData = {
      type: orderType,
      customer,
      items: orderItems,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal()
    };

    // Emit order created event for cross-MFE communication
    emitOrderCreated({
      orderId,
      orderNumber,
      customerId: customer.email, // Using email as customer ID for demo
      items: orderItems.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity
      })),
      total: calculateTotal(),
      type: orderType
    });

    console.log('Creating order:', orderData);
    console.log('Order created event emitted:', { orderId, orderNumber });
    
    // Navigate to order details or dashboard
    navigate('/orders');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-neutral-200 rounded"></div>
            <div className="h-96 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">New Order</h1>
            <p className="mt-1 text-neutral-600">Create a new order for your customer</p>
          </div>
        </div>
      </div>

      {/* Order Type Selection */}
      <Card>
        <div className="border-b border-neutral-200 pb-4 mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Order Type</h2>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {(['DINE_IN', 'TAKEOUT', 'DELIVERY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                orderType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <div className="text-center">
                <div className="font-medium">{type.replace('_', ' ')}</div>
                <div className="text-sm text-neutral-600 mt-1">
                  {type === 'DINE_IN' && 'Customer dining in restaurant'}
                  {type === 'TAKEOUT' && 'Customer picks up order'}
                  {type === 'DELIVERY' && 'Order delivered to customer'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Select Menu Items</h2>
            </div>
            
            {/* Menu Filters */}
            <div className="flex flex-wrap gap-4 items-center mb-6">
              <div className="flex-1 min-w-64">
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            {/* Menu Items */}
            <div className="space-y-4">
              {filteredMenuItems.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                  <p className="text-neutral-600">No menu items found</p>
                </div>
              ) : (
                filteredMenuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{item.name}</h3>
                        <span className="text-sm text-neutral-500">({item.category})</span>
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="text-xs text-neutral-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.estimatedTime}min
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => addToOrder(item)}
                      variant="primary"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Customer Information</h2>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Name *"
                value={customer.name}
                onChange={(e) => setCustomer({...customer, name: e.target.value})}
                placeholder="Customer name"
                icon={<User className="w-4 h-4" />}
              />
              
              <Input
                label="Phone *"
                value={customer.phone}
                onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                placeholder="Phone number"
                type="tel"
              />
              
              <Input
                label="Email"
                value={customer.email}
                onChange={(e) => setCustomer({...customer, email: e.target.value})}
                placeholder="Email address"
                type="email"
              />
              
              {orderType === 'DELIVERY' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    value={customer.address}
                    onChange={(e) => setCustomer({...customer, address: e.target.value})}
                    placeholder="Enter delivery address"
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Order Items */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Order Items</h2>
            </div>
            
            {orderItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">No items added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.menuItem.id} className="p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.menuItem.name}</span>
                      <span className="font-semibold">
                        {formatCurrency(item.menuItem.price * item.quantity)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <Input
                        placeholder="Special instructions..."
                        value={item.specialInstructions || ''}
                        onChange={(e) => updateSpecialInstructions(item.menuItem.id, e.target.value)}
                        size="sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Order Total */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Order Summary</h2>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>{formatCurrency(calculateTax())}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t border-neutral-200 pt-2">
                <span>Total</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              
              {orderItems.length > 0 && (
                <div className="text-sm text-neutral-600 mt-3 pt-3 border-t border-neutral-200">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    Estimated prep time: {estimatedPrepTime()} minutes
                  </div>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSubmitOrder}
              variant="primary"
              className="w-full mt-6"
              disabled={orderItems.length === 0}
            >
              Create Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewOrderPage;