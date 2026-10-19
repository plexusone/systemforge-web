import type { Connection, Manifest } from './types';

/** An error from the console's API, with its HTTP status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Where the console's API is served. */
export const API_BASE = '/console/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    let message = res.statusText || `request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Not JSON; the status line is the message.
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const conns = (org: string) => `/v1/organizations/${encodeURIComponent(org)}/connections`;
const conn = (org: string, id: string) => `${conns(org)}/${encodeURIComponent(id)}`;

/** The console's API. Every call runs as the signed-in person. */
export const api = {
  providers: () => request<{ providers: Manifest[] }>('/v1/providers').then((r) => r.providers),
  connections: (org: string) =>
    request<{ connections: Connection[] }>(conns(org)).then((r) => r.connections),
  create: (
    org: string,
    input: {
      provider: string;
      authMethod: string;
      displayName: string;
      fields: Record<string, string>;
      rotation?: string;
    }
  ) => request<Connection>(conns(org), { method: 'POST', body: JSON.stringify(input) }),
  rename: (org: string, id: string, displayName: string) =>
    request<Connection>(conn(org, id), { method: 'PATCH', body: JSON.stringify({ displayName }) }),
  test: (org: string, id: string) =>
    request<Connection>(`${conn(org, id)}/test`, { method: 'POST' }),
  reconnect: (org: string, id: string, fields: Record<string, string>) =>
    request<Connection>(`${conn(org, id)}/reconnect`, {
      method: 'POST',
      body: JSON.stringify({ fields }),
    }),
  disconnect: (org: string, id: string) => request<Connection>(conn(org, id), { method: 'DELETE' }),
  /** The return address to use, if sign-in's redirect policy allows it. */
  returnTo: (url: string) =>
    request<{ url: string }>(`/v1/return-to?url=${encodeURIComponent(url)}`).then((r) => r.url),
};
