import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import {
  useApproveRequest,
  useCreateRequest,
  useRequests,
  useStocks,
} from '../hooks';
import type { RequestPriority, RequestStatus, StockRequest } from '../types';
import { ClipboardCheck, Plus, HandThumbsUp, XCircle } from 'react-bootstrap-icons';
import { EmptyState, TableSkeleton } from '../components/ui/LoadingState';
import { toast } from 'sonner';

const priorityColors: Record<RequestPriority, string> = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const statusBadgeClass: Partial<Record<RequestStatus, string>> = {
  PENDING: 'badge bg-warning text-dark',
  MANAGER_APPROVED: 'badge bg-info text-white',
  MANAGER_REJECTED: 'badge bg-danger text-white',
  PROCUREMENT_APPROVED: 'badge bg-primary text-white',
  PROCUREMENT_REJECTED: 'badge bg-danger text-white',
  CFO_APPROVED: 'badge bg-success text-white',
  CFO_REJECTED: 'badge bg-danger text-white',
  FULFILLED: 'badge bg-secondary text-white',
  CANCELLED: 'badge bg-dark text-white',
};

const getStatusBadgeClass = (status: RequestStatus): string =>
  statusBadgeClass[status] ?? 'badge bg-light text-dark';

const emptyRequestForm = {
  stock: 0,
  quantity_requested: 1,
  priority: 'MEDIUM' as RequestPriority,
  reason: '',
};

export default function Requests() {
  const { user } = useAuth();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newRequest, setNewRequest] = useState(emptyRequestForm);

  const canCreate = user?.role === 'DEPARTMENT' || user?.role === 'ADMIN';

  const { data: requests = [], isLoading, isError } = useRequests(user?.role);
  const { data: stocks = [] } = useStocks();
  const createMutation = useCreateRequest();
  const approveMutation = useApproveRequest();

  // Open create modal if navigated from dashboard with state
  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;
    if (state?.openCreateModal) {
      setShowCreateModal(true);
      // Clear the state so the modal doesn't reopen on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleCreateRequest = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newRequest.stock) {
      toast.error('Please select a stock item');
      return;
    }
    if (newRequest.quantity_requested <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    const selectedStock = stocks.find((stock) => stock.id === newRequest.stock);
    if (selectedStock && newRequest.quantity_requested > selectedStock.current_quantity) {
      toast.error(`Only ${selectedStock.current_quantity} units available`);
      return;
    }

    createMutation.mutate(newRequest, {
      onSuccess: () => {
        setShowCreateModal(false);
        setNewRequest(emptyRequestForm);
      },
    });
  };

  const canApprove = (request: StockRequest): boolean => {
    if (user?.role === 'MANAGER' && request.status === 'PENDING') return true;
    if (user?.role === 'PROCUREMENT' && request.status === 'MANAGER_APPROVED') return true;
    if (user?.role === 'CFO' && request.status === 'PROCUREMENT_APPROVED') return true;
    return false;
  };

  const handleApprove = (request: StockRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const submitApproval = () => {
    if (!selectedRequest) return;
    if (approvalAction === 'reject' && !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    approveMutation.mutate(
      {
        requestId: selectedRequest.id,
        payload: {
          action: approvalAction,
          rejection_reason: approvalAction === 'reject' ? rejectionReason.trim() : undefined,
        },
      },
      {
        onSuccess: () => {
          setShowApprovalModal(false);
          setSelectedRequest(null);
          setRejectionReason('');
          setApprovalAction('approve');
        },
      },
    );
  };

  const filteredRequests = requests.filter((request) => {
    if (user?.role === 'DEPARTMENT') {
      return request.requested_by_username === user.username;
    }
    if (user?.role === 'STOREKEEPER') {
      return request.status === 'CFO_APPROVED' || request.status === 'FULFILLED';
    }
    return true;
  });

  return (
    <Layout>
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-bold">Stock Requests</h1>
            <p className="text-muted small mb-0">View and manage stock request approvals</p>
          </div>
          {canCreate && (
            <button
              type="button"
              className="btn btn-cbu text-white"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} className="me-2" />
              New Request
            </button>
          )}
        </div>

        {isError && (
          <div className="alert alert-danger" role="alert">
            Failed to load requests. Please try again.
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <TableSkeleton rows={6} columns={8} />
            ) : filteredRequests.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-semibold">ID</th>
                    <th className="text-muted small fw-semibold">Item</th>
                    <th className="text-muted small fw-semibold">Qty</th>
                    <th className="text-muted small fw-semibold">Priority</th>
                    <th className="text-muted small fw-semibold">Status</th>
                    <th className="text-muted small fw-semibold">Requested By</th>
                    <th className="text-muted small fw-semibold">Date</th>
                    <th className="text-muted small fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="small fw-semibold">#{request.id}</td>
                      <td className="small">{request.stock_name || '—'}</td>
                      <td className="small">{request.quantity_requested}</td>
                      <td>
                        <span className={`badge bg-${priorityColors[request.priority]}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="small text-muted">{request.requested_by_username || '—'}</td>
                      <td className="small text-muted">
                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="small">
                        {canApprove(request) && (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-success me-2"
                              onClick={() => handleApprove(request, 'approve')}
                              disabled={approveMutation.isPending}
                            >
                              <HandThumbsUp size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleApprove(request, 'reject')}
                              disabled={approveMutation.isPending}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState icon={<ClipboardCheck size={32} />} title="No requests found" />
            )}
          </div>
        </div>

        <div
          className={`modal ${showCreateModal ? 'd-block' : ''}`}
          style={{ display: showCreateModal ? 'block' : 'none' }}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-semibold">Create Stock Request</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                  aria-label="Close"
                />
              </div>
              <form onSubmit={handleCreateRequest}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="stock" className="form-label small fw-semibold">
                      Stock Item *
                    </label>
                    <select
                      id="stock"
                      className="form-select"
                      value={newRequest.stock}
                      onChange={(event) =>
                        setNewRequest({ ...newRequest, stock: Number(event.target.value) })
                      }
                      required
                    >
                      <option value={0}>Select an item...</option>
                      {stocks.map((stock) => (
                        <option key={stock.id} value={stock.id}>
                          {stock.name} ({stock.current_quantity} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="qty" className="form-label small fw-semibold">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="qty"
                      className="form-control"
                      value={newRequest.quantity_requested}
                      onChange={(event) =>
                        setNewRequest({
                          ...newRequest,
                          quantity_requested: Number(event.target.value),
                        })
                      }
                      min={1}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="priority" className="form-label small fw-semibold">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="form-select"
                      value={newRequest.priority}
                      onChange={(event) =>
                        setNewRequest({
                          ...newRequest,
                          priority: event.target.value as RequestPriority,
                        })
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label small fw-semibold">
                      Reason (optional)
                    </label>
                    <textarea
                      id="reason"
                      className="form-control"
                      rows={3}
                      value={newRequest.reason}
                      onChange={(event) =>
                        setNewRequest({ ...newRequest, reason: event.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-cbu text-white"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {showApprovalModal && selectedRequest && (
          <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-0 bg-light">
                  <h5 className="modal-title fw-semibold">
                    {approvalAction === 'reject' ? 'Reject Request' : 'Approve Request'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowApprovalModal(false)}
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">Request #{selectedRequest.id}</p>
                  <p className="mb-3">
                    <strong>{selectedRequest.stock_name}</strong> -{' '}
                    {selectedRequest.quantity_requested} units
                  </p>
                  {approvalAction === 'reject' ? (
                    <div className="mb-3">
                      <label htmlFor="rejectReason" className="form-label small fw-semibold">
                        Rejection Reason *
                      </label>
                      <textarea
                        id="rejectReason"
                        className="form-control"
                        rows={3}
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        required
                      />
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">
                      This will advance the request to the next approval stage. Are you sure?
                    </p>
                  )}
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowApprovalModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${approvalAction === 'reject' ? 'btn-danger' : 'btn-success'}`}
                    onClick={submitApproval}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending
                      ? 'Processing...'
                      : approvalAction === 'reject'
                        ? 'Confirm Reject'
                        : 'Confirm Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(showCreateModal || showApprovalModal) && (
          <div
            className="modal-backdrop fade show"
            onClick={() => {
              setShowCreateModal(false);
              setShowApprovalModal(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
}