import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Layout from '../components/Layout';
import { BlockchainLog } from '../types';
import { Link45deg, Check2Circle, Clock, Copy } from 'react-bootstrap-icons';
import { toast } from 'sonner';

export default function BlockchainLogs() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading } = useQuery<BlockchainLog[]>({
    queryKey: ['blockchain-logs'],
    queryFn: async () => {
      const res = await api.get('/blockchain/logs/');
      return res.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: status = {} } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: async () => {
      const res = await api.get('/blockchain/verify/');
      return res.data || {};
    },
  });

  const actionBadgeClass: Record<string, string> = {
    REQUEST_CREATED: 'bg-primary',
    MANAGER_APPROVED: 'bg-success',
    PROCUREMENT_APPROVED: 'bg-info',
    CFO_APPROVED: 'bg-teal',
    REQUEST_FINALIZED: 'bg-indigo',
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.transaction_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.request_id).includes(searchTerm)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const truncateHash = (hash: string): string => {
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-700">Blockchain Audit Trail</h1>
          <p className="text-muted small mb-0">Immutable transaction history</p>
        </div>

        {/* Network Status Card */}
        <div className="card border-0 shadow-sm mb-4 bg-light">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-auto">
                <div
                  className="rounded-circle bg-success me-3"
                  style={{ width: '12px', height: '12px' }}
                />
              </div>
              <div className="col">
                <p className="mb-1 small">
                  <strong>Blockchain Network</strong> {status.is_connected ? 'Connected' : 'Disconnected'}
                </p>
                <small className="text-muted">
                  Contract: {status.contract_address ? truncateHash(status.contract_address) : '—'} • Block #{status.current_block || '—'} •{' '}
                  {status.total_requests_on_chain || 0} on-chain requests
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Link45deg size={18} className="text-muted" />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by transaction hash or request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredLogs.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-600">Request ID</th>
                    <th className="text-muted small fw-600">Action</th>
                    <th className="text-muted small fw-600">Transaction Hash</th>
                    <th className="text-muted small fw-600">Block #</th>
                    <th className="text-muted small fw-600">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="small fw-600">#{log.request_id}</td>
                      <td className="small">
                        <span className={`badge ${actionBadgeClass[log.action] || 'bg-secondary'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="small">
                        <code>{truncateHash(log.transaction_hash)}</code>
                        <button
                          className="btn btn-link btn-sm ms-2 p-0"
                          onClick={() => copyToClipboard(log.transaction_hash)}
                          title="Copy full hash"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                      <td className="small text-muted">
                        {log.block_number ? `#${log.block_number}` : '—'}
                      </td>
                      <td className="small text-muted">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center">
                <Check2Circle size={32} className="text-muted mb-3" />
                <p className="text-muted">
                  {searchTerm ? 'No transactions match your search' : 'No blockchain transactions recorded yet'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface BlockchainLog {
  id: number;
  stock_request: number;
  action: string;
  transaction_hash: string;
  block_number: number;
  created_at: string;
  user: number;
  user_username?: string;
}

interface BlockchainInfo {
  connected: boolean;
  chain_id: number;
  block_number: number;
  contract_loaded: boolean;
  contract_address: string;
  account_address: string;
  account_balance: number;
}

export default function BlockchainLogs() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: logs = [], isLoading: logsLoading } = useQuery<BlockchainLog[]>({
    queryKey: ['blockchain-logs'],
    queryFn: async () => {
      const response = await api.get('/blockchain/logs/');
      return response.data;
    },
    refetchInterval: 10000,
  });

  const { data: info, isLoading: infoLoading } = useQuery<BlockchainInfo>({
    queryKey: ['blockchain-info'],
    queryFn: async () => {
      const response = await api.get('/blockchain/verify/');
      return response.data;
    },
    refetchInterval: 5000,
  });

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text || '')
      toast.success('Transaction hash copied')
    } catch {
      toast.error('Copy failed')
    }
  }

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; color: string; icon: LucideIcon }> = {
      REQUEST_CREATED: { label: 'Request Created', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
      MANAGER_APPROVED: { label: 'Manager Approved', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      PROCUREMENT_APPROVED: { label: 'Procurement Approved', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: CheckCircle },
      CFO_APPROVED: { label: 'CFO Approved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle },
      REQUEST_FINALIZED: { label: 'Finalized', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: CheckCircle },
    }
    const config = actionMap[action] || { label: action, color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Activity }
    const Icon = config.icon
    return (
      <Badge className={`flex items-center gap-1 border ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return '—';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const filteredLogs = logs.filter(log =>
    log.transaction_hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(log.stock_request).includes(searchTerm) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLoading = logsLoading || infoLoading;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span className="text-uppercase small text-muted">Immutable Audit Trail</span>
            </div>
            <h1 className="h2 mb-1">Blockchain Explorer</h1>
            <p className="text-muted mb-0">Transactions, hashes, and network status for audit review.</p>
          </div>
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2">
            <Badge className={`px-3 py-1 rounded-pill ${info?.connected ? 'bg-success text-white' : 'bg-danger text-white'}`}>
              <Activity className="w-4 h-4 me-1" />
              {info?.connected ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge className="px-3 py-1 rounded-pill bg-info text-white">
              <Box className="w-4 h-4 me-1" />
              Block #{info?.block_number || '—'}
            </Badge>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <p className="small text-muted mb-0">Network Status</p>
                  <div className={`rounded-circle ${info?.connected ? 'bg-success' : 'bg-danger'}`} style={{ width: 10, height: 10 }} />
                </div>
                <h3 className="h4 mb-1">{info?.connected ? 'Online' : 'Offline'}</h3>
                <p className="small text-muted mb-0">Chain ID: {info?.chain_id || '—'}</p>
              </CardContent>
            </Card>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-primary" />
                  <p className="small text-muted mb-0">Contract Address</p>
                </div>
                <p className="text-monospace small text-dark mb-2">{formatAddress(info?.contract_address || '')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => info?.contract_address && copyToClipboard(info.contract_address)}
                >
                  <Copy className="w-4 h-4 me-1" />
                  Copy address
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-purple" />
                  <p className="small text-muted mb-0">Signing Account</p>
                </div>
                <p className="text-monospace small text-dark mb-2">{formatAddress(info?.account_address || '')}</p>
                <p className="small text-muted mb-0">Balance: {info?.account_balance ? Number(info.account_balance).toFixed(4) : '0'} ETH</p>
              </CardContent>
            </Card>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Card className="bg-white border border-slate-200 shadow-sm">
              <CardContent className="p-4">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-warning" />
                  <p className="small text-muted mb-0">Total Transactions</p>
                </div>
                <h3 className="h4 mb-1">{logs.length}</h3>
                <p className="small text-muted mb-0">Immutable records</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardHeader className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-2">
              <LinkIcon className="w-5 h-5 text-cyan-600" />
              <CardTitle className="mb-0">Transaction History</CardTitle>
            </div>
            <div className="position-relative w-100 w-sm-50">
              <Search className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
              <Input
                placeholder="Search by hash or request ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ps-5"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead className="text-end">Block #</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-end">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-5 text-muted">
                        <Database className="w-10 h-10 mx-auto mb-3 text-muted" />
                        No blockchain transactions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover-bg-white/10">
                        <TableCell>
                          <span className="badge bg-light text-dark">#{log.stock_request}</span>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <div className="d-flex align-items-center gap-2">
                            <code className="text-muted small">{log.transaction_hash.slice(0, 10)}...{log.transaction_hash.slice(-8)}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0"
                              onClick={() => copyToClipboard(log.transaction_hash)}
                            >
                              <Copy className="w-4 h-4 text-muted" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-end">
                          <Badge variant="outline" className="border border-cyan-300 text-cyan-700">
                            {log.block_number}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="d-flex align-items-center gap-1 text-muted small">
                            <Clock className="w-3 h-3" />
                            {formatDate(log.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted"
                            onClick={() => window.open(`https://etherscan.io/tx/${log.transaction_hash}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="d-flex align-items-start gap-3">
              <Shield className="w-5 h-5 text-warning mt-1" />
              <p className="mb-0 text-muted small">
                <strong>Blockchain Security:</strong> All approval transactions are permanently recorded and cryptographically verified. This creates an immutable audit trail that cannot be altered or deleted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}