/**
 * CBUCSMS Frontend Type Definitions
 * Complete TypeScript interfaces for all API responses and component props
 */

// ============ AUTH & USER ============

export type UserRole = 'ADMIN' | 'MANAGER' | 'PROCUREMENT' | 'CFO' | 'STOREKEEPER' | 'DEPARTMENT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  department: string | null;
  wallet_address: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

// ============ INVENTORY (STOCK) ============

export type StockStatus = 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DAMAGED';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Stock {
  id: number;
  name: string;
  description?: string;
  category: number;
  category_name?: string;
  original_quantity: number;
  current_quantity: number;
  min_threshold: number;
  location?: string;
  cost_per_item?: string | number;
  status: StockStatus;
  created_at?: string;
  updated_at?: string;
  created_by_username?: string;
}

export interface StockCreatePayload {
  name: string;
  description?: string;
  category: number;
  original_quantity: number;
  current_quantity: number;
  min_threshold: number;
  location?: string;
  cost_per_item?: number | string;
}

export interface StockUpdateQuantityPayload {
  quantity: number;
  reason?: string;
}

// ============ REQUESTS & APPROVALS ============

export type RequestStatus =
  | 'PENDING'
  | 'MANAGER_APPROVED'
  | 'PROCUREMENT_APPROVED'
  | 'CFO_APPROVED'
  | 'FULFILLED'
  | 'REJECTED';

export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface StockRequest {
  id: number;
  stock: number;
  stock_name?: string;
  requested_by: number;
  requested_by_username?: string;
  quantity_requested: number;
  priority: RequestPriority;
  status: RequestStatus;
  reason: string;
  department?: string;
  
  // Approval fields (read-only from backend)
  manager_approval_date?: string;
  manager_approval_reason?: string;
  procurement_approval_date?: string;
  procurement_approval_reason?: string;
  cfo_approval_date?: string;
  cfo_approval_reason?: string;
  rejection_date?: string;
  rejection_reason?: string;
  rejected_by?: string;
  rejection_stage?: string;
  
  // Fulfillment
  fulfilled_date?: string;
  fulfilled_by_username?: string;
  
  // Blockchain
  blockchain_tx_hash?: string;
  blockchain_tx_verified?: boolean;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
}

export interface StockRequestCreatePayload {
  stock: number;
  quantity_requested: number;
  priority: RequestPriority;
  reason: string;
}

export interface StockRequestApprovalPayload {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

// ============ BLOCKCHAIN ============

export type BlockchainAction =
  | 'REQUEST_CREATED'
  | 'MANAGER_APPROVED'
  | 'PROCUREMENT_APPROVED'
  | 'CFO_APPROVED'
  | 'REQUEST_FINALIZED';

export interface BlockchainLog {
  id: number;
  request_id: number;
  action: BlockchainAction;
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
}

export interface BlockchainStatus {
  connected: boolean;
  contract_address: string;
  current_block: number;
  total_requests_on_chain: number;
  wallet_address?: string;
}

// ============ DASHBOARD ============

export interface DashboardOverview {
  total_stocks: number;
  low_stock_count: number;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  pending_for_user: number;
  blockchain_logs_count: number;
  latest_block: number;
}

export interface ChartDataPoint {
  name: string;
  count?: number;
  requests?: number;
  request_count?: number;
  [key: string]: string | number | undefined;
}

export interface DashboardCharts {
  category_distribution: ChartDataPoint[];
  monthly_trends: ChartDataPoint[];
  top_requested_items: ChartDataPoint[];
}

export interface DashboardStats {
  overview: DashboardOverview;
  charts: DashboardCharts;
}

// ============ PAGINATED RESPONSES ============

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============ ERROR HANDLING ============

export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

// ============ COMPONENT PROPS ============

export interface RoleBasedProps {
  allowedRoles: UserRole[];
  userRole: UserRole | undefined;
}

export interface LoadingProps {
  isLoading: boolean;
  error?: Error | null;
}
