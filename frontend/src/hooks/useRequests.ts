import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import { extractList, getApiErrorMessage } from '../lib/api-utils';
import type {
  StockRequest,
  StockRequestApprovalPayload,
  StockRequestCreatePayload,
  UserRole,
} from '../types';
import { queryKeys } from './queryKeys';

export function useRequests(role?: UserRole) {
  return useQuery<StockRequest[]>({
    queryKey: queryKeys.requests(role),
    queryFn: async () => {
      const response = await api.get('/requests/');
      return extractList<StockRequest>(response.data);
    },
  });
}

export function useMyRequests(username?: string) {
  return useQuery<StockRequest[]>({
    queryKey: queryKeys.myRequests(username),
    enabled: Boolean(username),
    queryFn: async () => {
      const response = await api.get('/requests/my_requests/');
      return extractList<StockRequest>(response.data);
    },
  });
}

export function useFulfillmentQueue() {
  return useQuery<StockRequest[]>({
    queryKey: queryKeys.fulfillmentQueue,
    queryFn: async () => {
      const response = await api.get('/requests/');
      return extractList<StockRequest>(response.data).filter(
        (request) => request.status === 'CFO_APPROVED' || request.status === 'FULFILLED',
      );
    },
  });
}

export function useRecentRequests(limit = 5) {
  return useQuery<StockRequest[]>({
    queryKey: queryKeys.recentRequests,
    queryFn: async () => {
      const response = await api.get('/requests/');
      return extractList<StockRequest>(response.data).slice(0, limit);
    },
    refetchInterval: 15000,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockRequestCreatePayload) => api.post('/requests/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.myRequests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success('Request created successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create request'));
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: number;
      payload: StockRequestApprovalPayload;
    }) => api.post(`/requests/${requestId}/approve/`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success(
        variables.payload.action === 'reject' ? 'Request rejected' : 'Request approved',
      );
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update request'));
    },
  });
}

export function useFulfillRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stockId, requestId }: { stockId: number; requestId: number }) =>
      api.post(`/stocks/${stockId}/mark_fulfilled/`, { request_id: requestId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.fulfillmentQueue });
      queryClient.invalidateQueries({ queryKey: queryKeys.requests() });
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success('Request fulfilled successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to fulfill request'));
    },
  });
}
