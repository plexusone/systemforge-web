import { useState, type ReactNode } from 'react';
import { Button, Input } from '@plexusone/ui';
import type { CodeStatus, CreatedCode, InviteStatus } from '../types';

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

export function Note({ children }: { children: ReactNode }): ReactNode {
  return (
    <p role="status" className="rounded-md border px-3 py-2 text-sm">
      {children}
    </p>
  );
}

export function Loading({ what }: { what: string }): ReactNode {
  return <p className="text-sm text-muted-foreground">Loading {what}…</p>;
}

export function Empty({ children }: { children: ReactNode }): ReactNode {
  return (
    <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

const LABEL: Record<CodeStatus | InviteStatus, string> = {
  active: 'Active',
  used_up: 'Used',
  expired: 'Expired',
  revoked: 'Revoked',
  pending: 'Pending',
  redeemed: 'Joined',
};

const TONE: Record<CodeStatus | InviteStatus, string> = {
  active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  used_up: 'bg-muted text-muted-foreground',
  redeemed: 'bg-muted text-muted-foreground',
  expired: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  revoked: 'bg-destructive/15 text-destructive',
};

export function StatusBadge({ status }: { status: CodeStatus | InviteStatus }): ReactNode {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}

/** A date as people read it, or a dash. */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** A code's short name: its last four characters. */
export function codeName(hint: string): string {
  return `…${hint}`;
}

/**
 * ShowOnce shows a new code and its link with a copy button. The API returns
 * them only once, so the person is told to copy them now.
 */
export function ShowOnce({
  created,
  onDone,
}: {
  created: CreatedCode;
  onDone: () => void;
}): ReactNode {
  const value = created.link ?? created.invite_code;
  // The copy result belongs to the value copied, so a new code that replaces
  // this one does not show "Copied." before it is copied.
  const [copiedResult, setCopiedResult] = useState<{ value: string; ok: boolean }>();
  const copied = copiedResult?.value === value ? copiedResult.ok : undefined;
  async function copy() {
    const copying = value;
    try {
      await navigator.clipboard.writeText(copying);
      setCopiedResult({ value: copying, ok: true });
    } catch {
      setCopiedResult({ value: copying, ok: false });
    }
  }
  return (
    <section
      aria-label="New invite"
      className="mb-6 space-y-3 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-4"
    >
      <p className="text-sm font-medium">
        Copy this {created.link ? 'link' : 'code'} now. It will not be shown again.
      </p>
      <div className="flex gap-2">
        <Input
          readOnly
          value={value}
          aria-label="Invite"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button type="button" onClick={copy}>
          Copy
        </Button>
      </div>
      {created.link && <p className="text-xs text-muted-foreground">Code: {created.invite_code}</p>}
      {copied === true && <p className="text-xs text-muted-foreground">Copied.</p>}
      {copied === false && (
        <p className="text-xs text-muted-foreground">
          Copying is not available here; select it and copy.
        </p>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onDone}>
        Done
      </Button>
    </section>
  );
}

/**
 * useRun runs an action, tracking busy and error state, and calls after on
 * success.
 */
export function useRun(): {
  busy: boolean;
  error?: string;
  run: (what: string, fn: () => Promise<void>) => Promise<void>;
  clear: () => void;
} {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function run(what: string, fn: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (err) {
      setError(`${what}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run, clear: () => setError(undefined) };
}
