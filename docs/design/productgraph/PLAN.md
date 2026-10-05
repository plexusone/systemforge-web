# ProductGraph Integration Plan

**Author:** PlexusOne
**Date:** 2026-04-27
**Status:** In Progress

## Executive Summary

Integrate @plexusone/telemetry with ProductGraph to provide a complete frontend-to-backend observability pipeline with multi-provider analytics forwarding.

## Current State

### Completed

- ProductGraphAdapter implementation (644 lines)
- Session management with 30-minute timeout
- Event batching (20 events, 5s interval)
- OTel semantic convention compliance
- Component path tracking
- State change tracking
- Journey step tracking
- Scroll depth tracking
- API call timing
- Error boundary integration

### Remaining

- Documentation and examples
- Unit and integration tests
- Backend correlation (trace ID propagation)
- SSR support (Next.js, Remix)
- Performance optimization

## Implementation Phases

### Phase 1: Documentation (Current)

**Goal:** Complete documentation for existing implementation.

**Deliverables:**

1. API reference documentation
2. Usage examples for common scenarios
3. Configuration guide
4. Migration guide from direct analytics

**Files:**

- `docs/design/productgraph/PRD.md` - Product requirements
- `docs/design/productgraph/TRD.md` - Technical requirements
- `docs/design/productgraph/PLAN.md` - This document
- `docs/design/productgraph/TASKS.md` - Task breakdown
- `packages/telemetry/README.md` - Package documentation

### Phase 2: Testing

**Goal:** Comprehensive test coverage.

**Deliverables:**

1. Unit tests for ProductGraphAdapter
2. Unit tests for hooks
3. Integration tests with mock server
4. E2E tests with example app

**Files:**

- `packages/telemetry/src/adapters/productgraph.test.ts`
- `packages/telemetry/src/hooks/productgraph.test.ts`
- `packages/telemetry/src/TelemetryProvider.test.tsx`
- `examples/productgraph-demo/` - Example app

### Phase 3: Backend Correlation

**Goal:** Enable frontend-backend trace correlation.

**Deliverables:**

1. Session ID propagation via headers
2. Request ID generation
3. systemforge middleware integration
4. Correlation documentation

**Implementation:**

```typescript
// Enhanced ProductGraphAdapter with correlation
class ProductGraphAdapter {
  getCorrelationHeaders(): Record<string, string> {
    return {
      'X-Session-ID': this.sessionManager.getSessionId(),
      'X-Request-ID': crypto.randomUUID(),
      'X-Trace-ID': this.getTraceId(),
    };
  }
}

// useAPITracker enhanced
function useAPITracker() {
  const telemetry = useTelemetry();
  const adapter = telemetry.adapter as ProductGraphAdapter;

  return {
    fetch: async (url: string, options?: RequestInit) => {
      const headers = {
        ...options?.headers,
        ...adapter.getCorrelationHeaders(),
      };
      const start = performance.now();
      const response = await fetch(url, { ...options, headers });
      const duration = performance.now() - start;

      telemetry.track({
        type: 'custom',
        name: 'api.response',
        properties: {
          method: options?.method || 'GET',
          path: new URL(url).pathname,
          status_code: response.status,
          duration_ms: Math.round(duration),
        },
      });

      return response;
    },
  };
}
```

### Phase 4: SSR Support

**Goal:** Support server-side rendering frameworks.

**Deliverables:**

1. SSR-safe adapter initialization
2. Next.js app router support
3. Remix support
4. Hydration handling

**Implementation:**

```typescript
// SSR-safe adapter
function createProductGraphAdapter(config: ProductGraphConfig) {
  if (typeof window === 'undefined') {
    return new NoopAdapter(); // Server-side
  }
  return new ProductGraphAdapter(config);
}

// Next.js usage
'use client';
import { TelemetryProvider, createProductGraphAdapter } from '@plexusone/telemetry';

const adapter = createProductGraphAdapter({
  projectId: process.env.NEXT_PUBLIC_PRODUCTGRAPH_PROJECT_ID!,
  endpoint: process.env.NEXT_PUBLIC_PRODUCTGRAPH_ENDPOINT!
});

export function Providers({ children }) {
  return (
    <TelemetryProvider adapter={adapter}>
      {children}
    </TelemetryProvider>
  );
}
```

### Phase 5: Performance Optimization

**Goal:** Optimize bundle size and runtime performance.

**Deliverables:**

1. Tree-shaking optimization
2. Lazy loading of advanced features
3. Web Worker for batching (optional)
4. Bundle size audit

**Targets:**

| Metric                 | Current | Target   |
| ---------------------- | ------- | -------- |
| Bundle size (min+gzip) | ~10 KB  | < 8 KB   |
| Event dispatch latency | ~30ms   | < 20ms   |
| Memory footprint       | ~500 KB | < 300 KB |

## Timeline

| Phase                        | Duration | Target     |
| ---------------------------- | -------- | ---------- |
| Phase 1: Documentation       | 3 days   | 2026-04-30 |
| Phase 2: Testing             | 5 days   | 2026-05-07 |
| Phase 3: Backend Correlation | 3 days   | 2026-05-12 |
| Phase 4: SSR Support         | 3 days   | 2026-05-15 |
| Phase 5: Performance         | 2 days   | 2026-05-19 |

## Dependencies

### Internal

| Dependency   | Version | Status |
| ------------ | ------- | ------ |
| ProductGraph | v0.2.0  | Ready  |
| omnidxi      | v0.1.0  | Ready  |

### External

| Dependency | Version | Purpose      |
| ---------- | ------- | ------------ |
| React      | ^18.0.0 | UI framework |
| TypeScript | ^5.0.0  | Type safety  |

## Risks

| Risk                     | Impact | Mitigation                      |
| ------------------------ | ------ | ------------------------------- |
| Bundle size growth       | Medium | Tree-shaking, lazy loading      |
| SSR hydration mismatches | High   | Client-only initialization      |
| Ad blocker evolution     | Low    | Backend forwarding handles this |
| Breaking API changes     | Medium | Semantic versioning             |

## Success Criteria

1. **Documentation**: Complete API reference and examples
2. **Testing**: >80% code coverage
3. **Performance**: Bundle < 8 KB, latency < 20ms
4. **Adoption**: Used in 2+ internal projects

## Related Documents

- [PRD.md](PRD.md) - Product requirements
- [TRD.md](TRD.md) - Technical requirements
- [TASKS.md](TASKS.md) - Task breakdown
