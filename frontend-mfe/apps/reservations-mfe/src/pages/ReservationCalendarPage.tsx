import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  duration: number; // in minutes
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

interface DayData {
  date: string;
  reservations: Reservation[];
  availableSlots: number;
  totalCapacity: number;
  isFullyBooked: boolean;
  isToday: boolean;
  isOtherMonth: boolean;
}

const ReservationCalendarPage: React.FC = () => {
  const { view = 'month', date } = useParams<{ view?: string; date?: string }>();
  const navigate = useNavigate();
  const { onReservationCreated, onReservationUpdated } = useRestaurantEvents();
  
  const [currentDate, setCurrentDate] = useState(date ? new Date(date) : new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarData, setCalendarData] = useState<DayData[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data for development
  useEffect(() => {
    const generateMockReservations = (): Reservation[] => {
      const mockReservations: Reservation[] = [];
      const today = new Date();
      
      // Generate reservations for the next 30 days
      for (let i = 0; i < 30; i++) {
        const reservationDate = new Date(today);
        reservationDate.setDate(today.getDate() + i);
        
        // Random number of reservations per day (0-8)
        const numReservations = Math.floor(Math.random() * 9);
        
        for (let j = 0; j < numReservations; j++) {
          const reservation: Reservation = {
            id: `res_${i}_${j}`,
            customerName: [
              'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
              'David Wilson', 'Jessica Miller', 'Chris Anderson', 'Amanda Taylor'
            ][Math.floor(Math.random() * 8)],
            customerEmail: `customer${i}${j}@example.com`,
            customerPhone: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
            partySize: Math.floor(Math.random() * 8) + 1,
            date: reservationDate.toISOString().split('T')[0],
            time: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'][Math.floor(Math.random() * 8)],
            duration: [90, 120, 150][Math.floor(Math.random() * 3)],
            status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)] as any,
            tableNumber: Math.floor(Math.random() * 20) + 1,
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            confirmationCode: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000) + 1000}`,
            source: ['phone', 'online', 'walk-in', 'app'][Math.floor(Math.random() * 4)] as any,
            priority: ['normal', 'vip'][Math.floor(Math.random() * 2)] as any,
            specialRequests: Math.random() > 0.7 ? 'Anniversary dinner' : undefined
          };
          
          mockReservations.push(reservation);
        }
      }
      
      return mockReservations;
    };

    const mockReservations = generateMockReservations();
    setReservations(mockReservations);
  }, []);

  // Generate calendar data based on current view and reservations
  useEffect(() => {
    const generateCalendarData = () => {
      if (view === 'month') {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
        
        const days: DayData[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 42; i++) { // 6 weeks
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          const dateStr = date.toISOString().split('T')[0];
          const dayReservations = reservations.filter(res => res.date === dateStr);
          
          days.push({
            date: dateStr,
            reservations: dayReservations,
            availableSlots: Math.max(0, 20 - dayReservations.length), // Assuming 20 total slots
            totalCapacity: 20,
            isFullyBooked: dayReservations.length >= 20,
            isToday: date.getTime() === today.getTime(),
            isOtherMonth: date.getMonth() !== month
          });
        }
        
        setCalendarData(days);
      }
    };

    if (reservations.length > 0) {
      generateCalendarData();
    }
  }, [currentDate, view, reservations]);

  // Listen for reservation events
  useEffect(() => {
    const unsubscribeCreated = onReservationCreated((event) => {
      setReservations(prev => [...prev, event.payload]);
    });

    const unsubscribeUpdated = onReservationUpdated((event) => {
      setReservations(prev => prev.map(res => 
        res.id === event.payload.reservationId 
          ? { ...res, ...event.payload.updates }
          : res
      ));
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [onReservationCreated, onReservationUpdated]);

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

  const getPartySizeColor = (size: number): string => {
    if (size <= 2) return 'small';
    if (size <= 6) return 'medium';
    return 'large';
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
    navigate(`/calendar/${view}/${newDate.toISOString().split('T')[0]}`);
  };

  const navigateToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    navigate(`/calendar/${view}/${today.toISOString().split('T')[0]}`);
  };

  const handleDateClick = (dayData: DayData) => {
    const clickedDate = new Date(dayData.date);
    setSelectedDate(clickedDate);
    
    if (dayData.reservations.length === 1) {
      setSelectedReservation(dayData.reservations[0]);
    }
  };

  const handleCreateReservation = (date?: string) => {
    if (date) {
      navigate(`/reservations/new?date=${date}`);
    } else {
      setShowCreateModal(true);
    }
  };

  const renderMonthView = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => navigateMonth('prev')} variant="outline" size="sm">
              ← Previous
            </Button>
            <Button onClick={navigateToToday} variant="outline" size="sm">
              Today
            </Button>
            <Button onClick={() => navigateMonth('next')} variant="outline" size="sm">
              Next →
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
          {/* Week day headers */}
          <div className="calendar-grid bg-neutral-50 border-b border-neutral-200">
            {weekDays.map(day => (
              <div key={day} className="p-3 text-center font-medium text-neutral-700">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-grid">
            {calendarData.map((dayData, index) => (
              <div
                key={index}
                onClick={() => handleDateClick(dayData)}
                className={`calendar-day ${
                  dayData.isToday ? 'today' : ''
                } ${
                  dayData.isOtherMonth ? 'other-month' : ''
                } ${
                  dayData.reservations.length > 0 ? 'has-reservations' : ''
                } ${
                  dayData.isFullyBooked ? 'fully-booked' : ''
                } cursor-pointer hover:bg-blue-50`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${
                    dayData.isOtherMonth ? 'text-neutral-400' : 'text-neutral-900'
                  }`}>
                    {new Date(dayData.date).getDate()}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {dayData.reservations.length}/{dayData.totalCapacity}
                  </span>
                </div>

                {/* Reservation indicators */}
                <div className="space-y-1">
                  {dayData.reservations.slice(0, 3).map((reservation, resIndex) => (
                    <div
                      key={resIndex}
                      className="text-xs p-1 rounded truncate"
                      style={{
                        backgroundColor: reservation.status === 'confirmed' ? '#dcfce7' : 
                                       reservation.status === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: reservation.status === 'confirmed' ? '#166534' : 
                               reservation.status === 'pending' ? '#92400e' : '#991b1b'
                      }}
                    >
                      {reservation.time} - {reservation.customerName}
                      <span className={`party-size-indicator ${getPartySizeColor(reservation.partySize)} ml-1`}>
                        {reservation.partySize}
                      </span>
                    </div>
                  ))}
                  {dayData.reservations.length > 3 && (
                    <div className="text-xs text-neutral-500 text-center">
                      +{dayData.reservations.length - 3} more
                    </div>
                  )}
                </div>

                {/* Quick add button */}
                {!dayData.isOtherMonth && !dayData.isFullyBooked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateReservation(dayData.date);
                    }}
                    className="mt-1 w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded"
                  >
                    + Add
                  </button>
                )}

                {dayData.isFullyBooked && !dayData.isOtherMonth && (
                  <div className="mt-1 text-xs text-red-600 text-center font-medium">
                    Fully Booked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Reservation Calendar</h1>
          <p className="text-neutral-600">
            {selectedDate ? formatDate(selectedDate) : formatDate(currentDate)} • 
            {calendarData.reduce((acc, day) => acc + day.reservations.length, 0)} reservations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            {['day', 'week', 'month'].map((viewType) => (
              <button
                key={viewType}
                onClick={() => navigate(`/calendar/${viewType}`)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === viewType
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>

          <Button
            onClick={() => handleCreateReservation()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + New Reservation
          </Button>

          <Button
            onClick={() => navigate('/reservations')}
            variant="outline"
          >
            View All
          </Button>

          <Button
            onClick={() => navigate('/tables')}
            variant="outline"
          >
            Table Layout
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="metric-value">
            {calendarData.filter(day => day.isToday)[0]?.reservations.length || 0}
          </div>
          <div className="metric-label">Today's Reservations</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {reservations.filter(res => res.status === 'pending').length}
          </div>
          <div className="metric-label">Pending Confirmations</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {Math.round(calendarData.filter(day => !day.isOtherMonth && day.reservations.length > 0).length / calendarData.filter(day => !day.isOtherMonth).length * 100) || 0}%
          </div>
          <div className="metric-label">Occupancy Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {calendarData.filter(day => day.isFullyBooked && !day.isOtherMonth).length}
          </div>
          <div className="metric-label">Fully Booked Days</div>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'month' && renderMonthView()}
      
      {view === 'week' && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="text-center text-neutral-500">
            Week view coming soon...
            <br />
            <Button onClick={() => navigate('/calendar/month')} className="mt-4">
              Switch to Month View
            </Button>
          </div>
        </div>
      )}
      
      {view === 'day' && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="text-center text-neutral-500">
            Day view coming soon...
            <br />
            <Button onClick={() => navigate('/calendar/month')} className="mt-4">
              Switch to Month View
            </Button>
          </div>
        </div>
      )}

      {/* Selected Reservation Details */}
      {selectedReservation && (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reservation Details</h3>
            <Button
              onClick={() => setSelectedReservation(null)}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-neutral-900">{selectedReservation.customerName}</h4>
              <p className="text-sm text-neutral-600">{selectedReservation.customerEmail}</p>
              <p className="text-sm text-neutral-600">{selectedReservation.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium">Date:</span> {selectedReservation.date}
              </p>
              <p className="text-sm">
                <span className="font-medium">Time:</span> {selectedReservation.time}
              </p>
              <p className="text-sm">
                <span className="font-medium">Party Size:</span> {selectedReservation.partySize}
              </p>
              <p className="text-sm">
                <span className="font-medium">Table:</span> {selectedReservation.tableNumber || 'TBD'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <span className={`reservation-status-badge ${selectedReservation.status}`}>
              {selectedReservation.status.charAt(0).toUpperCase() + selectedReservation.status.slice(1)}
            </span>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => navigate(`/reservations/${selectedReservation.id}/edit`)}
                size="sm"
              >
                Edit
              </Button>
              <Button
                onClick={() => navigate(`/reservations/${selectedReservation.id}`)}
                variant="outline"
                size="sm"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationCalendarPage;