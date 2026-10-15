import { SessionClient, type WireSession } from '@plexusone/auth';
import type { AppModule } from './types';

/** Options for a development session. */
export interface DevSessionOptions {
  /** The person's name. Default "Dev User". */
  name?: string;
  /** The role held in the application. Default "admin". */
  role?: string;
  /** The organizations the person belongs to. Default one, "Dev organization". */
  organizations?: Array<{ id: string; name: string; role?: string }>;
  /** Other applications to list in the catalog, for the product switcher. */
  otherApps?: Array<{ id: string; name: string; url: string; role?: string }>;
}

/**
 * devSession returns the BFF session a person signed in to app would have,
 * for running an application with no backend: one person, memberships with
 * a role in app, and a catalog with app (and any other apps).
 */
export function devSession(app: AppModule, opts: DevSessionOptions = {}): WireSession {
  const role = opts.role ?? 'admin';
  const orgs = opts.organizations ?? [{ id: 'dev-org', name: 'Dev organization' }];
  const others = opts.otherApps ?? [];
  return {
    authenticated: true,
    user: {
      id: 'dev-user',
      name: opts.name ?? 'Dev User',
      email: 'dev@example.com',
      memberships: orgs.map((o) => ({
        organization_id: o.id,
        organization_name: o.name,
        role: 'owner',
        applications: {
          [app.id]: o.role ?? role,
          ...Object.fromEntries(others.map((a) => [a.id, a.role ?? 'viewer'])),
        },
      })),
    },
    apps: [
      { id: app.id, name: app.name, url: '/' },
      ...others.map(({ id, name, url }) => ({ id, name, url })),
    ],
  };
}

/**
 * devSessionClient returns a SessionClient that answers with session and
 * accepts sign-out, without a network: the BFF is not needed.
 */
export function devSessionClient(session: WireSession): SessionClient {
  let current = session;
  const fetchFn = (async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/auth/logout')) {
      current = { authenticated: false };
      return new Response(null, { status: 204 });
    }
    return new Response(JSON.stringify(current), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return new SessionClient({ fetch: fetchFn });
}
