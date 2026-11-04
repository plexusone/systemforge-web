# @plexusone/api-client

HTTP client for the application's API, with the current organization sent on
every request and TanStack Query hooks on top.

## Installation

```bash
pnpm add @plexusone/api-client @tanstack/react-query
```

## Usage

### ApiProvider

Wrap the application with `ApiProvider`. It creates the client and a
`QueryClient`, or uses the one you pass.

```tsx
import { ApiProvider } from '@plexusone/api-client';

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <ApiProvider config={{ baseUrl: '/api', onUnauthorized: () => navigate('/login') }}>
          <YourApp />
        </ApiProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
```

### Queries

```tsx
import { useApiQuery } from '@plexusone/api-client';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading } = useApiQuery<User>(
    ['users', userId],
    `/users/${encodeURIComponent(userId)}`
  );
  if (isLoading) return <Spinner />;
  return <div>{data?.name}</div>;
}
```

`usePaginatedQuery` and `useInfiniteApiQuery` work the same way for paginated
lists.

### Mutations

```tsx
import { useApiMutation } from '@plexusone/api-client';

function CreateUser() {
  const { mutate, isPending } = useApiMutation<User, CreateUserInput>('/users', {
    invalidateQueries: [['users']],
  });
  return <UserForm onSubmit={(data) => mutate(data)} isLoading={isPending} />;
}
```

`useApiDelete` sends a DELETE; `useInvalidateQueries` and `usePrefetch` give
direct cache control.

### Direct client access

```tsx
import { useApiClient } from '@plexusone/api-client';

function Export() {
  const { client } = useApiClient();
  return <button onClick={() => client.post('/exports', { kind: 'csv' })}>Export</button>;
}
```

## Request paths

A path is appended to `baseUrl`, never resolved against it: `/users` under
`https://app.example.com/api` is `https://app.example.com/api/users`. A
relative `baseUrl` such as `/api` is on the page's origin.

A path that names a scheme or host (`https://…`, `//host`), contains a
backslash or control character, or has `.` or `..` segments is refused with a
`TypeError` before any request is sent, so a request can never leave the base
with your headers. Encode IDs and other values you put in a path with
`encodeURIComponent`.

## Organizations and the cache

The client sends the current organization as `X-Organization-ID`. With
`@plexusone/tenant` in the tree, `ApiProvider` follows the organization tenant
selects, which is always one the person is a member of. Pass
`followTenant={false}` to set it yourself with `setCurrentOrgId`. The server
must still check that the person belongs to the organization in the header.

Cached data belongs to one person in one organization. When the organization
changes, or `@plexusone/auth` reports that the signed-in person changed (sign
out, session expiry or an account switch), `ApiProvider` cancels requests in
flight, drops all cached data and refetches what is on screen.

## API Reference

### ApiProvider props

| Prop           | Type              | Description                                  |
| -------------- | ----------------- | -------------------------------------------- |
| `config`       | `ApiClientConfig` | Client configuration (below)                 |
| `queryClient`  | `QueryClient`     | Use this QueryClient instead of creating one |
| `followTenant` | `boolean`         | Follow tenant's organization. Default `true` |

### ApiClientConfig

| Field            | Type                        | Description                          |
| ---------------- | --------------------------- | ------------------------------------ |
| `baseUrl`        | `string`                    | Base URL for API requests            |
| `defaultHeaders` | `Record<string, string>`    | Headers sent with every request      |
| `timeout`        | `number`                    | Request timeout in ms. Default 30000 |
| `currentOrgId`   | `string`                    | Initial organization ID              |
| `onUnauthorized` | `() => void`                | Called on a 401 response             |
| `onError`        | `(error: ApiError) => void` | Called on any error                  |

### Client methods

| Method                         | Description    |
| ------------------------------ | -------------- |
| `get(path, options?)`          | GET request    |
| `post(path, data?, options?)`  | POST request   |
| `put(path, data?, options?)`   | PUT request    |
| `patch(path, data?, options?)` | PATCH request  |
| `delete(path, options?)`       | DELETE request |
