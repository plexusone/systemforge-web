import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useAppContext } from '@plexusone/host';
import { Button, Input, Label } from '@plexusone/ui';
import { ApiError, api } from '../api';
import {
  ErrorNote,
  Loading,
  PageHeader,
  StateBadge,
  canManage,
  expiryText,
  orgHref,
} from '../components/ui';
import { useLoad } from '../useLoad';
import type { Connection, Manifest } from '../types';

/** Connections lists an organization's connections and what can be done with each. */
export function Connections(): ReactNode {
  const { organizationId: org, role } = useAppContext();
  const connections = useLoad(() => api.connections(org), [org]);
  const providers = useLoad(() => api.providers(), []);
  const manage = canManage(role);

  const header = (
    <PageHeader
      title="Connections"
      subtitle="Services your organization has connected. Every application in the organization can use them; none ever sees a token."
    >
      {manage && (
        <Link
          to={orgHref(org, 'connections/new')}
          className="inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Connect a service
        </Link>
      )}
    </PageHeader>
  );

  if (connections.error) {
    return (
      <>
        {header}
        <ErrorNote>
          {connections.error instanceof ApiError && connections.error.status === 404
            ? 'Connections are not enabled on this deployment.'
            : `Could not load connections: ${connections.error.message}`}
        </ErrorNote>
      </>
    );
  }
  if (!connections.data) {
    return (
      <>
        {header}
        <Loading what="connections" />
      </>
    );
  }
  const shown = connections.data.filter((c) => c.state !== 'disconnected');
  const byKey = new Map((providers.data ?? []).map((m) => [m.key, m]));

  return (
    <>
      {header}
      {shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No services are connected yet.
          {!manage && ' An owner or admin can connect one.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((c) => (
            <li key={c.id}>
              <ConnectionRow
                connection={c}
                manifest={byKey.get(c.provider)}
                manage={manage}
                onChange={connections.reload}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

type Panel = 'replace' | 'rename' | 'disconnect' | undefined;

function ConnectionRow({
  connection: c,
  manifest,
  manage,
  onChange,
}: {
  connection: Connection;
  manifest?: Manifest;
  manage: boolean;
  onChange: () => void;
}): ReactNode {
  const { organizationId: org } = useAppContext();
  const [panel, setPanel] = useState<Panel>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const expiry = expiryText(c);
  const service = manifest?.displayName ?? c.provider;

  async function run(what: string, fn: () => Promise<unknown>, after?: string) {
    setBusy(true);
    setError(undefined);
    setNote(undefined);
    try {
      await fn();
      setPanel(undefined);
      if (after) setNote(after);
      onChange();
    } catch (err) {
      setError(`${what}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      aria-label={c.displayName}
      className="rounded-lg border border-border bg-background p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-medium">{c.displayName}</h2>
            <StateBadge state={c.state} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {service}
            {(c.externalLabel || c.externalAccountId) &&
              ` · ${c.externalLabel || c.externalAccountId}`}
            {c.metadata?.rotation &&
              ` · rotated ${c.metadata.rotation === 'manual' ? 'by hand' : 'automatically'}`}
          </p>
          <p
            className={`mt-1 text-sm ${expiry.soon ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
          >
            {expiry.text}
            {expiry.soon && manage && ' — replace the token before then'}
          </p>
          {c.health.lastError && c.state === 'needs_attention' && (
            <p className="mt-1 text-sm text-destructive">Last check failed: {c.health.lastError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run('Test', () => api.test(org, c.id), 'Checked just now.')}
          >
            Test
          </Button>
          {manage && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setPanel(panel === 'replace' ? undefined : 'replace')}
              >
                Replace token
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setPanel(panel === 'rename' ? undefined : 'rename')}
              >
                Rename
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setPanel(panel === 'disconnect' ? undefined : 'disconnect')}
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
      {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {panel === 'replace' && manifest && (
        <ReplaceForm
          manifest={manifest}
          connection={c}
          busy={busy}
          onSubmit={(fields) =>
            run('Replace', () => api.reconnect(org, c.id, fields), 'The new token is in use.')
          }
        />
      )}
      {panel === 'rename' && (
        <RenameForm
          busy={busy}
          current={c.displayName}
          onSubmit={(name) => run('Rename', () => api.rename(org, c.id, name))}
        />
      )}
      {panel === 'disconnect' && (
        <div className="mt-4 rounded-md border border-destructive/40 p-4 text-sm">
          <p>
            Disconnecting destroys the stored token. Applications that use this connection stop
            reading {service} until it is connected again.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => run('Disconnect', () => api.disconnect(org, c.id))}
            >
              Disconnect {c.displayName}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPanel(undefined)}>
              Keep it
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function ReplaceForm({
  manifest,
  connection,
  busy,
  onSubmit,
}: {
  manifest: Manifest;
  connection: Connection;
  busy: boolean;
  onSubmit: (fields: Record<string, string>) => void;
}): ReactNode {
  const method =
    manifest.authMethods.find((m) => m.key === connection.authMethod) ?? manifest.authMethods[0];
  const [fields, setFields] = useState<Record<string, string>>({});
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit(fields);
    setFields({});
  }
  return (
    <form onSubmit={submit} className="mt-4 max-w-xl space-y-3 rounded-md border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Create a new token in {manifest.displayName} the same way as before, for the same account,
        and paste it here. It is checked before it replaces the current one.
      </p>
      {method.fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={`replace-${connection.id}-${f.name}`}>{f.label || f.name}</Label>
          <Input
            id={`replace-${connection.id}-${f.name}`}
            type={f.secret ? 'password' : 'text'}
            autoComplete="off"
            spellCheck={false}
            required={f.required}
            value={fields[f.name] ?? ''}
            onChange={(e) => setFields((x) => ({ ...x, [f.name]: e.target.value }))}
          />
        </div>
      ))}
      <Button type="submit" size="sm" disabled={busy}>
        {busy ? 'Checking…' : 'Replace token'}
      </Button>
    </form>
  );
}

function RenameForm({
  current,
  busy,
  onSubmit,
}: {
  current: string;
  busy: boolean;
  onSubmit: (name: string) => void;
}): ReactNode {
  const [name, setName] = useState(current);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSubmit(name.trim());
      }}
      className="mt-4 flex max-w-xl items-end gap-2"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="rename">Name</Label>
        <Input id="rename" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={busy || !name.trim()}>
        Save
      </Button>
    </form>
  );
}
