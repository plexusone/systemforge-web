import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSignInMethods } from '../useSignInMethods';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const email = { id: 'email', name: 'Email', path: '/bff/auth/email' };

describe('useSignInMethods', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is loading, then lists what the BFF offers', async () => {
    fetchMock.mockImplementation(async () => json({ methods: [email] }));
    const { result } = renderHook(() => useSignInMethods());
    expect(result.current).toMatchObject({ methods: [], isLoading: true, error: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ methods: [email], error: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports why the list could not be loaded', async () => {
    fetchMock.mockImplementation(async () => json({ code: 'UNKNOWN_PROVIDER' }, 404));
    const { result } = renderHook(() => useSignInMethods());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.methods).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('reads an answer without a list as none', async () => {
    fetchMock.mockImplementation(async () => json({}));
    const { result } = renderHook(() => useSignInMethods());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({ methods: [], error: null });
  });

  it('makes no request when turned off', () => {
    const { result } = renderHook(() => useSignInMethods('', false));
    expect(result.current).toMatchObject({ methods: [], isLoading: false, error: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not show one BFF’s methods for another', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.startsWith('https://a.example.com')
        ? json({ methods: [email] })
        : new Promise<Response>(() => {})
    );
    const { result, rerender } = renderHook(({ base }) => useSignInMethods(base), {
      initialProps: { base: 'https://a.example.com' },
    });
    await waitFor(() => expect(result.current.methods).toEqual([email]));
    rerender({ base: 'https://b.example.com' });
    expect(result.current).toMatchObject({ methods: [], isLoading: true });
  });
});
