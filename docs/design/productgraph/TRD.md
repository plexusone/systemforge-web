# ProductGraph Integration TRD

**Author:** PlexusOne
**Date:** 2026-04-27
**Status:** Draft

## Overview

This document describes the technical architecture for integrating @plexusone/telemetry with ProductGraph for comprehensive frontend observability.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              React Application                               │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         TelemetryProvider                               │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │ │
│  │  │ usePageView │  │ useJourney  │  │ useState    │  │ ErrorBoundary │  │ │
│  │  │             │  │ Step        │  │ Tracker     │  │               │  │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘  │ │
│  │         │                │                │                 │          │ │
│  │         └────────────────┴────────────────┴─────────────────┘          │ │
│  │                                  │                                      │ │
│  │                       ┌──────────┴──────────┐                          │ │
│  │                       │   TelemetryClient   │                          │ │
│  │                       └──────────┬──────────┘                          │ │
│  │                                  │                                      │ │
│  │                       ┌──────────┴──────────┐                          │ │
│  │                       │ ProductGraphAdapter │                          │ │
│  │                       │   (Session Mgmt)    │                          │ │
│  │                       │   (Event Batching)  │                          │ │
│  │                       └──────────┬──────────┘                          │ │
│  └──────────────────────────────────┼──────────────────────────────────────┘ │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ POST /v1/events
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ProductGraph Service                                 │
│                                                                              │
│  ┌────────────────┐    ┌──────────────────────────────────────────────────┐ │
│  │ Event Handler  │───▶│              MultiPublisher                      │ │
│  └────────────────┘    │  ┌─────────────────┐  ┌───────────────────────┐  │ │
│                        │  │ Memory Publisher│  │   Analytics Adapter   │  │ │
│                        │  │   (Storage)     │  │      (omnidxi)        │  │ │
│                        │  └─────────────────┘  └───────────┬───────────┘  │ │
│                        └───────────────────────────────────┼──────────────┘ │
└────────────────────────────────────────────────────────────┼────────────────┘
                                                             │
                              ┌──────────────────────────────┴───────┐
                              ▼                                      ▼
                   ┌──────────────────┐                   ┌──────────────────┐
                   │    Amplitude     │                   │     Mixpanel     │
                   └──────────────────┘                   └──────────────────┘
```

## Components

### ProductGraphAdapter

**Location:** `packages/telemetry/src/adapters/productgraph.ts`

**Responsibilities:**

1. **Session Management**
   - Generate session ID (UUID v4)
   - 30-minute inactivity timeout
   - Event sequencing within session

2. **Event Transformation**
   - Map TelemetryEvent → ProductGraphEvent
   - Apply OTel semantic conventions
   - Inject context (page, user, org)

3. **Batching**
   - Buffer events (default: 20 events)
   - Flush on interval (default: 5s)
   - Flush on page unload

4. **Transport**
   - POST to /v1/events
   - API key in X-PG-API-Key header
   - Retry with exponential backoff

### Event Type Mapping

| TelemetryEventType | ProductGraph event.type | Refinements                                         |
| ------------------ | ----------------------- | --------------------------------------------------- |
| `page_view`        | `page.view`             | -                                                   |
| `action`           | `ui.click`              | Based on action: scroll, input, focus, blur, submit |
| `error`            | `error`                 | -                                                   |
| `performance`      | `performance`           | -                                                   |
| `custom`           | `custom`                | -                                                   |

### ProductGraphEvent Schema

```typescript
interface ProductGraphEvent {
  // Identity
  event_id: string; // UUID v4
  project_id: string; // From config
  'session.id': string; // Managed by adapter
  'user.id'?: string; // From identify()
  'user.anonymous_id'?: string; // localStorage fallback

  // Event classification
  'event.type': ProductGraphEventType;
  'event.name': string;
  'event.timestamp': string; // ISO8601
  'event.sequence': number; // Auto-incremented

  // Page context
  'page.path'?: string;
  'page.title'?: string;
  'page.url'?: string;
  'page.referrer'?: string;

  // UI context
  'ui.component.name'?: string;
  'ui.component.path'?: string;
  'ui.component.type'?: string;
  'ui.action'?: string;
  'ui.element'?: string;
  'ui.element.text'?: string;

  // State changes
  'ui.state.key'?: string;
  'ui.state.before'?: string;
  'ui.state.after'?: string;

  // Journey tracking
  'gen_ai.journey.id'?: string;
  'gen_ai.journey.step.id'?: string;
  'gen_ai.journey.step.name'?: string;

  // API tracking
  'api.method'?: string;
  'api.path'?: string;
  'api.status_code'?: number;
  'api.duration_ms'?: number;

  // Error tracking
  'error.type'?: string;
  'error.message'?: string;
  'error.stack'?: string;

  // Performance
  duration_ms?: number;

  // Organization
  'org.id'?: string;
  'org.name'?: string;

  // Device/viewport
  'device.viewport'?: string;

  // Custom
  metadata?: Record<string, unknown>;
}
```

## Configuration

### ProductGraphConfig

```typescript
interface ProductGraphConfig {
  // Required
  projectId: string; // ProductGraph project ID
  endpoint: string; // ProductGraph endpoint URL

  // Optional
  apiKey?: string; // X-PG-API-Key header
  sessionTimeout?: number; // Session timeout in ms (default: 30 min)
  batchSize?: number; // Events per batch (default: 20)
  batchInterval?: number; // Flush interval in ms (default: 5000)
  debug?: boolean; // Enable console logging
  headers?: Record<string, string>; // Custom headers

  // Future
  captureSnapshots?: boolean; // DOM snapshots
  snapshotQuality?: number; // JPEG quality (0-1)
}
```

### Environment Variables

| Variable                              | Description        |
| ------------------------------------- | ------------------ |
| `NEXT_PUBLIC_PRODUCTGRAPH_PROJECT_ID` | Project identifier |
| `NEXT_PUBLIC_PRODUCTGRAPH_ENDPOINT`   | API endpoint       |
| `NEXT_PUBLIC_PRODUCTGRAPH_API_KEY`    | API key (optional) |

## Hooks API

### Core Hooks

```typescript
// Page tracking (auto-tracks on mount)
usePageView(path: string, properties?: object);

// Journey tracking
const { enterStep, completeStep, abandonStep } = useJourneyStep(stepId, stepName);

// State tracking (tracks changes)
useStateTracker(key: string, value: any, options?: StateTrackerOptions);

// Component path context
const path = useComponentPath();  // ['App', 'Dashboard', 'Widget']

// API tracking
const { trackRequest, trackResponse } = useAPITracker();

// Scroll depth
useScrollTracker(options?: { thresholds: number[] });

// Error tracking (via ErrorBoundary)
<ErrorBoundary fallback={<ErrorUI />}>
  <App />
</ErrorBoundary>
```

### Usage Example

```tsx
import {
  TelemetryProvider,
  ProductGraphAdapter,
  usePageView,
  useJourneyStep,
  JourneyProvider,
  ComponentPathProvider,
} from '@plexusone/telemetry';

const adapter = new ProductGraphAdapter({
  projectId: 'proj_demo',
  endpoint: 'https://api.productgraph.io/v1/events',
  apiKey: 'pk_live_xxx',
});

function App() {
  return (
    <TelemetryProvider adapter={adapter}>
      <ComponentPathProvider name="App">
        <JourneyProvider journeyId="checkout_flow">
          <Router />
        </JourneyProvider>
      </ComponentPathProvider>
    </TelemetryProvider>
  );
}

function CheckoutPage() {
  usePageView('/checkout');
  const { enterStep, completeStep } = useJourneyStep('payment', 'Enter Payment');

  useEffect(() => {
    enterStep();
    return () => completeStep();
  }, []);

  return <PaymentForm />;
}
```

## Backend Correlation

### Trace ID Propagation

```typescript
// Frontend: Include session ID in API calls
const headers = {
  'X-Session-ID': sessionId,
  'X-Request-ID': crypto.randomUUID()
};

// Backend: Extract and attach to span
func Middleware(next http.Handler) http.Handler {
  return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    sessionID := r.Header.Get("X-Session-ID")
    requestID := r.Header.Get("X-Request-ID")

    ctx := context.WithValue(r.Context(), "session_id", sessionID)
    span := trace.SpanFromContext(ctx)
    span.SetAttributes(
      attribute.String("session.id", sessionID),
      attribute.String("request.id", requestID),
    )

    next.ServeHTTP(w, r.WithContext(ctx))
  })
}
```

## Performance Considerations

### Bundle Size

| Component           | Size (min+gzip) |
| ------------------- | --------------- |
| Core telemetry      | ~3 KB           |
| ProductGraphAdapter | ~4 KB           |
| Hooks               | ~3 KB           |
| Total               | ~10 KB          |

### Memory

- Event buffer: Max 20 events × ~1 KB = ~20 KB
- Session state: ~500 bytes
- Total: < 1 MB typical

### Network

- Batch size: 20 events (~20 KB payload)
- Interval: 5 seconds
- Worst case: 4 requests/minute

## Security

### Data Privacy

1. **PII Filtering**: Adapter should filter sensitive fields
2. **localStorage**: Only stores anonymous ID
3. **Transport**: HTTPS required in production

### API Key Protection

1. Use environment variables
2. API key is optional (project ID may suffice)
3. Backend validates against project

## Testing

### Unit Tests

```typescript
describe('ProductGraphAdapter', () => {
  it('transforms page_view events', () => {
    const adapter = new ProductGraphAdapter(config);
    const event = adapter.transform({
      type: 'page_view',
      properties: { path: '/home' },
    });
    expect(event['event.type']).toBe('page.view');
    expect(event['page.path']).toBe('/home');
  });

  it('batches events', async () => {
    const adapter = new ProductGraphAdapter({ ...config, batchSize: 2 });
    adapter.track(event1);
    adapter.track(event2);
    // Should trigger flush
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

```typescript
describe('TelemetryProvider', () => {
  it('tracks page views on route change', () => {
    render(
      <TelemetryProvider adapter={mockAdapter}>
        <Router>
          <Route path="/" component={Home} />
        </Router>
      </TelemetryProvider>
    );

    navigate('/about');
    expect(mockAdapter.track).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'page_view' })
    );
  });
});
```

## Migration Guide

### From Direct Amplitude/Mixpanel

```typescript
// Before: Direct Amplitude
import amplitude from '@amplitude/analytics-browser';
amplitude.track('button_clicked', { button: 'signup' });

// After: Via ProductGraph
import { useTelemetry } from '@plexusone/telemetry';
const { trackAction } = useTelemetry();
trackAction('button', 'click', { button: 'signup' });
// Events forward to Amplitude via ProductGraph → omnidxi
```

## Related Documents

- [PRD.md](PRD.md) - Product requirements
- [PLAN.md](PLAN.md) - Implementation plan
- [TASKS.md](TASKS.md) - Task breakdown
- [ProductGraph Events API](https://github.com/plexusone/productgraph/docs/api/events.md)
