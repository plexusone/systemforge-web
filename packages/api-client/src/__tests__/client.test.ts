import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, buildUrl } from '../client';

describe('buildUrl', () => {
  const origin = () => window.location.origin;

  it('appends the path to the base instead of resolving it', () => {
    expect(buildUrl('https://app.example.com/api', '/users')).toBe(
      'https://app.example.com/api/users'
    );
    expect(buildUrl('https://app.example.com/api/', 'users')).toBe(
      'https://app.example.com/api/users'
    );
    expect(buildUrl('https://api.example.com', '/v1/users')).toBe(
      'https://api.example.com/v1/users'
    );
  });

  it('accepts a relative base on this origin', () => {
    expect(buildUrl('/api', '/users')).toBe(`${origin()}/api/users`);
  });

  it('keeps a query in the path and adds parameters', () => {
    expect(buildUrl('/api', '/users?sort=name', { page: 2, q: undefined })).toBe(
      `${origin()}/api/users?sort=name&page=2`
    );
  });

  it('refuses a path that would leave the base', () => {
    for (const path of [
      '//evil.example/x',
      'https://evil.example/x',
      'javascript:alert(1)',
      '/\\evil.example',
      '/orgs/../../admin',
      '/orgs/%2e%2e/admin',
      '/./users',
      '/a\nb',
    ]) {
      expect(() => buildUrl('https://app.example.com/api', path)).toThrow(TypeError);
    }
  });
});

describe('ApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends requests under the base and with the organization header', async () => {
    const fetch = vi.fn(async () => new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const client = new ApiClient({ baseUrl: '/api', currentOrgId: 'org-1' });
    await expect(client.get('/users')).resolves.toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${window.location.origin}/api/users`);
    expect(new Headers(init.headers).get('X-Organization-ID')).toBe('org-1');
  });

  it('rejects a path to another host without sending it', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const client = new ApiClient({
      baseUrl: '/api',
      defaultHeaders: { 'X-CSRF-Token': 't' },
    });
    await expect(client.get('//evil.example/collect')).rejects.toThrow(TypeError);
    expect(fetch).not.toHaveBeenCalled();
  });
});
