import type {
  TelemetryConfig,
  TelemetryEvent,
  TelemetryUser,
  TelemetryOrg,
  TelemetryAdapter,
  ActionEvent,
  ErrorEvent,
  PageViewEvent,
  PerformanceEvent,
} from './types';
import { scrubOrigin, scrubText, scrubUrl } from './scrub';

/**
 * Console adapter - logs events to console (useful for development)
 */
export class ConsoleAdapter implements TelemetryAdapter {
  name = 'console';

  track(event: TelemetryEvent): void {
    const emoji = {
      page_view: '📄',
      action: '🎯',
      error: '❌',
      performance: '⚡',
      custom: '📊',
    }[event.type];

    console.log(`${emoji} [Telemetry] ${event.type}: ${event.name}`, event.properties);
  }

  identify(user: TelemetryUser): void {
    console.log('👤 [Telemetry] Identify:', user);
  }

  setOrg(org: TelemetryOrg): void {
    console.log('🏢 [Telemetry] Set Org:', org);
  }

  reset(): void {
    console.log('🔄 [Telemetry] Reset');
  }
}

/** The most events an adapter holds while its endpoint is unreachable. */
export const MAX_QUEUED_EVENTS = 1000;

/** Puts unsent events back at the front of the queue, keeping it bounded. */
export function requeue<T>(queue: T[], events: T[]): void {
  queue.unshift(...events);
  if (queue.length > MAX_QUEUED_EVENTS) queue.length = MAX_QUEUED_EVENTS;
}

/**
 * HTTP adapter - sends events to a REST endpoint. Requests carry cookies
 * only to the page's own origin unless `credentials` says otherwise.
 */
export class HttpAdapter implements TelemetryAdapter {
  name = 'http';
  private endpoint: string;
  private batch: TelemetryEvent[] = [];
  private batchSize: number;
  private batchInterval: number;
  private credentials: RequestCredentials;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    endpoint: string,
    batchSize = 10,
    batchInterval = 5000,
    credentials: RequestCredentials = 'same-origin'
  ) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;
    this.credentials = credentials;
  }

  track(event: TelemetryEvent): void {
    this.batch.push(event);
    // Events wait while the endpoint is unreachable; keep only the newest.
    if (this.batch.length > MAX_QUEUED_EVENTS) {
      this.batch.splice(0, this.batch.length - MAX_QUEUED_EVENTS);
    }

    if (this.batch.length >= this.batchSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.batchInterval);
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        credentials: this.credentials,
        keepalive: true,
      });
      // A rejected batch would be rejected again; only retry a server error.
      if (response.status >= 500 || response.status === 429) requeue(this.batch, events);
    } catch (error) {
      requeue(this.batch, events);
      console.error('[Telemetry] Failed to send events:', error);
    }
  }
}

/**
 * Telemetry client for tracking events
 */
export class TelemetryClient {
  private config: TelemetryConfig;
  private adapters: TelemetryAdapter[];
  private user: TelemetryUser | null = null;
  private org: TelemetryOrg | null = null;
  private globalProperties: Record<string, unknown> = {};

  constructor(config: TelemetryConfig) {
    this.config = {
      enabled: true,
      sampleRate: 1,
      ...config,
    };

    this.adapters = config.adapters || [];

    // Add console adapter in debug mode
    if (config.debug && !this.adapters.some((a) => a.name === 'console')) {
      this.adapters.unshift(new ConsoleAdapter());
    }

    // Add HTTP adapter if endpoint provided
    if (config.endpoint && !this.adapters.some((a) => a.name === 'http')) {
      this.adapters.push(
        new HttpAdapter(config.endpoint, config.batchSize, config.batchInterval, config.credentials)
      );
    }

    // Set global properties
    if (config.appName) this.globalProperties.app_name = config.appName;
    if (config.appVersion) this.globalProperties.app_version = config.appVersion;
    if (config.environment) this.globalProperties.environment = config.environment;
  }

  /**
   * Check if event should be sampled
   */
  private shouldSample(): boolean {
    return Math.random() < (this.config.sampleRate ?? 1);
  }

  /**
   * Build event with global properties
   */
  private buildEvent(event: TelemetryEvent): TelemetryEvent {
    let enrichedEvent: TelemetryEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      properties: {
        ...this.globalProperties,
        ...event.properties,
        ...(this.user && { user_id: this.user.id }),
        ...(this.org && { org_id: this.org.id }),
      },
    };

    // Apply transform if configured
    if (this.config.eventTransform) {
      enrichedEvent = this.config.eventTransform(enrichedEvent);
    }

    return enrichedEvent;
  }

  /**
   * Track an event
   */
  track(event: TelemetryEvent): void {
    if (!this.config.enabled) return;
    if (!this.shouldSample()) return;

    // Apply filter if configured
    if (this.config.eventFilter && !this.config.eventFilter(event)) {
      return;
    }

    const enrichedEvent = this.buildEvent(event);

    for (const adapter of this.adapters) {
      try {
        adapter.track(enrichedEvent);
      } catch (error) {
        console.error(`[Telemetry] Adapter ${adapter.name} failed:`, error);
      }
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    const event: PageViewEvent = {
      type: 'page_view',
      name: 'page_view',
      timestamp: Date.now(),
      properties: {
        // Query strings and fragments often carry tokens, so they are dropped.
        path: scrubUrl(path),
        ...(this.config.collectTitle &&
          typeof document !== 'undefined' && { title: document.title }),
        ...(this.config.collectReferrer &&
          typeof document !== 'undefined' && { referrer: scrubOrigin(document.referrer) }),
        ...properties,
      },
    };

    this.track(event);
  }

  /**
   * Track a user action
   */
  trackAction(category: string, action: string, properties?: Record<string, unknown>): void {
    const event: ActionEvent = {
      type: 'action',
      name: `${category}:${action}`,
      timestamp: Date.now(),
      properties: {
        category,
        action,
        ...properties,
      },
    };

    this.track(event);
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    const event: ErrorEvent = {
      type: 'error',
      name: error.name || 'Error',
      timestamp: Date.now(),
      properties: {
        error_type: error.name,
        message: scrubText(error.message ?? ''),
        ...(this.config.collectStacks !== false &&
          error.stack && { stack: scrubText(error.stack, 4000) }),
        context,
      },
    };

    this.track(event);
  }

  /**
   * Track a performance metric
   */
  trackPerformance(
    metric: string,
    value: number,
    unit?: string,
    properties?: Record<string, unknown>
  ): void {
    const event: PerformanceEvent = {
      type: 'performance',
      name: metric,
      timestamp: Date.now(),
      properties: {
        metric,
        value,
        unit,
        ...properties,
      },
    };

    this.track(event);
  }

  /**
   * Track a custom event
   */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    this.track({
      type: 'custom',
      name,
      timestamp: Date.now(),
      properties,
    });
  }

  /**
   * Identify the current user
   */
  identify(user: TelemetryUser): void {
    if (!this.config.enabled) return;
    this.user = user;

    for (const adapter of this.adapters) {
      try {
        adapter.identify?.(user);
      } catch (error) {
        console.error(`[Telemetry] Adapter ${adapter.name} identify failed:`, error);
      }
    }
  }

  /**
   * Set organization context
   */
  setOrg(org: TelemetryOrg): void {
    if (!this.config.enabled) return;
    this.org = org;

    for (const adapter of this.adapters) {
      try {
        adapter.setOrg?.(org);
      } catch (error) {
        console.error(`[Telemetry] Adapter ${adapter.name} setOrg failed:`, error);
      }
    }
  }

  /**
   * Clear all context
   */
  reset(): void {
    this.user = null;
    this.org = null;

    for (const adapter of this.adapters) {
      try {
        adapter.reset?.();
      } catch (error) {
        console.error(`[Telemetry] Adapter ${adapter.name} reset failed:`, error);
      }
    }
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    await Promise.all(
      this.adapters.map((adapter) =>
        adapter.flush?.().catch((error) => {
          console.error(`[Telemetry] Adapter ${adapter.name} flush failed:`, error);
        })
      )
    );
  }

  /**
   * Check if telemetry is enabled
   */
  get isEnabled(): boolean {
    return this.config.enabled ?? true;
  }
}

/**
 * Create a telemetry client
 */
export function createTelemetryClient(config: TelemetryConfig): TelemetryClient {
  return new TelemetryClient(config);
}
