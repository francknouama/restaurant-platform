import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@restaurant/shared-ui';
import { 
  Search, 
  Plus, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
}

const CustomerLookupPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mock customer data
  useEffect(() => {
    setTimeout(() => {
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, City, State 12345',
          totalOrders: 15,
          totalSpent: 425.75,
          lastOrderDate: '2024-01-15T10:30:00Z',
          status: 'ACTIVE',
          joinDate: '2023-08-15T09:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 987-6543',
          address: '456 Oak Ave, City, State 12345',
          totalOrders: 8,
          totalSpent: 189.50,
          lastOrderDate: '2024-01-12T14:20:00Z',
          status: 'ACTIVE',
          joinDate: '2023-11-02T11:15:00Z'
        },
        {
          id: '3',
          name: 'Bob Wilson',
          email: 'bob.wilson@example.com',
          phone: '+1 (555) 456-7890',
          totalOrders: 3,
          totalSpent: 67.25,
          lastOrderDate: '2024-01-10T16:45:00Z',
          status: 'ACTIVE',
          joinDate: '2024-01-05T13:30:00Z'
        },
        {
          id: '4',
          name: 'Alice Johnson',
          email: 'alice.johnson@example.com',
          phone: '+1 (555) 321-0987',
          address: '789 Pine Rd, City, State 12345',
          totalOrders: 22,
          totalSpent: 678.90,
          lastOrderDate: '2024-01-08T19:15:00Z',
          status: 'ACTIVE',
          joinDate: '2023-06-20T10:45:00Z'
        },
        {
          id: '5',
          name: 'Carol Davis',
          email: 'carol.davis@example.com',
          phone: '+1 (555) 654-3210',
          totalOrders: 1,
          totalSpent: 25.50,
          lastOrderDate: '2023-12-28T12:00:00Z',
          status: 'INACTIVE',
          joinDate: '2023-12-28T12:00:00Z'
        }
      ];
      setCustomers(mockCustomers);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchTerm)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCustomerAvatar = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getCustomerType = (totalOrders: number, totalSpent: number) => {
    if (totalOrders >= 20 || totalSpent >= 500) return { label: 'VIP', color: 'purple' };
    if (totalOrders >= 10 || totalSpent >= 200) return { label: 'Regular', color: 'blue' };
    if (totalOrders >= 5) return { label: 'Frequent', color: 'green' };
    return { label: 'New', color: 'gray' };
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-16 bg-neutral-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Customer Lookup</h1>
          <p className="mt-2 text-neutral-600">Search and manage customer information</p>
        </div>
        <Button variant="primary" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <Button variant="outline">
            Advanced Search
          </Button>
        </div>
      </Card>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900">
              {customers.length}
            </div>
            <div className="text-sm text-neutral-600">Total Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {customers.filter(c => c.status === 'ACTIVE').length}
            </div>
            <div className="text-sm text-neutral-600">Active Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {customers.filter(c => c.totalOrders >= 10).length}
            </div>
            <div className="text-sm text-neutral-600">Regular Customers</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {customers.filter(c => c.totalOrders >= 20 || c.totalSpent >= 500).length}
            </div>
            <div className="text-sm text-neutral-600">VIP Customers</div>
          </div>
        </Card>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No customers found</h3>
                <p className="text-neutral-600">
                  {searchTerm 
                    ? 'Try adjusting your search terms.'
                    : 'No customers have been added yet.'}
                </p>
              </div>
            </Card>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const customerType = getCustomerType(customer.totalOrders, customer.totalSpent);
            
            return (
              <Card key={customer.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-4">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {getCustomerAvatar(customer.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{customer.name}</h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            customerType.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                            customerType.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                            customerType.color === 'green' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {customerType.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {customer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4" />
                      <span>{customer.phone}</span>
                    </div>
                    {customer.address && (
                      <div className="flex items-start space-x-2 text-sm text-neutral-600">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-neutral-900">
                        {customer.totalOrders}
                      </div>
                      <div className="text-xs text-neutral-600">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="text-xs text-neutral-600">Total Spent</div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-xs text-neutral-600">
                    <div className="flex items-center justify-between">
                      <span>Last Order:</span>
                      <span>{formatDate(customer.lastOrderDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Joined:</span>
                      <span>{formatDate(customer.joinDate)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-neutral-200">
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="flex-1"
                      onClick={() => navigate(`/orders/customers/${customer.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate(`/orders/new?customer=${customer.id}`)}
                    >
                      New Order
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CustomerLookupPage;