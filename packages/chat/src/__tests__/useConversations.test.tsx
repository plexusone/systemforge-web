import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatProvider } from '../components/ChatProvider';
import { useConversations } from '../hooks/useConversations';

function deferred() {
  let resolve!: (r: Response) => void;
  const promise = new Promise<Response>((r) => (resolve = r));
  return { promise, resolve };
}

const list = (title: string) =>
  new Response(
    JSON.stringify({
      conversations: [{ id: title, title, created_at: '2026-01-01', updated_at: '2026-01-01' }],
    }),
    { status: 200 }
  );

function setup() {
  let base = 'https://a.example';
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ChatProvider config={{ apiBaseUrl: base }}>{children}</ChatProvider>
  );
  const hook = renderHook(() => useConversations(), { wrapper });
  return {
    ...hook,
    setBase(next: string) {
      base = next;
      hook.rerender();
    },
  };
}

describe('useConversations', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the newest load when an earlier refresh settles last', async () => {
    const slow = deferred();
    const responses: Record<string, Array<Promise<Response> | Response>> = {
      'https://a.example': [list('a'), slow.promise],
      'https://b.example': [list('b')],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => responses[url.split('/v1/')[0]].shift()!)
    );
    const h = setup();
    await waitFor(() => expect(h.result.current.conversations[0]?.title).toBe('a'));

    // A refresh for base A is still in flight when the base becomes B.
    let refreshing!: Promise<void>;
    act(() => {
      refreshing = h.result.current.refresh();
    });
    h.setBase('https://b.example');
    await waitFor(() => expect(h.result.current.conversations[0]?.title).toBe('b'));

    await act(async () => {
      slow.resolve(list('stale-a'));
      await refreshing;
    });
    expect(h.result.current.conversations[0]?.title).toBe('b');
    expect(h.result.current.isLoading).toBe(false);
  });

  it('clears an earlier error and shows loading when the base changes', async () => {
    const pending = deferred();
    const responses: Record<string, Array<Promise<Response> | Response>> = {
      'https://a.example': [new Response(null, { status: 500 })],
      'https://b.example': [pending.promise],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => responses[url.split('/v1/')[0]].shift()!)
    );
    const h = setup();
    await waitFor(() => expect(h.result.current.error).not.toBeNull());

    h.setBase('https://b.example');
    expect(h.result.current.error).toBeNull();
    expect(h.result.current.isLoading).toBe(true);

    await act(async () => {
      pending.resolve(list('b'));
    });
    await waitFor(() => expect(h.result.current.isLoading).toBe(false));
    expect(h.result.current.error).toBeNull();
    expect(h.result.current.conversations[0]?.title).toBe('b');
  });
});
