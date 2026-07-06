import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchainStatus } from '../hooks/useBlockchain';
import {
  Grid3x3Gap,
  Boxes,
  Clock,
  CheckCircle,
  Link45deg,
  People,
  BoxArrowRight,
  List,
  XLg,
} from 'react-bootstrap-icons';
import type { UserRole } from '../types';
import { CBU_LOGO_URL } from '../types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Grid3x3Gap,
    roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO', 'STOREKEEPER', 'DEPARTMENT'],
  },
  {
    name: 'Stock',
    href: '/stock',
    icon: Boxes,
    roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO', 'STOREKEEPER', 'DEPARTMENT'],
  },
  {
    name: 'My Requests',
    href: '/my-requests',
    icon: Clock,
    roles: ['DEPARTMENT'],
  },
  {
    name: 'Fulfillment',
    href: '/fulfillment',
    icon: CheckCircle,
    roles: ['STOREKEEPER'],
  },
  {
    name: 'Blockchain Logs',
    href: '/blockchain',
    icon: Link45deg,
    roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO'],
  },
  {
    name: 'Users',
    href: '/users',
    icon: People,
    roles: ['ADMIN'],
  },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  ADMIN: 'danger',
  MANAGER: 'primary',
  PROCUREMENT: 'warning',
  CFO: 'info',
  STOREKEEPER: 'success',
  DEPARTMENT: 'secondary',
};

function getInitials(username: string | undefined): string {
  if (!username) return '?';
  const parts = username.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data: blockchainStatus, isLoading: statusLoading, isError: statusError } =
    useBlockchainStatus();

  const isConnected = Boolean(blockchainStatus?.connected) && !statusError;
  const connectionLabel = statusLoading
    ? 'Checking connection...'
    : isConnected
      ? 'System connected'
      : 'Connection unavailable';

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredNav = NAV_ITEMS.filter((item) => user?.role && item.roles.includes(user.role));
  const roleBadgeColor = user?.role ? ROLE_BADGE_COLORS[user.role] : 'secondary';
  const userInitials = getInitials(user?.username);

  const handleLogoutClick = () => {
    setMenuOpen(false);
    setShowLogoutModal(true);
  };
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="d-flex flex-column min-vh-100 layout-page">
      <nav className="navbar navbar-dark layout-navbar sticky-top shadow-sm">
        <div className="container-fluid px-3 px-lg-4">
          {/* Brand */}
          <NavLink className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/dashboard">
            <img
              src={CBU_LOGO_URL}
              alt="Copperbelt University"
              className="layout-brand-logo"
            />
            <span className="d-none d-sm-inline">CBU Stores</span>
          </NavLink>

          {/* Mobile toggler */}
          <button
            className="navbar-toggler border-0 d-lg-none"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <XLg size={22} /> : <List size={22} />}
          </button>

          {/* Desktop navigation (always visible on lg+) */}
          <div className="d-none d-lg-flex align-items-center gap-2">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/dashboard'}
                  className={({ isActive }) =>
                    `nav-link d-inline-flex align-items-center gap-2 ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Desktop right section (always visible on lg+) */}
          <div className="d-none d-lg-flex align-items-center gap-2 ms-auto">
            <span className={`badge bg-${roleBadgeColor} text-uppercase px-3 py-2`}>
              {user?.role ?? 'Guest'}
            </span>
            <div className="d-flex align-items-center gap-2 text-white">
              <div className="avatar-circle d-flex align-items-center justify-content-center flex-shrink-0">
                {userInitials}
              </div>
              <span className="fw-semibold small">{user?.username}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-light btn-sm d-flex align-items-center"
              onClick={handleLogoutClick}
            >
              <BoxArrowRight size={18} className="me-1" />
              Logout
            </button>
          </div>
        </div>

        {/* Mobile collapsible menu (visible only when toggled) */}
        {menuOpen && (
          <div className="d-lg-none bg-white shadow-lg rounded-3 p-3 mx-3 mb-3">
            <div className="d-flex flex-column gap-2">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) =>
                      `nav-link d-flex align-items-center gap-2 text-dark ${isActive ? 'fw-bold bg-light' : ''} rounded`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={18} />
                    {item.name}
                  </NavLink>
                );
              })}
              <hr className="my-2" />
              <div className="d-flex align-items-center gap-2 px-2">
                <span className={`badge bg-${roleBadgeColor} text-uppercase px-3 py-2`}>
                  {user?.role ?? 'Guest'}
                </span>
                <div className="d-flex align-items-center gap-2">
                  <div className="avatar-circle d-flex align-items-center justify-content-center" style={{ width: 30, height: 30 }}>
                    {userInitials}
                  </div>
                  <span className="fw-semibold small text-dark">{user?.username}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center mt-2"
                onClick={handleLogoutClick}
              >
                <BoxArrowRight size={18} className="me-1" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-grow-1 py-4 px-3 px-lg-4">{children}</main>

      {/* Footer */}
      <footer className="layout-footer border-top mt-auto">
        <div className="container-fluid px-3 px-lg-4">
          <div className="row align-items-center py-3 gy-2">
            <div className="col-lg-4 text-center text-lg-start">
              <small className="text-muted">
                © {new Date().getFullYear()} Copperbelt University · CBU ChainStores
              </small>
            </div>
            <div className="col-lg-4 text-center">
              <span className="d-inline-flex align-items-center gap-2 small text-muted" role="status" aria-live="polite">
                <span
                  className={`layout-health-dot ${isConnected ? 'layout-health-dot--live' : 'layout-health-dot--offline'}`}
                  aria-hidden="true"
                />
                {connectionLabel}
              </span>
            </div>
            <div className="col-lg-4 d-flex justify-content-center justify-content-lg-end gap-2 flex-wrap">
              <span className="layout-status-pill layout-status-pill-audit">Immutable Audit Trail</span>
              <span className="layout-status-pill layout-status-pill-blockchain">Blockchain Verified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Logout Modal */}
      <div className={`modal fade ${showLogoutModal ? 'show d-block' : ''}`} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle" aria-hidden={!showLogoutModal}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-semibold" id="logoutModalTitle">Confirm Logout</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleCancelLogout} />
            </div>
            <div className="modal-body pt-2">
              <p className="text-muted mb-0">Are you sure you want to sign out? Your session will end and you will need to log in again to continue.</p>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-outline-secondary" onClick={handleCancelLogout}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmLogout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
      {showLogoutModal && <div className="modal-backdrop fade show" onClick={handleCancelLogout} aria-hidden="true" />}
    </div>
  );
}