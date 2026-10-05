# SystemForge Web

React framework for building multi-tenant SaaS applications with SystemForge.

## Overview

SystemForge Web provides a complete set of React packages for building production-ready SaaS applications:

- **Authentication** - Secure BFF-based auth with HTTP-only cookies
- **Multi-tenancy** - Organization switching, role-based access
- **Application Shell** - Responsive layout with navigation
- **Telemetry** - Event tracking and error boundaries
- **Design Tokens** - Consistent styling primitives

## Packages

| Package                    | Description                                              |
| -------------------------- | -------------------------------------------------------- |
| `@plexusone/auth`          | Authentication primitives (AuthProvider, ProtectedRoute) |
| `@plexusone/tenant`        | Multi-tenant context (TenantProvider, RequireRole)       |
| `@plexusone/api-client`    | HTTP client with auth integration                        |
| `@plexusone/telemetry`     | Event instrumentation and error tracking                 |
| `@plexusone/shell`         | Application shell components                             |
| `@plexusone/pages`         | Pre-built pages (Login, Settings, Error)                 |
| `@plexusone/design-tokens` | Design system tokens                                     |

## Quick Example

```tsx
import { AuthProvider } from '@plexusone/auth';
import { TenantProvider } from '@plexusone/tenant';
import { AppShell } from '@plexusone/shell';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <AppShell
          brandName="My App"
          navigation={[
            { label: 'Dashboard', href: '/', icon: HomeIcon },
            { label: 'Settings', href: '/settings', icon: SettingsIcon },
          ]}
        >
          <YourRoutes />
        </AppShell>
      </TenantProvider>
    </AuthProvider>
  );
}
```

## Architecture

SystemForge Web is designed to work with [SystemForge](https://github.com/plexusone/systemforge) backends using the BFF (Backend-for-Frontend) pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   React Application                      ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐││
│  │  │ AuthProvider│ │TenantProvider│ │     AppShell       │││
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BFF Proxy Layer                          │
│            (HTTP-only cookies, CSRF protection)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SystemForge Backend                         │
│         (Identity, Authorization, Multi-tenancy)             │
└─────────────────────────────────────────────────────────────┘
```

## License

MIT
