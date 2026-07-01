import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<unknown>) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: 'Something went wrong. Please try again.',
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      errorMessage: error.message || 'Something went wrong. Please try again.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught frontend error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-white py-5 px-3">
          <div className="text-center" role="alert" aria-live="assertive">
            <h1 className="display-6 fw-bold text-dark">Something went wrong</h1>
            <p className="text-muted mb-4">{this.state.errorMessage}</p>
            <button className="btn btn-primary px-4 py-2" onClick={this.handleRetry}>
              Reload the app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
