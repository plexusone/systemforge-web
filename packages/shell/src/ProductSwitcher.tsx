import { type MouseEvent, type ReactNode } from 'react';
import { membershipFor, useSessionOptional, type CatalogApp } from '@plexusone/auth';
import { cn } from '@plexusone/ui';
import { carryPreferences } from './preferences';
import { switcherApps } from './switcher';

/** Props for {@link ProductSwitcher}. */
export interface ProductSwitcherProps {
  /** The application rendering the switcher. Always shown, in its catalog place. */
  self: CatalogApp;
  /** The current organization's ID; roles are per organization. */
  organizationId?: string;
  /** The catalog. Default: the session's. */
  apps?: CatalogApp[];
  /**
   * Client-side navigation, for applications composed in one build. Without
   * it, entries are plain links to each application's URL, carrying the
   * sidebar state and theme so the next application opens the same way.
   */
  onNavigate?: (url: string) => void;
  className?: string;
}

/**
 * ProductSwitcher lists the deployment's applications the person holds a
 * role in for the current organization, from the session's app catalog.
 *
 * @example
 * ```tsx
 * <ProductSwitcher self={{ id: 'build', name: 'Build', url: '/' }} organizationId={orgId} />
 * ```
 */
export function ProductSwitcher({
  self,
  organizationId,
  apps,
  onNavigate,
  className,
}: ProductSwitcherProps): ReactNode {
  const ctx = useSessionOptional();
  const session = ctx?.session;
  const catalog = apps ?? session?.apps ?? [];
  const membership = session ? membershipFor(session, organizationId) : undefined;
  const entries = switcherApps(catalog, self, membership);

  const follow = (url: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // Read the preferences when the link is followed, not when it rendered:
    // the sidebar may have been toggled since.
    if (!onNavigate) e.currentTarget.href = carryPreferences(url);
    if (
      !onNavigate ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey
    ) {
      return;
    }
    e.preventDefault();
    onNavigate(url);
  };

  return (
    <nav aria-label="Products" className={cn('flex items-center gap-1', className)}>
      {entries.map((app) =>
        app.id === self.id ? (
          <span
            key={app.id}
            aria-current="page"
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-foreground"
          >
            {app.name}
          </span>
        ) : (
          <a
            key={app.id}
            href={app.url}
            onClick={follow(app.url)}
            onAuxClick={follow(app.url)}
            className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {app.name}
          </a>
        )
      )}
    </nav>
  );
}
