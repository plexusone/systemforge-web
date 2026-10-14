import { describe, expect, it } from 'vitest';
import { SessionClient, SessionError } from '../client';
import { fakeFetch, json, twoOrgs } from './fixtures';

describe('SessionClient', () => {
  it('reads the session with credentials', async () => {
    const f = fakeFetch({ '/bff/session': () => json(twoOrgs) });
    const s = await new SessionClient({ fetch: f.fn }).getSession();
    expect(s.user?.id).toBe('p-1');
    expect(f.calls[0].init?.credentials).toBe('include');
  });

  it('honors a base path', async () => {
    const f = fakeFetch({ '/auth-bff/session': () => json({ authenticated: false }) });
    const s = await new SessionClient({ basePath: '/auth-bff/', fetch: f.fn }).getSession();
    expect(s.authenticated).toBe(false);
  });

  it('reports a BFF error with its code', async () => {
    const f = fakeFetch({
      '/bff/session': () => json({ code: 'INTERNAL_ERROR', message: 'internal error' }, 500),
    });
    const err = await new SessionClient({ fetch: f.fn }).getSession().catch((e) => e);
    expect(err).toBeInstanceOf(SessionError);
    expect(err).toMatchObject({ status: 500, code: 'INTERNAL_ERROR', message: 'internal error' });
  });

  it('reports a non-JSON error by status', async () => {
    const f = fakeFetch({ '/bff/session': () => new Response('bad gateway', { status: 502 }) });
    const err = await new SessionClient({ fetch: f.fn }).getSession().catch((e) => e);
    expect(err).toMatchObject({ status: 502, code: 'HTTP_502' });
  });

  it('builds sign-in URLs with a return path and an optional provider', () => {
    const c = new SessionClient();
    expect(c.signInUrl({ returnTo: '/orgs/org-1?tab=a' })).toBe(
      '/bff/auth/login?return_to=%2Forgs%2Forg-1%3Ftab%3Da'
    );
    expect(c.signInUrl({ provider: 'github', returnTo: '/' })).toBe(
      '/bff/auth/github?return_to=%2F'
    );
  });

  it('defaults the return path to the current location', () => {
    window.history.pushState({}, '', '/orgs/org-2/sites?x=1');
    expect(new SessionClient().signInUrl()).toBe(
      '/bff/auth/login?return_to=%2Forgs%2Forg-2%2Fsites%3Fx%3D1'
    );
  });

  it('signs out with a POST', async () => {
    const f = fakeFetch({ '/bff/auth/logout': () => new Response(null, { status: 204 }) });
    await new SessionClient({ fetch: f.fn }).signOut();
    expect(f.calls[0].init?.method).toBe('POST');
  });

  it('reports a rejected sign-out', async () => {
    const f = fakeFetch({
      '/bff/auth/logout': () =>
        json({ code: 'CSRF_REJECTED', message: 'cross-origin request rejected' }, 403),
    });
    await expect(new SessionClient({ fetch: f.fn }).signOut()).rejects.toMatchObject({
      code: 'CSRF_REJECTED',
    });
  });
});
