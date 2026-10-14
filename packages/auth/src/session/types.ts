/**
 * Session types for the relying-party BFF.
 *
 * The BFF serves `GET /bff/session` in snake_case. Components use the
 * camelCase types below; {@link toSession} is the only place that knows the
 * wire format.
 */

/** An application in the deployment's catalog, for the product switcher. */
export interface CatalogApp {
  /** Application identifier, as its role vocabulary declares it. */
  id: string;
  /** What the switcher shows. */
  name: string;
  /** Where the application opens. */
  url: string;
  /** Optional icon URL or short icon name. */
  icon?: string;
}

/** A membership of the signed-in person in one organization. */
export interface SessionMembership {
  /** The organization's ID: the key for routes and API paths, never a slug. */
  organizationId: string;
  organizationName?: string;
  /** Display only. */
  organizationSlug?: string;
  organizationType?: string;
  /** The organization role (for example owner, admin, member). */
  role?: string;
  /** Application ID to the role held in that application. */
  applications: Record<string, string>;
}

/** The signed-in person. */
export interface SessionUser {
  /** Principal ID. */
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  memberships: SessionMembership[];
}

/** The browser session as the BFF reports it. */
export interface Session {
  authenticated: boolean;
  user?: SessionUser;
  expiresAt?: Date;
  /** The deployment's application catalog, in order; empty when not configured. */
  apps: CatalogApp[];
}

/** `GET /bff/session` as served. */
export interface WireSession {
  authenticated: boolean;
  user_id?: string;
  expires_at?: string;
  user?: {
    id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
    memberships?: Array<{
      id?: string;
      organization_id: string;
      organization_name?: string;
      organization_slug?: string;
      organization_type?: string;
      role?: string;
      applications?: Record<string, string>;
    }> | null;
  };
  apps?: Array<{ id: string; name: string; url: string; icon?: string; order?: number }> | null;
}
