import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { StockRequest } from '../types';
import { CheckCircle, Clock, Box } from 'react-bootstrap-icons';

type StageState = 'completed' | 'pending' | 'rejected';

const ApprovalTimeline: React.FC<{ request: StockRequest }> = ({ request }) => {
  const status = request.status;

  // How far along the workflow the request has progressed.
  const rank: Record<string, number> = {
    PENDING: 1,
    MANAGER_APPROVED: 2,
    PROCUREMENT_APPROVED: 3,
    CFO_APPROVED: 4,
    FULFILLED: 5,
  };
  const progress = rank[status] ?? 0;
  const isRejected = status.endsWith('_REJECTED');

  // The stage at which a rejection happened (if any).
  const rejectedStage =
    status === 'MANAGER_REJECTED'
      ? 'Manager'
      : status === 'PROCUREMENT_REJECTED'
        ? 'Procurement'
        : status === 'CFO_REJECTED'
          ? 'CFO'
          : null;

  const stages: { name: string; threshold: number }[] = [
    { name: 'Submitted', threshold: 1 },
    { name: 'Manager', threshold: 2 },
    { name: 'Procurement', threshold: 3 },
    { name: 'CFO', threshold: 4 },
    { name: 'Fulfilled', threshold: 5 },
  ];

  const stateFor = (stage: { name: string; threshold: number }): StageState => {
    if (rejectedStage === stage.name) return 'rejected';
    return progress >= stage.threshold ? 'completed' : 'pending';
  };

  const circleClass: Record<StageState, string> = {
    completed: 'bg-success text-white',
    pending: 'bg-light text-muted',
    rejected: 'bg-danger text-white',
  };

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h6 className="card-title mb-4 fw-600">Approval Timeline</h6>
        <div className="d-flex justify-content-between">
          {stages.map((stage) => {
            const state = stateFor(stage);
            return (
              <div key={stage.name} className="text-center flex-grow-1">
                <div
                  className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${circleClass[state]}`}
                  style={{ width: '40px', height: '40px' }}
                >
                  {state === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                </div>
                <small className="d-block fw-500">{stage.name}</small>
              </div>
            );
          })}
        </div>

        {isRejected && (
          <div className="alert alert-danger mt-4 mb-0" role="alert">
            <strong>Rejected at the {rejectedStage} stage.</strong> Please contact the approver for details.
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyRequests() {
  const { user } = useAuth();

  const { data: requests = [], isLoading } = useQuery<StockRequest[]>({
    queryKey: ['my-requests', user?.username],
    queryFn: async () => {
      const res = await api.get('/requests/');
      return (res.data || []).filter((r: StockRequest) => r.requested_by_username === user?.username);
    },
  });

  return (
    <Layout>
      <div className="container-fluid">
        {/* Header */}
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-700">My Requests</h1>
          <p className="text-muted small mb-0">Track your stock requests through the approval chain</p>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : requests.length > 0 ? (
          <div className="row g-4">
            {requests.map((request) => (
              <div key={request.id} className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-600 mb-1">#{request.id} - {request.stock_name}</h6>
                        <small className="text-muted">
                          {request.created_at ? new Date(request.created_at).toLocaleDateString() : '—'}
                        </small>
                      </div>
                      <span className={`badge ${request.status === 'FULFILLED' ? 'bg-success' : request.status.endsWith('_REJECTED') ? 'bg-danger' : 'bg-info'}`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-muted small mb-4">
                      <strong>{request.quantity_requested}</strong> units requested
                      {request.reason && ` • ${request.reason}`}
                    </p>
                    <ApprovalTimeline request={request} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card border-0 shadow-sm text-center py-5">
            <Box size={48} className="text-muted mx-auto mb-3" />
            <p className="text-muted">You haven't made any requests yet</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
