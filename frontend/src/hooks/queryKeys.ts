export const queryKeys = {
  stocks: ['stocks'] as const,
  categories: ['categories'] as const,
  requests: (role?: string) => ['requests', role] as const,
  myRequests: (username?: string) => ['my-requests', username] as const,
  fulfillmentQueue: ['fulfillment-queue'] as const,
  dashboardStats: ['dashboard-stats'] as const,
  recentRequests: ['recent-requests'] as const,
  users: ['users'] as const,
  blockchainLogs: ['blockchain-logs'] as const,
  blockchainStatus: ['blockchain-status'] as const,
};
