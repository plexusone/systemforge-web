import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { devSession } from '@plexusone/host';
import { renderApp } from '@plexusone/host/testing';
import { createConsoleApp } from '../app';
import { browser, money, subscriptionText } from '../pages/Billing';
import type { BillingStatus } from '../types';

const app = createConsoleApp({ billing: true });

const status = (over: Partial<BillingStatus> = {}): BillingStatus => ({
  configured: true,
  mode: 'test',
  plan: 'free',
  canManage: true,
  pricing: {
    app: 'pbhq',
    currency: 'usd',
    plans: [
      {
        id: 'free',
        name: 'Free',
        tier: 'free',
        tierName: 'Free',
        tierRank: 1,
        selfServe: true,
        free: true,
        default: true,
      },
      {
        id: 'builder',
        name: 'Builder',
        tier: 'builder',
        tierName: 'Builder',
        tierRank: 2,
        selfServe: true,
        free: false,
        default: false,
        trialDays: 14,
        prices: [
          { interval: 'month', amountCents: 1900 },
          { interval: 'year', amountCents: 19000 },
        ],
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        tier: 'enterprise',
        tierName: 'Enterprise',
        tierRank: 3,
        selfServe: false,
        free: false,
        default: false,
      },
    ],
    features: [
      {
        id: 'refresh',
        name: 'Measurement refresh',
        levels: ['daily', 'hourly'],
        cells: [
          { plan: 'free', included: true, level: 'daily' },
          { plan: 'builder', included: true, level: 'hourly' },
          { plan: 'enterprise', included: true, level: 'hourly' },
        ],
      },
    ],
    limits: [
      {
        id: 'sites',
        name: 'Sites',
        unit: 'site',
        period: 'none',
        cells: [
          { plan: 'free', max: 2 },
          { plan: 'builder', max: 10 },
          { plan: 'enterprise', max: 0, unlimited: true },
        ],
      },
    ],
  },
  ...over,
});

interface Call {
  method: string;
  url: string;
  body?: unknown;
}

let calls: Call[];
let current: BillingStatus;

const json = (code: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status: code,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  calls = [];
  current = status();
  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = {
      method: init?.method ?? 'GET',
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(c);
    if (c.url.endsWith('/billing') && c.method === 'GET') return json(200, current);
    if (c.url.endsWith('/billing/checkout'))
      return json(200, { url: 'https://checkout.stripe.com/c/1' });
    if (c.url.endsWith('/billing/portal'))
      return json(200, { url: 'https://billing.stripe.com/p/1' });
    return json(404, { error: 'not found' });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const session = (role: string) =>
  devSession(app, { organizations: [{ id: 'org-1', name: 'Acme', role }] });

describe('Billing', () => {
  it('shows the plan and the plans, and buys one through checkout', async () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => undefined);
    renderApp(app, { session: session('owner'), path: '/orgs/org-1/billing' });
    const builder = await screen.findByRole('article', { name: 'Builder' });
    expect(
      within(screen.getByRole('region', { name: 'Current plan' })).getByText('Free')
    ).toBeInTheDocument();
    expect(screen.getByText('Test mode: no real charges')).toBeInTheDocument();
    expect(within(builder).getByText('14-day free trial')).toBeInTheDocument();
    expect(within(builder).getByText('Sites: 10')).toBeInTheDocument();
    expect(within(builder).getByText('Measurement refresh: hourly')).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'Enterprise' })).getByText('Talk to us')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Yearly' }));
    expect(within(builder).getByText(/\/ year/)).toBeInTheDocument();
    fireEvent.click(within(builder).getByRole('button', { name: 'Choose Builder' }));
    await waitFor(() => expect(go).toHaveBeenCalledWith('https://checkout.stripe.com/c/1'));
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.url).toBe('/console/api/v1/organizations/org-1/billing/checkout');
    expect(post?.body).toEqual({ plan: 'builder', interval: 'year' });
  });

  it('shows and sells the yearly price of a plan with no monthly one', async () => {
    current = status();
    const builder = current.pricing.plans[1]!;
    builder.prices = [{ interval: 'year', amountCents: 19000 }];
    const go = vi.spyOn(browser, 'go').mockImplementation(() => undefined);
    renderApp(app, { session: session('owner'), path: '/orgs/org-1/billing' });
    const card = await screen.findByRole('article', { name: 'Builder' });
    expect(within(card).getByText(/\/ year/)).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'Choose Builder' }));
    await waitFor(() => expect(go).toHaveBeenCalled());
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({
      plan: 'builder',
      interval: 'year',
    });
  });

  it('sends a paying organization to the billing portal', async () => {
    const go = vi.spyOn(browser, 'go').mockImplementation(() => undefined);
    current = status({
      plan: 'builder',
      subscription: {
        plan: 'builder',
        status: 'active',
        currentPeriodEnd: '2026-12-09T00:00:00Z',
        cancelAtPeriodEnd: false,
        paid: true,
      },
    });
    renderApp(app, { session: session('admin'), path: '/orgs/org-1/billing' });
    fireEvent.click(await screen.findByRole('button', { name: 'Manage billing' }));
    await waitFor(() => expect(go).toHaveBeenCalledWith('https://billing.stripe.com/p/1'));
    expect(screen.queryByRole('button', { name: /^Choose/ })).toBeNull();
    expect(
      within(screen.getByRole('article', { name: 'Builder' })).getByText('Your plan')
    ).toBeInTheDocument();
  });

  it('lets a member see the plan but not change it', async () => {
    current = status({ canManage: false });
    renderApp(app, { session: session('member'), path: '/orgs/org-1/billing' });
    expect(await screen.findByText('An owner or admin can change the plan.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Choose/ })).toBeNull();
  });

  it('says when the deployment takes no payments', async () => {
    current = status({ configured: false, mode: undefined });
    renderApp(app, { session: session('owner'), path: '/orgs/org-1/billing' });
    expect(await screen.findByText(/Payments are not set up on this deployment/)).toHaveTextContent(
      'Free'
    );
    expect(screen.queryByRole('button', { name: /^Choose/ })).toBeNull();
    expect(screen.queryByText('Test mode: no real charges')).toBeNull();
  });

  it('thanks the buyer on return from checkout', async () => {
    renderApp(app, {
      session: session('owner'),
      path: '/orgs/org-1/billing?checkout=success&session_id=cs_1',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Your payment went through');
  });

  it('lists Billing in the navigation only when asked to', () => {
    const nav = (a: typeof app) =>
      a.navigation?.({ organizationId: 'org-1' } as never)?.[0]?.items.map((i) => i.id);
    expect(nav(app)).toContain('billing');
    expect(nav(createConsoleApp())).not.toContain('billing');
  });
});

describe('formatting', () => {
  it('formats prices without empty cents', () => {
    expect(money(1900, 'usd')).toMatch(/19(?!\.)/);
    expect(money(499, 'usd')).toMatch(/4\.99/);
    expect(money(1900, 'jpy')).toMatch(/1,900(?!\.)/);
  });

  it('says what happens next to a subscription', () => {
    const sub = {
      plan: 'builder',
      status: 'active',
      currentPeriodEnd: '2026-12-09T12:00:00Z',
      cancelAtPeriodEnd: false,
      paid: true,
    };
    expect(subscriptionText(sub, 'builder')).toMatch(/^Renews on /);
    expect(subscriptionText({ ...sub, cancelAtPeriodEnd: true }, 'builder')).toMatch(
      /^Canceled; the plan ends on /
    );
    expect(subscriptionText({ ...sub, status: 'past_due' }, 'builder')).toMatch(/payment failed/);
  });
});
