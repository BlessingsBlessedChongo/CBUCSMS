import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Layout from '../components/Layout';
import { StockRequest } from '../types';
import { CheckCircle, Clock, AlertCircle, Package } from 'react-bootstrap-icons';

const ApprovalTimeline: React.FC<{ request: StockRequest }> = ({ request }) => {
  const stages = [
    { name: 'Submitted', status: 'completed' },
    { name: 'Manager', status: ['PENDING'].includes(request.status) ? 'pending' : 'completed' },
    { name: 'Procurement', status: ['PENDING', 'MANAGER_APPROVED'].includes(request.status) ? 'pending' : 'completed' },
    { name: 'CFO', status: ['FULFILLED'].includes(request.status) ? 'completed' : 'pending' },
    { name: 'Fulfilled', status: request.status === 'FULFILLED' ? 'completed' : 'pending' },
  ];

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <h6 className="card-title mb-4 fw-600">Approval Timeline</h6>
        <div className="d-flex justify-content-between">
          {stages.map((stage) => (
            <div key={stage.name} className="text-center flex-grow-1">
              <div
                className={`rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center ${
                  stage.status === 'completed' ? 'bg-success text-white' : 'bg-light text-muted'
                }`}
                style={{ width: '40px', height: '40px' }}
              >
                {stage.status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
              </div>
              <small className="d-block fw-500">{stage.name}</small>
            </div>
          ))}
        </div>

        {request.status === 'REJECTED' && request.rejection_reason && (
          <div className="alert alert-danger mt-4 mb-0">
            <strong>Rejected:</strong> {request.rejection_reason}
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
                      <span className={`badge ${request.status === 'FULFILLED' ? 'bg-success' : request.status === 'REJECTED' ? 'bg-danger' : 'bg-info'}`}>
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
            <Package size={48} className="text-muted mx-auto mb-3" />
            <p className="text-muted">You haven't made any requests yet</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
            approved: r.status?.includes('MANAGER_APPROVED') || false,
            approved_by: r.manager_approved_by || null,
            approved_at: r.manager_approved_at || null,
            rejection_reason: r.manager_rejection_reason || null,
          },
          procurement: {
            approved: r.status?.includes('PROCUREMENT_APPROVED') || false,
            approved_by: r.procurement_approved_by || null,
            approved_at: r.procurement_approved_at || null,
            rejection_reason: r.procurement_rejection_reason || null,
          },
          cfo: {
            approved: r.status?.includes('CFO_APPROVED') || false,
            approved_by: r.cfo_approved_by || null,
            approved_at: r.cfo_approved_at || null,
            rejection_reason: r.cfo_rejection_reason || null,
          },
        },
        blockchain_data: r.blockchain || r.blockchain_data || null,
      }))
    },
    refetchInterval: 10000,
  })

  const timeline = data || []

  const formatDate = (s?: string) => s ? new Date(s).toLocaleString() : ''

  if (isLoading) {
    return (
      <Layout>
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
          <div className="spinner-border text-primary" role="status" aria-hidden></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="container py-4">
        <div className="mb-4">
          <h1 className="h3">My Requests</h1>
          <p className="text-muted">Track progress through Manager → Procurement → CFO → Fulfilled</p>
        </div>

        {timeline.length === 0 ? (
          <Card>
            <CardContent className="text-center py-5">
              <Package className="mb-3" />
              <h4>No requests yet</h4>
              <p className="text-muted">Create a request to begin the approval workflow.</p>
              <div className="mt-3">
                <Button onClick={() => (window.location.href = '/requests')}>Create Request</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="row g-4">
            {timeline.map((req) => (
              <div className="col-12" key={req.request_id}>
                <Card>
                  <CardHeader className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <Package />
                      <div>
                        <div className="fw-bold">#{req.request_id} — {req.stock_name}</div>
                        <div className="text-muted small">Requested: {formatDate(req.created_at)}</div>
                      </div>
                      {req.blockchain_verified && (
                        <Badge className="ms-2 bg-light text-success border"> <LinkIcon className="me-1" /> On-chain verified</Badge>
                      )}
                    </div>
                    <div className="text-end small text-muted">Priority: <span className="fw-semibold">{req.priority}</span></div>
                  </CardHeader>
                  <CardContent>
                    <div className="row">
                      <div className="col-md-4">
                        <h6 className="small text-muted">Request Details</h6>
                        <p className="mb-1">Quantity: <strong>{req.quantity}</strong></p>
                        <p className="mb-1">Status: <strong>{req.django_status.replace(/_/g, ' ')}</strong></p>
                      </div>
                      <div className="col-md-8">
                        <h6 className="small text-muted">Approval Progress</h6>
                        <div className="d-flex align-items-center gap-4">
                          {/** Manager */}
                          <div className="text-center">
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${req.approval_steps.manager.approved ? 'bg-success text-white' : req.approval_steps.manager.rejection_reason ? 'bg-danger text-white' : 'bg-light text-muted'}`} style={{ width:40, height:40 }}>
                              {req.approval_steps.manager.approved ? <CheckCircle /> : req.approval_steps.manager.rejection_reason ? <XCircle /> : <Clock />}
                            </div>
                            <div className="small mt-2">Manager</div>
                            {req.approval_steps.manager.approved_by && <div className="small text-muted">{req.approval_steps.manager.approved_by}</div>}
                          </div>

                          <ChevronRight />

                          {/** Procurement */}
                          <div className="text-center">
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${req.approval_steps.procurement.approved ? 'bg-success text-white' : req.approval_steps.procurement.rejection_reason ? 'bg-danger text-white' : 'bg-light text-muted'}`} style={{ width:40, height:40 }}>
                              {req.approval_steps.procurement.approved ? <CheckCircle /> : req.approval_steps.procurement.rejection_reason ? <XCircle /> : <Clock />}
                            </div>
                            <div className="small mt-2">Procurement</div>
                            {req.approval_steps.procurement.approved_by && <div className="small text-muted">{req.approval_steps.procurement.approved_by}</div>}
                          </div>

                          <ChevronRight />

                          {/** CFO */}
                          <div className="text-center">
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${req.approval_steps.cfo.approved ? 'bg-success text-white' : req.approval_steps.cfo.rejection_reason ? 'bg-danger text-white' : 'bg-light text-muted'}`} style={{ width:40, height:40 }}>
                              {req.approval_steps.cfo.approved ? <CheckCircle /> : req.approval_steps.cfo.rejection_reason ? <XCircle /> : <Clock />}
                            </div>
                            <div className="small mt-2">CFO</div>
                            {req.approval_steps.cfo.approved_by && <div className="small text-muted">{req.approval_steps.cfo.approved_by}</div>}
                          </div>

                          <ChevronRight />

                          {/** Fulfilled */}
                          <div className="text-center">
                            <div className={`rounded-circle d-inline-flex align-items-center justify-content-center ${req.django_status === 'FULFILLED' ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width:40, height:40 }}>
                              {req.django_status === 'FULFILLED' ? <CheckCircle /> : <Package />}
                            </div>
                            <div className="small mt-2">Fulfilled</div>
                          </div>
                        </div>

                        {/* Rejection messages */}
                        {req.approval_steps.manager.rejection_reason && (
                          <div className="mt-3 alert alert-danger">
                            <strong>Manager Rejection:</strong> {req.approval_steps.manager.rejection_reason}
                          </div>
                        )}
                        {req.approval_steps.procurement.rejection_reason && (
                          <div className="mt-3 alert alert-danger">
                            <strong>Procurement Rejection:</strong> {req.approval_steps.procurement.rejection_reason}
                          </div>
                        )}
                        {req.approval_steps.cfo.rejection_reason && (
                          <div className="mt-3 alert alert-danger">
                            <strong>CFO Rejection:</strong> {req.approval_steps.cfo.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
