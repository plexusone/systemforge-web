# ProductGraph Integration Tasks

**Last Updated:** 2026-04-27

## Overview

Task breakdown for integrating @plexusone/telemetry with ProductGraph.

## Phase 1: Documentation

### P1.1: Design Documents

- [x] Create PRD.md with product requirements
- [x] Create TRD.md with technical specification
- [x] Create PLAN.md with implementation phases
- [x] Create TASKS.md (this file)

### P1.2: Package Documentation

- [ ] Update packages/telemetry/README.md with ProductGraph examples
- [ ] Add JSDoc comments to ProductGraphAdapter
- [ ] Add JSDoc comments to productgraph hooks
- [ ] Create API reference in docs/

### P1.3: Usage Examples

- [ ] Basic page tracking example
- [ ] Journey tracking example
- [ ] State change tracking example
- [ ] Error boundary example
- [ ] Backend correlation example

## Phase 2: Testing

### P2.1: Unit Tests

- [ ] ProductGraphAdapter.transform() tests
- [ ] ProductGraphAdapter.track() tests
- [ ] SessionManager tests
- [ ] Event batching tests
- [ ] Flush on unload tests

### P2.2: Hook Tests

- [ ] usePageView tests
- [ ] useJourneyStep tests
- [ ] useStateTracker tests
- [ ] useScrollTracker tests
- [ ] useAPITracker tests
- [ ] useComponentPath tests

### P2.3: Integration Tests

- [ ] TelemetryProvider with ProductGraphAdapter
- [ ] JourneyProvider context
- [ ] ComponentPathProvider hierarchy
- [ ] ErrorBoundary error tracking
- [ ] Mock server for event validation

### P2.4: Example App

- [ ] Create examples/productgraph-demo/
- [ ] Multi-page navigation demo
- [ ] Checkout journey demo
- [ ] Error simulation demo
- [ ] API call tracking demo

## Phase 3: Backend Correlation

### P3.1: Correlation Headers

- [ ] Add getCorrelationHeaders() to ProductGraphAdapter
- [ ] Generate X-Request-ID per request
- [ ] Include X-Session-ID in API calls
- [ ] Document header propagation

### P3.2: Enhanced API Tracker

- [ ] Create useCorrelatedFetch() hook
- [ ] Inject correlation headers automatically
- [ ] Track request/response timing
- [ ] Log correlation IDs in debug mode

### P3.3: systemforge Middleware

- [ ] Document middleware integration
- [ ] Add correlation extraction example
- [ ] Link to systemforge observability docs

## Phase 4: SSR Support

### P4.1: SSR-Safe Initialization

- [ ] Create createProductGraphAdapter() factory
- [ ] Implement NoopAdapter for server
- [ ] Handle typeof window checks
- [ ] Test with Next.js

### P4.2: Framework Guides

- [ ] Next.js App Router guide
- [ ] Next.js Pages Router guide
- [ ] Remix guide
- [ ] Hydration troubleshooting

### P4.3: Client Components

- [ ] Mark components with 'use client'
- [ ] Test hydration scenarios
- [ ] Handle strict mode double-render

## Phase 5: Performance

### P5.1: Bundle Optimization

- [ ] Audit current bundle size
- [ ] Identify tree-shaking issues
- [ ] Split advanced features to separate entry
- [ ] Measure with bundlephobia

### P5.2: Runtime Optimization

- [ ] Profile event dispatch
- [ ] Optimize batching algorithm
- [ ] Consider Web Worker for heavy lifting
- [ ] Memory profiling

### P5.3: Release

- [ ] Update package.json version to 1.0.0
- [ ] Update CHANGELOG.md
- [ ] Create release notes
- [ ] Publish to npm

## Backlog

### Future Enhancements

- [ ] React DevTools integration
- [ ] Replay/session recording support
- [ ] A/B testing adapter
- [ ] Custom event schemas
- [ ] Real-time event streaming
- [ ] Offline event queue
- [ ] Consent management integration

## Completed

- [x] ProductGraphAdapter implementation (644 lines)
- [x] Session management with 30-minute timeout
- [x] Event batching (20 events, 5s interval)
- [x] OTel semantic convention compliance
- [x] Component path tracking hooks
- [x] State change tracking hooks
- [x] Journey step tracking hooks
- [x] Scroll depth tracking
- [x] API call timing tracking
- [x] Error boundary integration
- [x] TypeScript type definitions
- [x] Package exports configuration

## Notes

### Priority Legend

- P0: Critical path, blocks release
- P1: Important, should have for release
- P2: Nice to have
- P3: Future consideration

### Current Focus

Phase 1: Documentation - completing design docs and package documentation.

### Blockers

None currently identified.

## Related Documents

- [PRD.md](PRD.md) - Product requirements
- [TRD.md](TRD.md) - Technical requirements
- [PLAN.md](PLAN.md) - Implementation plan
