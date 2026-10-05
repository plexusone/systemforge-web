# @plexusone/tenant

Multi-tenancy primitives for organization-based applications.

## Installation

```bash
pnpm add @plexusone/tenant
```

## Features

- Organization context management
- Organization switching
- Role-based access control
- Membership management
- TypeScript-first API

## Usage

### TenantProvider

Wrap your application with `TenantProvider` (inside `AuthProvider`):

```tsx
import { AuthProvider } from '@plexusone/auth';
import { TenantProvider } from '@plexusone/tenant';

function App() {
  return (
    <AuthProvider bffBaseUrl="/api/auth">
      <TenantProvider>
        <YourApp />
      </TenantProvider>
    </AuthProvider>
  );
}
```

### useOrganization Hook

Access the current organization:

```tsx
import { useOrganization } from '@plexusone/tenant';

function OrgInfo() {
  const { organization, membership, isLoading } = useOrganization();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{organization.name}</h2>
      <p>Your role: {membership.role}</p>
    </div>
  );
}
```

### useOrganizations Hook

List and switch organizations:

```tsx
import { useOrganizations } from '@plexusone/tenant';

function OrgSwitcher() {
  const { organizations, currentOrg, switchOrg, isLoading } = useOrganizations();

  return (
    <select value={currentOrg?.id} onChange={(e) => switchOrg(e.target.value)} disabled={isLoading}>
      {organizations.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  );
}
```

### RequireRole

Restrict access based on role:

```tsx
import { RequireRole } from '@plexusone/tenant';

function AdminPanel() {
  return (
    <RequireRole roles={['admin', 'owner']} fallback={<AccessDenied />}>
      <AdminDashboard />
    </RequireRole>
  );
}
```

## API Reference

### TenantProvider Props

| Prop           | Type                      | Description                    |
| -------------- | ------------------------- | ------------------------------ |
| `defaultOrgId` | `string`                  | Default organization to select |
| `onOrgChange`  | `(orgId: string) => void` | Callback when org changes      |

### useOrganization Return Value

| Property       | Type                   | Description               |
| -------------- | ---------------------- | ------------------------- |
| `organization` | `Organization \| null` | Current organization      |
| `membership`   | `Membership \| null`   | Current user's membership |
| `isLoading`    | `boolean`              | Loading state             |
| `error`        | `Error \| null`        | Error if any              |

### Organization Type

```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  avatarUrl?: string;
  createdAt: string;
}
```

### Membership Type

```typescript
interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}
```

### RequireRole Props

| Prop       | Type        | Description                        |
| ---------- | ----------- | ---------------------------------- |
| `roles`    | `string[]`  | Allowed roles                      |
| `fallback` | `ReactNode` | Component to show if access denied |
| `children` | `ReactNode` | Protected content                  |
