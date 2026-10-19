import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useAppContext } from '@plexusone/host';
import { Button, Input, Label } from '@plexusone/ui';
import { ApiError, api } from '../api';
import {
  ErrorNote,
  Loading,
  PageHeader,
  canManage,
  expiryText,
  orgHref,
  returnQuery,
} from '../components/ui';
import { useLoad } from '../useLoad';
import {
  OFFERED_ROTATION,
  type AuthMethod,
  type Connection,
  type Manifest,
  type RotationMode,
  type Scope,
} from '../types';

/**
 * Connect walks a person through connecting one service: how the credential
 * will be rotated, how to create it at the service, which permissions it
 * needs, and pasting it here, where the service checks it before it is saved.
 */
export function Connect(): ReactNode {
  const { provider = '' } = useParams();
  const { organizationId: org, role } = useAppContext();
  const providers = useLoad(() => api.providers(), []);

  if (!canManage(role)) {
    return (
      <>
        <PageHeader title="Connect a service" />
        <p className="text-sm text-muted-foreground">
          Only an organization&rsquo;s owners and admins connect services.
        </p>
      </>
    );
  }
  if (providers.error)
    return <ErrorNote>Could not load the services: {providers.error.message}</ErrorNote>;
  if (!providers.data) return <Loading what="the service" />;
  const manifest = providers.data.find((m) => m.key === provider);
  if (!manifest || manifest.authMethods.length === 0) {
    return (
      <>
        <PageHeader title="Connect a service" />
        <ErrorNote>
          This deployment does not offer a service named &ldquo;{provider}&rdquo;.
        </ErrorNote>
        <p className="mt-4 text-sm">
          <Link className="underline" to={orgHref(org, 'connections/new')}>
            Choose another service
          </Link>
        </p>
      </>
    );
  }
  return <Wizard manifest={manifest} method={manifest.authMethods[0]} />;
}

/** The rotation modes the console offers, recommended first. */
function offeredModes(method: AuthMethod): RotationMode[] {
  return (method.rotation ?? [])
    .filter((r) => OFFERED_ROTATION.includes(r.key))
    .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)));
}

function Wizard({ manifest, method }: { manifest: Manifest; method: AuthMethod }): ReactNode {
  const modes = useMemo(() => offeredModes(method), [method]);
  const [mode, setMode] = useState<string | undefined>(modes[0]?.key);
  const [done, setDone] = useState<Connection>();
  const chosen = modes.find((m) => m.key === mode);

  if (done) return <Connected manifest={manifest} connection={done} />;

  const steps = (method.setup ?? []).filter(
    (s) => !s.rotation?.length || (mode !== undefined && s.rotation.includes(mode))
  );
  const scopes: Scope[] = [...(method.scopes ?? []), ...(chosen?.scopes ?? [])];

  return (
    <>
      <PageHeader title={`Connect ${manifest.displayName}`} subtitle={<Back />} />
      <ol className="space-y-8">
        {modes.length > 0 && (
          <Section n={1} title="How will the token be replaced?">
            <RotationChoice modes={modes} value={mode} onChange={setMode} />
          </Section>
        )}
        <Section n={modes.length > 0 ? 2 : 1} title={`Create the token in ${manifest.displayName}`}>
          {steps.length > 0 ? (
            <SetupSteps steps={steps} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a token with the permissions below.
              {(method.helpUrl || manifest.helpUrl) && (
                <>
                  {' '}
                  <a
                    className="underline"
                    href={method.helpUrl || manifest.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    How to create it
                  </a>
                </>
              )}
            </p>
          )}
          {scopes.length > 0 && <Permissions scopes={scopes} />}
          {chosen?.expiryDays ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Give it an expiry {chosen.expiryDays} days out. You&rsquo;ll see here when it is due.
            </p>
          ) : null}
        </Section>
        <Section n={modes.length > 0 ? 3 : 2} title="Paste it here">
          <CredentialForm
            manifest={manifest}
            method={method}
            rotation={mode}
            onConnected={setDone}
          />
        </Section>
      </ol>
    </>
  );
}

function Back(): ReactNode {
  const { organizationId: org } = useAppContext();
  const [params] = useSearchParams();
  return (
    <Link
      className="underline"
      to={orgHref(org, 'connections/new') + returnQuery(params.get('return_to'))}
    >
      Choose another service
    </Link>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <li className="rounded-lg border border-border bg-background p-5">
      <h2 className="mb-4 flex items-center gap-3 text-base font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-sm text-background">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </li>
  );
}

function RotationChoice({
  modes,
  value,
  onChange,
}: {
  modes: RotationMode[];
  value?: string;
  onChange: (k: string) => void;
}): ReactNode {
  return (
    <fieldset className="grid gap-3 md:grid-cols-2">
      <legend className="sr-only">Rotation</legend>
      {modes.map((m) => (
        <label
          key={m.key}
          className={`cursor-pointer rounded-md border p-4 text-sm ${value === m.key ? 'border-foreground ring-1 ring-foreground' : 'border-border'}`}
        >
          <span className="flex items-center gap-2 font-medium">
            <input
              type="radio"
              name="rotation"
              value={m.key}
              checked={value === m.key}
              onChange={() => onChange(m.key)}
            />
            {m.label}
            {m.recommended && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                Recommended
              </span>
            )}
          </span>
          {m.description && (
            <span className="mt-2 block text-muted-foreground">{m.description}</span>
          )}
          {(m.scopes?.length ?? 0) > 0 && (
            <span className="mt-3 block">
              <span className="font-medium">Needs also:</span>{' '}
              {m.scopes?.map((s) => s.name).join(', ')}
            </span>
          )}
          {(m.risks?.length ?? 0) > 0 && (
            <span className="mt-2 block text-amber-700 dark:text-amber-400">
              <span className="font-medium">Trade-off:</span> {m.risks?.join(' ')}
            </span>
          )}
        </label>
      ))}
    </fieldset>
  );
}

function SetupSteps({ steps }: { steps: NonNullable<AuthMethod['setup']> }): ReactNode {
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm">
      {steps.map((s) => (
        <li key={s.title}>
          <span className="font-medium">{s.title}</span>
          {s.detail && <p className="mt-1 text-muted-foreground">{s.detail}</p>}
          {s.url && (
            <a
              className="mt-2 inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent"
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open {new URL(s.url).host} ↗
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

function Permissions({ scopes }: { scopes: Scope[] }): ReactNode {
  return (
    <table className="mt-5 w-full text-left text-sm">
      <caption className="mb-2 text-left font-medium">Permissions to grant</caption>
      <thead className="text-xs text-muted-foreground">
        <tr>
          <th className="py-1 pr-4 font-normal">Permission</th>
          <th className="py-1 pr-4 font-normal">Used for</th>
          <th className="py-1 font-normal" />
        </tr>
      </thead>
      <tbody>
        {scopes.map((s) => (
          <tr key={s.name} className="border-t border-border">
            <td className="py-1.5 pr-4 font-mono text-xs">{s.name}</td>
            <td className="py-1.5 pr-4 text-muted-foreground">{s.description}</td>
            <td className="py-1.5 text-xs">{s.required ? 'Required' : 'Recommended'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CredentialForm({
  manifest,
  method,
  rotation,
  onConnected,
}: {
  manifest: Manifest;
  method: AuthMethod;
  rotation?: string;
  onConnected: (c: Connection) => void;
}): ReactNode {
  const { organizationId: org } = useAppContext();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [name, setName] = useState(manifest.displayName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const c = await api.create(org, {
        provider: manifest.key,
        authMethod: method.key,
        displayName: name.trim() || manifest.displayName,
        fields,
        ...(rotation ? { rotation } : {}),
      });
      setFields({});
      onConnected(c);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 422
          ? `${manifest.displayName} did not accept the token: ${err.message}. Check that you copied all of it and granted the required permissions.`
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      {method.fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={`field-${f.name}`}>{f.label || f.name}</Label>
          <Input
            id={`field-${f.name}`}
            type={f.secret ? 'password' : 'text'}
            autoComplete="off"
            spellCheck={false}
            required={f.required}
            value={fields[f.name] ?? ''}
            onChange={(e) => setFields((x) => ({ ...x, [f.name]: e.target.value }))}
          />
          {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
        </div>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="display-name">Name</Label>
        <Input id="display-name" value={name} onChange={(e) => setName(e.target.value)} />
        <p className="text-xs text-muted-foreground">
          How this connection appears to your organization.
        </p>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      <Button type="submit" disabled={busy}>
        {busy ? 'Checking…' : `Connect ${manifest.displayName}`}
      </Button>
    </form>
  );
}

/** Connected shows what was connected, and returns to the application that sent the person here. */
function Connected({
  manifest,
  connection,
}: {
  manifest: Manifest;
  connection: Connection;
}): ReactNode {
  const { organizationId: org } = useAppContext();
  const [params] = useSearchParams();
  const returnTo = params.get('return_to');
  const [error, setError] = useState<string>();
  const expiry = expiryText(connection);

  async function goBack() {
    if (!returnTo) return;
    let allowed: string;
    try {
      allowed = await api.returnTo(returnTo);
    } catch {
      setError('That return address is not allowed.');
      return;
    }
    window.location.assign(withConnection(allowed, connection.id));
  }

  return (
    <>
      <PageHeader title={`${manifest.displayName} is connected`} />
      <dl className="grid max-w-xl grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Name</dt>
        <dd>{connection.displayName}</dd>
        <dt className="text-muted-foreground">Account</dt>
        <dd>{connection.externalLabel || connection.externalAccountId || 'Unknown'}</dd>
        <dt className="text-muted-foreground">Token</dt>
        <dd className={expiry.soon ? 'text-amber-700 dark:text-amber-400' : ''}>{expiry.text}</dd>
      </dl>
      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      <div className="mt-6 flex gap-3">
        {returnTo && <Button onClick={goBack}>Continue</Button>}
        <Link
          to={orgHref(org, 'connections')}
          className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          See all connections
        </Link>
      </div>
    </>
  );
}

/**
 * withConnection adds the new connection's ID to an allowed return address,
 * as `connection_id`, so the application that linked here can select it.
 */
export function withConnection(url: string, connectionId: string): string {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('connection_id', connectionId);
  // A path on this host stays a path; an absolute URL stays absolute.
  return url.startsWith('/') ? `${u.pathname}${u.search}${u.hash}` : u.toString();
}
