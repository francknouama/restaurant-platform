import React from 'react';
import { Reservation, ReservationID, ReservationStatus } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';

export interface ReservationCardProps {
  reservation: Reservation;
  onConfirm?: (reservationId: ReservationID) => void;
  onCancel?: (reservationId: ReservationID) => void;
  onCheckIn?: (reservationId: ReservationID) => void;
  onMarkNoShow?: (reservationId: ReservationID) => void;
  onComplete?: (reservationId: ReservationID) => void;
  onEdit?: (reservationId: ReservationID) => void;
  loading?: boolean;
  compact?: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onConfirm,
  onCancel,
  onCheckIn,
  onMarkNoShow,
  onComplete,
  onEdit,
  loading = false,
  compact = false,
}) => {
  const getStatusColor = (status: ReservationStatus) => {
    const colors = {
      PENDING: 'warning',
      CONFIRMED: 'info',
      CHECKED_IN: 'success',
      COMPLETED: 'neutral',
      CANCELLED: 'danger',
      NO_SHOW: 'danger',
    } as const;
    return colors[status];
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getTimeFromNow = () => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
    const now = new Date();
    const diffMinutes = Math.floor((reservationDateTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      const pastMinutes = Math.abs(diffMinutes);
      if (pastMinutes < 60) return `${pastMinutes}m ago`;
      return `${Math.floor(pastMinutes / 60)}h ago`;
    }
    
    if (diffMinutes < 60) return `in ${diffMinutes}m`;
    if (diffMinutes < 1440) return `in ${Math.floor(diffMinutes / 60)}h`;
    return `in ${Math.floor(diffMinutes / 1440)}d`;
  };

  const isUpcoming = () => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
    const now = new Date();
    const diffMinutes = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 30; // Within 30 minutes
  };

  const isOverdue = () => {
    const reservationDateTime = new Date(`${reservation.date}T${reservation.time}`);
    const now = new Date();
    const diffMinutes = (now.getTime() - reservationDateTime.getTime()) / (1000 * 60);
    return diffMinutes > 15 && reservation.status === 'CONFIRMED'; // 15 minutes late
  };

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-lg ${
        reservation.status === 'CHECKED_IN' 
          ? 'ring-2 ring-green-500 bg-green-50' 
          : reservation.status === 'CANCELLED' || reservation.status === 'NO_SHOW'
          ? 'ring-2 ring-red-300 bg-red-50 opacity-75'
          : isUpcoming()
          ? 'ring-2 ring-blue-500 bg-blue-50'
          : isOverdue()
          ? 'ring-2 ring-red-500 bg-red-50'
          : ''
      }`}
      padding={compact ? 'sm' : 'md'}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
              {reservation.customerName}
            </h3>
            <StatusBadge status={reservation.status} variant={getStatusColor(reservation.status)}>
              {reservation.status.replace('_', ' ')}
            </StatusBadge>
            {isUpcoming() && (
              <StatusBadge status="upcoming" variant="info" size="sm">
                UPCOMING
              </StatusBadge>
            )}
            {isOverdue() && (
              <StatusBadge status="overdue" variant="danger" size="sm">
                OVERDUE
              </StatusBadge>
            )}
          </div>
          
          <div className={`flex items-center space-x-4 text-gray-600 ${compact ? 'text-sm' : 'text-base'}`}>
            <span className="flex items-center space-x-1">
              <span>📅</span>
              <span>{formatDate(reservation.date)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🕒</span>
              <span>{formatTime(`${reservation.date}T${reservation.time}`)}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>👥</span>
              <span>{reservation.partySize}</span>
            </span>
            <span className="flex items-center space-x-1">
              <span>🍽️</span>
              <span>Table {reservation.tableID}</span>
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
            {getTimeFromNow()}
          </div>
          {reservation.duration && (
            <div className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              {reservation.duration}min duration
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      {!compact && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {reservation.customerPhone && (
              <div className="flex items-center space-x-2">
                <span>📞</span>
                <span>{reservation.customerPhone}</span>
              </div>
            )}
            {reservation.customerEmail && (
              <div className="flex items-center space-x-2">
                <span>✉️</span>
                <span className="truncate">{reservation.customerEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Special Requests */}
      {reservation.specialRequests && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-sm">
          <span className="font-medium text-blue-900">Special Requests: </span>
          <span className="text-blue-700">{reservation.specialRequests}</span>
        </div>
      )}

      {/* Notes */}
      {reservation.notes && (
        <div className="mb-3 p-2 bg-yellow-50 rounded text-sm">
          <span className="font-medium text-yellow-900">Notes: </span>
          <span className="text-yellow-700">{reservation.notes}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {reservation.status === 'PENDING' && onConfirm && (
          <Button
            variant="primary"
            size={compact ? "xs" : "sm"}
            onClick={() => onConfirm(reservation.id)}
            loading={loading}
          >
            Confirm
          </Button>
        )}
        
        {reservation.status === 'CONFIRMED' && onCheckIn && (
          <Button
            variant="success"
            size={compact ? "xs" : "sm"}
            onClick={() => onCheckIn(reservation.id)}
            loading={loading}
          >
            Check In
          </Button>
        )}
        
        {reservation.status === 'CHECKED_IN' && onComplete && (
          <Button
            variant="secondary"
            size={compact ? "xs" : "sm"}
            onClick={() => onComplete(reservation.id)}
            loading={loading}
          >
            Complete
          </Button>
        )}
        
        {onEdit && reservation.status !== 'COMPLETED' && reservation.status !== 'CANCELLED' && reservation.status !== 'NO_SHOW' && (
          <Button
            variant="outline"
            size={compact ? "xs" : "sm"}
            onClick={() => onEdit(reservation.id)}
            disabled={loading}
          >
            Edit
          </Button>
        )}

        {/* Mark No Show - for confirmed reservations that are overdue */}
        {reservation.status === 'CONFIRMED' && isOverdue() && onMarkNoShow && (
          <Button
            variant="danger"
            size={compact ? "xs" : "sm"}
            onClick={() => onMarkNoShow(reservation.id)}
            loading={loading}
          >
            No Show
          </Button>
        )}
        
        {onCancel && reservation.status !== 'COMPLETED' && reservation.status !== 'CANCELLED' && reservation.status !== 'NO_SHOW' && (
          <Button
            variant="danger"
            size={compact ? "xs" : "sm"}
            onClick={() => onCancel(reservation.id)}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Time Information */}
      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Created: {new Date(reservation.createdAt).toLocaleDateString()}</span>
            {reservation.updatedAt && reservation.updatedAt !== reservation.createdAt && (
              <span>Updated: {new Date(reservation.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReservationCard;