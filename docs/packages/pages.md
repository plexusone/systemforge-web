# @plexusone/pages

Pre-built pages for common application needs.

## Installation

```bash
pnpm add @plexusone/pages react-router-dom
```

## Features

- Login page with OAuth support
- User settings page
- Error pages (404, 500)
- Loading states
- Maintenance page
- Fully customizable

## Pages

### LoginPage

```tsx
import { LoginPage } from '@plexusone/pages';

function Login() {
  return (
    <LoginPage
      brandName="My App"
      brandLogo="/logo.svg"
      providers={['github', 'google']}
      onLogin={(provider) => {
        // Handle OAuth login
      }}
    />
  );
}
```

### UserSettingsPage

```tsx
import { UserSettingsPage } from '@plexusone/pages';

function Settings() {
  return (
    <UserSettingsPage
      sections={['profile', 'security', 'notifications', 'linked-accounts']}
      onSave={async (data) => {
        await updateUser(data);
      }}
    />
  );
}
```

### ErrorPage

```tsx
import { ErrorPage } from '@plexusone/pages';

function NotFound() {
  return (
    <ErrorPage
      code={404}
      title="Page Not Found"
      message="The page you're looking for doesn't exist."
      action={{ label: 'Go Home', href: '/' }}
    />
  );
}
```

### LoadingPage

```tsx
import { LoadingPage } from '@plexusone/pages';

function AppLoader() {
  return <LoadingPage message="Loading your workspace..." />;
}
```

### MaintenancePage

```tsx
import { MaintenancePage } from '@plexusone/pages';

function Maintenance() {
  return (
    <MaintenancePage
      title="We'll be right back"
      message="We're performing scheduled maintenance."
      estimatedTime="30 minutes"
    />
  );
}
```

## API Reference

### LoginPage Props

| Prop                | Type                     | Description                                                                               |
| ------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `appName`           | `string`                 | Application name                                                                          |
| `logo`              | `ReactNode`              | Logo                                                                                      |
| `oauthProviders`    | `OAuthProvider[]`        | OAuth providers to offer                                                                  |
| `showEmailForm`     | `boolean`                | Show the email and password form                                                          |
| `showRegisterLink`  | `boolean`                | Show the link to registration                                                             |
| `redirectUrl`       | `string`                 | Where to go after sign-in; only a URL on this site is followed, anything else goes to `/` |
| `onNavigate`        | `(href: string) => void` | Client-side navigation                                                                    |
| `registerUrl`       | `string`                 | Registration page                                                                         |
| `forgotPasswordUrl` | `string`                 | Password reset page                                                                       |

`redirectUrl` often comes from the address bar (`?next=…`), which is why it
must be on this site. URLs that reach `window.location` (`registerUrl`,
`forgotPasswordUrl`, `homeUrl` on ErrorPage) are followed only when they are
relative or `http(s)`.

### UserSettingsPage Props

| Prop             | Type                                           | Description                                            |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `activeTab`      | `SettingsTab`                                  | Tab to open                                            |
| `tabs`           | `SettingsTab[]`                                | Tabs to show                                           |
| `onTabChange`    | `(tab: SettingsTab) => void`                   | Called when the tab changes                            |
| `bffBaseUrl`     | `string`                                       | BFF base URL for linked accounts                       |
| `oauthProviders` | `OAuthProvider[]`                              | Providers offered for linking                          |
| `onSaveProfile`  | `(profile: { name: string }) => Promise<void>` | Saves the profile; without it the profile is read-only |
| `onChangeAvatar` | `() => void`                                   | Starts an avatar change; without it no button shows    |

### ErrorPage Props

| Prop      | Type                              | Description                 |
| --------- | --------------------------------- | --------------------------- |
| `code`    | `number`                          | Error code (404, 500, etc.) |
| `title`   | `string`                          | Error title                 |
| `message` | `string`                          | Error message               |
| `action`  | `{ label: string; href: string }` | Action button               |

### LoadingPage Props

| Prop          | Type      | Description                  |
| ------------- | --------- | ---------------------------- |
| `message`     | `string`  | Loading message              |
| `showSpinner` | `boolean` | Show spinner (default: true) |

### MaintenancePage Props

| Prop            | Type     | Description         |
| --------------- | -------- | ------------------- |
| `title`         | `string` | Page title          |
| `message`       | `string` | Maintenance message |
| `estimatedTime` | `string` | Estimated downtime  |

## Organization Management Pages

Pages for managing organization members, invitations, and settings.

### OrganizationMembersPage

Manage organization members with role editing and ownership transfer.

```tsx
import { OrganizationMembersPage } from '@plexusone/pages';

function Members() {
  return (
    <OrganizationMembersPage
      orgSlug="my-org"
      currentUserId="user-123"
      currentUserRole="owner"
      apiBaseUrl="/api"
      onMemberUpdate={() => {
        // Refresh data
      }}
      onOwnershipTransferred={() => {
        // Handle ownership change
      }}
    />
  );
}
```

**Features:**

- Member list with avatars and role badges
- Edit member roles (admin/member)
- Remove members from organization
- Transfer ownership modal (owner only)

### OrganizationInvitationsPage

Manage pending invitations to join the organization.

```tsx
import { OrganizationInvitationsPage } from '@plexusone/pages';

function Invitations() {
  return (
    <OrganizationInvitationsPage
      orgSlug="my-org"
      currentUserRole="admin"
      apiBaseUrl="/api"
      onInvitationCreated={() => {
        toast.success('Invitation sent');
      }}
      onInvitationRevoked={() => {
        toast.success('Invitation revoked');
      }}
    />
  );
}
```

**Features:**

- List pending invitations with expiration
- Create new invitations (email + role)
- Revoke pending invitations
- View invitation history

### OrganizationSettingsPage

Tabbed settings page for organization configuration.

```tsx
import { OrganizationSettingsPage } from '@plexusone/pages';

function OrgSettings() {
  return (
    <OrganizationSettingsPage
      orgSlug="my-org"
      activeTab="general"
      currentUserRole="owner"
      apiBaseUrl="/api"
      onTabChange={(tab) => {
        navigate(`/settings/${tab}`);
      }}
    />
  );
}
```

**Tabs:**

- **General** - Organization name, logo URL
- **Members** - Placeholder for embedded members page
- **Invitations** - Placeholder for embedded invitations page
- **Danger Zone** - Delete organization (owner only)

## Organization Management Props

### OrganizationMembersPage Props

| Prop                     | Type         | Description                                |
| ------------------------ | ------------ | ------------------------------------------ |
| `orgSlug`                | `string`     | Organization slug (required)               |
| `currentUserId`          | `string`     | Current user's principal ID                |
| `currentUserRole`        | `MemberRole` | User's role: `owner`, `admin`, or `member` |
| `apiBaseUrl`             | `string`     | API base URL (default: `/api`)             |
| `onMemberUpdate`         | `() => void` | Callback when member is updated            |
| `onOwnershipTransferred` | `() => void` | Callback when ownership transfers          |

### OrganizationInvitationsPage Props

| Prop                  | Type         | Description                                |
| --------------------- | ------------ | ------------------------------------------ |
| `orgSlug`             | `string`     | Organization slug (required)               |
| `currentUserRole`     | `MemberRole` | User's role: `owner`, `admin`, or `member` |
| `apiBaseUrl`          | `string`     | API base URL (default: `/api`)             |
| `onInvitationCreated` | `() => void` | Callback when invitation is created        |
| `onInvitationRevoked` | `() => void` | Callback when invitation is revoked        |

### OrganizationSettingsPage Props

| Prop              | Type                            | Description                                               |
| ----------------- | ------------------------------- | --------------------------------------------------------- |
| `orgSlug`         | `string`                        | Organization slug (required)                              |
| `activeTab`       | `OrgSettingsTab`                | Active tab: `general`, `members`, `invitations`, `danger` |
| `tabs`            | `OrgSettingsTab[]`              | Available tabs (default: all)                             |
| `currentUserId`   | `string`                        | Current user's principal ID                               |
| `currentUserRole` | `MemberRole`                    | User's role: `owner`, `admin`, or `member`                |
| `apiBaseUrl`      | `string`                        | API base URL (default: `/api`)                            |
| `onTabChange`     | `(tab: OrgSettingsTab) => void` | Tab change callback                                       |
| `onNavigate`      | `(href: string) => void`        | Navigation callback                                       |

## Types

### MemberRole

```typescript
type MemberRole = 'owner' | 'admin' | 'member';
```

### OrgSettingsTab

```typescript
type OrgSettingsTab = 'general' | 'members' | 'invitations' | 'danger';
```

### OrgMember

```typescript
interface OrgMember {
  id: string;
  principal_id: string;
  organization_id: string;
  role: MemberRole;
  permissions: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
}
```

### OrgInvitation

```typescript
interface OrgInvitation {
  id: string;
  organization_id: string;
  email?: string;
  invite_code?: string;
  role: MemberRole;
  max_uses?: number;
  use_count: number;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  inviter_name?: string;
  expires_at?: string;
  created_at: string;
}
```

## Permission Model

Organization management follows this permission model:

| Action              | Owner | Admin | Member |
| ------------------- | ----- | ----- | ------ |
| View members        | Yes   | Yes   | Yes    |
| Invite users        | Yes   | Yes   | No     |
| Invite admins       | Yes   | No    | No     |
| Edit member roles   | Yes   | Yes\* | No     |
| Remove members      | Yes   | Yes\* | No     |
| Update org settings | Yes   | Yes   | No     |
| Transfer ownership  | Yes   | No    | No     |
| Delete organization | Yes   | No    | No     |

\*Admins manage members only: granting `admin`, and changing or removing an owner or another admin, is an owner's. An admin may step down or leave

`currentUserRole` decides only which controls the pages show. The server must
enforce this table on every request: which roles may grant which roles,
and that only an owner can grant `owner` or `admin` or act on an owner or
admin. SystemForge's organization API does.

The pages encode `orgSlug` and member and invitation IDs in request paths,
and load again, with fresh state, when `orgSlug` or `apiBaseUrl` changes.
