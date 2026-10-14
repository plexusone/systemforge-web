import { describe, expect, it } from 'vitest';
import { membershipFor, organizationLabel, toSession } from '../adapter';
import { noCatalog, signedOut, twoOrgs } from './fixtures';

describe('toSession', () => {
  it('maps the wire session to camelCase', () => {
    const s = toSession(twoOrgs);
    expect(s.authenticated).toBe(true);
    expect(s.expiresAt?.toISOString()).toBe('2026-10-15T12:00:00.000Z');
    expect(s.user).toMatchObject({
      id: 'p-1',
      name: 'Ada',
      avatarUrl: 'https://example.com/a.png',
    });
    expect(s.user?.memberships[0]).toEqual({
      organizationId: 'org-1',
      organizationName: 'Acme',
      organizationSlug: 'acme',
      organizationType: undefined,
      role: 'owner',
      applications: { build: 'admin', agents: 'viewer' },
    });
    expect(s.apps.map((a) => a.id)).toEqual(['build', 'agents', 'portfolio']);
    expect(s.apps[2].icon).toBe('chart');
    expect(s.apps[0]).not.toHaveProperty('order');
  });

  it('gives a membership without applications an empty map', () => {
    const s = toSession(noCatalog);
    expect(s.user?.memberships[0].applications).toEqual({});
    expect(s.apps).toEqual([]);
    expect(s.user?.email).toBeUndefined();
  });

  it('treats a signed-out response as unauthenticated with no apps', () => {
    expect(toSession(signedOut)).toEqual({ authenticated: false, apps: [] });
  });

  it('treats authenticated without a user as signed out', () => {
    expect(toSession({ authenticated: true })).toEqual({ authenticated: false, apps: [] });
  });

  it('drops an unparseable expiry', () => {
    expect(toSession({ ...twoOrgs, expires_at: 'soon' }).expiresAt).toBeUndefined();
  });
});

describe('membershipFor', () => {
  const s = toSession(twoOrgs);

  it('finds a membership by organization ID', () => {
    expect(membershipFor(s, 'org-2')?.role).toBe('member');
  });

  it('never matches by slug', () => {
    expect(membershipFor(s, 'acme')).toBeUndefined();
  });

  it('returns undefined without an organization', () => {
    expect(membershipFor(s, undefined)).toBeUndefined();
  });
});

describe('organizationLabel', () => {
  it('prefers the name, then the slug, then the ID', () => {
    expect(
      organizationLabel({ organizationId: 'o', organizationName: 'N', organizationSlug: 's' })
    ).toBe('N');
    expect(organizationLabel({ organizationId: 'o', organizationSlug: 's' })).toBe('s');
    expect(organizationLabel({ organizationId: 'o' })).toBe('o');
  });
});
