import type { WireSession } from '../types';

/** A signed-in person in two organizations, with a three-app catalog. */
export const twoOrgs: WireSession = {
  authenticated: true,
  user_id: 'p-1',
  expires_at: '2026-10-15T12:00:00Z',
  user: {
    id: 'p-1',
    email: 'ada@example.com',
    name: 'Ada',
    avatar_url: 'https://example.com/a.png',
    memberships: [
      {
        id: 'm-1',
        organization_id: 'org-1',
        organization_name: 'Acme',
        organization_slug: 'acme',
        role: 'owner',
        applications: { build: 'admin', agents: 'viewer' },
      },
      {
        id: 'm-2',
        organization_id: 'org-2',
        organization_slug: 'side',
        role: 'member',
        applications: { build: 'editor' },
      },
    ],
  },
  apps: [
    { id: 'build', name: 'Build', url: 'https://app.example.com', order: 1 },
    { id: 'agents', name: 'Agents', url: 'https://agents.example.com', order: 2 },
    {
      id: 'portfolio',
      name: 'Portfolio',
      url: 'https://portfolio.example.com',
      icon: 'chart',
      order: 3,
    },
  ],
};

/** A signed-in person with one organization and no catalog configured. */
export const noCatalog: WireSession = {
  authenticated: true,
  user: {
    id: 'p-2',
    name: 'Grace',
    memberships: [{ organization_id: 'org-9', role: 'member' }],
  },
};

export const signedOut: WireSession = { authenticated: false };

/** A fetch that answers each path from a table, recording calls. */
export function fakeFetch(answers: Record<string, () => Response>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const answer = answers[url];
    if (!answer) return new Response('not found', { status: 404 });
    return answer();
  }) as typeof fetch;
  return { fn, calls };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
