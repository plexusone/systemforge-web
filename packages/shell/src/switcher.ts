import type { CatalogApp, SessionMembership } from '@plexusone/auth';

/**
 * The applications the product switcher shows: those in the catalog in
 * which the member holds a role for the current organization, and the
 * current application, all in catalog order. The order is the same in every
 * application, so the switcher looks the same wherever it is; only which
 * entry is current changes. An application the catalog does not list comes
 * first.
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
  const listed = apps
    .filter((a) => a.id === self.id || Boolean(membership?.applications[a.id]))
    .map((a) => (a.id === self.id ? { ...a, ...self } : a));
  return listed.some((a) => a.id === self.id) ? listed : [self, ...listed];
}
