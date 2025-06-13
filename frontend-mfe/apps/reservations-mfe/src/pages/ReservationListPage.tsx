import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noshow' | 'waitlist';
  tableNumber?: number;
  specialRequests?: string;
  notes?: string;
  createdAt: string;
  modifiedAt?: string;
  confirmationCode: string;
  source: 'phone' | 'online' | 'walk-in' | 'app';
  priority: 'normal' | 'vip' | 'special';
}

const ReservationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { emitReservationUpdated } = useRestaurantEvents();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'partySize' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedReservations, setSelectedReservations] = useState<string[]>([]);

  // Mock data
  useEffect(() => {
    const generateMockReservations = (): Reservation[] => {
      const mockReservations: Reservation[] = [];
      const today = new Date();
      
      // Generate reservations for today and next 7 days
      for (let i = 0; i < 8; i++) {
        const reservationDate = new Date(today);
        reservationDate.setDate(today.getDate() + i);
        
        const numReservations = Math.floor(Math.random() * 12) + 3; // 3-15 reservations per day
        
        for (let j = 0; j < numReservations; j++) {
          const reservation: Reservation = {
            id: `res_${i}_${j}`,
            customerName: [
              'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
              'David Wilson', 'Jessica Miller', 'Chris Anderson', 'Amanda Taylor',
              'Robert Garcia', 'Lisa Martinez', 'James Rodriguez', 'Michelle Lee',
              'William Lopez', 'Ashley Kim', 'Daniel Park', 'Jennifer Chen'
            ][Math.floor(Math.random() * 16)],
            customerEmail: `customer${i}${j}@example.com`,
            customerPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            partySize: Math.floor(Math.random() * 10) + 1,
            date: reservationDate.toISOString().split('T')[0],
            time: ['11:00', '11:30', '12:00', '12:30', '13:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'][Math.floor(Math.random() * 14)],
            duration: [60, 90, 120, 150][Math.floor(Math.random() * 4)],
            status: ['pending', 'confirmed', 'completed', 'cancelled', 'noshow'][Math.floor(Math.random() * 5)] as any,
            tableNumber: Math.random() > 0.3 ? Math.floor(Math.random() * 25) + 1 : undefined,
            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            confirmationCode: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000) + 1000}`,
            source: ['phone', 'online', 'walk-in', 'app'][Math.floor(Math.random() * 4)] as any,
            priority: Math.random() > 0.8 ? 'vip' : Math.random() > 0.9 ? 'special' : 'normal',
            specialRequests: Math.random() > 0.7 ? [
              'Wheelchair accessible',
              'High chair needed',
              'Anniversary celebration',
              'Birthday party',
              'Quiet table please',
              'Window seat preferred'
            ][Math.floor(Math.random() * 6)] : undefined,
            notes: Math.random() > 0.8 ? 'Regular customer - prefers table by window' : undefined
          };
          
          mockReservations.push(reservation);
        }
      }
      
      return mockReservations.sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime());
    };

    setReservations(generateMockReservations());
  }, []);

  // Filter and search reservations
  useEffect(() => {
    let filtered = [...reservations];
    
    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(res => res.date === today);
        break;
      case 'tomorrow':
        filtered = filtered.filter(res => res.date === tomorrow);
        break;
      case 'week':
        filtered = filtered.filter(res => res.date >= today && res.date <= weekFromNow);
        break;
      case 'all':
      default:
        break;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(res => res.status === statusFilter);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(res =>
        res.customerName.toLowerCase().includes(term) ||
        res.customerEmail.toLowerCase().includes(term) ||
        res.customerPhone.includes(term) ||
        res.confirmationCode.toLowerCase().includes(term) ||
        (res.tableNumber && res.tableNumber.toString().includes(term))
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'name':
          aVal = a.customerName.toLowerCase();
          bVal = b.customerName.toLowerCase();
          break;
        case 'partySize':
          aVal = a.partySize;
          bVal = b.partySize;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'date':
        default:
          aVal = new Date(a.date + ' ' + a.time).getTime();
          bVal = new Date(b.date + ' ' + b.time).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, dateFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'text-amber-600 bg-amber-100';
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-gray-600 bg-gray-100';
      case 'noshow': return 'text-red-700 bg-red-200';
      case 'waitlist': return 'text-purple-600 bg-purple-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'vip': return '⭐';
      case 'special': return '🎉';
      default: return '';
    }
  };

  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'phone': return '📞';
      case 'online': return '💻';
      case 'walk-in': return '🚶';
      case 'app': return '📱';
      default: return '';
    }
  };

  const handleStatusChange = (reservationId: string, newStatus: string) => {
    setReservations(prev => prev.map(res =>
      res.id === reservationId
        ? { ...res, status: newStatus as any, modifiedAt: new Date().toISOString() }
        : res
    ));

    emitReservationUpdated({
      reservationId,
      updates: { status: newStatus },
      updatedBy: 'staff',
      timestamp: new Date().toISOString()
    });
  };

  const handleBulkAction = (action: string) => {
    if (selectedReservations.length === 0) return;

    switch (action) {
      case 'confirm':
        selectedReservations.forEach(id => handleStatusChange(id, 'confirmed'));
        break;
      case 'cancel':
        selectedReservations.forEach(id => handleStatusChange(id, 'cancelled'));
        break;
      case 'delete':
        setReservations(prev => prev.filter(res => !selectedReservations.includes(res.id)));
        break;
    }
    
    setSelectedReservations([]);
  };

  const toggleReservationSelection = (reservationId: string) => {
    setSelectedReservations(prev =>
      prev.includes(reservationId)
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const selectAllReservations = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.map(res => res.id));
    }
  };

  const formatDateTime = (date: string, time: string): string => {
    const reservationDate = new Date(date + 'T' + time);
    return reservationDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const isToday = (date: string): boolean => {
    return date === new Date().toISOString().split('T')[0];
  };

  const isPast = (date: string, time: string): boolean => {
    return new Date(date + 'T' + time).getTime() < Date.now();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reservations</h1>
          <p className="text-neutral-600">
            {filteredReservations.length} of {reservations.length} reservations
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
            onClick={() => navigate('/calendar')}
            variant="outline"
          >
            Calendar View
          </Button>
          
          <Button
            onClick={() => navigate('/waitlist')}
            variant="outline"
          >
            Waitlist
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, phone, confirmation..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
              <option value="all">All Dates</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="noshow">No Show</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date & Time</option>
              <option value="name">Customer Name</option>
              <option value="partySize">Party Size</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReservations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              {selectedReservations.length} reservation(s) selected
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleBulkAction('confirm')}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm All
              </Button>
              <Button
                onClick={() => handleBulkAction('cancel')}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                Cancel All
              </Button>
              <Button
                onClick={() => setSelectedReservations([])}
                size="sm"
                variant="outline"
              >
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReservations.length === filteredReservations.length}
                    onChange={selectAllReservations}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Party Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {filteredReservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className={`hover:bg-neutral-50 ${
                    selectedReservations.includes(reservation.id) ? 'bg-blue-50' : ''
                  } ${
                    isToday(reservation.date) && !isPast(reservation.date, reservation.time) ? 'border-l-4 border-l-blue-400' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedReservations.includes(reservation.id)}
                      onChange={() => toggleReservationSelection(reservation.id)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-neutral-900">
                            {reservation.customerName}
                          </div>
                          {getPriorityIcon(reservation.priority) && (
                            <span title={reservation.priority}>
                              {getPriorityIcon(reservation.priority)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {reservation.customerEmail}
                        </div>
                        <div className="text-sm text-neutral-500">
                          {reservation.customerPhone}
                        </div>
                        <div className="text-xs text-neutral-400">
                          #{reservation.confirmationCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-900">
                      {formatDateTime(reservation.date, reservation.time)}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {reservation.duration}min duration
                    </div>
                    {isPast(reservation.date, reservation.time) && (
                      <div className="text-xs text-red-600 font-medium">Past</div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`party-size-indicator ${
                      reservation.partySize <= 2 ? 'small' : 
                      reservation.partySize <= 6 ? 'medium' : 'large'
                    }`}>
                      {reservation.partySize}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    {reservation.tableNumber ? `Table ${reservation.tableNumber}` : 'TBD'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(reservation.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="noshow">No Show</option>
                    </select>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span>{getSourceIcon(reservation.source)}</span>
                      <span className="text-sm text-neutral-600 capitalize">
                        {reservation.source}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => navigate(`/reservations/${reservation.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => navigate(`/reservations/${reservation.id}/edit`)}
                        size="sm"
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredReservations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg mb-2">No reservations found</div>
          <div className="text-neutral-500 text-sm mb-4">
            {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first reservation to get started'
            }
          </div>
          <Button
            onClick={() => navigate('/reservations/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + New Reservation
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReservationListPage;