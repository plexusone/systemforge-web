import type { ReactNode } from 'react';
import type { Connection, ConnectionState, Detail, Manifest } from '../types';

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}): ReactNode {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }): ReactNode {
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  );
}

export function Loading({ what }: { what: string }): ReactNode {
  return <p className="text-sm text-muted-foreground">Loading {what}…</p>;
}

const STATE_LABEL: Record<ConnectionState, string> = {
  pending: 'Pending',
  connected: 'Connected',
  needs_attention: 'Needs attention',
  disconnected: 'Disconnected',
  revoked: 'Revoked',
};

const STATE_TONE: Record<ConnectionState, string> = {
  pending: 'bg-muted text-muted-foreground',
  connected: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  needs_attention: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  disconnected: 'bg-muted text-muted-foreground',
  revoked: 'bg-destructive/15 text-destructive',
};

export function StateBadge({ state }: { state: ConnectionState }): ReactNode {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATE_TONE[state]}`}
    >
      {STATE_LABEL[state]}
    </span>
  );
}

const DAY = 24 * 60 * 60 * 1000;

/** Days until an expiry, rounded down; negative once it has passed. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.floor((new Date(iso).getTime() - now.getTime()) / DAY);
}

/** How a connection's credential expiry reads, and whether it needs action soon. */
export function expiryText(c: Connection, now: Date = new Date()): { text: string; soon: boolean } {
  const at = c.health.credentialExpiresAt;
  if (!at) return { text: 'Does not expire', soon: false };
  const days = daysUntil(at, now);
  const date = new Date(at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (days < 0) return { text: `Expired on ${date}`, soon: true };
  if (days === 0) return { text: `Expires today (${date})`, soon: true };
  return { text: `Expires in ${days} day${days === 1 ? '' : 's'} (${date})`, soon: days <= 14 };
}

/** The roles that may connect, replace and disconnect. */
export function canManage(role?: string): boolean {
  return role === 'owner' || role === 'admin';
}

/** A path within the organization, for links: `orgHref(org, 'connections')`. */
export function orgHref(org: string, rest: string): string {
  return `/orgs/${encodeURIComponent(org)}/${rest.replace(/^\/+/, '')}`;
}

/** A query string carrying a return address, or none. */
export function returnQuery(returnTo: string | null): string {
  return returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : '';
}

/** "just now", "5 minutes ago", "3 hours ago" or "2 days ago". */
export function ago(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const unit = (n: number, what: string) => `${n} ${what}${n === 1 ? '' : 's'} ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return unit(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 24) return unit(hours, 'hour');
  return unit(Math.round(hours / 24), 'day');
}

/** When the connection was last checked and how it went. */
export function checkText(c: Connection, now: Date = new Date()): string {
  const h = c.health;
  if (!h.lastValidatedAt) return 'Not checked yet';
  const when = `Last checked ${ago(h.lastValidatedAt, now)}`;
  if (h.lastValidation === 'ok') return `${when}: working`;
  if (h.lastValidation === 'failed') return `${when}: failed`;
  return when;
}

/** A detail as one line: "Properties: a, b and 3 more". */
export function detailText(d: Detail): string {
  const values = d.values ?? [];
  const more = d.more ? ` and ${d.more} more` : '';
  return values.length ? `${d.label}: ${values.join(', ')}${more}` : d.label;
}

/** What the connection's permissions let it do, from the service's descriptions. */
export function accessText(c: Connection, manifest?: Manifest): string | undefined {
  const method = manifest?.authMethods.find((m) => m.key === c.authMethod);
  const scopes = method?.scopes ?? [];
  const held = c.scopes?.length
    ? scopes.filter((s) => c.scopes?.includes(s.name))
    : scopes.filter((s) => s.required);
  const described = held.map((s) => s.description).filter((d): d is string => !!d);
  return described.length ? `Access: ${described.join('; ')}` : undefined;
}

/** What a Test reports: that it worked and what it found, or why it failed. */
export function testResult(c: Connection): string {
  if (c.health.lastValidation === 'failed') {
    return c.health.lastError ? `The check failed: ${c.health.lastError}` : 'The check failed.';
  }
  const found = (c.health.details ?? []).map((d) => {
    const n = (d.values?.length ?? 0) + (d.more ?? 0);
    return n ? `${n} ${d.label.toLowerCase()}` : d.label.toLowerCase();
  });
  return found.length ? `Working: it reaches ${found.join(', ')}.` : 'Working.';
}
