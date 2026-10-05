# Packages Overview

SystemForge Web is organized as a monorepo with focused, composable packages.

## Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      Application                             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   @systemforge  │     │   @systemforge  │     │   @systemforge  │
│     /shell    │     │    /pages     │     │  /telemetry   │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   @systemforge  │     │   @systemforge  │     │   @systemforge  │
│     /auth     │     │    /tenant    │     │  /api-client  │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │   @systemforge  │
                    │ /design-tokens│
                    └───────────────┘
```

## Package Summary

| Package                                      | Purpose         | Key Exports                                        |
| -------------------------------------------- | --------------- | -------------------------------------------------- |
| [@plexusone/auth](auth.md)                   | Authentication  | `AuthProvider`, `ProtectedRoute`, `useAuth`        |
| [@plexusone/tenant](tenant.md)               | Multi-tenancy   | `TenantProvider`, `RequireRole`, `useOrganization` |
| [@plexusone/api-client](api-client.md)       | HTTP client     | `ApiProvider`, `useApi`, `createClient`            |
| [@plexusone/telemetry](telemetry.md)         | Instrumentation | `TelemetryProvider`, `ErrorBoundary`               |
| [@plexusone/shell](shell.md)                 | App layout      | `AppShell`, `Sidebar`, `Navbar`                    |
| [@plexusone/pages](pages.md)                 | Pre-built pages | `LoginPage`, `ErrorPage`                           |
| [@plexusone/design-tokens](design-tokens.md) | Design system   | Colors, typography, spacing                        |

## Choosing Packages

**Minimal Setup:**

```bash
pnpm add @plexusone/auth @plexusone/tenant
```

**Full Application:**

```bash
pnpm add @plexusone/auth @plexusone/tenant @plexusone/api-client \
         @plexusone/shell @plexusone/pages @plexusone/telemetry
```

**Design System Only:**

```bash
pnpm add @plexusone/design-tokens
```
