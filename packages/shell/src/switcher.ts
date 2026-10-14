import type { CatalogApp, SessionMembership } from '@plexusone/auth';

/**
 * The applications the product switcher shows: those in the catalog in
 * which the member holds a role for the current organization, in catalog
 * order, with the current application always present and first.
 *
 * With an empty catalog (for example in local development) it is the
 * current application alone. Without a membership only the current
 * application is shown, since a role is held per organization.
 */
export function switcherApps(
  apps: CatalogApp[],
  self: CatalogApp,
  membership?: SessionMembership
): CatalogApp[] {
  const others = apps.filter((a) => a.id !== self.id && Boolean(membership?.applications[a.id]));
  const fromCatalog = apps.find((a) => a.id === self.id);
  return [fromCatalog ? { ...fromCatalog, ...self } : self, ...others];
}
