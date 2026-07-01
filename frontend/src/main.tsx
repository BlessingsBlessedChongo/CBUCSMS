import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/toast'
import ErrorBoundary from './components/ErrorBoundary'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './index.css'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Stock = lazy(() => import('./pages/Stock'))
const Requests = lazy(() => import('./pages/Requests'))
const BlockchainLogs = lazy(() => import('./pages/BlockchainLogs'))
const MyRequests = lazy(() => import('./pages/MyRequests'))
const Fulfillment = lazy(() => import('./pages/Fulfillment'))
const Users = lazy(() => import('./pages/Users'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Do not retry mutations: create/approve actions trigger on-chain
      // transactions and must never be duplicated automatically.
      retry: false,
    },
  },
})

function SuspenseFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
      <div className="spinner-border text-primary" role="status" aria-label="Loading page">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SuspenseFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
            <Route path="/fulfillment" element={<ProtectedRoute><Fulfillment /></ProtectedRoute>} />
            <Route path="/blockchain" element={<ProtectedRoute><BlockchainLogs /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  )
}

export default App

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
