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

## API Reference

### AuthProvider Props

| Prop          | Type                     | Description                                    |
| ------------- | ------------------------ | ---------------------------------------------- |
| `bffBaseUrl`  | `string`                 | Base URL for BFF auth endpoints                |
| `loginPath`   | `string`                 | Path to redirect for login (default: `/login`) |
| `onAuthError` | `(error: Error) => void` | Error callback                                 |

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
