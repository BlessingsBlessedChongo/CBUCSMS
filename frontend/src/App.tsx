import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import type { UserRole } from './types';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Stock = lazy(() => import('./pages/Stock'));
const Requests = lazy(() => import('./pages/Requests'));
const BlockchainLogs = lazy(() => import('./pages/BlockchainLogs'));
const MyRequests = lazy(() => import('./pages/MyRequests'));
const Fulfillment = lazy(() => import('./pages/Fulfillment'));
const Users = lazy(() => import('./pages/Users'));

function SuspenseFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
      <div className="spinner-border text-primary" role="status" aria-label="Loading page">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SuspenseFallback />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleRoute({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SuspenseFallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
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
    <>
      <ScrollToTop />
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute>
                <Stock />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />          
          <Route
            path="/my-requests"
            element={
              <RoleRoute roles={['DEPARTMENT']}>
                <MyRequests />
              </RoleRoute>
            }
          />
          <Route
            path="/fulfillment"
            element={
              <RoleRoute roles={['STOREKEEPER', 'ADMIN']}>
                <Fulfillment />
              </RoleRoute>
            }
          />
          <Route
            path="/blockchain"
            element={
              <RoleRoute roles={['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO']}>
                <BlockchainLogs />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute roles={['ADMIN']}>
                <Users />
              </RoleRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
