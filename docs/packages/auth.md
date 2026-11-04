# @plexusone/auth

Authentication primitives for secure BFF-based authentication.

## Installation

```bash
pnpm add @plexusone/auth
```

## Features

- BFF (Backend-for-Frontend) authentication pattern
- HTTP-only cookie session management
- Protected route component
- OAuth provider linking
- TypeScript-first API

## Usage

### AuthProvider

Wrap your application with `AuthProvider`:

```tsx
import { AuthProvider } from '@plexusone/auth';

function App() {
  return (
    <AuthProvider bffBaseUrl="/api/auth">
      <YourApp />
    </AuthProvider>
  );
}
```

### useAuth Hook

Access authentication state and methods:

```tsx
import { useAuth } from '@plexusone/auth';

function UserInfo() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <button onClick={() => login()}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {user.name}</p>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

### ProtectedRoute

Protect routes that require authentication:

```tsx
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@plexusone/auth';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
```

### Linked Accounts

Manage OAuth provider connections:

```tsx
import { useLinkedAccounts } from '@plexusone/auth';

function LinkedAccounts() {
  const { accounts, link, unlink } = useLinkedAccounts();

  return (
    <div>
      {accounts.map((account) => (
        <div key={account.provider}>
          {account.provider}: {account.connected ? 'Connected' : 'Not connected'}
          <button
            onClick={() => (account.connected ? unlink(account.provider) : link(account.provider))}
          >
            {account.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Session over the BFF

`SessionProvider` reads `GET /bff/session` from the relying-party BFF and
`useSession` returns it: the person, their memberships keyed by
organization ID with a role per application, and the deployment's app
catalog. Sign-in is a redirect; sign-out is a same-origin POST.

```tsx
import { SessionProvider, useSession, membershipFor } from '@plexusone/auth';

function Who({ org }: { org: string }) {
  const { status, session, signIn, signOut } = useSession();
  if (status === 'loading') return null;
  if (status !== 'authenticated') return <button onClick={() => signIn()}>Sign in</button>;
  const role = membershipFor(session, org)?.applications['reports'];
  return (
    <span>
      {session.user?.name} ({role ?? 'no role'}){' '}
      <button onClick={() => void signOut()}>Sign out</button>
    </span>
  );
}

<SessionProvider onUnauthorized={() => window.location.assign('/bff/auth/login')}>
  <Who org={orgId} />
</SessionProvider>;
```

The session is re-read when the window regains focus and every five
minutes (`refreshInterval`, `refreshOnFocus`). `onUnauthorized` runs when a
signed-in session is found signed out, not after a deliberate sign-out.

### Signing out of SystemAuth too

Signing out ends the app's session at the BFF, then SystemAuth's login
session, so the next sign-in asks who the person is instead of resuming
it. `signOut` (and `logout`) asks the BFF for JSON; a BFF on SystemForge
v0.30.1 or later answers with SystemAuth's sign-out page, and the provider
submits a form there with `return_to`. SystemAuth ends its login session,
revokes the person's tokens, ends their sessions in the other apps, and
returns the browser signed out. An older BFF answers `204`, and the page
stays as before.

`endSession` on `SessionProvider` or `AuthProvider` replaces that step;
`null` leaves it out. SystemAuth must list the app's origin in
`social_login.allowed_redirect_origins`, and the app and SystemAuth must
share a site, such as `app.example.com` and `auth.example.com`.

### When the signed-in person changes

`AuthProvider` and `SessionProvider` dispatch `PRINCIPAL_CHANGE_EVENT`
(`systemforge:principal-change`) on `window` when the signed-in person signs
out, the session ends, or another account takes its place. Data cached for
the previous person must not be shown to the next one: `@plexusone/api-client`
clears its query cache on this event, and an application with its own caches
should do the same.

### Navigation URLs

A URL that came from props, the server or the address bar must be checked
before the browser goes there: `window.location.assign('javascript:…')` runs
script, and React's guard on `href` does not cover it.

| Function             | Accepts                                                        |
| -------------------- | -------------------------------------------------------------- |
| `safeHref(url)`      | Relative URLs and absolute `http(s)` URLs                      |
| `sameOriginURL(url)` | The above, on this page's origin only                          |
| `returnPath(url)`    | A path on this site, such as `/orgs/a?tab=2`                   |
| `navigateTo(url)`    | Goes to `url` if `safeHref` accepts it; returns whether it did |

Each returns the URL unchanged, or `undefined` when it is refused. The sign-in
`return_to` value is checked with `returnPath`; any other value is dropped and
the BFF uses its default landing page.

## API Reference

### AuthProvider Props

| Prop          | Type                         | Description                                                                              |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| `bffBaseUrl`  | `string`                     | Base URL for BFF auth endpoints                                                          |
| `loginPath`   | `string`                     | Path to redirect for login (default: `/login`)                                           |
| `onAuthError` | `(error: Error) => void`     | Error callback                                                                           |
| `endSession`  | `((target) => void) \| null` | Ends SystemAuth's login session after logout (default: a form POST to its sign-out page) |

### useAuth Return Value

| Property          | Type                  | Description                   |
| ----------------- | --------------------- | ----------------------------- |
| `user`            | `User \| null`        | Current user object           |
| `isAuthenticated` | `boolean`             | Whether user is authenticated |
| `isLoading`       | `boolean`             | Loading state                 |
| `login`           | `() => void`          | Initiate login flow           |
| `logout`          | `() => Promise<void>` | Logout user                   |
| `refresh`         | `() => Promise<void>` | Refresh session               |

### User Type

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}
```
