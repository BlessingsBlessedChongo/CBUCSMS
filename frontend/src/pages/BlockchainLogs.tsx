import { useState } from 'react';
import Layout from '../components/Layout';
import { useBlockchainLogs, useBlockchainStatus } from '../hooks';
import { EmptyState, TableSkeleton } from '../components/ui/LoadingState';
import { Link45deg, Check2Circle, Copy } from 'react-bootstrap-icons';
import { toast } from 'sonner';

export default function BlockchainLogs() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs = [], isLoading } = useBlockchainLogs();
  const { data: status } = useBlockchainStatus();

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
      String(log.stock_request).includes(searchTerm),
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
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-bold">Blockchain Audit Trail</h1>
          <p className="text-muted small mb-0">Immutable transaction history</p>
        </div>

        <div className="card border-0 shadow-sm mb-4 bg-light">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-auto">
                <div
                  className={`rounded-circle me-3 ${status?.connected ? 'bg-success' : 'bg-danger'}`}
                  style={{ width: '12px', height: '12px' }}
                />
              </div>
              <div className="col">
                <p className="mb-1 small">
                  <strong>Blockchain Network</strong>{' '}
                  {status?.connected ? 'Connected' : 'Disconnected'}
                </p>
                <small className="text-muted">
                  Contract:{' '}
                  {status?.contract_address ? truncateHash(status.contract_address) : '—'} • Block #
                  {status?.block_number ?? '—'} • {logs.length} recorded{' '}
                  {logs.length === 1 ? 'transaction' : 'transactions'}
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <Link45deg size={18} className="text-muted" />
            </span>
            <input
              type="search"
              className="form-control border-start-0"
              placeholder="Search by transaction hash or request ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search blockchain logs"
            />
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : filteredLogs.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-semibold">Request ID</th>
                    <th className="text-muted small fw-semibold">Action</th>
                    <th className="text-muted small fw-semibold">Transaction Hash</th>
                    <th className="text-muted small fw-semibold">Block #</th>
                    <th className="text-muted small fw-semibold">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="small fw-semibold">#{log.stock_request}</td>
                      <td className="small">
                        <span className={`badge ${actionBadgeClass[log.action] || 'bg-secondary'}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="small">
                        <code>{truncateHash(log.transaction_hash)}</code>
                        <button
                          type="button"
                          className="btn btn-link btn-sm ms-2 p-0"
                          onClick={() => copyToClipboard(log.transaction_hash)}
                          title="Copy full hash"
                          aria-label="Copy transaction hash"
                        >
                          <Copy size={14} />
                        </button>
                      </td>
                      <td className="small text-muted">
                        {log.block_number ? `#${log.block_number}` : '—'}
                      </td>
                      <td className="small text-muted">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState
                icon={<Check2Circle size={32} />}
                title={
                  searchTerm
                    ? 'No transactions match your search'
                    : 'No blockchain transactions recorded yet'
                }
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
