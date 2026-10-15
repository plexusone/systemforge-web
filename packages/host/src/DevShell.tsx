import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { AppShell } from '@plexusone/shell';
import type { ShellProps } from './types';

/**
 * DevShell is a neutral shell for running one application on its own: the
 * application's name as the brand, the product and organization switchers,
 * the theme toggle and the profile menu. Stacks use their own Shell instead.
 */
export function DevShell({ app, context, onOrganizationChange, children }: ShellProps): ReactNode {
  const navigate = useNavigate();
  return (
    <AppShell
      appName={app.name}
      brand={<span className="font-semibold text-foreground">{app.name}</span>}
      app={{ id: app.id, name: app.name, url: '/' }}
      organizationId={context.organizationId}
      onOrganizationChange={onOrganizationChange}
      navigation={app.navigation?.(context) ?? []}
      profileItems={app.profileItems?.(context)}
      command={app.command}
      actions={app.actions}
      showThemeToggle
      onNavigate={(href) => navigate(href)}
    >
      {children}
    </AppShell>
  );
}
