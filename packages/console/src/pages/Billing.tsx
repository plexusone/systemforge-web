import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { useAppContext } from '@plexusone/host';
import { Button } from '@plexusone/ui';
import { ApiError, api } from '../api';
import { ErrorNote, Loading, PageHeader } from '../components/ui';
import { useLoad } from '../useLoad';
import type { BillingStatus, LimitRow, PlanColumn, Price } from '../types';

/** Where the browser is sent for checkout and the portal; replaced in tests. */
export const browser = {
  go: (url: string): void => window.location.assign(url),
};

/** Billing shows the organization's plan and lets an owner or admin choose or change it. */
export function Billing(): ReactNode {
  const { organizationId: org } = useAppContext();
  const status = useLoad(() => api.billing(org), [org]);
  const [params] = useSearchParams();
  const returned = params.get('checkout');

  const header = (
    <PageHeader
      title="Billing"
      subtitle="Your organization's plan. Every application in the organization follows it."
    >
      {status.data?.mode === 'test' && (
        <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          Test mode: no real charges
        </span>
      )}
    </PageHeader>
  );

  if (status.error) {
    return (
      <>
        {header}
        <ErrorNote>
          {status.error instanceof ApiError && status.error.status === 404
            ? 'Billing is not enabled on this deployment.'
            : `Could not load billing: ${status.error.message}`}
        </ErrorNote>
      </>
    );
  }
  if (!status.data) {
    return (
      <>
        {header}
        <Loading what="billing" />
      </>
    );
  }
  return (
    <>
      {header}
      {returned === 'success' && (
        <p
          role="status"
          className="mb-4 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm"
        >
          Thank you. Your payment went through; your plan changes as soon as the payment provider
          confirms it.{' '}
          <button type="button" className="underline" onClick={status.reload}>
            Refresh
          </button>
        </p>
      )}
      {returned === 'canceled' && (
        <p
          role="status"
          className="mb-4 rounded-md border border-border bg-muted px-3 py-2 text-sm"
        >
          Checkout was canceled. Nothing was charged.
        </p>
      )}
      <BillingView org={org} status={status.data} />
    </>
  );
}

/** The plan, the subscription and the plans to choose from. */
export function BillingView({ org, status: s }: { org: string; status: BillingStatus }): ReactNode {
  const yearly = s.pricing.plans.some((p) => price(p, 'year'));
  const [interval, setPeriod] = useState<'month' | 'year'>('month');
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();
  const current = s.pricing.plans.find((p) => p.id === s.plan);
  const paid = s.subscription?.paid ?? false;

  async function go(key: string, fn: () => Promise<string>) {
    setBusy(key);
    setError(undefined);
    try {
      browser.go(await fn());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(undefined);
    }
  }

  return (
    <div className="space-y-6">
      <section aria-label="Current plan" className="rounded-lg border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Current plan</p>
            <p className="text-lg font-semibold">{current?.name ?? s.plan}</p>
            {s.subscription && subscriptionText(s.subscription, s.plan) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {subscriptionText(s.subscription, s.plan)}
              </p>
            )}
          </div>
          {paid && s.canManage && (
            <Button
              variant="outline"
              disabled={busy !== undefined}
              onClick={() => void go('portal', () => api.portal(org))}
            >
              {busy === 'portal' ? 'Opening…' : 'Manage billing'}
            </Button>
          )}
        </div>
        {paid && s.canManage && (
          <p className="mt-3 text-xs text-muted-foreground">
            Change or cancel the plan, update the card and download invoices in the billing portal.
          </p>
        )}
      </section>

      {!s.configured && (
        <p className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
          Payments are not set up on this deployment, so every organization is on{' '}
          {current?.name ?? 'the free plan'}.
        </p>
      )}
      {s.configured && !s.canManage && (
        <p className="text-sm text-muted-foreground">An owner or admin can change the plan.</p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      <section aria-label="Plans">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Plans</h2>
          {yearly && (
            <div
              role="group"
              aria-label="Billing interval"
              className="inline-flex rounded-md border border-border p-0.5 text-sm"
            >
              {(['month', 'year'] as const).map((i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={interval === i}
                  className={`rounded px-3 py-1 ${interval === i ? 'bg-foreground text-background' : ''}`}
                  onClick={() => setPeriod(i)}
                >
                  {i === 'month' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          )}
        </div>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {s.pricing.plans.map((p, i) => {
            // A plan without a price for the chosen interval shows, and sells, the one it has.
            const pr = price(p, interval) ?? p.prices?.[0];
            const isCurrent = p.id === s.plan;
            const canBuy =
              s.configured && s.canManage && !paid && p.selfServe && !p.free && pr !== undefined;
            return (
              <li key={p.id}>
                <article
                  aria-label={p.name}
                  className={`flex h-full flex-col rounded-lg border p-5 ${isCurrent ? 'border-foreground' : 'border-border'}`}
                >
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {p.free ? 'Free' : pr ? money(pr.amountCents, s.pricing.currency) : 'Custom'}
                    {pr && !p.free && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {' '}
                        / {pr.interval}
                      </span>
                    )}
                  </p>
                  {p.trialDays ? (
                    <p className="text-xs text-muted-foreground">{p.trialDays}-day free trial</p>
                  ) : null}
                  <ul className="mt-4 flex-1 space-y-1 text-sm">
                    {s.pricing.limits.map((l) => (
                      <li key={l.id}>{limitText(l, i)}</li>
                    ))}
                    {s.pricing.features.map((f) => {
                      const c = f.cells[i];
                      if (!c?.included) return null;
                      return <li key={f.id}>{c.level ? `${f.name}: ${c.level}` : f.name}</li>;
                    })}
                  </ul>
                  <div className="mt-4">
                    {isCurrent ? (
                      <p className="text-sm font-medium">Your plan</p>
                    ) : canBuy && pr ? (
                      <Button
                        className="w-full"
                        disabled={busy !== undefined}
                        onClick={() => void go(p.id, () => api.checkout(org, p.id, pr.interval))}
                      >
                        {busy === p.id ? 'Opening checkout…' : `Choose ${p.name}`}
                      </Button>
                    ) : !p.selfServe ? (
                      <p className="text-sm text-muted-foreground">Talk to us</p>
                    ) : paid && s.canManage && !p.free ? (
                      <p className="text-sm text-muted-foreground">Change in the billing portal</p>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function price(p: PlanColumn, interval: Price['interval']): Price | undefined {
  return p.prices?.find((x) => x.interval === interval);
}

/**
 * money formats an amount in the currency's smallest unit (cents for USD,
 * yen for JPY), without a fraction when there is none.
 */
export function money(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const digits =
    new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  const scale = 10 ** digits;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: amount % scale === 0 ? 0 : digits,
  }).format(amount / scale);
}

const PER: Record<LimitRow['period'], string> = {
  none: '',
  day: ' a day',
  month: ' a month',
  year: ' a year',
};

function limitText(l: LimitRow, i: number): string {
  const c = l.cells[i];
  if (!c) return l.name;
  if (c.unlimited) return `${l.name}: unlimited`;
  return `${l.name}: ${c.max.toLocaleString()}${PER[l.period]}${c.fairUse ? ' (fair use)' : ''}`;
}

/** subscriptionText says what happens next to a subscription. */
export function subscriptionText(
  sub: NonNullable<BillingStatus['subscription']>,
  plan: string
): string {
  const end = new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { dateStyle: 'medium' });
  switch (sub.status) {
    case 'trialing':
      return `Free trial until ${end}.`;
    case 'past_due':
      return 'The last payment failed. Update the card in the billing portal to keep the plan.';
    case 'active':
      if (!sub.paid || sub.plan !== plan) return '';
      return sub.cancelAtPeriodEnd ? `Canceled; the plan ends on ${end}.` : `Renews on ${end}.`;
    default:
      return sub.paid ? 'The subscription has ended.' : '';
  }
}
