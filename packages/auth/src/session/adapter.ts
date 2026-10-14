import type { Session, WireSession } from './types';

/** Converts the BFF's `GET /bff/session` response into a {@link Session}. */
export function toSession(wire: WireSession): Session {
  if (!wire.authenticated || !wire.user) {
    return { authenticated: false, apps: [] };
  }
  const u = wire.user;
  const expires = wire.expires_at ? new Date(wire.expires_at) : undefined;
  return {
    authenticated: true,
    expiresAt: expires && !Number.isNaN(expires.getTime()) ? expires : undefined,
    user: {
      id: u.id,
      name: u.name || undefined,
      email: u.email || undefined,
      avatarUrl: u.avatar_url || undefined,
      memberships: (u.memberships ?? []).map((m) => ({
        organizationId: m.organization_id,
        organizationName: m.organization_name || undefined,
        organizationSlug: m.organization_slug || undefined,
        organizationType: m.organization_type || undefined,
        role: m.role || undefined,
        applications: m.applications ?? {},
      })),
    },
    apps: (wire.apps ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      ...(a.icon ? { icon: a.icon } : {}),
    })),
  };
}

/**
 * The membership for an organization ID, if the person has one. Organizations
 * are matched by ID only, never by slug.
 */
export function membershipFor(session: Session, organizationId: string | undefined) {
  if (!organizationId) return undefined;
  return session.user?.memberships.find((m) => m.organizationId === organizationId);
}

/** A label for a membership: its name, else its slug, else its ID. */
export function organizationLabel(m: {
  organizationId: string;
  organizationName?: string;
  organizationSlug?: string;
}): string {
  return m.organizationName || m.organizationSlug || m.organizationId;
}
