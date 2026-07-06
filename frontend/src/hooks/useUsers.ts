import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import { extractList, getApiErrorMessage } from '../lib/api-utils';
import type { UserAccount, UserCreatePayload, UserRole, UserUpdatePayload } from '../types';
import { queryKeys } from './queryKeys';

export function useUsers() {
  return useQuery<UserAccount[]>({
    queryKey: queryKeys.users,
    queryFn: async () => {
      const response = await api.get('/users/');
      return extractList<UserAccount>(response.data);
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserCreatePayload) => api.post('/users/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create user'));
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      api.patch(`/users/${id}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update user'));
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => api.delete(`/users/${userId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete user'));
    },
  });
}

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'PROCUREMENT', label: 'Procurement' },
  { value: 'CFO', label: 'CFO' },
  { value: 'STOREKEEPER', label: 'Storekeeper' },
  { value: 'DEPARTMENT', label: 'Department' },
];
