import type { ReactNode } from 'react';
import { SessionClient, SessionProvider, type WireSession } from '@plexusone/auth';

/** A person in two organizations with a three-app catalog. */
export const wire: WireSession = {
  authenticated: true,
  user: {
    id: 'p-1',
    name: 'Ada',
    email: 'ada@example.com',
    memberships: [
      {
        organization_id: 'org-1',
        organization_name: 'Acme',
        organization_slug: 'acme',
        role: 'owner',
        applications: { build: 'admin', agents: 'viewer' },
      },
      {
        organization_id: 'org-2',
        organization_slug: 'side',
        role: 'member',
        applications: { build: 'editor' },
      },
    ],
  },
  apps: [
    { id: 'build', name: 'Build', url: 'https://app.example.com' },
    { id: 'agents', name: 'Agents', url: 'https://agents.example.com' },
    { id: 'portfolio', name: 'Portfolio', url: 'https://portfolio.example.com' },
  ],
};

/** Wraps children in a SessionProvider answering with the given session. */
export function WithSession({
  session = wire,
  children,
}: {
  session?: WireSession;
  children: ReactNode;
}) {
  const fetchFn = (async () =>
    new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })) as typeof fetch;
  return (
    <SessionProvider
      client={new SessionClient({ fetch: fetchFn })}
      refreshInterval={0}
      refreshOnFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
