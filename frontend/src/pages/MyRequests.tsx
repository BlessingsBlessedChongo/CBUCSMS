import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { useMyRequests } from '../hooks';
import type { StockRequest } from '../types';
import { CheckCircle, Clock, Box } from 'react-bootstrap-icons';
import { EmptyState, PageSpinner } from '../components/ui/LoadingState';

type StageState = 'completed' | 'pending' | 'rejected';

function ApprovalTimeline({ request }: { request: StockRequest }) {
  const status = request.status;

  const rank: Record<string, number> = {
    PENDING: 1,
    MANAGER_APPROVED: 2,
    PROCUREMENT_APPROVED: 3,
    CFO_APPROVED: 4,
    FULFILLED: 5,
  };
  const progress = rank[status] ?? 0;
  const isRejected = status.endsWith('_REJECTED');

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
        <h6 className="card-title mb-4 fw-semibold">Approval Timeline</h6>
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
                <small className="d-block fw-medium">{stage.name}</small>
              </div>
            );
          })}
        </div>

        {isRejected && (
          <div className="alert alert-danger mt-4 mb-0" role="alert">
            <strong>Rejected at the {rejectedStage} stage.</strong> Please contact the approver for
            details.
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyRequests() {
  const { user } = useAuth();
  const { data: requests = [], isLoading } = useMyRequests(user?.username);

  return (
    <Layout>
      <div className="container-fluid">
        <div className="mb-4">
          <h1 className="h3 mb-1 fw-bold">My Requests</h1>
          <p className="text-muted small mb-0">Track your stock requests through the approval chain</p>
        </div>

        {isLoading ? (
          <PageSpinner label="Loading your requests..." />
        ) : requests.length > 0 ? (
          <div className="row g-4">
            {requests.map((request) => (
              <div key={request.id} className="col-lg-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-semibold mb-1">
                          #{request.id} - {request.stock_name}
                        </h6>
                        <small className="text-muted">
                          {request.created_at
                            ? new Date(request.created_at).toLocaleDateString()
                            : '—'}
                        </small>
                      </div>
                      <span
                        className={`badge ${request.status === 'FULFILLED' ? 'bg-success' : request.status.endsWith('_REJECTED') ? 'bg-danger' : 'bg-info'}`}
                      >
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
          <EmptyState
            icon={<Box size={48} />}
            title="No requests yet"
            description="You haven't made any stock requests. Use the dashboard to create one."
          />
        )}
      </div>
    </Layout>
  );
}
