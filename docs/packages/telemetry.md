# @plexusone/telemetry

Event instrumentation and error tracking for React applications.

## Installation

```bash
pnpm add @plexusone/telemetry
```

## Features

- Event tracking with typed schemas
- Error boundary with automatic reporting
- Page view tracking
- Multiple sink support (console, analytics)
- TypeScript-first API

## Usage

### TelemetryProvider

Wrap your application with `TelemetryProvider`:

```tsx
import { TelemetryProvider, consoleSink } from '@plexusone/telemetry';

function App() {
  return (
    <TelemetryProvider sinks={[consoleSink()]} context={{ appVersion: '1.0.0' }}>
      <YourApp />
    </TelemetryProvider>
  );
}
```

### useTrack Hook

Track custom events:

```tsx
import { useTrack } from '@plexusone/telemetry';

function CheckoutButton() {
  const track = useTrack();

  const handleClick = () => {
    track('checkout_started', {
      cartValue: 99.99,
      itemCount: 3,
    });
  };

  return <button onClick={handleClick}>Checkout</button>;
}
```

### ErrorBoundary

Catch and report errors:

```tsx
import { ErrorBoundary } from '@plexusone/telemetry';
import { ErrorPage } from '@plexusone/pages';

function App() {
  return (
    <TelemetryProvider sinks={[consoleSink()]}>
      <ErrorBoundary fallback={<ErrorPage />}>
        <YourApp />
      </ErrorBoundary>
    </TelemetryProvider>
  );
}
```

### Page View Tracking

```tsx
import { usePageView } from '@plexusone/telemetry';

function Page({ title }: { title: string }) {
  usePageView(title);

  return <div>...</div>;
}
```

## Sinks

### Console Sink

```tsx
import { consoleSink } from '@plexusone/telemetry';

<TelemetryProvider sinks={[consoleSink({ level: 'debug' })]}>
```

### Custom Sink

```tsx
const analyticsSink = {
  track: (event, properties) => {
    analytics.track(event, properties);
  },
  error: (error, context) => {
    errorReporting.captureException(error, context);
  },
};

<TelemetryProvider sinks={[analyticsSink]}>
```

## API Reference

### TelemetryProvider Props

| Prop      | Type                      | Description                   |
| --------- | ------------------------- | ----------------------------- |
| `sinks`   | `TelemetrySink[]`         | Array of telemetry sinks      |
| `context` | `Record<string, unknown>` | Global context for all events |
| `enabled` | `boolean`                 | Enable/disable telemetry      |

### useTrack Return Value

```typescript
type TrackFunction = (event: string, properties?: Record<string, unknown>) => void;
```

### TelemetrySink Interface

```typescript
interface TelemetrySink {
  track: (event: string, properties: Record<string, unknown>) => void;
  error: (error: Error, context: Record<string, unknown>) => void;
  pageView?: (path: string, title: string) => void;
}
```

## ProductGraph Integration

ProductGraph provides advanced telemetry with session management, journey tracking, and OTel semantic conventions.

### ProductGraphAdapter

```tsx
import { TelemetryProvider, ProductGraphAdapter } from '@plexusone/telemetry';

const adapter = new ProductGraphAdapter({
  projectId: 'my-project',
  endpoint: 'https://api.productgraph.io/v1/events',
  apiKey: process.env.NEXT_PUBLIC_PRODUCTGRAPH_API_KEY,
  batchSize: 20, // Events per batch (default: 20)
  batchInterval: 5000, // Flush interval in ms (default: 5000)
  sessionTimeout: 30 * 60 * 1000, // Session timeout (default: 30 min)
});

function App() {
  return (
    <TelemetryProvider config={{ adapters: [adapter] }}>
      <YourApp />
    </TelemetryProvider>
  );
}
```

### Configuration Options

| Option           | Type    | Default  | Description                     |
| ---------------- | ------- | -------- | ------------------------------- |
| `projectId`      | string  | required | ProductGraph project ID         |
| `endpoint`       | string  | required | ProductGraph API endpoint       |
| `apiKey`         | string  | -        | API key for X-PG-API-Key header |
| `batchSize`      | number  | 20       | Events per batch                |
| `batchInterval`  | number  | 5000     | Flush interval (ms)             |
| `sessionTimeout` | number  | 1800000  | Session timeout (ms)            |
| `debug`          | boolean | false    | Enable console logging          |

### Journey Tracking

Track multi-step user flows:

```tsx
import { JourneyProvider, useJourneyStep } from '@plexusone/telemetry';

function App() {
  return (
    <JourneyProvider journeyId="checkout_flow">
      <CheckoutWizard />
    </JourneyProvider>
  );
}

function PaymentStep() {
  const { enterStep, completeStep, abandonStep } = useJourneyStep(
    'payment',
    'Enter Payment Details'
  );

  useEffect(() => {
    enterStep();
    return () => completeStep();
  }, []);

  return <PaymentForm />;
}
```

### State Change Tracking

Track state changes with before/after values:

```tsx
import { useStateTracker } from '@plexusone/telemetry';

function CartPage() {
  const [items, setItems] = useState([]);

  // Tracks changes to cart.items with before/after values
  useStateTracker('cart.items', items, {
    debounce: 500, // Debounce rapid changes
  });

  return <CartList items={items} />;
}
```

### Component Path Tracking

Build component hierarchy for debugging:

```tsx
import { ComponentPathProvider, useComponentPath } from '@plexusone/telemetry';

function App() {
  return (
    <ComponentPathProvider name="App">
      <Dashboard />
    </ComponentPathProvider>
  );
}

function Widget() {
  const path = useComponentPath();
  // path = ['App', 'Dashboard', 'Widget']

  return <div>...</div>;
}
```

### Interaction Hooks

| Hook                  | Purpose                                       |
| --------------------- | --------------------------------------------- |
| `useScrollTracker`    | Track scroll depth (25%, 50%, 75%, 90%, 100%) |
| `useClickTracker`     | Track clicks with component context           |
| `useAPITracker`       | Track API calls with timing                   |
| `usePageLeaveTracker` | Track page exit and duration                  |

```tsx
import { useScrollTracker, useAPITracker } from '@plexusone/telemetry';

function ArticlePage() {
  // Track scroll depth at 25%, 50%, 75%, 100%
  useScrollTracker({ thresholds: [25, 50, 75, 100] });

  return <Article />;
}

function DataFetcher() {
  const { trackRequest, trackResponse } = useAPITracker();

  const fetchData = async () => {
    trackRequest('GET', '/api/data');
    const response = await fetch('/api/data');
    trackResponse('GET', '/api/data', response.status, duration);
  };
}
```

### OTel Semantic Conventions

ProductGraph events follow OpenTelemetry semantic conventions:

| Namespace          | Fields                                          |
| ------------------ | ----------------------------------------------- |
| `session.*`        | id                                              |
| `event.*`          | type, name, timestamp, sequence                 |
| `page.*`           | path, title, url, referrer                      |
| `ui.*`             | component.name, component.path, action, element |
| `ui.state.*`       | key, before, after                              |
| `gen_ai.journey.*` | id, step.id, step.name                          |
| `api.*`            | method, path, status_code, duration_ms          |
| `error.*`          | type, message, stack                            |

See the [ProductGraph Integration TRD](../design/productgraph/TRD.md) for full details.
