import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAppContext } from '@plexusone/host';
import { api } from '../api';
import { ErrorNote, Loading, PageHeader, canManage, orgHref, returnQuery } from '../components/ui';
import { useLoad } from '../useLoad';
import type { Connection, Manifest } from '../types';

/** Gallery lists the services an organization can connect, one card each. */
export function Gallery(): ReactNode {
  const { organizationId: org, role } = useAppContext();
  const [params] = useSearchParams();
  const providers = useLoad(() => api.providers(), []);
  const connections = useLoad(() => api.connections(org), [org]);
  // Keep a return address from an application's link on the way to the wizard.
  const suffix = returnQuery(params.get('return_to'));

  if (!canManage(role)) {
    return (
      <>
        <PageHeader title="Connect a service" />
        <p className="text-sm text-muted-foreground">
          Only an organization&rsquo;s owners and admins connect services. Ask one of them to
          connect it.
        </p>
      </>
    );
  }
  if (providers.error)
    return <ErrorNote>Could not load the services: {providers.error.message}</ErrorNote>;
  if (!providers.data) return <Loading what="services" />;

  const count = (key: string) =>
    (connections.data ?? []).filter(
      (c: Connection) => c.provider === key && c.state !== 'disconnected'
    ).length;

  return (
    <>
      <PageHeader
        title="Connect a service"
        subtitle="Choose a service. You'll create a token there, step by step, and paste it here; it is checked before anything is saved."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.data.map((m) => (
          <li key={m.key}>
            <ServiceCard
              manifest={m}
              connected={count(m.key)}
              to={orgHref(org, `connections/new/${m.key}`) + suffix}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function ServiceCard({
  manifest,
  connected,
  to,
}: {
  manifest: Manifest;
  connected: number;
  to: string;
}): ReactNode {
  const method = manifest.authMethods[0];
  const permissions = method?.scopes?.length ?? 0;
  const guided = (method?.setup?.length ?? 0) > 0;
  return (
    <Link
      to={to}
      className="flex h-full flex-col rounded-lg border border-border bg-background p-4 transition hover:border-foreground/30 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-sm font-semibold uppercase"
        >
          {manifest.displayName.slice(0, 2)}
        </span>
        <span className="font-medium">{manifest.displayName}</span>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted-foreground">
        {guided ? 'Guided setup' : 'Token'}
        {permissions > 0 && ` · ${permissions} permission${permissions === 1 ? '' : 's'}`}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        {connected > 0 ? `${connected} connected · connect another` : 'Not connected'}
      </p>
    </Link>
  );
}
