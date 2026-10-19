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
  it('shows the current application first, then those the member holds a role in, in catalog order', () => {
    expect(
      ids(
        switcherApps(
          catalog,
          build,
          member({ build: 'admin', agents: 'viewer', portfolio: 'viewer' })
        )
      )
    ).toEqual(['build', 'agents', 'portfolio']);
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
    // In the console itself, the products the person holds a role in are listed after it.
    expect(
      ids(
        switcherApps([...catalog, console], console, member({ console: 'owner', build: 'admin' }))
      )
    ).toEqual(['console', 'build']);
  });

  it('always shows the current application, even without a role there', () => {
    expect(ids(switcherApps(catalog, portfolio, member({ agents: 'viewer' })))).toEqual([
      'portfolio',
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
    expect(switcherApps(catalog, self, member({}))[0].name).toBe('Build (dev)');
  });
});
