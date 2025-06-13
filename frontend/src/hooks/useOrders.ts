import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { orderApi } from '../services/api';
import {
  OrderID,
  OrderStatus,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters
} from '../types';

// Query Keys
export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDER_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: OrderFilters) => [...ORDER_QUERY_KEYS.lists(), filters] as const,
  details: () => [...ORDER_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.details(), id] as const,
  customer: (customerId: string) => [...ORDER_QUERY_KEYS.all, 'customer', customerId] as const,
  table: (tableId: string) => [...ORDER_QUERY_KEYS.all, 'table', tableId] as const,
  analytics: () => [...ORDER_QUERY_KEYS.all, 'analytics'] as const,
};

// Order Queries
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.list(filters),
    queryFn: () => orderApi.getOrders(filters),
    staleTime: 1 * 60 * 1000, // 1 minute - orders change frequently
    onError: (error: any) => {
      toast.error(`Failed to load orders: ${error.message}`);
    },
  });
};

export const useOrder = (id: OrderID) => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.detail(id.value),
    queryFn: () => orderApi.getOrder(id),
    enabled: !!id.value,
    staleTime: 30 * 1000, // 30 seconds - individual orders change very frequently
    onError: (error: any) => {
      toast.error(`Failed to load order: ${error.message}`);
    },
  });
};

export const useCustomerOrders = (customerId: string, filters?: Partial<OrderFilters>) => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.customer(customerId),
    queryFn: () => orderApi.getCustomerOrders(customerId, filters),
    enabled: !!customerId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error: any) => {
      toast.error(`Failed to load customer orders: ${error.message}`);
    },
  });
};

export const useTableOrders = (tableId: string, activeOnly: boolean = true) => {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.table(tableId),
    queryFn: () => orderApi.getTableOrders(tableId, activeOnly),
    enabled: !!tableId,
    staleTime: 30 * 1000, // 30 seconds - table orders change very frequently
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds for active table orders
    onError: (error: any) => {
      toast.error(`Failed to load table orders: ${error.message}`);
    },
  });
};

// Order Mutations
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => orderApi.createOrder(data),
    onSuccess: (newOrder) => {
      // Invalidate relevant order lists
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      // Add the new order to cache
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(newOrder.id.value), newOrder);
      
      // Invalidate table orders if it's a dine-in order
      if (newOrder.type === 'DINE_IN' && newOrder.tableID) {
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.table(newOrder.tableID));
      }
      
      // Invalidate customer orders
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.customer(newOrder.customerID));
      
      toast.success(`Order #${newOrder.id.value} created successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: OrderID; data: UpdateOrderRequest }) => 
      orderApi.updateOrder(id, data),
    onSuccess: (updatedOrder) => {
      // Update the specific order in cache
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      // Invalidate related data
      if (updatedOrder.type === 'DINE_IN' && updatedOrder.tableID) {
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.table(updatedOrder.tableID));
      }
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.customer(updatedOrder.customerID));
      
      toast.success(`Order #${updatedOrder.id.value} updated successfully!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });
};

// Order Status Management
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: OrderID; status: OrderStatus }) => 
      orderApi.updateOrderStatus(id, status),
    onSuccess: (updatedOrder) => {
      // Update the specific order in cache
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      
      // Invalidate lists to update status badges and counts
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      // Invalidate related data
      if (updatedOrder.type === 'DINE_IN' && updatedOrder.tableID) {
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.table(updatedOrder.tableID));
      }
      
      toast.success(`Order status updated to ${updatedOrder.status}`);
    },
    onError: (error: any) => {
      toast.error(`Failed to update order status: ${error.message}`);
    },
  });
};

export const usePayOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, paymentMethod }: { id: OrderID; paymentMethod?: string }) => 
      orderApi.payOrder(id, paymentMethod),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      toast.success(`Payment processed for Order #${updatedOrder.id.value}`);
    },
    onError: (error: any) => {
      toast.error(`Payment failed: ${error.message}`);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: OrderID; reason?: string }) => 
      orderApi.cancelOrder(id, reason),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      // Invalidate related data
      if (updatedOrder.type === 'DINE_IN' && updatedOrder.tableID) {
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.table(updatedOrder.tableID));
      }
      
      toast.success(`Order #${updatedOrder.id.value} cancelled`);
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });
};

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: OrderID) => orderApi.completeOrder(id),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      // Invalidate related data
      if (updatedOrder.type === 'DINE_IN' && updatedOrder.tableID) {
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.table(updatedOrder.tableID));
      }
      
      toast.success(`Order #${updatedOrder.id.value} completed!`);
    },
    onError: (error: any) => {
      toast.error(`Failed to complete order: ${error.message}`);
    },
  });
};

// Order Item Management
export const useAddOrderItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, item }: { id: OrderID; item: any }) => 
      orderApi.addOrderItem(id, item),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      toast.success('Item added to order successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to add item: ${error.message}`);
    },
  });
};

export const useUpdateOrderItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, itemId, item }: { id: OrderID; itemId: string; item: any }) => 
      orderApi.updateOrderItem(id, itemId, item),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      toast.success('Order item updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update item: ${error.message}`);
    },
  });
};

export const useRemoveOrderItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, itemId }: { id: OrderID; itemId: string }) => 
      orderApi.removeOrderItem(id, itemId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.detail(updatedOrder.id.value), updatedOrder);
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.lists());
      
      toast.success('Item removed from order successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove item: ${error.message}`);
    },
  });
};

// Order Analytics
export const useOrderAnalytics = (dateFrom?: string, dateTo?: string, groupBy?: 'day' | 'week' | 'month') => {
  return useQuery({
    queryKey: [...ORDER_QUERY_KEYS.analytics(), { dateFrom, dateTo, groupBy }],
    queryFn: () => orderApi.getOrderAnalytics(dateFrom, dateTo, groupBy),
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics don't change as frequently
    onError: (error: any) => {
      toast.error(`Failed to load order analytics: ${error.message}`);
    },
  });
};

// Bulk Operations
export const useBulkUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderIds, status }: { orderIds: OrderID[]; status: OrderStatus }) => 
      orderApi.bulkUpdateOrderStatus(orderIds, status),
    onSuccess: ({ success, failed }) => {
      // Invalidate all order-related queries since multiple orders changed
      queryClient.invalidateQueries(ORDER_QUERY_KEYS.all);
      
      if (success.length > 0) {
        toast.success(`${success.length} orders updated successfully`);
      }
      if (failed.length > 0) {
        toast.error(`Failed to update ${failed.length} orders`);
      }
    },
    onError: (error: any) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });
};