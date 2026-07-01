import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { StockRequest, Stock, RequestPriority, RequestStatus } from '../types';
import { ClipboardCheck, Plus, HandThumbsUp, XCircle } from 'react-bootstrap-icons';  // ✅ ThumbsUp → HandThumbsUp
import { toast } from 'sonner';

const priorityColors: Record<RequestPriority, string> = {
  LOW: 'secondary',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const statusBadgeClass: Record<RequestStatus, string> = {
  PENDING: 'badge bg-warning text-dark',
  MANAGER_APPROVED: 'badge bg-info text-white',
  PROCUREMENT_APPROVED: 'badge bg-warning text-dark',
  CFO_APPROVED: 'badge bg-success text-white',
  FULFILLED: 'badge bg-success text-white',
  REJECTED: 'badge bg-danger text-white',
};

export default function Requests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [newRequest, setNewRequest] = useState({ stock: 0, quantity_requested: 1, priority: 'MEDIUM' as RequestPriority, reason: '' });

  const canCreate = user?.role === 'DEPARTMENT' || user?.role === 'ADMIN';

  // Fetch requests based on role
  const { data: requests = [], isLoading } = useQuery<StockRequest[]>({
    queryKey: ['requests', user?.role],
    queryFn: async () => {
      const res = await api.get('/requests/');
      return res.data || [];
    },
  });

  const { data: stocks = [] } = useQuery<Stock[]>({
    queryKey: ['stocks'],
    queryFn: async () => {
      const res = await api.get('/stocks/');
      return res.data || [];
    },
  });

  // Create request mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/requests/', payload),
    onSuccess: () => {
      setShowCreateModal(false);
      setNewRequest({ stock: 0, quantity_requested: 1, priority: 'MEDIUM', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Request created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to create request');
    },
  });

  // Approval/Rejection mutation
  const approveMutation = useMutation({
    mutationFn: ({ requestId, action, reason }: any) =>
      api.post(`/requests/${requestId}/approve/`, { action, rejection_reason: reason }),
    onSuccess: () => {
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Request updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to update request');
    },
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.stock) {
      toast.error('Please select a stock item');
      return;
    }
    if (newRequest.quantity_requested <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    const selectedStock = stocks.find((s) => s.id === newRequest.stock);
    if (selectedStock && newRequest.quantity_requested > selectedStock.current_quantity) {
      toast.error(`Only ${selectedStock.current_quantity} units available`);
      return;
    }
    createMutation.mutate(newRequest);
  };

  const canApprove = (request: StockRequest): boolean => {
    if (user?.role === 'MANAGER' && request.status === 'PENDING') return true;
    if (user?.role === 'PROCUREMENT' && request.status === 'MANAGER_APPROVED') return true;
    if (user?.role === 'CFO' && request.status === 'PROCUREMENT_APPROVED') return true;
    return false;
  };

  const handleApprove = (request: StockRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    if (action === 'reject') {
      setRejectionReason('');
    }
    setShowApprovalModal(true);
  };

  const submitApproval = () => {
    if (!selectedRequest) return;
    const isRejecting = selectedRequest.status === 'PENDING' && rejectionReason;
    if (isRejecting && !rejectionReason) {
      toast.error('Rejection reason is required');
      return;
    }
    approveMutation.mutate({
      requestId: selectedRequest.id,
      action: rejectionReason ? 'reject' : 'approve',
      reason: rejectionReason,
    });
  };

  // Filter requests for the current user
  const filteredRequests = requests.filter((req) => {
    if (user?.role === 'DEPARTMENT') {
      return req.requested_by_username === user.username;
    }
    if (user?.role === 'STOREKEEPER') {
      return req.status === 'CFO_APPROVED' || req.status === 'FULFILLED';
    }
    return true;
  });

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
          <div>
            <h1 className="h3 mb-1 fw-700">Stock Requests</h1>
            <p className="text-muted small mb-0">View and manage stock request approvals</p>
          </div>
          {canCreate && (
            <button className="btn btn-cbu" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} className="me-2" />
              New Request
            </button>
          )}
        </div>

        {/* Requests Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredRequests.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-600">ID</th>
                    <th className="text-muted small fw-600">Item</th>
                    <th className="text-muted small fw-600">Qty</th>
                    <th className="text-muted small fw-600">Priority</th>
                    <th className="text-muted small fw-600">Status</th>
                    <th className="text-muted small fw-600">Requested By</th>
                    <th className="text-muted small fw-600">Date</th>
                    <th className="text-muted small fw-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="small fw-600">#{req.id}</td>
                      <td className="small">{req.stock_name || '—'}</td>
                      <td className="small">{req.quantity_requested}</td>
                      <td>
                        <span className={`badge bg-${priorityColors[req.priority]}`}>{req.priority}</span>
                      </td>
                      <td>
                        <span className={statusBadgeClass[req.status]}>{req.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="small text-muted">{req.requested_by_username || '—'}</td>
                      <td className="small text-muted">
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="small">
                        {canApprove(req) && (
                          <button
                            className="btn btn-sm btn-success me-2"
                            onClick={() => handleApprove(req, 'approve')}
                            disabled={approveMutation.isPending}
                          >
                            <HandThumbsUp size={14} /> Approve   {/* ✅ Updated icon name */}
                          </button>
                        )}
                        {canApprove(req) && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleApprove(req, 'reject')}
                            disabled={approveMutation.isPending}
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center">
                <ClipboardCheck size={32} className="text-muted mb-3" />
                <p className="text-muted">No requests found</p>
              </div>
            )}
          </div>
        </div>

        {/* Create Request Modal */}
        <div
          className={`modal ${showCreateModal ? 'd-block' : ''}`}
          style={{ display: showCreateModal ? 'block' : 'none' }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title fw-600">Create Stock Request</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)} />
              </div>
              <form onSubmit={handleCreateRequest}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="stock" className="form-label small fw-600">
                      Stock Item *
                    </label>
                    <select
                      id="stock"
                      className="form-select"
                      value={newRequest.stock}
                      onChange={(e) => setNewRequest({ ...newRequest, stock: Number(e.target.value) })}
                      required
                    >
                      <option value={0}>Select an item...</option>
                      {stocks.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.current_quantity} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="qty" className="form-label small fw-600">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="qty"
                      className="form-control"
                      value={newRequest.quantity_requested}
                      onChange={(e) => setNewRequest({ ...newRequest, quantity_requested: Number(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="priority" className="form-label small fw-600">
                      Priority
                    </label>
                    <select
                      id="priority"
                      className="form-select"
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value as RequestPriority })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="reason" className="form-label small fw-600">
                      Reason (optional)
                    </label>
                    <textarea
                      id="reason"
                      className="form-control"
                      rows={3}
                      value={newRequest.reason}
                      onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-cbu" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedRequest && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-0 bg-light">
                  <h5 className="modal-title fw-600">
                    {rejectionReason ? 'Reject Request' : 'Approve Request'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setShowApprovalModal(false)} />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">Request #{selectedRequest.id}</p>
                  <p className="mb-3">
                    <strong>{selectedRequest.stock_name}</strong> - {selectedRequest.quantity_requested} units
                  </p>
                  {rejectionReason !== undefined && (
                    <div className="mb-3">
                      <label htmlFor="rejectReason" className="form-label small fw-600">
                        Rejection Reason *
                      </label>
                      <textarea
                        id="rejectReason"
                        className="form-control"
                        rows={3}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                      />
                    </div>
                  )}
                  <p className="text-muted small">Are you sure?</p>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowApprovalModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${rejectionReason ? 'btn-danger' : 'btn-success'}`}
                    onClick={submitApproval}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? 'Processing...' : rejectionReason ? 'Reject' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Backdrops */}
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