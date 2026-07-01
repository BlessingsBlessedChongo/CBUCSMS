import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Layout from '../components/Layout';
import {
  Boxes,
  Clock,
  CheckCircle,
  GraphUp,                      // ✅ correct Bootstrap icon for "trending up"
  Plus,
  Eye,
  Link45deg,
  BarChart as BarChartIcon,
  Activity,
  ArrowUpRight,
  ExclamationTriangleFill as AlertTriangle,
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

// ----------------------------------------------------------------------
// TypeScript interfaces
// ----------------------------------------------------------------------
interface DashboardOverview {
  total_stocks: number;
  low_stock_count: number;
  pending_for_user: number;
  total_requests: number;
  approved_requests: number;
  blockchain_logs_count: number;
  latest_block: number;
}

interface MonthlyTrend {
  month: string;
  requests: number;
}

interface CategoryDistribution {
  name: string;
  count: number;
}

interface TopRequestedItem {
  name: string;
  request_count: number;
}

interface DashboardCharts {
  monthly_trends: MonthlyTrend[];
  category_distribution: CategoryDistribution[];
  top_requested_items: TopRequestedItem[];
}

interface DashboardStats {
  overview: DashboardOverview;
  charts: DashboardCharts;
}

interface RecentRequest {
  id: number;
  stock_name: string;
  quantity_requested: number;
  status: string;
  requested_by_username: string;
  created_at: string;
}

// ----------------------------------------------------------------------
// Chart colors (CBU palette)
// ----------------------------------------------------------------------
const CHART_COLORS = ['#1a5276', '#2980b9', '#3498db', '#5dade2', '#85c1e2', '#aed6f1'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats/');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Fetch recent requests (last 5)
  const { data: recentRequests = [] } = useQuery<RecentRequest[]>({
    queryKey: ['recent-requests'],
    queryFn: async () => {
      const res = await api.get('/requests/?limit=5');
      return (res.data?.results ?? res.data ?? []).slice(0, 5);
    },
    refetchInterval: 15000,
  });

  const isLoading = statsLoading;
  const overview = stats?.overview;
  const charts = stats?.charts;

  // Helper: status badge colour
  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-warning text-dark',
      MANAGER_APPROVED: 'bg-primary',
      PROCUREMENT_APPROVED: 'bg-info text-dark',
      CFO_APPROVED: 'bg-success',
      FULFILLED: 'bg-secondary',
      REJECTED: 'bg-danger',
    };
    return map[status] || 'bg-light text-dark';
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isLoading) {
    return (
      <Layout>
        <div className="container-fluid py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-fluid">
        {/* ---------- Header ---------- */}
        <div className="row align-items-center mb-4">
          <div className="col-md-8">
            <div className="d-flex align-items-center gap-3">
              <img
                src="https://www.cbu.ac.zm/opus/assets/images/correct%20logo.png"
                alt="Copperbelt University logo"
                width={56}
                height={56}
                className="rounded bg-white p-1 shadow-sm"
              />
              <div>
                <h1 className="h3 fw-bold mb-1">
                  Welcome back, <span className="text-primary">{user?.username}</span>!
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
            <button className="btn btn-primary" onClick={() => navigate('/requests')}>
              <Plus className="me-1" /> New Request
            </button>
          </div>
        </div>

        {/* ---------- Stat cards ---------- */}
        <div className="row g-3 mb-5">
          <div className="col-lg-3 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1">Total Inventory</p>
                    <h3 className="fw-bold mb-0">{overview?.total_stocks ?? 0}</h3>
                    {overview && overview.low_stock_count > 0 && (
                      <small className="text-danger">
                        <ExclamationTriangleFill size={14} className="me-1" />
                        {overview.low_stock_count} low stock
                      </small>
                    )}
                  </div>
                  <div className="bg-primary bg-opacity-10 rounded p-3">
                    <Boxes size={24} className="text-primary" />
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
                    {/* ✅ Replaced TrendingUp with GraphUp */}
                    <GraphUp size={24} className="text-info" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Charts ---------- */}
        <div className="row g-3 mb-5">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  {/* ✅ Replaced TrendingUp with GraphUp */}
                  <GraphUp className="me-2 text-primary" />
                  Monthly Trends
                </h5>
                {charts?.monthly_trends && charts.monthly_trends.length > 0 ? (
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
                      <YAxis stroke="#6c757d" fontSize={12} />
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
                  <div className="text-center py-5 text-muted">No trend data available.</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <BarChartIcon className="me-2 text-primary" />
                  By Category
                </h5>
                {charts?.category_distribution && charts.category_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={charts.category_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, count }) => `${name}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {charts.category_distribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5 text-muted">No category data.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Most Requested Items ---------- */}
        <div className="row g-3 mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Boxes className="me-2 text-primary" />
                  Most Requested Items
                </h5>
                {charts?.top_requested_items && charts.top_requested_items.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={charts.top_requested_items}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                      <XAxis type="number" stroke="#6c757d" fontSize={12} />
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
                  <div className="text-center py-5 text-muted">No request data available.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Recent Activity & Quick Actions ---------- */}
        <div className="row g-3">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Activity className="me-2 text-primary" />
                  Recent Activity
                </h5>
                {recentRequests.length > 0 ? (
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
                        {recentRequests.map((req) => (
                          <tr
                            key={req.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate('/requests')}
                          >
                            <td className="small fw-bold">#{req.id}</td>
                            <td className="small">{req.stock_name}</td>
                            <td className="small">{req.quantity_requested}</td>
                            <td className="small">
                              <span className={`badge ${getStatusBadge(req.status)}`}>
                                {req.status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="small text-muted">{req.requested_by_username}</td>
                            <td className="small text-muted">
                              {formatDate(req.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted">No recent activity.</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-semibold mb-3">
                  <Link45deg className="me-2 text-primary" />
                  Quick Actions
                </h5>
                <div className="d-grid gap-2">
                  {user?.role === 'DEPARTMENT' && (
                    <button
                      className="btn btn-primary btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/requests')}
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
                        <Eye size={16} className="me-2" /> Review {overview!.pending_for_user} Pending
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

                  {user?.role === 'ADMIN' && (
                    <button
                      className="btn btn-secondary btn-sm d-flex align-items-center justify-content-center"
                      onClick={() => navigate('/blockchain')}
                    >
                      <Link45deg size={16} className="me-2" /> Blockchain Activity
                    </button>
                  )}

                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                    onClick={() => navigate('/stock')}
                  >
                    <Boxes size={16} className="me-2" /> Manage Stock
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