import type { ReactNode } from 'react';
import { useSession } from '@plexusone/auth';
import { useAppContext } from '@plexusone/host';
import { useConsoleOptions } from '../options';
import type { Connection } from '../types';

/** The host's next steps for a connection, as links; nothing when it has none. */
export function NextStepLinks({
  connection,
  primary = false,
}: {
  connection: Connection;
  primary?: boolean;
}): ReactNode {
  const { nextSteps } = useConsoleOptions();
  const { organizationId } = useAppContext();
  const { session } = useSession();
  if (!nextSteps || connection.state !== 'connected') return null;
  const steps = nextSteps(connection, { organizationId, apps: session.apps });
  if (steps.length === 0) return null;
  const cls = primary
    ? 'inline-flex items-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90'
    : 'text-sm underline';
  return (
    <>
      {steps.map((s) => (
        <a key={s.href} href={s.href} className={cls}>
          {s.label}
        </a>
      ))}
    </>
  );
}
