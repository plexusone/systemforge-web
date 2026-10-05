# @plexusone/api-client

HTTP client with authentication and tenant context integration.

## Installation

```bash
pnpm add @plexusone/api-client @tanstack/react-query
```

## Features

- Automatic authentication headers
- Tenant context injection
- TanStack Query integration
- Request/response interceptors
- TypeScript-first API

## Usage

### ApiProvider

Wrap your application with `ApiProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiProvider } from '@plexusone/api-client';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiProvider baseUrl="/api">
          <YourApp />
        </ApiProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

### useApi Hook

Make API calls with automatic auth:

```tsx
import { useApi } from '@plexusone/api-client';

function UserList() {
  const api = useApi();

  const { data, isLoading } = api.useQuery(['users'], '/users');

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Mutations

```tsx
import { useApi } from '@plexusone/api-client';

function CreateUser() {
  const api = useApi();

  const mutation = api.useMutation('/users', {
    method: 'POST',
    onSuccess: () => {
      // Handle success
    },
  });

  const handleSubmit = (data: CreateUserData) => {
    mutation.mutate(data);
  };

  return <UserForm onSubmit={handleSubmit} isLoading={mutation.isPending} />;
}
```

### Direct Client Access

```tsx
import { useApiClient } from '@plexusone/api-client';

function DownloadReport() {
  const client = useApiClient();

  const download = async () => {
    const response = await client.get('/reports/download', {
      responseType: 'blob',
    });
    // Handle blob response
  };

  return <button onClick={download}>Download</button>;
}
```

## API Reference

### ApiProvider Props

| Prop      | Type                        | Description               |
| --------- | --------------------------- | ------------------------- |
| `baseUrl` | `string`                    | Base URL for API requests |
| `headers` | `Record<string, string>`    | Additional headers        |
| `onError` | `(error: ApiError) => void` | Global error handler      |

### useApi Return Value

| Method                                  | Description              |
| --------------------------------------- | ------------------------ |
| `useQuery(key, path, options?)`         | GET request with caching |
| `useMutation(path, options?)`           | POST/PUT/DELETE request  |
| `useInfiniteQuery(key, path, options?)` | Paginated queries        |

### Client Methods

| Method                         | Description    |
| ------------------------------ | -------------- |
| `get(path, options?)`          | GET request    |
| `post(path, data?, options?)`  | POST request   |
| `put(path, data?, options?)`   | PUT request    |
| `patch(path, data?, options?)` | PATCH request  |
| `delete(path, options?)`       | DELETE request |
