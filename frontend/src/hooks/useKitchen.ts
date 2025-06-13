import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { kitchenApi } from '../services/api';
import {
  KitchenOrderID,
  KitchenOrderStatus,
  KitchenPriority,
  KitchenOrderFilters,
  CreateKitchenOrderRequest,
  UpdateKitchenOrderRequest,
  UpdateKitchenItemRequest
} from '../types';

// Query Keys
export const KITCHEN_QUERY_KEYS = {
  all: ['kitchen'] as const,
  orders: () => [...KITCHEN_QUERY_KEYS.all, 'orders'] as const,
  ordersList: (filters?: KitchenOrderFilters) => [...KITCHEN_QUERY_KEYS.orders(), 'list', filters] as const,
  orderDetail: (id: string) => [...KITCHEN_QUERY_KEYS.orders(), 'detail', id] as const,
  queue: (station?: string) => [...KITCHEN_QUERY_KEYS.all, 'queue', station] as const,
  metrics: (dateFrom?: string, dateTo?: string) => [...KITCHEN_QUERY_KEYS.all, 'metrics', { dateFrom, dateTo }] as const,
  stations: () => [...KITCHEN_QUERY_KEYS.all, 'stations'] as const,
  stationMetrics: (station?: string, dateFrom?: string, dateTo?: string) => 
    [...KITCHEN_QUERY_KEYS.stations(), 'metrics', { station, dateFrom, dateTo }] as const,
};

// Kitchen Order Queries
export const useKitchenOrders = (filters?: KitchenOrderFilters) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.ordersList(filters),
    queryFn: () => kitchenApi.getKitchenOrders(filters),
    staleTime: 30 * 1000, // 30 seconds - kitchen data changes very frequently
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for real-time updates
    onError: (error: any) => {
      toast.error(`Failed to load kitchen orders: ${error.message}`);
    },
  });
};

export const useKitchenOrder = (id: KitchenOrderID) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.orderDetail(id.value),
    queryFn: () => kitchenApi.getKitchenOrder(id),
    enabled: !!id.value,
    staleTime: 15 * 1000, // 15 seconds - individual kitchen orders change very frequently
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds
    onError: (error: any) => {
      toast.error(`Failed to load kitchen order: ${error.message}`);
    },
  });
};

// Kitchen Queue Management
export const useKitchenQueue = (station?: string) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.queue(station),
    queryFn: () => kitchenApi.getKitchenQueue(station),
    staleTime: 15 * 1000, // 15 seconds
    refetchInterval: 15 * 1000, // Auto-refresh every 15 seconds for real-time queue updates
    onError: (error: any) => {
      toast.error(`Failed to load kitchen queue: ${error.message}`);
    },
  });
};

// Kitchen Metrics
export const useKitchenMetrics = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.metrics(dateFrom, dateTo),
    queryFn: () => kitchenApi.getKitchenMetrics(dateFrom, dateTo),
    staleTime: 2 * 60 * 1000, // 2 minutes - metrics don't change as frequently
    onError: (error: any) => {
      toast.error(`Failed to load kitchen metrics: ${error.message}`);
    },
  });
};

// Station Management
export const useStations = () => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.stations(),
    queryFn: kitchenApi.getStations,
    staleTime: 10 * 60 * 1000, // 10 minutes - stations rarely change
    onError: (error: any) => {
      toast.error(`Failed to load stations: ${error.message}`);
    },
  });
};

export const useStationMetrics = (station?: string, dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: KITCHEN_QUERY_KEYS.stationMetrics(station, dateFrom, dateTo),
    queryFn: () => kitchenApi.getStationMetrics(station, dateFrom, dateTo),
    enabled: !!station,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      toast.error(`Failed to load station metrics: ${error.message}`);
    },
  });
};

// Kitchen Order Mutations
export const useCreateKitchenOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateKitchenOrderRequest) => kitchenApi.createKitchenOrder(data),
    onSuccess: (newOrder) => {
      // Invalidate all kitchen order queries
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      // Add to cache
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(newOrder.id.value), newOrder);
      
      toast.success(`Kitchen order created for Order #${newOrder.orderID}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create kitchen order: ${error.message}`);
    },
  });
};

export const useUpdateKitchenOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: KitchenOrderID; data: UpdateKitchenOrderRequest }) =>
      kitchenApi.updateKitchenOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Update cache
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      
      // Invalidate lists
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success('Kitchen order updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update kitchen order: ${error.message}`);
    },
  });
};

// Kitchen Order Status Management
export const useUpdateKitchenOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: KitchenOrderID; status: KitchenOrderStatus }) =>
      kitchenApi.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      // Update cache
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      
      // Invalidate related queries
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.metrics());
      
      toast.success(`Order status updated to ${updatedOrder.status}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
};

export const useStartOrderPreparation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: KitchenOrderID) => kitchenApi.startOrderPreparation(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success(`Started preparing Order #${updatedOrder.orderID}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to start preparation: ${error.message}`);
    },
  });
};

export const useMarkOrderReady = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: KitchenOrderID) => kitchenApi.markOrderReady(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success(`Order #${updatedOrder.orderID} is ready!`, {
        duration: 6000,
        style: {
          background: '#10B981',
        },
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to mark order ready: ${error.message}`);
    },
  });
};

export const useCompleteKitchenOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: KitchenOrderID) => kitchenApi.completeKitchenOrder(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.metrics());
      
      toast.success(`Order #${updatedOrder.orderID} completed!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to complete order: ${error.message}`);
    },
  });
};

export const useCancelKitchenOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: KitchenOrderID; reason?: string }) =>
      kitchenApi.cancelKitchenOrder(id, reason),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success(`Order #${updatedOrder.orderID} cancelled`);
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
};

// Station Assignment
export const useAssignStation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, station }: { id: KitchenOrderID; station: string }) =>
      kitchenApi.assignStation(id, station),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success(`Assigned to ${updatedOrder.assignedStation} station`);
    },
    onError: (error: any) => {
      toast.error(`Failed to assign station: ${error.message}`);
    },
  });
};

export const useUnassignStation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: KitchenOrderID) => kitchenApi.unassignStation(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success('Station assignment removed');
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign station: ${error.message}`);
    },
  });
};

// Priority Management
export const useUpdatePriority = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, priority }: { id: KitchenOrderID; priority: KitchenPriority }) =>
      kitchenApi.updatePriority(id, priority),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      
      toast.success(`Priority updated to ${updatedOrder.priority}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update priority: ${error.message}`);
    },
  });
};

// Kitchen Item Management
export const useUpdateKitchenItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      itemId, 
      data 
    }: { 
      orderId: KitchenOrderID; 
      itemId: string; 
      data: UpdateKitchenItemRequest 
    }) => kitchenApi.updateKitchenItem(orderId, itemId, data),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      
      toast.success('Kitchen item updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
};

export const useStartItemPreparation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: KitchenOrderID; itemId: string }) =>
      kitchenApi.startItemPreparation(orderId, itemId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      
      toast.success('Item preparation started');
    },
    onError: (error: any) => {
      toast.error(`Failed to start item preparation: ${error.message}`);
    },
  });
};

export const useCompleteItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: KitchenOrderID; itemId: string }) =>
      kitchenApi.completeItem(orderId, itemId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(KITCHEN_QUERY_KEYS.orderDetail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      
      toast.success('Item completed!');
    },
    onError: (error: any) => {
      toast.error(`Failed to complete item: ${error.message}`);
    },
  });
};

// Queue Management
export const useReorderQueue = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderIds: KitchenOrderID[]) => kitchenApi.reorderQueue(orderIds),
    onSuccess: () => {
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.queue());
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.orders());
      
      toast.success('Queue reordered successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to reorder queue: ${error.message}`);
    },
  });
};

// Bulk Operations
export const useBulkUpdateKitchenStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: KitchenOrderID[]; status: KitchenOrderStatus }) =>
      kitchenApi.bulkUpdateStatus(orderIds, status),
    onSuccess: ({ success, failed }) => {
      // Invalidate all kitchen queries since multiple orders changed
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.all);
      
      if (success.length > 0) {
        toast.success(`${success.length} kitchen orders updated successfully`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} kitchen orders`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });
};

export const useBulkAssignStation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderIds, station }: { orderIds: KitchenOrderID[]; station: string }) =>
      kitchenApi.bulkAssignStation(orderIds, station),
    onSuccess: ({ success, failed }, { station }) => {
      queryClient.invalidateQueries(KITCHEN_QUERY_KEYS.all);
      
      if (success.length > 0) {
        toast.success(`${success.length} orders assigned to ${station} station`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to assign ${failed.length} orders`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk station assignment failed: ${error.message}`);
    },
  });
};