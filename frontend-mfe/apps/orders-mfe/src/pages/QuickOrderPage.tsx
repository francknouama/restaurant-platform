import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@restaurant/shared-ui';
import { 
  ArrowLeft, 
  Zap, 
  Plus, 
  Clock, 
  Star,
  TrendingUp,
  User
} from 'lucide-react';

interface QuickItem {
  id: string;
  name: string;
  price: number;
  estimatedTime: number;
  isPopular?: boolean;
  category: string;
  description: string;
}

interface Customer {
  name: string;
  phone: string;
}

const QuickOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<{[key: string]: number}>({});
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    phone: ''
  });
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEOUT'>('DINE_IN');
  const [quickItems, setQuickItems] = useState<QuickItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for popular/quick items
  useEffect(() => {
    setTimeout(() => {
      const mockQuickItems: QuickItem[] = [
        {
          id: '1',
          name: 'Classic Burger Combo',
          price: 15.99,
          estimatedTime: 8,
          isPopular: true,
          category: 'Combos',
          description: 'Burger + Fries + Drink'
        },
        {
          id: '2',
          name: 'Margherita Pizza',
          price: 18.99,
          estimatedTime: 12,
          isPopular: true,
          category: 'Pizza',
          description: 'Fresh tomato, mozzarella, basil'
        },
        {
          id: '3',
          name: 'Caesar Salad',
          price: 12.50,
          estimatedTime: 5,
          category: 'Salads',
          description: 'Romaine, parmesan, croutons'
        },
        {
          id: '4',
          name: 'Chicken Wings (12pc)',
          price: 16.99,
          estimatedTime: 15,
          isPopular: true,
          category: 'Appetizers',
          description: 'Buffalo or BBQ sauce'
        },
        {
          id: '5',
          name: 'Fish & Chips',
          price: 19.99,
          estimatedTime: 18,
          category: 'Mains',
          description: 'Beer-battered cod with fries'
        },
        {
          id: '6',
          name: 'Chicken Quesadilla',
          price: 13.99,
          estimatedTime: 10,
          category: 'Mexican',
          description: 'Grilled chicken, cheese, peppers'
        },
        {
          id: '7',
          name: 'Pasta Carbonara',
          price: 17.50,
          estimatedTime: 14,
          category: 'Pasta',
          description: 'Spaghetti, pancetta, eggs, parmesan'
        },
        {
          id: '8',
          name: 'Garden Salad',
          price: 9.99,
          estimatedTime: 3,
          category: 'Salads',
          description: 'Mixed greens, tomatoes, cucumbers'
        }
      ];
      setQuickItems(mockQuickItems);
      setIsLoading(false);
    }, 300);
  }, []);

  const addItem = (itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newQuantity = (prev[itemId] || 0) - 1;
      if (newQuantity <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: newQuantity };
    });
  };

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = quickItems.find(i => i.id === itemId);
      return total + (item ? item.price * quantity : 0);
    }, 0);
  };

  const calculateTax = () => {
    return calculateTotal() * 0.1; // 10% tax
  };

  const getEstimatedTime = () => {
    const selectedItemObjects = Object.entries(selectedItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId]) => quickItems.find(item => item.id === itemId))
      .filter(Boolean) as QuickItem[];
    
    return selectedItemObjects.length > 0 
      ? Math.max(...selectedItemObjects.map(item => item.estimatedTime))
      : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const getSelectedItemsCount = () => {
    return Object.values(selectedItems).reduce((sum, quantity) => sum + quantity, 0);
  };

  const handleQuickOrder = () => {
    if (getSelectedItemsCount() === 0) {
      alert('Please select at least one item');
      return;
    }

    if (!customer.name || !customer.phone) {
      alert('Please provide customer name and phone number');
      return;
    }

    // Create quick order (mock)
    const orderData = {
      type: orderType,
      customer,
      items: Object.entries(selectedItems)
        .filter(([_, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => {
          const item = quickItems.find(i => i.id === itemId)!;
          return { menuItem: item, quantity };
        }),
      total: calculateTotal() + calculateTax(),
      estimatedTime: getEstimatedTime()
    };

    console.log('Creating quick order:', orderData);
    
    // Navigate to order details or dashboard
    navigate('/orders');
  };

  const popularItems = quickItems.filter(item => item.isPopular);
  const allItems = quickItems;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-neutral-200 rounded"></div>
            ))}
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
            <h1 className="text-3xl font-bold text-neutral-900 flex items-center space-x-2">
              <Zap className="w-8 h-8 text-amber-500" />
              <span>Quick Order</span>
            </h1>
            <p className="mt-1 text-neutral-600">Fast ordering for popular items</p>
          </div>
        </div>
        
        {getSelectedItemsCount() > 0 && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-neutral-600">
                {getSelectedItemsCount()} items selected
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(calculateTotal() + calculateTax())}
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={handleQuickOrder}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Quick Order</span>
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu Items */}
        <div className="lg:col-span-3 space-y-6">
          {/* Order Type */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Order Type</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {(['DINE_IN', 'TAKEOUT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    orderType === type
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-center font-medium">
                    {type.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Popular Items */}
          {popularItems.length > 0 && (
            <Card>
              <div className="border-b border-neutral-200 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span>Popular Items</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {popularItems.map((item) => (
                  <div key={item.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-neutral-900">{item.name}</h3>
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                        </div>
                        <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.price)}
                      </span>
                      <span className="text-xs text-neutral-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {item.estimatedTime}min
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {selectedItems[item.id] ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {selectedItems[item.id]}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addItem(item.id)}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => addItem(item.id)}
                          className="flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Items */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">All Quick Items</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allItems.map((item) => (
                <div key={item.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-neutral-900">{item.name}</h3>
                        {item.isPopular && (
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-neutral-600 mt-1">{item.description}</p>
                      <span className="text-xs text-neutral-500">{item.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.estimatedTime}min
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {selectedItems[item.id] ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeItem(item.id)}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedItems[item.id]}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addItem(item.id)}
                        >
                          +
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => addItem(item.id)}
                        className="flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Customer Info</h2>
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
            </div>
          </Card>

          {/* Order Summary */}
          <Card>
            <div className="border-b border-neutral-200 pb-4 mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Order Summary</h2>
            </div>
            
            {getSelectedItemsCount() === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-600">No items selected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(selectedItems)
                  .filter(([_, quantity]) => quantity > 0)
                  .map(([itemId, quantity]) => {
                    const item = quickItems.find(i => i.id === itemId)!;
                    return (
                      <div key={itemId} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-xs text-neutral-600">
                            {quantity} × {formatCurrency(item.price)}
                          </div>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(item.price * quantity)}
                        </div>
                      </div>
                    );
                  })}
                
                <div className="border-t border-neutral-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t border-neutral-200 pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal() + calculateTax())}</span>
                  </div>
                  
                  <div className="text-sm text-neutral-600 mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      Est. prep time: {getEstimatedTime()} minutes
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={handleQuickOrder}
                  variant="primary"
                  className="w-full flex items-center justify-center space-x-2"
                  disabled={!customer.name || !customer.phone}
                >
                  <Zap className="w-4 h-4" />
                  <span>Place Quick Order</span>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickOrderPage;