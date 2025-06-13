import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@restaurant/shared-ui';
import { useRestaurantEvents } from '@restaurant/shared-state';

interface CreateReservationForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partySize: number;
  date: string;
  time: string;
  duration: number;
  tableNumber?: number;
  specialRequests: string;
  notes: string;
  source: 'phone' | 'online' | 'walk-in' | 'app';
  priority: 'normal' | 'vip' | 'special';
}

interface TimeSlot {
  time: string;
  available: boolean;
  tablesAvailable: number;
  waitTime: number;
}

interface Table {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: string;
}

const CreateReservationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { emitReservationCreated } = useRestaurantEvents();
  
  const [formData, setFormData] = useState<CreateReservationForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    partySize: 2,
    date: searchParams.get('date') || new Date().toISOString().split('T')[0],
    time: '19:00',
    duration: 120,
    tableNumber: undefined,
    specialRequests: '',
    notes: '',
    source: 'phone',
    priority: 'normal'
  });

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showTableSelection, setShowTableSelection] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate mock time slots based on date and party size
  useEffect(() => {
    if (formData.date && formData.partySize) {
      setIsCheckingAvailability(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const slots: TimeSlot[] = [];
        const baseTime = new Date(`${formData.date}T11:00:00`);
        
        for (let i = 0; i < 22; i++) { // 11:00 AM to 10:00 PM (30-min intervals)
          const slotTime = new Date(baseTime.getTime() + i * 30 * 60 * 1000);
          const timeStr = slotTime.toTimeString().slice(0, 5);
          
          // Skip lunch hours for larger parties
          if (formData.partySize > 6 && slotTime.getHours() < 17) {
            continue;
          }
          
          // Simulate availability based on time and party size
          const isPopularTime = slotTime.getHours() >= 18 && slotTime.getHours() <= 20;
          const availabilityChance = formData.partySize <= 4 ? 0.8 : 
                                  formData.partySize <= 6 ? 0.6 : 0.4;
          const finalChance = isPopularTime ? availabilityChance * 0.7 : availabilityChance;
          
          const available = Math.random() < finalChance;
          const tablesAvailable = available ? Math.floor(Math.random() * 3) + 1 : 0;
          const waitTime = !available ? Math.floor(Math.random() * 45) + 15 : 0;
          
          slots.push({
            time: timeStr,
            available,
            tablesAvailable,
            waitTime
          });
        }
        
        setAvailableSlots(slots);
        setIsCheckingAvailability(false);
        setShowTimeSlots(true);
      }, 1000);
    }
  }, [formData.date, formData.partySize]);

  // Generate available tables when time is selected
  useEffect(() => {
    if (formData.time && formData.partySize) {
      const mockTables: Table[] = [];
      
      // Generate tables based on party size
      for (let i = 1; i <= 25; i++) {
        const capacity = [2, 4, 6, 8, 10][Math.floor(Math.random() * 5)];
        const isAppropriate = capacity >= formData.partySize && capacity <= formData.partySize + 2;
        const available = isAppropriate && Math.random() > 0.3;
        
        if (available || isAppropriate) {
          mockTables.push({
            id: i,
            number: i,
            capacity,
            status: available ? 'available' : 'reserved',
            location: ['Window', 'Center', 'Patio', 'Bar'][Math.floor(Math.random() * 4)]
          });
        }
      }
      
      setAvailableTables(mockTables.sort((a, b) => a.number - b.number));
      setShowTableSelection(true);
    }
  }, [formData.time, formData.partySize]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }

    if (formData.partySize < 1 || formData.partySize > 20) {
      newErrors.partySize = 'Party size must be between 1 and 20';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Cannot make reservations for past dates';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newReservation = {
        id: `res_${Date.now()}`,
        ...formData,
        status: 'pending' as const,
        confirmationCode: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000) + 1000}`,
        createdAt: new Date().toISOString()
      };

      // Emit reservation created event
      emitReservationCreated(newReservation);

      // Navigate to reservation details
      navigate(`/reservations/${newReservation.id}`, {
        state: { message: 'Reservation created successfully!' }
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateReservationForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectTimeSlot = (time: string) => {
    handleInputChange('time', time);
  };

  const selectTable = (tableNumber: number) => {
    handleInputChange('tableNumber', tableNumber);
  };

  const getMinDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = (): string => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 3 months ahead
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">New Reservation</h1>
          <p className="text-neutral-600">Create a new table reservation</p>
        </div>
        <Button
          onClick={() => navigate('/reservations')}
          variant="outline"
        >
          ← Back to Reservations
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="form-section-title">Customer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerName ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="Enter customer name"
              />
              {errors.customerName && (
                <p className="text-red-600 text-xs mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerEmail ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="customer@example.com"
              />
              {errors.customerEmail && (
                <p className="text-red-600 text-xs mt-1">{errors.customerEmail}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerPhone ? 'border-red-300' : 'border-neutral-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.customerPhone && (
                <p className="text-red-600 text-xs mt-1">{errors.customerPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="vip">VIP</option>
                <option value="special">Special Event</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="form-section-title">Reservation Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-300' : 'border-neutral-300'
                }`}
              />
              {errors.date && (
                <p className="text-red-600 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Party Size *
              </label>
              <select
                value={formData.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.partySize ? 'border-red-300' : 'border-neutral-300'
                }`}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(size => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
              {errors.partySize && (
                <p className="text-red-600 text-xs mt-1">{errors.partySize}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="phone">Phone Call</option>
                <option value="online">Online Booking</option>
                <option value="walk-in">Walk-in</option>
                <option value="app">Mobile App</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time Slot Selection */}
        {showTimeSlots && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="form-section-title">Available Time Slots</h2>
            
            {isCheckingAvailability ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-neutral-600 mt-2">Checking availability...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => slot.available && selectTimeSlot(slot.time)}
                    className={`time-slot ${
                      slot.available ? 'available' : 'unavailable'
                    } ${
                      formData.time === slot.time ? 'selected' : ''
                    }`}
                    disabled={!slot.available}
                  >
                    <div className="font-medium">{slot.time}</div>
                    {slot.available ? (
                      <div className="text-xs">{slot.tablesAvailable} tables</div>
                    ) : (
                      <div className="text-xs">{slot.waitTime}min wait</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {errors.time && (
              <p className="text-red-600 text-xs mt-2">{errors.time}</p>
            )}
          </div>
        )}

        {/* Table Selection */}
        {showTableSelection && formData.time && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="form-section-title">Select Table (Optional)</h2>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
              <button
                type="button"
                onClick={() => selectTable(undefined as any)}
                className={`table-visual ${!formData.tableNumber ? 'selected' : 'available'}`}
              >
                Auto
              </button>
              
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => table.status === 'available' && selectTable(table.number)}
                  className={`table-visual ${table.status} ${
                    formData.tableNumber === table.number ? 'selected' : ''
                  }`}
                  disabled={table.status !== 'available'}
                  title={`Table ${table.number} - ${table.capacity} seats - ${table.location}`}
                >
                  <div className="text-xs font-bold">{table.number}</div>
                  <div className="text-xs">{table.capacity}</div>
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-4 mt-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-amber-100 border border-amber-300 rounded"></div>
                <span>Reserved</span>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="form-section-title">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Special Requests
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="High chair, wheelchair accessible, window seat, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Internal notes for staff..."
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            onClick={() => navigate('/reservations')}
            variant="outline"
          >
            Cancel
          </Button>
          
          <div className="flex space-x-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Reservation'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReservationPage;