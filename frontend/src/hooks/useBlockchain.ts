import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { extractList } from '../lib/api-utils';
import type { BlockchainLog, BlockchainStatus } from '../types';
import { queryKeys } from './queryKeys';

const EMPTY_STATUS: BlockchainStatus = {
  connected: false,
  chain_id: null,
  block_number: null,
  contract_address: null,
  account_address: null,
  account_balance: null,
};

export function useBlockchainLogs() {
  return useQuery<BlockchainLog[]>({
    queryKey: queryKeys.blockchainLogs,
    queryFn: async () => {
      const response = await api.get('/blockchain/logs/');
      return extractList<BlockchainLog>(response.data);
    },
    refetchInterval: 30000,
  });
}

export function useBlockchainStatus() {
  return useQuery<BlockchainStatus>({
    queryKey: queryKeys.blockchainStatus,
    queryFn: async () => {
      const response = await api.get<BlockchainStatus>('/blockchain/verify/');
      return response.data ?? EMPTY_STATUS;
    },
    refetchInterval: 30000,
  });
}
