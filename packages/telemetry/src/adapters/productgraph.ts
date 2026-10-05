/**
 * ProductGraph Adapter for @plexusone/telemetry
 *
 * This adapter sends telemetry events to ProductGraph's event ingestion API,
 * using OpenTelemetry-compatible semantic conventions.
 *
 * @example
 * ```tsx
 * import { TelemetryProvider } from '@plexusone/telemetry';
 * import { ProductGraphAdapter } from '@plexusone/telemetry/adapters/productgraph';
 *
 * const productGraph = new ProductGraphAdapter({
 *   projectId: 'my-project',
 *   endpoint: 'https://api.productgraph.io/v1/events',
 *   apiKey: 'pg_key_xxx',
 * });
 *
 * function App() {
 *   return (
 *     <TelemetryProvider config={{ adapters: [productGraph] }}>
 *       <MyApp />
 *     </TelemetryProvider>
 *   );
 * }
 * ```
 */

import type { TelemetryAdapter, TelemetryEvent, TelemetryUser, TelemetryOrg } from '../types';

// =============================================================================
// ProductGraph Event Types (OTel-compatible)
// =============================================================================

/**
 * ProductGraph event types aligned with OTel semantic conventions
 */
export type ProductGraphEventType =
  | 'page.view'
  | 'page.leave'
  | 'ui.click'
  | 'ui.input'
  | 'ui.scroll'
  | 'ui.focus'
  | 'ui.blur'
  | 'ui.submit'
  | 'state.change'
  | 'api.request'
  | 'api.response'
  | 'journey.step'
  | 'journey.conversion'
  | 'snapshot.captured'
  | 'error'
  | 'performance'
  | 'custom';

/**
 * ProductGraph event following OTel semantic conventions
 */
export interface ProductGraphEvent {
  // Identity
  event_id: string;
  project_id: string;
  'session.id': string;
  'user.id'?: string;
  'user.anonymous_id'?: string;

  // Event classification
  'event.type': ProductGraphEventType;
  'event.name': string;
  'event.timestamp': string;
  'event.sequence': number;

  // Page context
  'page.path'?: string;
  'page.title'?: string;
  'page.referrer'?: string;
  'page.url'?: string;

  // UI context
  'ui.component.name'?: string;
  'ui.component.path'?: string;
  'ui.component.type'?: string;
  'ui.action'?: string;
  'ui.element'?: string;
  'ui.element.text'?: string;
  'ui.viewport'?: string;
  'ui.scroll.position'?: number;

  // State tracking
  'ui.state.key'?: string;
  'ui.state.before'?: string;
  'ui.state.after'?: string;
  'ui.state.change_type'?: string;

  // Journey context
  'gen_ai.journey.id'?: string;
  'gen_ai.journey.step.id'?: string;
  'gen_ai.journey.step.name'?: string;
  'gen_ai.journey.conversion.status'?: string;

  // API tracking
  'api.method'?: string;
  'api.path'?: string;
  'api.status_code'?: number;
  'api.duration_ms'?: number;

  // Error tracking
  'error.type'?: string;
  'error.message'?: string;
  'error.stack'?: string;
  'error.component'?: string;

  // Performance
  duration_ms?: number;
  'performance.lcp_ms'?: number;
  'performance.fid_ms'?: number;
  'performance.cls'?: number;

  // Snapshot
  'snapshot.url'?: string;
  'snapshot.viewport'?: string;

  // Organization context
  'org.id'?: string;
  'org.name'?: string;

  // Custom metadata
  metadata?: Record<string, unknown>;
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * ProductGraph adapter configuration
 */
export interface ProductGraphConfig {
  /**
   * ProductGraph project ID
   */
  projectId: string;

  /**
   * ProductGraph event ingestion endpoint
   * @example "https://api.productgraph.io/v1/events"
   */
  endpoint: string;

  /**
   * API key for authentication (optional if using BFF proxy)
   */
  apiKey?: string;

  /**
   * Enable snapshot capture (screenshots)
   * @default false
   */
  captureSnapshots?: boolean;

  /**
   * Snapshot quality (0.1 - 1.0)
   * @default 0.8
   */
  snapshotQuality?: number;

  /**
   * Session inactivity timeout in milliseconds
   * @default 1800000 (30 minutes)
   */
  sessionTimeout?: number;

  /**
   * Batch size before sending
   * @default 20
   */
  batchSize?: number;

  /**
   * Batch interval in milliseconds
   * @default 5000
   */
  batchInterval?: number;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;

  /**
   * Custom headers for API requests
   */
  headers?: Record<string, string>;
}

// =============================================================================
// Session Management
// =============================================================================

/**
 * Session manager for ProductGraph
 */
class SessionManager {
  private sessionId: string;
  private startedAt: number;
  private lastActivityAt: number;
  private timeout: number;
  private eventSequence: number = 0;
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(timeout: number = 30 * 60 * 1000) {
    this.timeout = timeout;
    this.sessionId = this.generateSessionId();
    this.startedAt = Date.now();
    this.lastActivityAt = Date.now();

    // Check for session timeout periodically
    if (typeof window !== 'undefined') {
      this.checkInterval = setInterval(() => this.checkTimeout(), 60000);

      // Handle page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkTimeout();
        }
      });
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);
    return `sess-${timestamp}-${randomPart}`;
  }

  private checkTimeout(): void {
    if (Date.now() - this.lastActivityAt > this.timeout) {
      this.startNewSession();
    }
  }

  private startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.startedAt = Date.now();
    this.lastActivityAt = Date.now();
    this.eventSequence = 0;
  }

  /**
   * Record activity and get current session info
   */
  recordActivity(): { sessionId: string; sequence: number } {
    this.lastActivityAt = Date.now();
    this.eventSequence++;
    return {
      sessionId: this.sessionId,
      sequence: this.eventSequence,
    };
  }

  /**
   * Get session duration in milliseconds
   */
  getDuration(): number {
    return Date.now() - this.startedAt;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// =============================================================================
// ProductGraph Adapter
// =============================================================================

/**
 * ProductGraph telemetry adapter
 *
 * Sends events to ProductGraph's event ingestion API with:
 * - Session management (30-minute timeout)
 * - Event batching
 * - OTel-compatible semantic conventions
 */
export class ProductGraphAdapter implements TelemetryAdapter {
  name = 'productgraph';

  private config: ProductGraphConfig;
  private sessionManager: SessionManager;
  private user: TelemetryUser | null = null;
  private org: TelemetryOrg | null = null;
  private batch: ProductGraphEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private anonymousId: string;

  constructor(config: ProductGraphConfig) {
    this.config = {
      sessionTimeout: 30 * 60 * 1000,
      batchSize: 20,
      batchInterval: 5000,
      snapshotQuality: 0.8,
      ...config,
    };

    this.sessionManager = new SessionManager(this.config.sessionTimeout);
    this.anonymousId = this.getOrCreateAnonymousId();

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => this.flush());
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private getOrCreateAnonymousId(): string {
    const key = 'pg_anonymous_id';
    if (typeof localStorage !== 'undefined') {
      let id = localStorage.getItem(key);
      if (!id) {
        id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(key, id);
      }
      return id;
    }
    return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private generateEventId(): string {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private mapEventType(type: string): ProductGraphEventType {
    const mapping: Record<string, ProductGraphEventType> = {
      page_view: 'page.view',
      action: 'ui.click', // Will be refined based on action category
      error: 'error',
      performance: 'performance',
      custom: 'custom',
    };
    return mapping[type] || 'custom';
  }

  private getViewport(): string {
    if (typeof window !== 'undefined') {
      return `${window.innerWidth}x${window.innerHeight}`;
    }
    return 'unknown';
  }

  /**
   * Track a telemetry event
   */
  track(event: TelemetryEvent): void {
    const { sessionId, sequence } = this.sessionManager.recordActivity();

    // Determine ProductGraph event type
    let eventType = this.mapEventType(event.type);

    // Refine event type based on properties
    if (event.type === 'action' && event.properties) {
      const category = event.properties.category as string;
      const action = event.properties.action as string;

      if (category === 'component') {
        // Component lifecycle events are not sent to ProductGraph
        return;
      }

      if (action === 'scroll') {
        eventType = 'ui.scroll';
      } else if (action === 'input' || action === 'change') {
        eventType = 'ui.input';
      } else if (action === 'focus') {
        eventType = 'ui.focus';
      } else if (action === 'blur') {
        eventType = 'ui.blur';
      } else if (action === 'submit') {
        eventType = 'ui.submit';
      }
    }

    // Build ProductGraph event
    const pgEvent: ProductGraphEvent = {
      event_id: this.generateEventId(),
      project_id: this.config.projectId,
      'session.id': sessionId,
      'event.type': eventType,
      'event.name': event.name,
      'event.timestamp': new Date(event.timestamp).toISOString(),
      'event.sequence': sequence,
      'ui.viewport': this.getViewport(),
    };

    // Add user context
    if (this.user) {
      pgEvent['user.id'] = this.user.id;
    } else {
      pgEvent['user.anonymous_id'] = this.anonymousId;
    }

    // Add org context
    if (this.org) {
      pgEvent['org.id'] = this.org.id;
      pgEvent['org.name'] = this.org.name;
    }

    // Map properties based on event type
    if (event.properties) {
      const props = event.properties;

      // Page properties
      if (props.path) pgEvent['page.path'] = props.path as string;
      if (props.title) pgEvent['page.title'] = props.title as string;
      if (props.referrer) pgEvent['page.referrer'] = props.referrer as string;
      if (props.url) pgEvent['page.url'] = props.url as string;

      // UI properties
      if (props.component) pgEvent['ui.component.name'] = props.component as string;
      if (props.component_path) pgEvent['ui.component.path'] = props.component_path as string;
      if (props.element) pgEvent['ui.element'] = props.element as string;
      if (props.element_text) pgEvent['ui.element.text'] = props.element_text as string;
      if (props.action) pgEvent['ui.action'] = props.action as string;
      if (props.scroll_position !== undefined)
        pgEvent['ui.scroll.position'] = props.scroll_position as number;

      // State properties
      if (props.state_key) pgEvent['ui.state.key'] = props.state_key as string;
      if (props.state_before) pgEvent['ui.state.before'] = JSON.stringify(props.state_before);
      if (props.state_after) pgEvent['ui.state.after'] = JSON.stringify(props.state_after);

      // Journey properties
      if (props.journey_id) pgEvent['gen_ai.journey.id'] = props.journey_id as string;
      if (props.journey_step_id)
        pgEvent['gen_ai.journey.step.id'] = props.journey_step_id as string;
      if (props.journey_step_name)
        pgEvent['gen_ai.journey.step.name'] = props.journey_step_name as string;

      // API properties
      if (props.method) pgEvent['api.method'] = props.method as string;
      if (props.api_path) pgEvent['api.path'] = props.api_path as string;
      if (props.status_code) pgEvent['api.status_code'] = props.status_code as number;
      if (props.api_duration) pgEvent['api.duration_ms'] = props.api_duration as number;

      // Error properties
      if (props.error_type) pgEvent['error.type'] = props.error_type as string;
      if (props.message) pgEvent['error.message'] = props.message as string;
      if (props.stack) pgEvent['error.stack'] = props.stack as string;

      // Performance properties
      if (props.metric === 'lcp') pgEvent['performance.lcp_ms'] = props.value as number;
      if (props.metric === 'fid') pgEvent['performance.fid_ms'] = props.value as number;
      if (props.metric === 'cls') pgEvent['performance.cls'] = props.value as number;
      if (props.duration) pgEvent.duration_ms = props.duration as number;

      // Snapshot properties
      if (props.snapshot_url) pgEvent['snapshot.url'] = props.snapshot_url as string;

      // Collect remaining properties as metadata
      const knownKeys = new Set([
        'path',
        'title',
        'referrer',
        'url',
        'component',
        'component_path',
        'element',
        'element_text',
        'action',
        'category',
        'label',
        'value',
        'scroll_position',
        'state_key',
        'state_before',
        'state_after',
        'journey_id',
        'journey_step_id',
        'journey_step_name',
        'method',
        'api_path',
        'status_code',
        'api_duration',
        'error_type',
        'message',
        'stack',
        'metric',
        'duration',
        'snapshot_url',
        'unit',
        'context',
      ]);

      const metadata: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!knownKeys.has(key)) {
          metadata[key] = value;
        }
      }
      if (Object.keys(metadata).length > 0) {
        pgEvent.metadata = metadata;
      }
    }

    // Add to batch
    this.batch.push(pgEvent);

    if (this.config.debug) {
      console.log('[ProductGraph] Event:', pgEvent);
    }

    // Check if batch should be flushed
    if (this.batch.length >= (this.config.batchSize || 20)) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.config.batchInterval || 5000);
    }
  }

  /**
   * Identify a user
   */
  identify(user: TelemetryUser): void {
    this.user = user;

    if (this.config.debug) {
      console.log('[ProductGraph] Identify:', user);
    }
  }

  /**
   * Set organization context
   */
  setOrg(org: TelemetryOrg): void {
    this.org = org;

    if (this.config.debug) {
      console.log('[ProductGraph] Set Org:', org);
    }
  }

  /**
   * Clear user and org context
   */
  reset(): void {
    this.user = null;
    this.org = null;

    if (this.config.debug) {
      console.log('[ProductGraph] Reset');
    }
  }

  /**
   * Flush pending events to ProductGraph
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.batch.length === 0) return;

    const events = [...this.batch];
    this.batch = [];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };

    if (this.config.apiKey) {
      headers['X-PG-API-Key'] = this.config.apiKey;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ events }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`ProductGraph API error: ${response.status}`);
      }

      if (this.config.debug) {
        console.log(`[ProductGraph] Flushed ${events.length} events`);
      }
    } catch (error) {
      // Re-add events to batch on failure
      this.batch.unshift(...events);

      if (this.config.debug) {
        console.error('[ProductGraph] Failed to send events:', error);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.sessionManager.destroy();
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a ProductGraph adapter
 *
 * @example
 * ```tsx
 * const adapter = createProductGraphAdapter({
 *   projectId: 'my-project',
 *   endpoint: 'https://api.productgraph.io/v1/events',
 * });
 * ```
 */
export function createProductGraphAdapter(config: ProductGraphConfig): ProductGraphAdapter {
  return new ProductGraphAdapter(config);
}
