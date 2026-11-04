/**
 * Telemetry event types
 */
export type TelemetryEventType = 'page_view' | 'action' | 'error' | 'performance' | 'custom';

/**
 * Base telemetry event
 */
export interface TelemetryEvent {
  type: TelemetryEventType;
  name: string;
  timestamp: number;
  properties?: Record<string, unknown>;
}

/**
 * Page view event
 */
export interface PageViewEvent extends TelemetryEvent {
  type: 'page_view';
  properties: {
    path: string;
    title?: string;
    referrer?: string;
    [key: string]: unknown;
  };
}

/**
 * Action event (user interactions)
 */
export interface ActionEvent extends TelemetryEvent {
  type: 'action';
  properties: {
    category: string;
    action: string;
    label?: string;
    value?: number;
    [key: string]: unknown;
  };
}

/**
 * Error event
 */
export interface ErrorEvent extends TelemetryEvent {
  type: 'error';
  properties: {
    error_type: string;
    message: string;
    stack?: string;
    component?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

/**
 * Performance event
 */
export interface PerformanceEvent extends TelemetryEvent {
  type: 'performance';
  properties: {
    metric: string;
    value: number;
    unit?: string;
    [key: string]: unknown;
  };
}

/**
 * User context for telemetry
 */
export interface TelemetryUser {
  id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Organization context for telemetry
 */
export interface TelemetryOrg {
  id: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
}

/**
 * Telemetry adapter interface
 * Implement this to send events to different backends
 */
export interface TelemetryAdapter {
  /**
   * Adapter name for identification
   */
  name: string;

  /**
   * Initialize the adapter
   */
  init?(config: TelemetryConfig): Promise<void>;

  /**
   * Track an event
   */
  track(event: TelemetryEvent): void;

  /**
   * Identify a user
   */
  identify?(user: TelemetryUser): void;

  /**
   * Set organization context
   */
  setOrg?(org: TelemetryOrg): void;

  /**
   * Clear user/org context (on logout)
   */
  reset?(): void;

  /**
   * Flush any pending events
   */
  flush?(): Promise<void>;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
  /**
   * Enable/disable telemetry (default: true)
   */
  enabled?: boolean;

  /**
   * Enable debug mode (logs events to console)
   */
  debug?: boolean;

  /**
   * Minimum log level
   */
  logLevel?: LogLevel;

  /**
   * Application name
   */
  appName?: string;

  /**
   * Application version
   */
  appVersion?: string;

  /**
   * Environment (development, staging, production)
   */
  environment?: string;

  /**
   * Telemetry adapters to use
   */
  adapters?: TelemetryAdapter[];

  /**
   * Event batching: number of events to batch before sending
   */
  batchSize?: number;

  /**
   * Event batching: max time (ms) to wait before sending batch
   */
  batchInterval?: number;

  /**
   * Sample rate for events (0-1, default: 1). 0 sends nothing.
   */
  sampleRate?: number;

  /**
   * Send `document.title` with page views. Titles often name customers or
   * documents. Default false.
   */
  collectTitle?: boolean;

  /**
   * Send the referrer's origin with page views. The full referrer can carry
   * tokens from the URL the person arrived on, so only the origin is sent.
   * Default false.
   */
  collectReferrer?: boolean;

  /**
   * Send error stacks, with URLs' query strings, emails and token-like
   * strings redacted. Default true.
   */
  collectStacks?: boolean;

  /**
   * Cookie mode for the HTTP adapter's requests. Default `same-origin`:
   * cookies go only to an endpoint on the page's own origin.
   */
  credentials?: RequestCredentials;

  /**
   * Filter function to exclude events
   */
  eventFilter?: (event: TelemetryEvent) => boolean;

  /**
   * Transform function to modify events before sending
   */
  eventTransform?: (event: TelemetryEvent) => TelemetryEvent;

  /**
   * Endpoint for sending telemetry (when using built-in HTTP adapter)
   */
  endpoint?: string;
}

/**
 * Telemetry context value
 */
export interface TelemetryContextValue {
  /**
   * Track a page view
   */
  trackPageView: (path: string, properties?: Record<string, unknown>) => void;

  /**
   * Track a user action
   */
  trackAction: (category: string, action: string, properties?: Record<string, unknown>) => void;

  /**
   * Track an error
   */
  trackError: (error: Error, context?: Record<string, unknown>) => void;

  /**
   * Track a performance metric
   */
  trackPerformance: (
    metric: string,
    value: number,
    unit?: string,
    properties?: Record<string, unknown>
  ) => void;

  /**
   * Track a custom event
   */
  trackEvent: (name: string, properties?: Record<string, unknown>) => void;

  /**
   * Identify the current user
   */
  identify: (user: TelemetryUser) => void;

  /**
   * Set organization context
   */
  setOrg: (org: TelemetryOrg) => void;

  /**
   * Clear all context (on logout)
   */
  reset: () => void;

  /**
   * Check if telemetry is enabled
   */
  isEnabled: boolean;
}

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode | ((error: Error, reset: () => void) => React.ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Performance timing entry
 */
export interface PerformanceTiming {
  name: string;
  startTime: number;
  duration?: number;
}

/**
 * Props for TelemetryProvider
 */
export interface TelemetryProviderProps {
  children: React.ReactNode;
  config: TelemetryConfig;
}
