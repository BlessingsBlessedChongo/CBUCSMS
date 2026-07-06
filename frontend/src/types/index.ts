/**
 * CBUCSMS Frontend Type Definitions
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'PROCUREMENT' | 'CFO' | 'STOREKEEPER' | 'DEPARTMENT';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  department: string | null;
  wallet_address: string;
}

export interface UserAccount extends User {
  is_active: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
}

export interface UserUpdatePayload {
  role?: UserRole;
  is_active?: boolean;
  department?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

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
  cost_per_item?: number | string;
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

export type RequestStatus =
  | 'PENDING'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'PROCUREMENT_APPROVED'
  | 'PROCUREMENT_REJECTED'
  | 'CFO_APPROVED'
  | 'CFO_REJECTED'
  | 'FULFILLED'
  | 'CANCELLED';

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
  fulfilled_date?: string;
  fulfilled_by_username?: string;
  blockchain_tx_hash?: string;
  blockchain_tx_verified?: boolean;
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

export type BlockchainAction =
  | 'REQUEST_CREATED'
  | 'MANAGER_APPROVED'
  | 'PROCUREMENT_APPROVED'
  | 'CFO_APPROVED'
  | 'REQUEST_FINALIZED';

export interface BlockchainLog {
  id: number;
  stock_request: number;
  user: number | null;
  action: BlockchainAction;
  transaction_hash: string;
  block_number: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface BlockchainStatus {
  connected: boolean;
  chain_id: number | null;
  block_number: number | null;
  contract_loaded?: boolean;
  contract_address: string | null;
  account_address: string | null;
  account_balance: number | string | null;
}

export interface DashboardOverview {
  total_stocks: number;
  low_stock_count: number;
  out_of_stock_count?: number;
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests?: number;
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

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface RoleBasedProps {
  allowedRoles: UserRole[];
  userRole: UserRole | undefined;
}

export interface LoadingProps {
  isLoading: boolean;
  error?: Error | null;
}

export const CBU_LOGO_URL =
  'https://www.cbu.ac.zm/opus/assets/images/correct%20logo.png';

export const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'admin123', role: 'ADMIN' as UserRole },
  { label: 'Manager', username: 'manager', password: 'manager123', role: 'MANAGER' as UserRole },
  { label: 'Procurement', username: 'procurement', password: 'proc123', role: 'PROCUREMENT' as UserRole },
  { label: 'CFO', username: 'cfo', password: 'cfo123', role: 'CFO' as UserRole },
  { label: 'Storekeeper', username: 'storekeeper', password: 'store123', role: 'STOREKEEPER' as UserRole },
  { label: 'Department', username: 'dean_science', password: 'science123', role: 'DEPARTMENT' as UserRole },
];
