import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { extractList } from '../lib/api-utils';
import type { Category } from '../types';
import { queryKeys } from './queryKeys';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const response = await api.get('/categories/');
      return extractList<Category>(response.data);
    },
  });
}
