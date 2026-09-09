import { Component } from 'react';
import '../styles/ErrorBoundary.css';

/**
 * ErrorBoundary — React class component that catches runtime JavaScript errors
 * anywhere in the child component tree and renders a professional TRACE recovery UI
 * instead of a white screen.
 *
 * Must be a class component because React does not support error boundaries
 * via hooks (as of React 19).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console for development diagnostics
    console.error('[TRACE Error Boundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  handleFullReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="error-boundary__title font-display">Unable to load this section</h2>
            <p className="error-boundary__message">
              An unexpected error occurred while rendering this page.
              Your records are safe — no data has been lost.
            </p>
            {this.state.error && (
              <details className="error-boundary__details">
                <summary className="error-boundary__details-toggle font-mono">
                  Technical details
                </summary>
                <pre className="error-boundary__stack font-mono">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="error-boundary__actions">
              <button
                className="error-boundary__btn error-boundary__btn--primary"
                onClick={this.handleReload}
              >
                Reload Section
              </button>
              <button
                className="error-boundary__btn error-boundary__btn--secondary"
                onClick={this.handleFullReload}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
