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

const EditReservationPage: React.FC = () => {
  const { reservationId } = useParams<{ reservationId: string }>();
  const navigate = useNavigate();
  const { emitReservationUpdated } = useRestaurantEvents();
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock data loading
  useEffect(() => {
    if (reservationId) {
      // Simulate API call
      setTimeout(() => {
        const mockReservation: Reservation = {
          id: reservationId,
          customerName: 'John Smith',
          customerEmail: 'john.smith@example.com',
          customerPhone: '(555) 123-4567',
          partySize: 4,
          date: '2025-06-15',
          time: '19:00',
          duration: 120,
          status: 'confirmed',
          tableNumber: 12,
          specialRequests: 'Window seat preferred',
          notes: 'Anniversary dinner',
          createdAt: '2025-06-13T10:30:00Z',
          modifiedAt: '2025-06-13T11:15:00Z',
          confirmationCode: 'A1234',
          source: 'phone',
          priority: 'vip'
        };
        setReservation(mockReservation);
        setIsLoading(false);
      }, 1000);
    }
  }, [reservationId]);

  const handleInputChange = (field: keyof Reservation, value: any) => {
    if (!reservation) return;
    
    setReservation(prev => prev ? { ...prev, [field]: value } : null);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    if (!reservation) return false;
    
    const newErrors: Record<string, string> = {};

    if (!reservation.customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!reservation.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(reservation.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email';
    }

    if (!reservation.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    }

    if (reservation.partySize < 1 || reservation.partySize > 20) {
      newErrors.partySize = 'Party size must be between 1 and 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reservation || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const updatedReservation = {
        ...reservation,
        modifiedAt: new Date().toISOString()
      };

      // Emit reservation updated event
      emitReservationUpdated({
        reservationId: reservation.id,
        updates: updatedReservation,
        updatedBy: 'staff',
        timestamp: new Date().toISOString()
      });

      navigate('/reservations', {
        state: { message: 'Reservation updated successfully!' }
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      setIsSubmitting(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        emitReservationUpdated({
          reservationId: reservation.id,
          updates: { status: 'cancelled' },
          updatedBy: 'staff',
          timestamp: new Date().toISOString()
        });

        navigate('/reservations', {
          state: { message: 'Reservation cancelled successfully!' }
        });
      } catch (error) {
        console.error('Error cancelling reservation:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-neutral-600 mt-2">Loading reservation...</p>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-neutral-400 text-lg">Reservation not found</div>
          <Button onClick={() => navigate('/reservations')} className="mt-4">
            Back to Reservations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Edit Reservation</h1>
          <p className="text-neutral-600">#{reservation.confirmationCode} • {reservation.customerName}</p>
        </div>
        <Button
          onClick={() => navigate('/reservations')}
          variant="outline"
        >
          ← Back to Reservations
        </Button>
      </div>

      {/* Reservation Info */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm font-medium text-neutral-700">Created:</span>
            <div className="text-sm text-neutral-600">
              {new Date(reservation.createdAt).toLocaleString()}
            </div>
          </div>
          {reservation.modifiedAt && (
            <div>
              <span className="text-sm font-medium text-neutral-700">Last Modified:</span>
              <div className="text-sm text-neutral-600">
                {new Date(reservation.modifiedAt).toLocaleString()}
              </div>
            </div>
          )}
          <div>
            <span className="text-sm font-medium text-neutral-700">Source:</span>
            <div className="text-sm text-neutral-600 capitalize">
              {reservation.source}
            </div>
          </div>
        </div>
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
                value={reservation.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerName ? 'border-red-300' : 'border-neutral-300'
                }`}
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
                value={reservation.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerEmail ? 'border-red-300' : 'border-neutral-300'
                }`}
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
                value={reservation.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.customerPhone ? 'border-red-300' : 'border-neutral-300'
                }`}
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
                value={reservation.priority}
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
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={reservation.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Time *
              </label>
              <input
                type="time"
                value={reservation.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Party Size *
              </label>
              <select
                value={reservation.partySize}
                onChange={(e) => handleInputChange('partySize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map(size => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? 'person' : 'people'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Duration
              </label>
              <select
                value={reservation.duration}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Table Number
              </label>
              <input
                type="number"
                value={reservation.tableNumber || ''}
                onChange={(e) => handleInputChange('tableNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Auto-assign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Status
              </label>
              <select
                value={reservation.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="noshow">No Show</option>
                <option value="waitlist">Waitlist</option>
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <h2 className="form-section-title">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Special Requests
              </label>
              <textarea
                value={reservation.specialRequests || ''}
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
                value={reservation.notes || ''}
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
          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={handleCancelReservation}
              disabled={isSubmitting || reservation.status === 'cancelled'}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Reservation
            </Button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={() => navigate('/reservations')}
              variant="outline"
            >
              Discard Changes
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditReservationPage;