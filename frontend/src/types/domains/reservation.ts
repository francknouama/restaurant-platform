import { ReservationID, Timestamps } from '../common';

// Reservation domain types matching Go backend exactly

// Reservation Status (matching Go backend state machine)
export const ReservationStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW'
} as const;

export type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

// Valid status transitions (matching Go backend business rules)
export const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CHECKED_IN', 'NO_SHOW', 'CANCELLED'],
  CHECKED_IN: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: []
};

export interface Reservation extends Timestamps {
  id: ReservationID;
  customerID: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableID: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // Time string (HH:MM:SS)
  dateTime: string; // Full ISO datetime for backend compatibility
  partySize: number;
  status: ReservationStatus;
  duration?: number; // Duration in minutes
  notes?: string;
  specialRequests?: string;
}

// Request types for API
export interface CreateReservationRequest {
  customerID: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tableID: string;
  dateTime: string;
  partySize: number;
  notes?: string;
  specialRequests?: string[];
}

export interface UpdateReservationRequest {
  tableID?: string;
  dateTime?: string;
  partySize?: number;
  notes?: string;
  specialRequests?: string[];
}

export interface UpdateReservationStatusRequest {
  status: ReservationStatus;
}

// Filter and search types
export interface ReservationFilters {
  status?: ReservationStatus | ReservationStatus[];
  tableID?: string;
  customerID?: string;
  customerName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeFrom?: string;
  timeTo?: string;
  partySize?: number;
  page?: number;
  limit?: number;
}

// Table availability types
export interface TableAvailability {
  tableID: string;
  tableName: string;
  capacity: number;
  location: string;
  isAvailable: boolean;
  nextAvailableTime?: string;
  currentReservation?: ReservationID;
}

export interface AvailabilityRequest {
  dateTime: string;
  partySize: number;
  duration?: number; // in minutes, default 120
}

export interface AvailabilityResponse {
  availableTables: TableAvailability[];
  suggestedTimes: string[];
  waitlistAvailable: boolean;
}

// Table management types
export interface Table {
  id: string;
  name: string;
  capacity: number;
  minCapacity: number;
  maxCapacity: number;
  location: string;
  isActive: boolean;
  features?: string[]; // e.g., 'window', 'private', 'accessible'
}

export interface TableLayout {
  id: string;
  name: string;
  tables: Table[];
  layout: string; // JSON string representing visual layout
}

// Waitlist types
export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  requestedTime: string;
  estimatedWait: number; // in minutes
  priority: number;
  status: 'WAITING' | 'SEATED' | 'CANCELLED';
  createdAt: string;
}

// Business rule validation
export interface ReservationValidationError {
  field: string;
  message: string;
  code: string;
}

// Reservation business logic constants
export const RESERVATION_CONSTANTS = {
  MIN_PARTY_SIZE: 1,
  MAX_PARTY_SIZE: 20,
  MIN_ADVANCE_BOOKING: 1, // 1 hour
  MAX_ADVANCE_BOOKING: 90, // 90 days
  DEFAULT_DURATION: 120, // 2 hours in minutes
  MAX_DURATION: 240, // 4 hours in minutes
  MAX_NOTES_LENGTH: 500,
  SPECIAL_REQUESTS: [
    'High Chair',
    'Wheelchair Accessible',
    'Quiet Table',
    'Window Seat',
    'Birthday Celebration',
    'Anniversary',
    'Business Meeting'
  ]
} as const;

// Helper functions for reservation business logic
export const isValidStatusTransition = (
  currentStatus: ReservationStatus, 
  newStatus: ReservationStatus
): boolean => {
  return RESERVATION_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
};

export const isValidReservationTime = (dateTime: string): boolean => {
  const reservationDate = new Date(dateTime);
  const now = new Date();
  const minTime = new Date(now.getTime() + RESERVATION_CONSTANTS.MIN_ADVANCE_BOOKING * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + RESERVATION_CONSTANTS.MAX_ADVANCE_BOOKING * 24 * 60 * 60 * 1000);
  
  return reservationDate >= minTime && reservationDate <= maxTime;
};

export const calculateReservationEndTime = (dateTime: string, duration: number = RESERVATION_CONSTANTS.DEFAULT_DURATION): string => {
  const startTime = new Date(dateTime);
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  return endTime.toISOString();
};

export const getReservationDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes
};