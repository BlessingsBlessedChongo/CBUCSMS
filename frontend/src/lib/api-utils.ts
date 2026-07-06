import type { AxiosError } from 'axios';
import type { ApiErrorResponse, PaginatedResponse } from '../types';

export function extractList<T>(data: unknown): T[] {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && 'results' in data) {
    return (data as PaginatedResponse<T>).results ?? [];
  }

  return [];
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const payload = axiosError.response?.data;

    if (payload?.detail) {
      return String(payload.detail);
    }

    if (payload?.error) {
      return String(payload.error);
    }

    if (payload?.message) {
      return String(payload.message);
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}
