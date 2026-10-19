import { describe, expect, it } from 'vitest';
import type { CatalogApp, SessionMembership } from '@plexusone/auth';
import { switcherApps } from '../switcher';

const build: CatalogApp = { id: 'build', name: 'Build', url: 'https://app.example.com' };
const agents: CatalogApp = { id: 'agents', name: 'Agents', url: 'https://agents.example.com' };
const portfolio: CatalogApp = {
  id: 'portfolio',
  name: 'Portfolio',
  url: 'https://portfolio.example.com',
};
const catalog = [agents, build, portfolio];

const member = (applications: Record<string, string>): SessionMembership => ({
  organizationId: 'org-1',
  applications,
});

const ids = (apps: CatalogApp[]) => apps.map((a) => a.id);

describe('switcherApps', () => {
  it('shows the applications the member holds a role in, and the current one, in catalog order', () => {
    expect(
      ids(
        switcherApps(
          catalog,
          build,
          member({ build: 'admin', agents: 'viewer', portfolio: 'viewer' })
        )
      )
    ).toEqual(['agents', 'build', 'portfolio']);
  });

  it('keeps the same order whichever application is current', () => {
    const m = member({ build: 'admin', agents: 'viewer', portfolio: 'viewer' });
    const orders = [build, agents, portfolio].map((self) => ids(switcherApps(catalog, self, m)));
    expect(orders).toEqual([orders[0], orders[0], orders[0]]);
  });

  it('hides applications the member holds no role in', () => {
    expect(
      ids(switcherApps(catalog, build, member({ build: 'admin', portfolio: 'viewer' })))
    ).toEqual(['build', 'portfolio']);
  });

  it('leaves out the organization console, which grants no product role', () => {
    const console: CatalogApp = {
      id: 'console',
      name: 'Organization',
      url: 'https://auth.example.com/console',
    };
    expect(ids(switcherApps([...catalog, console], build, member({ build: 'admin' })))).toEqual([
      'build',
    ]);
    // In the console itself, the products the person holds a role in are listed with it.
    expect(
      ids(
        switcherApps([...catalog, console], console, member({ console: 'owner', build: 'admin' }))
      )
    ).toEqual(['build', 'console']);
  });

  it('always shows the current application, even without a role there', () => {
    expect(ids(switcherApps(catalog, portfolio, member({ agents: 'viewer' })))).toEqual([
      'agents',
      'portfolio',
    ]);
  });

  it('puts an application the catalog does not list first', () => {
    const other: CatalogApp = { id: 'reports', name: 'Reports', url: '/' };
    expect(ids(switcherApps(catalog, other, member({ agents: 'viewer' })))).toEqual([
      'reports',
      'agents',
    ]);
  });

  it('is the current application alone with an empty catalog', () => {
    expect(switcherApps([], build, member({ agents: 'viewer' }))).toEqual([build]);
  });

  it('is the current application alone without a membership', () => {
    expect(ids(switcherApps(catalog, build, undefined))).toEqual(['build']);
  });

  it('keeps the caller’s name for itself over the catalog entry', () => {
    const self = { ...build, name: 'Build (dev)' };
    expect(switcherApps(catalog, self, member({})).find((a) => a.id === 'build')?.name).toBe(
      'Build (dev)'
    );
  });
});
