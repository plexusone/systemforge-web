import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiProvider, useApiClient } from '../ApiProvider';
import { useApiQuery } from '../hooks';

function Users() {
  const { data } = useApiQuery<{ who: string }>(['users'], '/users');
  return <p>{data ? data.who : 'loading'}</p>;
}

function OrgId() {
  const { currentOrgId } = useApiClient();
  return <span data-testid="org">{currentOrgId ?? ''}</span>;
}

function setup(answers: string[]) {
  let i = 0;
  const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
    const who = answers[Math.min(i++, answers.length - 1)];
    return new Response(
      JSON.stringify({ who, org: new Headers(init?.headers).get('X-Organization-ID') }),
      { status: 200 }
    );
  });
  vi.stubGlobal('fetch', fetch);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { fetch, queryClient };
}

describe('ApiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('drops cached data when the signed-in principal changes', async () => {
    const { queryClient } = setup(['alice', 'bob']);
    render(
      <ApiProvider config={{ baseUrl: '/api' }} queryClient={queryClient}>
        <Users />
      </ApiProvider>
    );
    expect(await screen.findByText('alice')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('systemforge:principal-change', { detail: { previous: 'a' } })
      );
    });
    // The cached data is gone, not merely stale.
    expect(queryClient.getQueryData(['users'])).not.toEqual({ who: 'alice', org: null });
    expect(await screen.findByText('bob')).toBeInTheDocument();
  });

  it('follows the organization tenant selects and drops the previous one’s data', async () => {
    const { fetch, queryClient } = setup(['org-a data', 'org-b data']);
    render(
      <ApiProvider config={{ baseUrl: '/api' }} queryClient={queryClient}>
        <Users />
        <OrgId />
      </ApiProvider>
    );
    expect(await screen.findByText('org-a data')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('systemforge:org-change', { detail: { org: { id: 'org-b' } } })
      );
    });
    expect(await screen.findByText('org-b data')).toBeInTheDocument();
    expect(screen.getByTestId('org')).toHaveTextContent('org-b');
    await waitFor(() => {
      const init = fetch.mock.calls.at(-1)?.[1] as RequestInit;
      expect(new Headers(init.headers).get('X-Organization-ID')).toBe('org-b');
    });
  });

  it('ignores tenant when followTenant is false', async () => {
    const { queryClient } = setup(['x']);
    render(
      <ApiProvider config={{ baseUrl: '/api' }} queryClient={queryClient} followTenant={false}>
        <OrgId />
      </ApiProvider>
    );
    act(() => {
      window.dispatchEvent(
        new CustomEvent('systemforge:org-change', { detail: { org: { id: 'org-b' } } })
      );
    });
    expect(screen.getByTestId('org')).toHaveTextContent('');
  });
});
