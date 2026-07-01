import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Grid3x3Gap,
  Boxes,
  ClipboardCheck,
  Clock,
  CheckCircle,
  Link45deg,
  People,
  BoxArrowRight,
  List,
  XLg,
} from 'react-bootstrap-icons';
import { UserRole } from '../types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: UserRole[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Grid3x3Gap, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO', 'STOREKEEPER', 'DEPARTMENT'] },
  { name: 'Stock', href: '/stock', icon: Boxes, roles: ['ADMIN', 'MANAGER', 'STOREKEEPER', 'CFO', 'PROCUREMENT', 'DEPARTMENT'] },
  { name: 'Requests', href: '/requests', icon: ClipboardCheck, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO', 'DEPARTMENT', 'STOREKEEPER'] },
  { name: 'My Requests', href: '/my-requests', icon: Clock, roles: ['DEPARTMENT'] },
  { name: 'Fulfillment', href: '/fulfillment', icon: CheckCircle, roles: ['STOREKEEPER'] },
  { name: 'Blockchain Logs', href: '/blockchain', icon: Link45deg, roles: ['ADMIN', 'MANAGER', 'PROCUREMENT', 'CFO'] },
  { name: 'Users', href: '/users', icon: People, roles: ['ADMIN'] },
];

const roleColors: Record<UserRole, string> = {
  ADMIN: 'danger',
  MANAGER: 'primary',
  PROCUREMENT: 'warning',
  CFO: 'info',
  STOREKEEPER: 'success',
  DEPARTMENT: 'secondary',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const filteredNav = navigation.filter((item) => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    setShowLogoutModal(true);
    setMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleBadgeColor = (role: UserRole | undefined): string => {
    return roleColors[role as UserRole] || 'secondary';
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ background: '#f8f9fa' }}>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm" style={{ background: '#1d4f7d' }}>
        <div className="container-fluid px-3 px-lg-4">
          {/* Brand */}
          <NavLink className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/dashboard">
            <img
              src="https://www.cbu.ac.zm/opus/assets/images/correct%20logo.png"
              alt="Copperbelt University"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <span className="d-none d-sm-inline">CBU Stores</span>
          </NavLink>

          {/* Navbar Toggler for Mobile */}
          <button
            className="navbar-toggler border-0"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <XLg size={20} /> : <List size={20} />}
          </button>

          {/* Navbar Content */}
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarNav">
            {/* Center Nav Links (Desktop) */}
            <div className="navbar-nav ms-lg-3 flex-lg-row mt-3 mt-lg-0 gap-lg-1">
              {filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `nav-link d-lg-inline-flex align-items-center gap-2 ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Right Side - User & Logout */}
            <div className="navbar-nav ms-lg-auto mt-3 mt-lg-0 gap-2 align-items-lg-center">
              {/* Role Badge */}
              <span className={`badge bg-${getRoleBadgeColor(user?.role)} px-3 py-2 fw-600`}>
                {user?.role || 'Guest'}
              </span>

              {/* Username (Desktop) */}
              <span className="d-none d-lg-inline text-white fw-500 small">
                {user?.username || 'User'}
              </span>

              {/* Logout Button */}
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                <BoxArrowRight size={18} className="me-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow-1 py-4 px-3 px-lg-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-top mt-auto">
        <div className="container-fluid px-3 px-lg-4">
          <div className="row align-items-center py-3 gy-2">
            <div className="col-md-6 text-center text-md-start">
              <small className="text-muted">
                © {new Date().getFullYear()} Copperbelt University • Blockchain-Secured Inventory System
              </small>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <span className="badge bg-light text-dark me-2">Immutable Audit Trail</span>
              <span className="badge bg-primary">Blockchain Verified</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Logout Confirmation Modal */}
      <div
        className={`modal ${showLogoutModal ? 'd-block' : ''}`}
        style={{ display: showLogoutModal ? 'block' : 'none' }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-light border-bottom-0">
              <h5 className="modal-title fw-600">Confirm Logout</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowLogoutModal(false)}
              />
            </div>
            <div className="modal-body">
              <p className="text-muted">
                Are you sure you want to sign out? You will need to log in again to continue.
              </p>
            </div>
            <div className="modal-footer bg-light border-top-0">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Backdrop */}
      {showLogoutModal && (
        <div
          className="modal-backdrop fade show"
          onClick={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}