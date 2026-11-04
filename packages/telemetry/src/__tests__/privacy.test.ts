import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpAdapter, MAX_QUEUED_EVENTS, TelemetryClient } from '../telemetry';
import { ProductGraphAdapter } from '../adapters/productgraph';
import { scrubText, scrubUrl } from '../scrub';
import type { TelemetryAdapter, TelemetryEvent } from '../types';

function recorder() {
  const events: TelemetryEvent[] = [];
  const identify = vi.fn();
  const adapter: TelemetryAdapter = { name: 'rec', track: (e) => events.push(e), identify };
  return { events, identify, adapter };
}

describe('scrubbing', () => {
  it('drops query strings and token-like path segments from URLs', () => {
    expect(scrubUrl('/invite/accept?token=abc#x')).toBe('/invite/accept');
    expect(scrubUrl('/reset/9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c')).toBe('/reset/[redacted]');
    expect(scrubUrl('/orgs/acme/settings')).toBe('/orgs/acme/settings');
  });

  it('redacts URLs, emails and tokens in text', () => {
    const out = scrubText(
      'GET https://api.example.com/x?sig=abc&exp=1 for ada@example.com, key k3y9f8a7b6c5d4e3f2a1b0c9d8e7f6a5'
    );
    expect(out).toBe('GET https://api.example.com/x?[redacted] for [redacted], key [redacted]');
    expect(scrubText('x'.repeat(20), 10)).toBe(`${'x'.repeat(10)}…`);
  });
});

describe('TelemetryClient', () => {
  it('sends page views without title or referrer, and without the query string', () => {
    const { events, adapter } = recorder();
    new TelemetryClient({ adapters: [adapter] }).trackPageView('/invite/accept?token=secret');
    expect(events[0].properties).toEqual({ path: '/invite/accept' });
  });

  it('sends only the referrer origin when asked to', () => {
    vi.spyOn(document, 'referrer', 'get').mockReturnValue(
      'https://app.example.com/reset?token=secret'
    );
    const { events, adapter } = recorder();
    new TelemetryClient({ adapters: [adapter], collectReferrer: true }).trackPageView('/');
    expect(events[0].properties?.referrer).toBe('https://app.example.com');
    vi.restoreAllMocks();
  });

  it('scrubs error messages and stacks', () => {
    const { events, adapter } = recorder();
    const err = new Error('failed for ada@example.com at https://x.example/a?t=1');
    new TelemetryClient({ adapters: [adapter] }).trackError(err);
    expect(events[0].properties?.message).toBe(
      'failed for [redacted] at https://x.example/a?[redacted]'
    );
    expect(String(events[0].properties?.stack)).not.toContain('ada@example.com');
  });

  it('sends nothing at a sample rate of 0', () => {
    const { events, adapter } = recorder();
    new TelemetryClient({ adapters: [adapter], sampleRate: 0 }).trackEvent('x');
    expect(events).toHaveLength(0);
  });

  it('does not pass identity to adapters while disabled', () => {
    const { identify, adapter } = recorder();
    new TelemetryClient({ adapters: [adapter], enabled: false }).identify({
      id: 'u1',
      email: 'ada@example.com',
    });
    expect(identify).not.toHaveBeenCalled();
  });
});

describe('HttpAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const event: TelemetryEvent = { type: 'custom', name: 'x', timestamp: 1 };

  it('sends cookies to its own origin only, by default', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetch);
    const a = new HttpAdapter('https://t.example.com/e');
    a.track(event);
    await a.flush();
    expect((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].credentials).toBe(
      'same-origin'
    );
  });

  it('drops a batch the endpoint rejects, and bounds the queue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 400 }))
    );
    const a = new HttpAdapter('https://t.example.com/e', 1_000_000, 1_000_000);
    for (let i = 0; i < MAX_QUEUED_EVENTS + 5; i++) a.track(event);
    expect((a as unknown as { batch: unknown[] }).batch).toHaveLength(MAX_QUEUED_EVENTS);
    await a.flush();
    expect((a as unknown as { batch: unknown[] }).batch).toHaveLength(0);
  });
});

describe('ProductGraphAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 }))
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const config = { projectId: 'p', endpoint: 'https://pg.example.com/e', batchSize: 1000 };
  const sent = (a: ProductGraphAdapter) =>
    (a as unknown as { batch: Record<string, unknown>[] }).batch;

  it('stores nothing until asked to persist the anonymous ID', () => {
    const a = new ProductGraphAdapter(config);
    a.track({ type: 'custom', name: 'x', timestamp: 1 });
    expect(localStorage.getItem('pg_anonymous_id')).toBeNull();
    a.destroy();

    const b = new ProductGraphAdapter({ ...config, persistAnonymousId: true });
    expect(localStorage.getItem('pg_anonymous_id')).toBeNull();
    b.track({ type: 'custom', name: 'x', timestamp: 1 });
    expect(localStorage.getItem('pg_anonymous_id')).toBe(sent(b)[0]['user.anonymous_id']);
    b.destroy();
  });

  it('gives the next person new anonymous and session IDs after reset', () => {
    const a = new ProductGraphAdapter({ ...config, persistAnonymousId: true });
    a.track({ type: 'custom', name: 'x', timestamp: 1 });
    a.reset();
    a.track({ type: 'custom', name: 'y', timestamp: 2 });
    const [first, second] = sent(a);
    expect(second['user.anonymous_id']).not.toBe(first['user.anonymous_id']);
    expect(second['session.id']).not.toBe(first['session.id']);
    a.destroy();
  });

  it('sends only the origin of a referrer and no query strings', () => {
    const a = new ProductGraphAdapter(config);
    a.track({
      type: 'page_view',
      name: 'page_view',
      timestamp: 1,
      properties: {
        path: '/x?token=1',
        referrer: 'https://app.example.com/invite?token=1',
      },
    });
    expect(sent(a)[0]).toMatchObject({
      'page.path': '/x',
      'page.referrer': 'https://app.example.com',
    });
    a.destroy();
  });
});
