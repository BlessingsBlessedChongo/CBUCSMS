import { useState } from 'react';
import Layout from '../components/Layout';
import { useFulfillmentQueue, useFulfillRequest } from '../hooks';
import type { StockRequest } from '../types';
import { CheckCircle, Box } from 'react-bootstrap-icons';
import { EmptyState, TableSkeleton } from '../components/ui/LoadingState';

export default function Fulfillment() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StockRequest | null>(null);

  const { data: pendingRequests = [], isLoading } = useFulfillmentQueue();
  const fulfillMutation = useFulfillRequest();

  const handleFulfill = (request: StockRequest) => {
    setSelectedRequest(request);
    setShowConfirmModal(true);
  };

  const confirmFulfill = () => {
    if (!selectedRequest) return;
    fulfillMutation.mutate(
      { stockId: selectedRequest.stock, requestId: selectedRequest.id },
      {
        onSuccess: () => {
          setShowConfirmModal(false);
          setSelectedRequest(null);
        },
      },
    );
  };

  const unfulfilledRequests = pendingRequests.filter((request) => request.status === 'CFO_APPROVED');
  const fulfilledHistory = pendingRequests.filter((request) => request.status === 'FULFILLED');

  return (
    <Layout>
      <div className="container-fluid">
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-bold">Fulfillment Queue</h1>
          <p className="text-muted small mb-0">Release approved stock to requesting departments</p>
        </div>

        {unfulfilledRequests.length === 0 && !isLoading && (
          <div className="alert alert-success" role="alert">
            <CheckCircle size={18} className="me-2" />
            All caught up! Nothing to fulfill.
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            {isLoading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : unfulfilledRequests.length > 0 ? (
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-muted small fw-semibold">Request ID</th>
                    <th className="text-muted small fw-semibold">Item</th>
                    <th className="text-muted small fw-semibold">Department</th>
                    <th className="text-muted small fw-semibold">Qty</th>
                    <th className="text-muted small fw-semibold">Requested By</th>
                    <th className="text-muted small fw-semibold">Approved Date</th>
                    <th className="text-muted small fw-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unfulfilledRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="small fw-semibold">#{request.id}</td>
                      <td className="small">{request.stock_name || '—'}</td>
                      <td className="small text-muted">{request.department || 'Unknown'}</td>
                      <td className="small">
                        <strong>{request.quantity_requested}</strong>
                      </td>
                      <td className="small text-muted">{request.requested_by_username || '—'}</td>
                      <td className="small text-muted">
                        {request.cfo_approval_date
                          ? new Date(request.cfo_approval_date).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="small">
                        <button
                          type="button"
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
              <EmptyState
                icon={<Box size={32} />}
                title="No requests pending fulfillment"
              />
            )}
          </div>
        </div>

        {fulfilledHistory.length > 0 && (
          <div className="mt-5">
            <h6 className="fw-semibold mb-3">Recently Fulfilled</h6>
            <div className="row g-2">
              {fulfilledHistory.slice(0, 5).map((request) => (
                <div key={request.id} className="col-lg-6">
                  <div className="card border-success border-2 bg-success bg-opacity-10">
                    <div className="card-body p-3">
                      <p className="mb-1 small fw-semibold">{request.stock_name}</p>
                      <small className="text-muted">
                        #{request.id} • {request.quantity_requested} units •{' '}
                        {request.requested_by_username}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showConfirmModal && selectedRequest && (
          <>
            <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true">
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0">
                  <div className="modal-header border-0 bg-light">
                    <h5 className="modal-title fw-semibold">Confirm Fulfillment</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowConfirmModal(false)}
                      aria-label="Close"
                    />
                  </div>
                  <div className="modal-body">
                    <p className="text-muted small mb-3">
                      You are about to mark this request as fulfilled:
                    </p>
                    <p className="mb-2">
                      <strong>{selectedRequest.stock_name}</strong>
                    </p>
                    <p className="text-muted small mb-4">
                      Qty: <strong>{selectedRequest.quantity_requested}</strong> • For:{' '}
                      <strong>{selectedRequest.requested_by_username}</strong>
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
            <div
              className="modal-backdrop fade show"
              onClick={() => setShowConfirmModal(false)}
            />
          </>
        )}
      </div>
    </Layout>
  );
}
