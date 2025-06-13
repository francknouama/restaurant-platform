import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';

interface CustomerReservation {
  id: string;
  date: string;
  time: string;
  partySize: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noshow';
  tableNumber?: number;
  totalSpent?: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  noShows: number;
  totalSpent: number;
  averagePartySize: number;
  preferredTimes: string[];
  specialRequests: string[];
  notes: string;
  tags: string[];
  createdAt: string;
  lastVisit?: string;
  reservations: CustomerReservation[];
  loyaltyLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const CustomerManagementPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'totalReservations' | 'totalSpent' | 'lastVisit'>('name');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // Mock data
  useEffect(() => {
    const generateMockCustomers = (): Customer[] => {
      const names = [
        'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
        'David Wilson', 'Jessica Miller', 'Chris Anderson', 'Amanda Taylor',
        'Robert Garcia', 'Lisa Martinez', 'James Rodriguez', 'Michelle Lee'
      ];
      
      const mockCustomers: Customer[] = names.map((name, index) => {
        const numReservations = Math.floor(Math.random() * 20) + 1;
        const completedReservations = Math.floor(numReservations * 0.8);
        const cancelledReservations = Math.floor(numReservations * 0.1);
        const noShows = numReservations - completedReservations - cancelledReservations;
        const totalSpent = completedReservations * (Math.random() * 200 + 50);
        
        const reservations: CustomerReservation[] = [];
        for (let i = 0; i < Math.min(10, numReservations); i++) {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 365));
          
          reservations.push({
            id: `res_${index}_${i}`,
            date: date.toISOString().split('T')[0],
            time: ['17:00', '18:00', '19:00', '20:00'][Math.floor(Math.random() * 4)],
            partySize: Math.floor(Math.random() * 6) + 1,
            status: ['completed', 'cancelled', 'noshow'][Math.floor(Math.random() * 3)] as any,
            tableNumber: Math.floor(Math.random() * 20) + 1,
            totalSpent: Math.random() * 200 + 50
          });
        }
        
        return {
          id: `cust_${index}`,
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
          phone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          totalReservations: numReservations,
          completedReservations,
          cancelledReservations,
          noShows,
          totalSpent,
          averagePartySize: Math.round((reservations.reduce((acc, res) => acc + res.partySize, 0) / reservations.length) * 10) / 10,
          preferredTimes: ['19:00', '19:30'],
          specialRequests: Math.random() > 0.7 ? ['Window seat', 'Quiet table'] : [],
          notes: Math.random() > 0.8 ? 'VIP customer - always provide excellent service' : '',
          tags: Math.random() > 0.5 ? ['VIP'] : [],
          createdAt: new Date(Date.now() - Math.random() * 730 * 24 * 60 * 60 * 1000).toISOString(),
          lastVisit: completedReservations > 0 ? reservations[0]?.date : undefined,
          reservations: reservations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
          loyaltyLevel: totalSpent > 2000 ? 'platinum' : totalSpent > 1000 ? 'gold' : totalSpent > 500 ? 'silver' : 'bronze'
        };
      });
      
      return mockCustomers.sort((a, b) => a.name.localeCompare(b.name));
    };

    const mockCustomers = generateMockCustomers();
    setCustomers(mockCustomers);
    
    // If customerId is provided, select that customer
    if (customerId) {
      const customer = mockCustomers.find(c => c.id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setShowCustomerDetails(true);
      }
    }
  }, [customerId]);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  ).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'totalReservations':
        return b.totalReservations - a.totalReservations;
      case 'totalSpent':
        return b.totalSpent - a.totalSpent;
      case 'lastVisit':
        const aDate = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const bDate = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return bDate - aDate;
      default:
        return 0;
    }
  });

  const getLoyaltyColor = (level: string): string => {
    switch (level) {
      case 'platinum': return 'bg-purple-100 text-purple-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'bronze': return 'bg-orange-100 text-orange-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
    navigate(`/customers/${customer.id}`);
  };

  const handleCreateReservation = (customer: Customer) => {
    navigate(`/reservations/new?customer=${encodeURIComponent(customer.name)}&email=${encodeURIComponent(customer.email)}&phone=${encodeURIComponent(customer.phone)}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customer Management</h1>
          <p className="text-neutral-600">
            {filteredCustomers.length} customers
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/reservations/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + New Reservation
          </Button>
          
          <Button
            onClick={() => navigate('/reservations')}
            variant="outline"
          >
            View Reservations
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="totalReservations">Sort by Reservations</option>
              <option value="totalSpent">Sort by Total Spent</option>
              <option value="lastVisit">Sort by Last Visit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value">{customers.length}</div>
          <div className="metric-label">Total Customers</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {customers.filter(c => c.loyaltyLevel === 'gold' || c.loyaltyLevel === 'platinum').length}
          </div>
          <div className="metric-label">VIP Customers</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            ${Math.round(customers.reduce((acc, c) => acc + c.totalSpent, 0)).toLocaleString()}
          </div>
          <div className="metric-label">Total Revenue</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(customers.reduce((acc, c) => acc + c.totalReservations, 0) / customers.length)}
          </div>
          <div className="metric-label">Avg Reservations</div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Reservations
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Loyalty Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredCustomers.map(customer => (
                <tr
                  key={customer.id}
                  className="hover:bg-neutral-50 cursor-pointer"
                  onClick={() => handleCustomerClick(customer)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center">
                        <div className="font-medium text-neutral-900">{customer.name}</div>
                        {customer.tags.includes('VIP') && (
                          <span className="ml-2 text-amber-500" title="VIP Customer">⭐</span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">
                        Customer since {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">{customer.email}</div>
                    <div className="text-sm text-neutral-500">{customer.phone}</div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {customer.totalReservations} total
                    </div>
                    <div className="text-sm text-neutral-500">
                      {customer.completedReservations} completed, {customer.cancelledReservations} cancelled
                    </div>
                    {customer.noShows > 0 && (
                      <div className="text-sm text-red-600">
                        {customer.noShows} no-shows
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">
                      ${customer.totalSpent.toFixed(0)}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Avg party: {customer.averagePartySize}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLoyaltyColor(customer.loyaltyLevel)}`}>
                      {customer.loyaltyLevel.charAt(0).toUpperCase() + customer.loyaltyLevel.slice(1)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {customer.lastVisit 
                      ? new Date(customer.lastVisit).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateReservation(customer);
                        }}
                        size="sm"
                      >
                        Reserve
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCustomerClick(customer);
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
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center">
                  {selectedCustomer.name}
                  {selectedCustomer.tags.includes('VIP') && (
                    <span className="ml-2 text-amber-500">⭐</span>
                  )}
                </h2>
                <p className="text-neutral-600">{selectedCustomer.email}</p>
              </div>
              <Button
                onClick={() => {
                  setShowCustomerDetails(false);
                  setSelectedCustomer(null);
                  navigate('/customers');
                }}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Customer Info */}
              <div className="lg:col-span-1">
                <div className="bg-neutral-50 rounded-lg p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-1 text-sm">
                      <div>{selectedCustomer.phone}</div>
                      <div className="text-neutral-600">{selectedCustomer.email}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Statistics</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="font-medium">{selectedCustomer.totalReservations}</div>
                        <div className="text-neutral-600">Total Reservations</div>
                      </div>
                      <div>
                        <div className="font-medium">${selectedCustomer.totalSpent.toFixed(0)}</div>
                        <div className="text-neutral-600">Total Spent</div>
                      </div>
                      <div>
                        <div className="font-medium">{selectedCustomer.averagePartySize}</div>
                        <div className="text-neutral-600">Avg Party Size</div>
                      </div>
                      <div>
                        <div className={`font-medium px-2 py-1 rounded text-xs ${getLoyaltyColor(selectedCustomer.loyaltyLevel)}`}>
                          {selectedCustomer.loyaltyLevel.charAt(0).toUpperCase() + selectedCustomer.loyaltyLevel.slice(1)}
                        </div>
                        <div className="text-neutral-600">Loyalty Level</div>
                      </div>
                    </div>
                  </div>

                  {selectedCustomer.preferredTimes.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Preferences</h3>
                      <div className="text-sm">
                        <div className="text-neutral-600">Preferred times:</div>
                        <div>{selectedCustomer.preferredTimes.join(', ')}</div>
                      </div>
                    </div>
                  )}

                  {selectedCustomer.notes && (
                    <div>
                      <h3 className="font-semibold mb-2">Notes</h3>
                      <div className="text-sm text-neutral-600">{selectedCustomer.notes}</div>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => handleCreateReservation(selectedCustomer)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Create Reservation
                  </Button>
                </div>
              </div>

              {/* Reservation History */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold mb-4">Reservation History</h3>
                {selectedCustomer.reservations.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCustomer.reservations.map(reservation => (
                      <div key={reservation.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {new Date(reservation.date).toLocaleDateString()} at {reservation.time}
                            </div>
                            <div className="text-sm text-neutral-600">
                              Party of {reservation.partySize} • Table {reservation.tableNumber}
                            </div>
                            {reservation.totalSpent && (
                              <div className="text-sm text-neutral-600">
                                Total: ${reservation.totalSpent.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <span className={`reservation-status-badge ${reservation.status}`}>
                            {reservation.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    No reservation history available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No customers found</div>
          <div className="text-neutral-500 text-sm">
            {searchTerm ? `No results for "${searchTerm}"` : 'No customers in the system yet'}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;