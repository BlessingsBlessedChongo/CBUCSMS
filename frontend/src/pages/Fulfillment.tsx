import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { StockRequest } from '../types';
import { CheckCircle, Box } from 'react-bootstrap-icons';
import { toast } from 'sonner';

export default function Fulfillment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);

  // Fetch CFO_APPROVED requests ready for fulfillment
  const { data: pendingRequests = [], isLoading } = useQuery<StockRequest[]>({
    queryKey: ['fulfillment-queue'],
    queryFn: async () => {
      const res = await api.get('/requests/');
      return (res.data || []).filter((r: StockRequest) => r.status === 'CFO_APPROVED' || r.status === 'FULFILLED');
    },
  });

  const fulfillMutation = useMutation({
    // Backend contract: POST /stocks/{stockId}/mark_fulfilled/ with { request_id }.
    mutationFn: ({ stockId, requestId }: { stockId: number; requestId: number }) =>
      api.post(`/stocks/${stockId}/mark_fulfilled/`, { request_id: requestId }),
    onSuccess: () => {
      setShowConfirmModal(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['fulfillment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      toast.success('Request fulfilled successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || 'Failed to fulfill request');
    },
  });

  const handleFulfill = (request: StockRequest) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const confirmFulfill = () => {
    if (selectedRequest) {
      fulfillMutation.mutate({ stockId: selectedRequest.stock, requestId: selectedRequest.id });
    }
  };

  const unfulfilledRequests = pendingRequests.filter((r) => r.status === 'CFO_APPROVED');

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-700">Fulfillment Queue</h1>
          <p className="text-muted small mb-0">Release approved stock to requesting departments</p>
        </div>

        {/* Status Alert */}
        {unfulfilledRequests.length === 0 && !isLoading && (
          <div className="alert alert-success" role="alert">
            <CheckCircle size={18} className="me-2" />
            All caught up! Nothing to fulfill.
          </div>
        )}

        {/* Fulfillment Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <div className="p-5 text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : unfulfilledRequests.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-600">Request ID</th>
                    <th className="text-muted small fw-600">Item</th>
                    <th className="text-muted small fw-600">Department</th>
                    <th className="text-muted small fw-600">Qty</th>
                    <th className="text-muted small fw-600">Requested By</th>
                    <th className="text-muted small fw-600">Approved Date</th>
                    <th className="text-muted small fw-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unfulfilledRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="small fw-600">#{request.id}</td>
                      <td className="small">{request.stock_name || '—'}</td>
                      <td className="small text-muted">{request.department || 'Unknown'}</td>
                      <td className="small">
                        <strong>{request.quantity_requested}</strong>
                      </td>
                      <td className="small text-muted">{request.requested_by_username || '—'}</td>
                      <td className="small text-muted">
                        {request.cfo_approval_date ? new Date(request.cfo_approval_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="small">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleFulfill(request)}
                          disabled={fulfillMutation.isPending}
                        >
                          <CheckCircle size={14} className="me-1" /> Fulfill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5 text-center">
                <Box size={32} className="text-muted mb-3" />
                <p className="text-muted">No requests pending fulfillment</p>
              </div>
            )}
          </div>
        </div>

        {/* Fulfilled History */}
        {pendingRequests.filter((r) => r.status === 'FULFILLED').length > 0 && (
          <div className="mt-5">
            <h6 className="fw-600 mb-3">Recently Fulfilled</h6>
            <div className="row g-2">
              {pendingRequests
                .filter((r) => r.status === 'FULFILLED')
                .slice(0, 5)
                .map((request) => (
                  <div key={request.id} className="col-lg-6">
                    <div className="card border-success border-2 bg-success bg-opacity-10">
                      <div className="card-body p-3">
                        <p className="mb-1 small fw-600">{request.stock_name}</p>
                        <small className="text-muted">
                          #{request.id} • {request.quantity_requested} units • {request.requested_by_username}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedRequest && (
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0">
                <div className="modal-header border-0 bg-light">
                  <h5 className="modal-title fw-600">Confirm Fulfillment</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowConfirmModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">You are about to mark this request as fulfilled:</p>
                  <p className="mb-2">
                    <strong>{selectedRequest.stock_name}</strong>
                  </p>
                  <p className="text-muted small mb-4">
                    Qty: <strong>{selectedRequest.quantity_requested}</strong> • For: <strong>{selectedRequest.requested_by_username}</strong>
                  </p>
                  <p className="small text-muted">This action is permanent.</p>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={confirmFulfill}
                    disabled={fulfillMutation.isPending}
                  >
                    {fulfillMutation.isPending ? 'Fulfilling...' : 'Confirm Fulfillment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Backdrop */}
        {showConfirmModal && (
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowConfirmModal(false)}
          />
        )}
      </div>
    </Layout>
  );
}
