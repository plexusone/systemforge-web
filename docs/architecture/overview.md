# Architecture Overview

SystemForge Web follows a modular, composable architecture designed for multi-tenant SaaS applications.

## Design Principles

1. **Security First** - BFF pattern with HTTP-only cookies, no tokens in localStorage
2. **Composable** - Use only the packages you need
3. **Type Safe** - Full TypeScript with strict types
4. **Framework Agnostic** - Works with any React framework
5. **Backend Agnostic** - Works with any backend supporting BFF pattern

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        React Application                          │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │TelemetryProv│  │ ErrorBound  │  │      AppShell           │   │  │
│  │  │    ider     │  │    ary      │  │  ┌────────┬──────────┐  │   │  │
│  │  └─────────────┘  └─────────────┘  │  │ Navbar │  Content │  │   │  │
│  │                                     │  ├────────┤          │  │   │  │
│  │  ┌─────────────┐  ┌─────────────┐  │  │Sidebar │          │  │   │  │
│  │  │ AuthProvider│  │TenantProvide│  │  │        │          │  │   │  │
│  │  │             │  │     r       │  │  └────────┴──────────┘  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  │                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐                                │  │
│  │  │ ApiProvider │  │QueryClient  │                                │  │
│  │  │             │  │  Provider   │                                │  │
│  │  └─────────────┘  └─────────────┘                                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP (cookies)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BFF Proxy Layer                                  │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  /api/auth/*    │  │  /api/users/*   │  │  /api/orgs/*    │          │
│  │                 │  │                 │  │                 │          │
│  │  - POST /login  │  │  - GET /me      │  │  - GET /        │          │
│  │  - POST /logout │  │  - PATCH /me    │  │  - POST /       │          │
│  │  - POST /refresh│  │                 │  │  - GET /:id     │          │
│  │  - GET /session │  │                 │  │                 │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  Features:                                                               │
│  - HTTP-only cookie management                                           │
│  - CSRF protection                                                       │
│  - Token refresh                                                         │
│  - Request forwarding to backend                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Internal (JWT)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SystemForge Backend                                │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │    Identity     │  │  Authorization  │  │   Multi-tenant  │          │
│  │                 │  │                 │  │                 │          │
│  │  - Users        │  │  - RBAC         │  │  - Organizations│          │
│  │  - Sessions     │  │  - SpiceDB      │  │  - Memberships  │          │
│  │  - OAuth        │  │  - Permissions  │  │  - Isolation    │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Provider Hierarchy

The recommended provider order:

```tsx
<QueryClientProvider>
  {' '}
  {/* TanStack Query */}
  <BrowserRouter>
    {' '}
    {/* React Router */}
    <TelemetryProvider>
      {' '}
      {/* Event tracking */}
      <ErrorBoundary>
        {' '}
        {/* Error handling */}
        <AuthProvider>
          {' '}
          {/* Authentication */}
          <ApiProvider>
            {' '}
            {/* HTTP client */}
            <TenantProvider>
              {' '}
              {/* Multi-tenancy */}
              <AppShell>
                {' '}
                {/* Layout */}
                <App />
              </AppShell>
            </TenantProvider>
          </ApiProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TelemetryProvider>
  </BrowserRouter>
</QueryClientProvider>
```

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │  React   │     │   BFF    │     │ Backend  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Click Login    │                │                │
     │───────────────>│                │                │
     │                │ POST /auth/login               │
     │                │───────────────>│                │
     │                │                │ Authenticate   │
     │                │                │───────────────>│
     │                │                │                │
     │                │                │<───────────────│
     │                │                │  JWT tokens    │
     │                │<───────────────│                │
     │                │  Set-Cookie    │                │
     │                │  (HTTP-only)   │                │
     │<───────────────│                │                │
     │  Redirect      │                │                │
     │                │                │                │
     │ API Request    │                │                │
     │───────────────>│                │                │
     │                │ GET /api/data  │                │
     │                │ (with cookie)  │                │
     │                │───────────────>│                │
     │                │                │ Forward with   │
     │                │                │ Bearer token   │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │<───────────────│                │
     │<───────────────│                │                │
```

## Data Flow

1. **User Action** → Component calls hook (e.g., `useAuth().login()`)
2. **Hook** → Calls API client method
3. **API Client** → Makes HTTP request with cookies
4. **BFF Proxy** → Extracts session, forwards with JWT
5. **Backend** → Processes request, returns response
6. **Response** → Flows back through layers
7. **State Update** → React Query cache updated
8. **Re-render** → UI reflects new state

## Package Dependencies

```
@plexusone/design-tokens  (standalone)
         │
         ▼
@plexusone/auth ◄──────── @plexusone/tenant
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
@plexusone/api-client    @plexusone/telemetry
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  @plexusone/shell       @plexusone/pages
```
