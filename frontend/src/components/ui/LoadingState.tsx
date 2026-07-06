import type { ReactNode } from 'react';

export function PageSpinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5" role="status" aria-live="polite">
      <div className="spinner-border text-primary mb-3" style={{ width: '2.75rem', height: '2.75rem' }}>
        <span className="visually-hidden">{label}</span>
      </div>
      <p className="text-muted small mb-0">{label}</p>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="placeholder-glow">
          <span className="placeholder col-6 mb-2"></span>
          <span className="placeholder col-4 mb-3 d-block" style={{ height: '2rem' }}></span>
          <span className="placeholder col-8"></span>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="p-4">
      <div className="placeholder-glow">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="d-flex gap-3 mb-3">
            {Array.from({ length: columns }).map((__, colIndex) => (
              <span key={colIndex} className="placeholder col"></span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="placeholder-glow" style={{ height }}>
      <span className="placeholder w-100 h-100 d-block rounded"></span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-5 px-3">
      <div className="text-muted mb-3">{icon}</div>
      <h6 className="fw-600 text-secondary">{title}</h6>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {action}
    </div>
  );
}
