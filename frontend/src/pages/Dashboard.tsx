import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDashboardStats, useRecentRequests } from '../hooks';
import { ChartSkeleton, EmptyState, PageSpinner, StatCardSkeleton } from '../components/ui/LoadingState';
import {
  Boxes,
  Clock,
  CheckCircle,
  GraphUp,
  Plus,
  Eye,
  Link45deg,
  BarChart as BarChartIcon,
  Activity,
  ExclamationTriangleFill,
} from 'react-bootstrap-icons';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import type { RequestStatus } from '../types';
import { CBU_LOGO_URL } from '../types';

const CHART_COLORS = ['#1a5276', '#29b6f6', '#2980b9', '#5dade2', '#85c1e2', '#aed6f1'];

const statusBadgeMap: Partial<Record<RequestStatus, string>> = {
  PENDING: 'bg-warning text-dark',
  MANAGER_APPROVED: 'bg-primary',
  PROCUREMENT_APPROVED: 'bg-info text-dark',
  CFO_APPROVED: 'bg-success',
  FULFILLED: 'bg-secondary',
  MANAGER_REJECTED: 'bg-danger',
  PROCUREMENT_REJECTED: 'bg-danger',
  CFO_REJECTED: 'bg-danger',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, isError } = useDashboardStats();
  const { data: recentRequests = [], isLoading: recentLoading } = useRecentRequests(5);

  const overview = stats?.overview;
  const charts = stats?.charts;

  const getStatusBadge = (status: string) =>
    statusBadgeMap[status as RequestStatus] || 'bg-light text-dark';

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row align-items-center mb-4">
          <div className="col-md-8">
            <div className="d-flex align-items-center gap-3">
              <img
                src={CBU_LOGO_URL}
                alt="Copperbelt University logo"
                width={56}
                height={56}
                className="rounded bg-white p-1 shadow-sm"
              />
              <div>
                <h1 className="h3 fw-bold mb-1">
                  {greeting()},{' '}
                  <span style={{ color: 'var(--cbu-primary)' }}>{user?.username}</span>!
                </h1>
                <p className="text-muted mb-0">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 text-md-end mt-3 mt-md-0">
            {user?.role === 'DEPARTMENT' && (
              <button
                className="btn btn-cbu-cyan text-white"
                onClick={() => navigate('/requests', { state: { openCreateModal: true } })}
              >
                <Plus className="me-1" /> New Request
              </button>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <button
                  className="btn btn-cbu-cyan text-white me-2"
                  onClick={() => navigate('/requests', { state: { openCreateModal: true } })}
                >
                  <Plus className="me-1" /> New Request
                </button>
                <button className="btn btn-cbu text-white" onClick={() => navigate('/requests')}>
                  <Eye className="me-1" /> View Requests
                </button>
              </>
            )}
            {['MANAGER', 'PROCUREMENT', 'CFO'].includes(user?.role ?? '') && (
              <button className="btn btn-cbu text-white" onClick={() => navigate('/requests')}>
                <Eye className="me-1" /> View Requests
              </button>
            )}
          </div>
        </div>

        {isError && (
          <div className="alert alert-danger" role="alert">
            Unable to load dashboard metrics. Please refresh the page.
          </div>
        )}

        <div className="row g-3 mb-5">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <StatCardSkeleton />
              </div>
            ))
          ) : (
            <>
              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted small mb-1">Total Inventory</p>
                        <h3 className="fw-bold mb-0">{overview?.total_stocks ?? 0}</h3>
                        {(overview?.low_stock_count ?? 0) > 0 && (
                          <small className="text-danger">
                            <ExclamationTriangleFill size={14} className="me-1" />
                            {overview?.low_stock_count} low stock
                          </small>
                        )}
                      </div>
                      <div className="rounded p-3" style={{ background: 'rgba(26, 82, 118, 0.1)' }}>
                        <Boxes size={24} style={{ color: 'var(--cbu-primary)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted small mb-1">Pending Approvals</p>
                        <h3 className="fw-bold mb-0">{overview?.pending_for_user ?? 0}</h3>
                        <small className="text-muted">For your role</small>
                      </div>
                      <div className="bg-warning bg-opacity-10 rounded p-3">
                        <Clock size={24} className="text-warning" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted small mb-1">Total Requests</p>
                        <h3 className="fw-bold mb-0">{overview?.total_requests ?? 0}</h3>
                        <small className="text-success">{overview?.approved_requests ?? 0} approved</small>
                      </div>
                      <div className="bg-success bg-opacity-10 rounded p-3">
                        <CheckCircle size={24} className="text-success" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="text-muted small mb-1">Blockchain Txs</p>
                        <h3 className="fw-bold mb-0">{overview?.blockchain_logs_count ?? 0}</h3>
                        <small className="text-muted">Block #{overview?.latest_block ?? '—'}</small>
                      </div>
                      <div className="bg-info bg-opacity-10 rounded p-3">
                        <GraphUp size={24} className="text-info" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="row g-3 mb-5">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <GraphUp className="me-2" style={{ color: 'var(--cbu-primary)' }} />
                  Monthly Trends
                </h5>
                {statsLoading ? (
                  <ChartSkeleton />
                ) : charts?.monthly_trends && charts.monthly_trends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={charts.monthly_trends}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a5276" stopOpacity={0.6} />
                          <stop offset="95%" stopColor="#1a5276" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                      <XAxis dataKey="month" stroke="#6c757d" fontSize={12} />
                      <YAxis stroke="#6c757d" fontSize={12} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="requests"
                        stroke="#1a5276"
                        fillOpacity={1}
                        fill="url(#colorTrend)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState
                    icon={<GraphUp size={32} />}
                    title="No trend data available"
                    description="Request activity will appear here once data is recorded."
                  />
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <BarChartIcon className="me-2" style={{ color: 'var(--cbu-primary)' }} />
                  By Category
                </h5>
                {statsLoading ? (
                  <ChartSkeleton />
                ) : charts?.category_distribution && charts.category_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={charts.category_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        dataKey="count"
                      >
                        {charts.category_distribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<BarChartIcon size={32} />} title="No category data" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3 mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Boxes className="me-2" style={{ color: 'var(--cbu-primary)' }} />
                  Most Requested Items
                </h5>
                {statsLoading ? (
                  <ChartSkeleton />
                ) : charts?.top_requested_items && charts.top_requested_items.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={charts.top_requested_items}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                      <XAxis type="number" stroke="#6c757d" fontSize={12} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#6c757d"
                        fontSize={12}
                        width={190}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #dee2e6',
                          borderRadius: '4px',
                        }}
                      />
                      <Bar dataKey="request_count" fill="#1a5276" barSize={20} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<Boxes size={32} />} title="No request data available" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Activity className="me-2" style={{ color: 'var(--cbu-primary)' }} />
                  Recent Activity
                </h5>
                {recentLoading ? (
                  <PageSpinner label="Loading recent activity..." />
                ) : recentRequests.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="small text-muted fw-semibold">ID</th>
                          <th className="small text-muted fw-semibold">Item</th>
                          <th className="small text-muted fw-semibold">Qty</th>
                          <th className="small text-muted fw-semibold">Status</th>
                          <th className="small text-muted fw-semibold">Requested By</th>
                          <th className="small text-muted fw-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRequests.map((request) => (
                          <tr
                            key={request.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                              navigate(user?.role === 'DEPARTMENT' ? '/my-requests' : '/requests')
                            }
                          >
                            <td className="small fw-bold">#{request.id}</td>
                            <td className="small">{request.stock_name}</td>
                            <td className="small">{request.quantity_requested}</td>
                            <td className="small">
                              <span className={`badge ${getStatusBadge(request.status)}`}>
                                {request.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="small text-muted">{request.requested_by_username}</td>
                            <td className="small text-muted">{formatDate(request.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState icon={<Activity size={32} />} title="No recent activity" />
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Link45deg className="me-2" style={{ color: 'var(--cbu-primary)' }} />
                  Quick Actions
                </h5>
                <div className="d-grid gap-2">
                  {user?.role === 'DEPARTMENT' && (
                    <button
                      className="btn btn-cbu-cyan btn-sm text-white d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/requests', { state: { openCreateModal: true } })}
                    >
                      <Plus size={16} className="me-2" /> Create Request
                    </button>
                  )}

                  {['MANAGER', 'PROCUREMENT', 'CFO'].includes(user?.role ?? '') &&
                    (overview?.pending_for_user ?? 0) > 0 && (
                      <button
                        className="btn btn-warning btn-sm d-flex align-items-center justify-content-center"
                        onClick={() => navigate('/requests')}
                      >
                        <Eye size={16} className="me-2" /> Review {overview?.pending_for_user} Pending
                      </button>
                    )}

                  {user?.role === 'STOREKEEPER' && (
                    <button
                      className="btn btn-info btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/fulfillment')}
                    >
                      <CheckCircle size={16} className="me-2" /> Fulfillment Queue
                    </button>
                  )}

                  {['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO'].includes(user?.role ?? '') && (
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/blockchain')}
                    >
                      <Link45deg size={16} className="me-2" /> Blockchain Activity
                    </button>
                  )}

                  {user?.role === 'ADMIN' && (
                    <button
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/users')}
                    >
                      <Eye size={16} className="me-2" /> Manage Users
                    </button>
                  )}

                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/stock')}
                  >
                    <Boxes size={16} className="me-2" /> Browse Stock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}