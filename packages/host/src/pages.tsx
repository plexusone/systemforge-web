import type { ReactNode } from 'react';

/** A plain message panel for the host's own pages. */
export function HostPanel({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div
      role="alert"
      className="mx-auto mt-16 max-w-md rounded-lg border border-border bg-background p-6"
    >
      <h1 className="mb-2 text-base font-semibold text-foreground">{title}</h1>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

/** A page or organization that does not exist, or is not the person's. */
export function NotFoundPage(): ReactNode {
  return (
    <HostPanel title="Not found">
      It does not exist, or it belongs to an organization you are not a member of.
    </HostPanel>
  );
}

/** A member of the organization without a role in this application. */
export function NoAccessPage({ appName }: { appName: string }): ReactNode {
  return (
    <HostPanel title="No access">
      You do not have a role in {appName} in this organization. Ask an organization admin for one.
    </HostPanel>
  );
}

/** A signed-in person without a role in this application anywhere. */
export function NoOrganizationPage({ appName }: { appName: string }): ReactNode {
  return (
    <HostPanel title={`No organization with ${appName}`}>
      You do not hold a role in {appName} in any organization yet. Ask an organization admin for
      one.
    </HostPanel>
  );
}

/** The sign-in service could not be reached. */
export function SessionErrorPage({ message }: { message?: string }): ReactNode {
  return (
    <HostPanel title="Could not reach the sign-in service">
      {message ? `${message}. ` : ''}Reload to try again.
    </HostPanel>
  );
}
