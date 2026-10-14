# SystemForge Web

React framework for building multi-tenant SaaS applications with SystemForge.

## Packages

| Package                    | Description               | npm                                                                                                                     |
| -------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `@plexusone/auth`          | Authentication primitives | [![npm](https://img.shields.io/npm/v/@plexusone/auth)](https://www.npmjs.com/package/@plexusone/auth)                   |
| `@plexusone/tenant`        | Multi-tenant context      | [![npm](https://img.shields.io/npm/v/@plexusone/tenant)](https://www.npmjs.com/package/@plexusone/tenant)               |
| `@plexusone/api-client`    | HTTP client               | [![npm](https://img.shields.io/npm/v/@plexusone/api-client)](https://www.npmjs.com/package/@plexusone/api-client)       |
| `@plexusone/telemetry`     | Event instrumentation     | [![npm](https://img.shields.io/npm/v/@plexusone/telemetry)](https://www.npmjs.com/package/@plexusone/telemetry)         |
| `@plexusone/shell`         | Application shell         | [![npm](https://img.shields.io/npm/v/@plexusone/shell)](https://www.npmjs.com/package/@plexusone/shell)                 |
| `@plexusone/pages`         | Pre-built pages           | [![npm](https://img.shields.io/npm/v/@plexusone/pages)](https://www.npmjs.com/package/@plexusone/pages)                 |
| `@plexusone/design-tokens` | Design system tokens      | [![npm](https://img.shields.io/npm/v/@plexusone/design-tokens)](https://www.npmjs.com/package/@plexusone/design-tokens) |

## Quick Start

```bash
# Install packages
pnpm add @plexusone/shell @plexusone/auth @plexusone/tenant

# Wrap your app
import { AuthProvider } from '@plexusone/auth';
import { TenantProvider } from '@plexusone/tenant';
import { AppShell } from '@plexusone/shell';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppShell>
          <YourApp />
        </AppShell>
      </TenantProvider>
    </AuthProvider>
  );
}
```

## Telemetry with ProductGraph

Track user behavior, journeys, and performance with ProductGraph integration:

```typescript
import { TelemetryProvider, ProductGraphAdapter, usePageView, useJourneyStep } from '@plexusone/telemetry';

const adapter = new ProductGraphAdapter({
  projectId: 'my-project',
  endpoint: 'https://api.productgraph.io/v1/events',
});

function App() {
  return (
    <TelemetryProvider config={{ adapters: [adapter] }}>
      <Router />
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

## Documentation

- [API Documentation](https://plexusone.github.io/systemforge-web/)
- [ProductGraph Integration](docs/specs/initiatives/invention/productgraph/TRD.md)
- [Changelog](CHANGELOG.md)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run development mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
