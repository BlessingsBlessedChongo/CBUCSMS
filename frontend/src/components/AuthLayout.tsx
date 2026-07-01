// src/components/AuthLayout.tsx
import Logo from './Logo';

export default function AuthLayout({ children, title, subtitle }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center login-background py-5">
      <div className="container-fluid px-3">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
            <div className="text-center mb-4">
              <Logo />
            </div>

            <div className="card auth-card shadow-lg border-0 rounded-4 overflow-hidden mx-auto">
              <div className="card-header bg-white border-0 pt-4 pb-2 text-center">
                <h4 className="fw-bold mb-1 login-header-title">{title}</h4>
                {subtitle && <p className="text-muted small mt-1">{subtitle}</p>}
              </div>
              <div className="card-body px-4 pb-4">
                {children}
              </div>
              <div className="card-footer bg-light border-0 py-4 text-center">
                <p className="text-muted small mb-0">
                  © {new Date().getFullYear()} Copperbelt University. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}