import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeSlashFill } from 'react-bootstrap-icons';
import { getApiErrorMessage } from '../lib/api-utils';
import { CBU_LOGO_URL } from '../types';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement>(null);

  // If already authenticated, redirect to dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUsername, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center login-page">
        <div className="text-center">
          <div className="spinner-border text-white mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white fs-6">Preparing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center login-page p-3">
      <div className="card border-0 shadow-lg login-card-surface" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-4 p-md-5">
          {/* Logo inside card */}
          <div className="text-center mb-3">
            <img
              src={CBU_LOGO_URL}
              alt="Copperbelt University"
              className="mx-auto d-block"
              style={{ width: '70px', height: '70px', objectFit: 'contain' }}
            />
          </div>
          <h1 className="h5 fw-bold text-center mb-1" style={{ color: '#1A5276' }}>CBU ChainStores</h1>
          <p className="text-center text-muted small mb-4">Central Stores Management Portal</p>

          <h2 className="text-center fw-semibold mb-4" style={{ color: '#29B6F6', fontSize: '1.1rem' }}>
            Enter your credentials
          </h2>

          {error && (
            <div className="alert alert-danger py-2 small d-flex align-items-center gap-2" role="alert">
              <span>!</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="username" className="form-label small fw-semibold text-secondary">Username</label>
              <input
                ref={usernameRef}
                id="username"
                type="text"
                className="form-control login-input"
                placeholder="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label small fw-semibold text-secondary">
                Password
              </label>
              <div className="position-relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control login-input pe-5"
                  placeholder="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-link position-absolute top-50 end-0 translate-middle-y text-secondary p-0 me-2 border-0"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ background: 'transparent', boxShadow: 'none' }}
                >
                  {showPassword ? <EyeSlashFill size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-cbu-cyan login-submit-btn text-white fw-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="card-footer bg-white border-0 text-center py-3">
          <small className="text-muted">© The Copperbelt University 2025</small>
        </div>
      </div>
    </div>
  );
}