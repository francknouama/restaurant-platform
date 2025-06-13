import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { reservationApi } from '../services/api';
import {
  ReservationID,
  ReservationStatus,
  ReservationFilters,
  CreateReservationRequest,
  UpdateReservationRequest
} from '../types';

// Query Keys
export const RESERVATION_QUERY_KEYS = {
  all: ['reservations'] as const,
  lists: () => [...RESERVATION_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ReservationFilters) => [...RESERVATION_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RESERVATION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RESERVATION_QUERY_KEYS.details(), id] as const,
  availability: (date: string, time?: string, partySize?: number) => 
    [...RESERVATION_QUERY_KEYS.all, 'availability', { date, time, partySize }] as const,
  tables: () => [...RESERVATION_QUERY_KEYS.all, 'tables'] as const,
  tableDetail: (id: string) => [...RESERVATION_QUERY_KEYS.tables(), id] as const,
  search: (query: string) => [...RESERVATION_QUERY_KEYS.all, 'search', query] as const,
  customer: (customerName: string) => [...RESERVATION_QUERY_KEYS.all, 'customer', customerName] as const,
  todaysReservations: () => [...RESERVATION_QUERY_KEYS.all, 'today'] as const,
  metrics: (dateFrom?: string, dateTo?: string) => 
    [...RESERVATION_QUERY_KEYS.all, 'metrics', { dateFrom, dateTo }] as const,
  waitlist: () => [...RESERVATION_QUERY_KEYS.all, 'waitlist'] as const,
};

// Reservation Queries
export const useReservations = (filters?: ReservationFilters) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.list(filters),
    queryFn: () => reservationApi.getReservations(filters),
    staleTime: 60 * 1000, // 1 minute - reservations change moderately frequently
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
    onError: (error: any) => {
      toast.error(`Failed to load reservations: ${error.message}`);
    },
  });
};

export const useReservation = (id: ReservationID) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.detail(id.value),
    queryFn: () => reservationApi.getReservation(id),
    enabled: !!id.value,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    onError: (error: any) => {
      toast.error(`Failed to load reservation: ${error.message}`);
    },
  });
};

export const useTodaysReservations = () => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.todaysReservations(),
    queryFn: reservationApi.getTodaysReservations,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for today's reservations
    onError: (error: any) => {
      toast.error(`Failed to load today's reservations: ${error.message}`);
    },
  });
};

// Table Availability
export const useTableAvailability = (
  date: string, 
  time?: string, 
  partySize?: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.availability(date, time, partySize),
    queryFn: () => {
      if (time && partySize) {
        return reservationApi.checkTableAvailability(date, time, partySize);
      } else {
        return reservationApi.getTableAvailabilityForDay(date);
      }
    },
    enabled: enabled && !!date,
    staleTime: 30 * 1000, // 30 seconds - availability changes frequently
    onError: (error: any) => {
      toast.error(`Failed to check availability: ${error.message}`);
    },
  });
};

// Table Management
export const useTables = () => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.tables(),
    queryFn: reservationApi.getTables,
    staleTime: 10 * 60 * 1000, // 10 minutes - tables rarely change
    onError: (error: any) => {
      toast.error(`Failed to load tables: ${error.message}`);
    },
  });
};

export const useTableInfo = (tableId: string) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.tableDetail(tableId),
    queryFn: () => reservationApi.getTableInfo(tableId),
    enabled: !!tableId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    onError: (error: any) => {
      toast.error(`Failed to load table info: ${error.message}`);
    },
  });
};

// Search and Filters
export const useSearchReservations = (query: string) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.search(query),
    queryFn: () => reservationApi.searchReservations(query),
    enabled: query.length >= 2, // Only search with 2+ characters
    staleTime: 60 * 1000, // 1 minute
    onError: (error: any) => {
      toast.error(`Search failed: ${error.message}`);
    },
  });
};

export const useCustomerReservations = (customerName: string) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.customer(customerName),
    queryFn: () => reservationApi.getReservationsByCustomer(customerName),
    enabled: !!customerName,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      toast.error(`Failed to load customer reservations: ${error.message}`);
    },
  });
};

// Analytics
export const useReservationMetrics = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.metrics(dateFrom, dateTo),
    queryFn: () => reservationApi.getReservationMetrics(dateFrom, dateTo),
    staleTime: 5 * 60 * 1000, // 5 minutes - metrics don't change frequently
    onError: (error: any) => {
      toast.error(`Failed to load reservation metrics: ${error.message}`);
    },
  });
};

// Waitlist
export const useWaitlist = () => {
  return useQuery({
    queryKey: RESERVATION_QUERY_KEYS.waitlist(),
    queryFn: reservationApi.getWaitlist,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    onError: (error: any) => {
      toast.error(`Failed to load waitlist: ${error.message}`);
    },
  });
};

// Reservation Mutations
export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateReservationRequest) => reservationApi.createReservation(data),
    onSuccess: (newReservation) => {
      // Invalidate and refetch reservation lists
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.availability(newReservation.date));
      
      // Add to cache
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(newReservation.id.value), 
        newReservation
      );
      
      toast.success(`Reservation created for ${newReservation.customerName}`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
        },
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to create reservation: ${error.message}`);
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: ReservationID; data: UpdateReservationRequest }) =>
      reservationApi.updateReservation(id, data),
    onSuccess: (updatedReservation) => {
      // Update cache
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      
      // Invalidate lists
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.availability(updatedReservation.date));
      
      toast.success('Reservation updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update reservation: ${error.message}`);
    },
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: ReservationID) => reservationApi.deleteReservation(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries(RESERVATION_QUERY_KEYS.detail(deletedId.value));
      
      // Invalidate lists
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      
      toast.success('Reservation deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete reservation: ${error.message}`);
    },
  });
};

// Status Management Mutations
export const useUpdateReservationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: ReservationID; status: ReservationStatus }) =>
      reservationApi.updateReservationStatus(id, status),
    onSuccess: (updatedReservation) => {
      // Update cache
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.metrics());
      
      toast.success(`Reservation status updated to ${updatedReservation.status}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
};

export const useConfirmReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: ReservationID) => reservationApi.confirmReservation(id),
    onSuccess: (updatedReservation) => {
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      
      toast.success(`Reservation confirmed for ${updatedReservation.customerName}!`, {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
        },
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to confirm reservation: ${error.message}`);
    },
  });
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: ReservationID; reason?: string }) =>
      reservationApi.cancelReservation(id, reason),
    onSuccess: (updatedReservation) => {
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.availability(updatedReservation.date));
      
      toast.success(`Reservation cancelled for ${updatedReservation.customerName}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel reservation: ${error.message}`);
    },
  });
};

export const useCheckInReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: ReservationID) => reservationApi.checkInReservation(id),
    onSuccess: (updatedReservation) => {
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      
      toast.success(`${updatedReservation.customerName} checked in!`, {
        duration: 4000,
        style: {
          background: '#3B82F6',
          color: '#FFFFFF',
        },
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to check in: ${error.message}`);
    },
  });
};

export const useMarkNoShow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: ReservationID) => reservationApi.markNoShow(id),
    onSuccess: (updatedReservation) => {
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.metrics());
      
      toast.error(`Marked ${updatedReservation.customerName} as no-show`);
    },
    onError: (error: any) => {
      toast.error(`Failed to mark no-show: ${error.message}`);
    },
  });
};

export const useCompleteReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: ReservationID) => reservationApi.completeReservation(id),
    onSuccess: (updatedReservation) => {
      queryClient.setQueryData(
        RESERVATION_QUERY_KEYS.detail(updatedReservation.id.value), 
        updatedReservation
      );
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.lists());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.todaysReservations());
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.metrics());
      
      toast.success(`Reservation completed for ${updatedReservation.customerName}!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to complete reservation: ${error.message}`);
    },
  });
};

// Waitlist Mutations
export const useAddToWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: reservationApi.addToWaitlist,
    onSuccess: (result) => {
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.waitlist());
      
      toast.success(
        `Added to waitlist! Position: ${result.position}, Est. wait: ${result.estimatedWaitTime}min`, 
        { duration: 6000 }
      );
    },
    onError: (error: any) => {
      toast.error(`Failed to add to waitlist: ${error.message}`);
    },
  });
};

export const useRemoveFromWaitlist = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (waitlistId: string) => reservationApi.removeFromWaitlist(waitlistId),
    onSuccess: () => {
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.waitlist());
      toast.success('Removed from waitlist');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove from waitlist: ${error.message}`);
    },
  });
};

export const useNotifyWaitlistCustomer = () => {
  return useMutation({
    mutationFn: (waitlistId: string) => reservationApi.notifyWaitlistCustomer(waitlistId),
    onSuccess: () => {
      toast.success('Customer notified successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to notify customer: ${error.message}`);
    },
  });
};

// Bulk Operations
export const useBulkUpdateReservationStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reservationIds, status }: { reservationIds: ReservationID[]; status: ReservationStatus }) =>
      reservationApi.bulkUpdateStatus(reservationIds, status),
    onSuccess: ({ success, failed }) => {
      // Invalidate all reservation queries since multiple reservations changed
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.all);
      
      if (success.length > 0) {
        toast.success(`${success.length} reservations updated successfully`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} reservations`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });
};

export const useBulkCancelReservations = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reservationIds, reason }: { reservationIds: ReservationID[]; reason?: string }) =>
      reservationApi.bulkCancel(reservationIds, reason),
    onSuccess: ({ success, failed }) => {
      queryClient.invalidateQueries(RESERVATION_QUERY_KEYS.all);
      
      if (success.length > 0) {
        toast.success(`${success.length} reservations cancelled`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to cancel ${failed.length} reservations`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk cancellation failed: ${error.message}`);
    },
  });
};