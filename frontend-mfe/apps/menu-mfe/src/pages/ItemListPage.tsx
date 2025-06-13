import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, StatusBadge } from '@restaurant/shared-ui';

const ItemListPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  // Mock data - will be replaced with real data
  const mockItems = [
    { id: '1', name: 'Grilled Salmon', category: 'Main Course', price: 24.99, available: true },
    { id: '2', name: 'Caesar Salad', category: 'Appetizers', price: 12.99, available: true },
    { id: '3', name: 'Chocolate Cake', category: 'Desserts', price: 8.99, available: false },
    { id: '4', name: 'Beef Tenderloin', category: 'Main Course', price: 32.99, available: true },
  ];

  const filteredItems = filter === 'all' 
    ? mockItems 
    : mockItems.filter(item => 
        filter === 'available' ? item.available : !item.available
      );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Menu Items</h1>
          <p className="mt-2 text-neutral-600">Manage individual menu items</p>
        </div>
        <Link to="/menu/items/new">
          <Button variant="primary">Add New Item</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          All Items ({mockItems.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            filter === 'available'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Available ({mockItems.filter(i => i.available).length})
        </button>
        <button
          onClick={() => setFilter('unavailable')}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            filter === 'unavailable'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Unavailable ({mockItems.filter(i => !i.available).length})
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900">{item.name}</h3>
                  <p className="text-sm text-neutral-600">{item.category}</p>
                </div>
                <StatusBadge 
                  status={item.available ? 'available' : 'unavailable'}
                  variant={item.available ? 'success' : 'danger'}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </StatusBadge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">
                  ${item.price}
                </span>
                <div className="flex space-x-2">
                  <Link to={`/menu/items/edit/${item.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  <Button 
                    variant={item.available ? 'outline' : 'success'} 
                    size="sm"
                  >
                    {item.available ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ItemListPage;