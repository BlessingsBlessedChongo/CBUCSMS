import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import { extractList, getApiErrorMessage } from '../lib/api-utils';
import type { Stock, StockCreatePayload, StockUpdateQuantityPayload } from '../types';
import { queryKeys } from './queryKeys';

export function useStocks() {
  return useQuery<Stock[]>({
    queryKey: queryKeys.stocks,
    queryFn: async () => {
      const response = await api.get('/stocks/');
      return extractList<Stock>(response.data);
    },
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockCreatePayload) => api.post('/stocks/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success('Stock item created successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create stock'));
    },
  });
}

export function useUpdateStockQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: StockUpdateQuantityPayload;
    }) => api.post(`/stocks/${id}/update_quantity/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stocks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      toast.success('Stock quantity updated');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update stock'));
    },
  });
}
