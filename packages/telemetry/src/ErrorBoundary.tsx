import { Component, type ContextType, type ReactNode, type ErrorInfo } from 'react';
import { TelemetryContext } from './TelemetryProvider';
import type { ErrorBoundaryProps, TelemetryContextValue } from './types';

/**
 * isDevelopmentBuild reports whether the bundler built for development.
 * Bundlers replace `process.env.NODE_ENV` with a string literal.
 */
function isDevelopmentBuild(): boolean {
  try {
    return process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
}

/**
 * Internal context for passing telemetry to error boundary
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary with telemetry integration
 *
 * Catches JavaScript errors in child components and reports them
 * to the telemetry system: the `telemetry` prop, or else the enclosing
 * TelemetryProvider's.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <h1>Something went wrong</h1>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps & { telemetry?: TelemetryContextValue },
  ErrorBoundaryState
> {
  static contextType = TelemetryContext;
  declare context: ContextType<typeof TelemetryContext>;

  constructor(props: ErrorBoundaryProps & { telemetry?: TelemetryContextValue }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Track error in telemetry
    (this.props.telemetry ?? this.context)?.trackError(error, {
      component: errorInfo.componentStack,
      boundary: true,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props;

      // Function fallback
      if (typeof fallback === 'function') {
        return fallback(this.state.error, this.reset);
      }

      // Element fallback
      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h2 style={{ color: '#dc2626' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={this.reset}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback component. It shows the error's message only in a
 * development build: messages can carry server responses or internal
 * details.
 */
export function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}): ReactNode {
  return (
    <div
      role="alert"
      style={{
        padding: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '20px',
      }}
    >
      <h2 style={{ color: '#dc2626', margin: '0 0 10px 0' }}>Something went wrong</h2>
      <pre
        style={{
          backgroundColor: '#fee2e2',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
        }}
      >
        {isDevelopmentBuild() ? error.message : 'An unexpected error occurred.'}
      </pre>
      <button
        onClick={reset}
        style={{
          marginTop: '10px',
          padding: '8px 16px',
          backgroundColor: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}
