import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeSlashFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ApiErrorResponse {
  response?: {
    data?: {
      detail?: unknown;
      message?: unknown;
    };
  };
  message?: unknown;
}

function parseErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return 'Invalid credentials. Please try again.';
  const apiError = error as ApiErrorResponse;
  if (apiError.response?.data?.detail) return String(apiError.response.data.detail);
  if (apiError.response?.data?.message) return String(apiError.response.data.message);
  if (apiError.message) return String(apiError.message);
  return 'Invalid credentials. Please try again.';
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const usernameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = parseErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#0D4674', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <div className="text-center">
          <div className="spinner-border text-white mb-3" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-white fs-6 fw-500">Preparing your secure session...</p>
        </div>
      </div>
    );
  }

  const isFormValid = Boolean(username.trim() && password);

  return (
    <>
      {/* Import professional font (Inter) – for production, move this to a <link> in index.html */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
        `}
      </style>
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center p-3"
        style={{
          backgroundColor: '#0D4674',
          fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }}
      >
        <div className="w-100" style={{ maxWidth: '380px' }}>
          {/* Login Card */}
          <div
            className="card border-0 shadow-lg"
            style={{
              borderRadius: '8px',
              borderBottom: '3px solid #29B6F6',
              background: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle noise texture overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")',
                backgroundRepeat: 'repeat',
                pointerEvents: 'none',
              }}
            />
            <div className="card-body p-5 position-relative">
              {/* University Logo */}
              <div className="text-center mb-4">
                <img
                  src="https://www.cbu.ac.zm/opus/assets/images/correct%20logo.png"
                  alt="Copperbelt University"
                  style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                  className="mx-auto d-block"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Heading */}
              <h2
                className="text-center fw-semibold mb-4"
                style={{
                  color: '#29B6F6',
                  fontSize: '1.4rem',
                  letterSpacing: '-0.2px',
                  fontWeight: 600,
                }}
              >
                Enter your credentials
              </h2>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-start gap-2" role="alert" aria-live="assertive">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
                {/* Username Field */}
                <div className="mb-3">
                  <input
                    ref={usernameRef}
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      borderColor: error ? '#dc3545' : '#E0E0E0',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      height: '45px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                    }}
                    aria-label="Username"
                    aria-invalid={!!error}
                  />
                </div>

                {/* Password Field */}
                <div className="mb-2">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-lg"
                    placeholder="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={{
                      borderColor: error ? '#dc3545' : '#E0E0E0',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '4px',
                      height: '45px',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                    }}
                    aria-label="Password"
                    aria-invalid={!!error}
                  />
                </div>

                {/* Show Password Toggle */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    style={{
                      color: '#78909C',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeSlashFill size={16} /> : <Eye size={16} />}
                    <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                  </button>
                </div>

                {/* Login Button */}
                <div className="d-grid mb-3">
                  <button
                    type="submit"
                    className="btn btn-lg fw-semibold text-white"
                    disabled={!isFormValid || loading}
                    style={{
                      borderRadius: '4px',
                      backgroundColor: '#29B6F6',
                      border: 'none',
                      height: '48px',
                      fontSize: '0.95rem',
                      letterSpacing: '0.3px',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0288D1')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#29B6F6')}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden></span>
                        Authenticating...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <small style={{ color: '#FFFFFF', fontSize: '0.75rem', fontFamily: 'inherit' }}>
              © The Copperbelt University 2026
            </small>
          </div>
        </div>
      </div>
    </>
  );
}