import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import type { DashboardStats } from '../types';
import { queryKeys } from './queryKeys';

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/dashboard/stats/');
      return response.data;
    },
    refetchInterval: 30000,
  });
}
