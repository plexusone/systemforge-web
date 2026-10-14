# ProductGraph Integration PRD

**Author:** PlexusOne
**Date:** 2026-04-27
**Status:** Draft

## Overview

This document defines the product requirements for integrating ProductGraph with @plexusone/telemetry to provide a complete frontend-to-backend observability pipeline.

## Problem Statement

Modern SaaS applications need comprehensive product analytics that:

1. **Bypass ad blockers** - Client-side analytics are increasingly blocked
2. **Unify data sources** - Events from frontend, backend, and external systems
3. **Track user journeys** - Multi-step flows across pages and sessions
4. **Correlate with backend traces** - Link frontend events to backend spans
5. **Forward to multiple providers** - Amplitude, Mixpanel, and custom systems

## Goals

### Primary Goals

1. **Complete ProductGraph adapter** in @plexusone/telemetry (DONE)
2. **Document usage patterns** for common scenarios
3. **Enable backend correlation** via trace ID propagation
4. **Support multi-provider forwarding** via ProductGraph → omnidxi

### Secondary Goals

1. **Reduce SDK bundle size** with tree-shaking
2. **Provide React DevTools integration** for debugging
3. **Support server-side rendering** (Next.js, Remix)

## User Stories

### US-1: Basic Event Tracking

As a developer, I want to track page views and user actions so that I can understand user behavior.

**Acceptance Criteria:**

- Configure ProductGraphAdapter with project ID and endpoint
- Track page views automatically on route change
- Track button clicks with component context
- Events appear in ProductGraph dashboard

### US-2: Journey Tracking

As a product manager, I want to track multi-step user journeys so that I can measure conversion funnels.

**Acceptance Criteria:**

- Define journey with steps (e.g., checkout flow)
- Track step entry, completion, and abandonment
- Measure time between steps
- Report conversion rates

### US-3: State Change Tracking

As a developer, I want to track state changes so that I can debug user sessions.

**Acceptance Criteria:**

- Track state key, before value, after value
- Support debouncing for rapid changes
- Filter sensitive state keys

### US-4: Backend Correlation

As a DevOps engineer, I want to correlate frontend events with backend traces so that I can debug end-to-end issues.

**Acceptance Criteria:**

- Propagate session ID to backend via headers
- Include trace ID in API calls
- Link ProductGraph events to OpenTelemetry spans

### US-5: Multi-Provider Analytics

As a data analyst, I want events forwarded to Amplitude and Mixpanel so that I can use existing analysis tools.

**Acceptance Criteria:**

- Events flow: Frontend → ProductGraph → omnidxi → Amplitude/Mixpanel
- No frontend changes required
- Event properties preserved in forwarding

## Requirements

### Functional Requirements

| ID    | Requirement                                         | Priority |
| ----- | --------------------------------------------------- | -------- |
| FR-1  | ProductGraphAdapter tracks all TelemetryEvent types | P0       |
| FR-2  | Session management with 30-minute timeout           | P0       |
| FR-3  | Event batching (20 events, 5s interval)             | P0       |
| FR-4  | OTel semantic convention compliance                 | P0       |
| FR-5  | Component path tracking                             | P1       |
| FR-6  | State change tracking with before/after             | P1       |
| FR-7  | Journey step tracking                               | P1       |
| FR-8  | Scroll depth tracking                               | P2       |
| FR-9  | API call timing tracking                            | P1       |
| FR-10 | Error boundary integration                          | P0       |

### Non-Functional Requirements

| ID    | Requirement                      | Target  |
| ----- | -------------------------------- | ------- |
| NFR-1 | Bundle size (minified + gzipped) | < 15 KB |
| NFR-2 | Event dispatch latency           | < 50ms  |
| NFR-3 | Memory footprint                 | < 5 MB  |
| NFR-4 | Browser support                  | ES2020+ |
| NFR-5 | React version                    | ^18.0.0 |

## Success Metrics

| Metric                      | Target                    | Measurement             |
| --------------------------- | ------------------------- | ----------------------- |
| SDK adoption                | 100% of new projects      | Package installs        |
| Event delivery rate         | > 99.9%                   | ProductGraph dashboard  |
| Journey completion tracking | Active in 50% of projects | Journey events received |
| Backend correlation         | Active in 30% of projects | Correlated traces       |

## Out of Scope

- Mobile SDK (Swift/Kotlin) - separate project
- Replay/session recording - future enhancement
- A/B testing integration - separate adapter
- Real-time streaming to frontend - ProductGraph roadmap

## Dependencies

| Dependency   | Version | Purpose                 |
| ------------ | ------- | ----------------------- |
| ProductGraph | v0.2.0+ | Event ingestion backend |
| omnidxi      | v0.1.0+ | Analytics forwarding    |
| React        | ^18.0.0 | UI framework            |

## Timeline

| Milestone              | Target Date |
| ---------------------- | ----------- |
| Adapter implementation | DONE        |
| Documentation          | 2026-04-30  |
| Example app            | 2026-05-05  |
| v1.0.0 release         | 2026-05-10  |

## Related Documents

- [TRD.md](TRD.md) - Technical requirements
- [PLAN.md](PLAN.md) - Implementation plan
- [TASKS.md](TASKS.md) - Task breakdown
