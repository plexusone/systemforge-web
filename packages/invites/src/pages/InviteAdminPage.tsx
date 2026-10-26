import { useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input, Label } from '@plexusone/ui';
import { ApiError, type InvitesApi } from '../api';
import {
  Empty,
  ErrorNote,
  Loading,
  Note,
  PageHeader,
  ShowOnce,
  StatusBadge,
  codeName,
  formatDate,
  useRun,
} from '../components/ui';
import type { CreatedCode, EmailInvite, InviteCode, WaitlistEntry } from '../types';
import { useLoad, type Load } from '../useLoad';

export interface InviteAdminPageProps {
  /** The invite API, from createInvitesApi. */
  api: InvitesApi;
  /** The page heading. Default: "Invites". */
  title?: string;
}

const SECTIONS = [
  { id: 'codes', label: 'Invite codes' },
  { id: 'invites', label: 'Email invites' },
  { id: 'waitlist', label: 'Waitlist' },
  { id: 'allowances', label: 'Member allowances' },
  { id: 'joined', label: 'Joined' },
] as const;

type Section = (typeof SECTIONS)[number]['id'];

/**
 * InviteAdminPage is the operator page for invite-gated sign-up: invite
 * codes, email invites, the waitlist, member allowances, and the accounts
 * invites admitted. It is for platform administrators; others get the
 * API's refusal.
 */
export function InviteAdminPage({ api, title = 'Invites' }: InviteAdminPageProps): ReactNode {
  const [section, setSection] = useState<Section>('codes');
  return (
    <>
      <PageHeader
        title={title}
        subtitle="Decide who can create an account while sign-up is by invitation."
      />
      <div
        role="tablist"
        aria-label="Invite sections"
        className="mb-6 flex flex-wrap gap-1 border-b"
      >
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              section === s.id
                ? 'border-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        {section === 'codes' && <CodesSection api={api} />}
        {section === 'invites' && <InvitesSection api={api} />}
        {section === 'waitlist' && <WaitlistSection api={api} />}
        {section === 'allowances' && <AllowancesSection api={api} />}
        {section === 'joined' && <JoinedSection api={api} />}
      </div>
    </>
  );
}

/** loadState renders a load's error or loading state, or nothing once loaded. */
function loadState<T>(load: Load<T>, what: string): ReactNode {
  if (load.error) {
    if (load.error instanceof ApiError && load.error.status === 403) {
      return <ErrorNote>Only platform administrators can manage invites.</ErrorNote>;
    }
    return (
      <ErrorNote>
        Could not load {what}: {load.error.message}
      </ErrorNote>
    );
  }
  if (load.data === undefined) return <Loading what={what} />;
  return null;
}

/** splitEmails reads addresses separated by commas, spaces or new lines. */
export function splitEmails(text: string): string[] {
  return text
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** days parses a number of days from a form field, or returns 0. */
function days(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Field labels a form control. */
function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/** ConfirmRow asks before a destructive action, with confirm and cancel buttons. */
function ConfirmRow({
  prompt,
  action,
  busy,
  onConfirm,
  onCancel,
}: {
  prompt: string;
  action: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}): ReactNode {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-sm">{prompt}</span>
      <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={onConfirm}>
        {action}
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// --- Invite codes ---

/** CodesSection creates operator invite codes and lists every code. */
function CodesSection({ api }: { api: InvitesApi }): ReactNode {
  const codes = useLoad(() => api.codes({ kind: 'operator' }), [api]);
  const [created, setCreated] = useState<CreatedCode>();
  const [label, setLabel] = useState('');
  const [maxUses, setMaxUses] = useState('10');
  const [expires, setExpires] = useState('14');
  const [note, setNote] = useState('');
  const action = useRun();

  function submit(e: FormEvent) {
    e.preventDefault();
    void action.run('Create code', async () => {
      setCreated(
        await api.createCode({
          label: label.trim(),
          note: note.trim(),
          max_uses: Math.max(1, Number.parseInt(maxUses, 10) || 1),
          expires_in_days: days(expires),
        })
      );
      setLabel('');
      setNote('');
      codes.reload();
    });
  }

  return (
    <>
      <form
        onSubmit={submit}
        aria-label="New invite code"
        className="mb-6 grid gap-3 sm:grid-cols-4"
      >
        <Field id="code-label" label="Label">
          <Input
            id="code-label"
            value={label}
            maxLength={100}
            placeholder="launch-week"
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
        <Field id="code-uses" label="People it admits">
          <Input
            id="code-uses"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </Field>
        <Field id="code-expires" label="Expires in days (0: never)">
          <Input
            id="code-expires"
            type="number"
            min={0}
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </Field>
        <Field id="code-note" label="Note">
          <Input
            id="code-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <div className="sm:col-span-4">
          <Button type="submit" disabled={action.busy}>
            Create invite code
          </Button>
        </div>
      </form>
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
      {created && <ShowOnce created={created} onDone={() => setCreated(undefined)} />}
      {loadState(codes, 'invite codes') ??
        (codes.data!.length === 0 ? (
          <Empty>No invite codes yet. Create one above and share its link.</Empty>
        ) : (
          <ul className="space-y-2">
            {codes.data!.map((c) => (
              <CodeRow key={c.id} code={c} api={api} onChange={codes.reload} />
            ))}
          </ul>
        ))}
    </>
  );
}

/** CodeRow shows one invite code's use and status, with revoke. */
function CodeRow({
  code: c,
  api,
  onChange,
}: {
  code: InviteCode;
  api: InvitesApi;
  onChange: () => void;
}): ReactNode {
  const [confirm, setConfirm] = useState(false);
  const action = useRun();
  const name = c.label ? `${c.label} ${codeName(c.hint)}` : codeName(c.hint);
  return (
    <li aria-label={`Code ${name}`} className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {c.label && <span className="font-medium">{c.label}</span>}
          <span className="font-mono text-sm text-muted-foreground">{codeName(c.hint)}</span>
          <StatusBadge status={c.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          {c.use_count} of {c.max_uses} used · created {formatDate(c.created_at)}
          {c.expires_at && ` · expires ${formatDate(c.expires_at)}`}
        </div>
      </div>
      {c.note && <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>}
      {c.status === 'active' && !confirm && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setConfirm(true)}
        >
          Revoke
        </Button>
      )}
      {confirm && (
        <ConfirmRow
          prompt="Nobody else will be able to join with this code."
          action={`Revoke ${name}`}
          busy={action.busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            void action.run('Revoke', async () => {
              await api.revokeCode(c.id);
              setConfirm(false);
              onChange();
            })
          }
        />
      )}
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
    </li>
  );
}

// --- Email invites ---

/** InvitesSection invites people by email address and lists the invites. */
function InvitesSection({ api }: { api: InvitesApi }): ReactNode {
  const invites = useLoad(() => api.invites(true), [api]);
  const [emails, setEmails] = useState('');
  const [note, setNote] = useState('');
  const [expires, setExpires] = useState('0');
  const [result, setResult] = useState<string>();
  const action = useRun();

  function submit(e: FormEvent) {
    e.preventDefault();
    const list = splitEmails(emails);
    if (list.length === 0) return;
    void action.run('Invite', async () => {
      const r = await api.addInvites(list, { note: note.trim(), expires_in_days: days(expires) });
      const failed = r.failed.map((f) => `${f.email} (${f.error})`).join(', ');
      setResult(
        `Invited ${r.invites.length} ${r.invites.length === 1 ? 'address' : 'addresses'}.` +
          (failed ? ` Not invited: ${failed}.` : '')
      );
      setEmails('');
      invites.reload();
    });
  }

  return (
    <>
      <form onSubmit={submit} aria-label="Invite by email" className="mb-6 space-y-3">
        <Field id="invite-emails" label="Email addresses">
          <textarea
            id="invite-emails"
            value={emails}
            rows={3}
            placeholder="ada@example.com, grace@example.com"
            onChange={(e) => setEmails(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="invite-note" label="Note">
            <Input
              id="invite-note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <Field id="invite-expires" label="Expires in days (0: never)">
            <Input
              id="invite-expires"
              type="number"
              min={0}
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </Field>
        </div>
        <Button type="submit" disabled={action.busy}>
          Invite
        </Button>
      </form>
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
      {result && <Note>{result}</Note>}
      {loadState(invites, 'email invites') ??
        (invites.data!.length === 0 ? (
          <Empty>No email invites yet.</Empty>
        ) : (
          <ul className="mt-4 space-y-2">
            {invites.data!.map((i) => (
              <InviteRow key={i.email} invite={i} api={api} onChange={invites.reload} />
            ))}
          </ul>
        ))}
    </>
  );
}

/** InviteRow shows one email invite, with revoke while it is pending. */
function InviteRow({
  invite: i,
  api,
  onChange,
}: {
  invite: EmailInvite;
  api: InvitesApi;
  onChange: () => void;
}): ReactNode {
  const [confirm, setConfirm] = useState(false);
  const action = useRun();
  return (
    <li aria-label={`Invite ${i.email}`} className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>{i.email}</span>
          <StatusBadge status={i.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          {i.redeemed_at
            ? `Joined ${formatDate(i.redeemed_at)}`
            : `Invited ${formatDate(i.created_at)}`}
          {i.status === 'pending' && i.expires_at && ` · expires ${formatDate(i.expires_at)}`}
        </div>
      </div>
      {i.note && <p className="mt-1 text-sm text-muted-foreground">{i.note}</p>}
      {i.status !== 'redeemed' && !confirm && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setConfirm(true)}
        >
          Revoke
        </Button>
      )}
      {confirm && (
        <ConfirmRow
          prompt="This address will no longer be able to sign up."
          action={`Revoke ${i.email}`}
          busy={action.busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            void action.run('Revoke', async () => {
              await api.revokeInvite(i.email);
              onChange();
            })
          }
        />
      )}
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
    </li>
  );
}

// --- Waitlist ---

/** WaitlistSection lists the waitlist and invites the selected addresses. */
function WaitlistSection({ api }: { api: InvitesApi }): ReactNode {
  const waitlist = useLoad(() => api.waitlist(), [api]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<string>();
  const action = useRun();

  function toggle(email: string) {
    const next = new Set(selected);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelected(next);
  }

  function drop(email: string) {
    const next = new Set(selected);
    next.delete(email);
    setSelected(next);
  }

  const state = loadState(waitlist, 'the waitlist');
  if (state) return state;
  const entries = waitlist.data!;
  const waiting = entries.filter((e) => !e.invited_at).map((e) => e.email);
  // Only addresses still on the list are invited and counted.
  const listed = new Set(entries.map((e) => e.email));
  const chosen = [...selected].filter((email) => listed.has(email));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={action.busy || chosen.length === 0}
          onClick={() =>
            void action.run('Invite', async () => {
              const r = await api.inviteFromWaitlist(chosen);
              setResult(`Invited ${r.invites.length}.${r.error ? ` ${r.error}` : ''}`);
              setSelected(new Set());
              waitlist.reload();
            })
          }
        >
          Invite selected ({chosen.length})
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={waiting.length === 0}
          onClick={() => setSelected(new Set(waiting))}
        >
          Select everyone not yet invited
        </Button>
      </div>
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
      {result && <Note>{result}</Note>}
      {entries.length === 0 ? (
        <Empty>Nobody is waiting.</Empty>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((e) => (
            <WaitlistRow
              key={e.email}
              entry={e}
              api={api}
              checked={selected.has(e.email)}
              onToggle={() => toggle(e.email)}
              onRemoved={() => {
                drop(e.email);
                waitlist.reload();
              }}
            />
          ))}
        </ul>
      )}
    </>
  );
}

/** WaitlistRow shows one waitlist entry, with select and remove. */
function WaitlistRow({
  entry: e,
  api,
  checked,
  onToggle,
  onRemoved,
}: {
  entry: WaitlistEntry;
  api: InvitesApi;
  checked: boolean;
  onToggle: () => void;
  onRemoved: () => void;
}): ReactNode {
  const [confirm, setConfirm] = useState(false);
  const action = useRun();
  return (
    <li aria-label={`Waiting ${e.email}`} className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={checked} onChange={onToggle} />
          <span>{e.email}</span>
        </label>
        <div className="text-xs text-muted-foreground">
          Joined {formatDate(e.joined_at)}
          {e.invited_at && ` · invited ${formatDate(e.invited_at)}`}
        </div>
      </div>
      {!confirm && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setConfirm(true)}
        >
          Remove
        </Button>
      )}
      {confirm && (
        <ConfirmRow
          prompt="Remove this address from the waitlist?"
          action={`Remove ${e.email}`}
          busy={action.busy}
          onCancel={() => setConfirm(false)}
          onConfirm={() =>
            void action.run('Remove', async () => {
              await api.removeFromWaitlist(e.email);
              onRemoved();
            })
          }
        />
      )}
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
    </li>
  );
}

// --- Member allowances ---

/** AllowancesSection sets how many people a member may invite. */
function AllowancesSection({ api }: { api: InvitesApi }): ReactNode {
  const allowances = useLoad(() => api.allowances(), [api]);
  const settings = useLoad(() => api.settings(), [api]);
  const [email, setEmail] = useState('');
  const [count, setCount] = useState('3');
  const [note, setNote] = useState('');
  const action = useRun();

  function submit(e: FormEvent) {
    e.preventDefault();
    const granted = count.trim() === '' ? null : Math.max(0, Number.parseInt(count, 10) || 0);
    void action.run('Set allowance', async () => {
      await api.setAllowance(email.trim(), granted, note.trim());
      setEmail('');
      setNote('');
      allowances.reload();
    });
  }

  return (
    <>
      {settings.data && (
        <p className="mb-4 text-sm text-muted-foreground">
          Members without an allowance of their own may invite {settings.data.default_allowance}{' '}
          {settings.data.default_allowance === 1 ? 'person' : 'people'}. Their links work for{' '}
          {Math.round(settings.data.member_code_ttl_seconds / 86400)} days.
        </p>
      )}
      <form
        onSubmit={submit}
        aria-label="Set an allowance"
        className="mb-6 grid gap-3 sm:grid-cols-4"
      >
        <Field id="allowance-email" label="Member's email">
          <Input
            id="allowance-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field id="allowance-count" label="People they may invite (empty: default)">
          <Input
            id="allowance-count"
            type="number"
            min={0}
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </Field>
        <Field id="allowance-note" label="Note">
          <Input
            id="allowance-note"
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={action.busy}>
            Set allowance
          </Button>
        </div>
      </form>
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
      {loadState(allowances, 'allowances') ??
        (allowances.data!.length === 0 ? (
          <Empty>No allowances set. Every member has the default.</Empty>
        ) : (
          <ul className="space-y-2">
            {allowances.data!.map((a) => (
              <li
                key={a.principal_id}
                aria-label={`Allowance ${a.email}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
              >
                <span>{a.email}</span>
                <span className="text-sm text-muted-foreground">
                  {a.held} of {a.effective} used or waiting
                  {a.granted === null && ' (default)'}
                  {a.note && ` · ${a.note}`}
                </span>
              </li>
            ))}
          </ul>
        ))}
    </>
  );
}

// --- Joined ---

/** JoinedSection lists accounts created with invite codes. */
function JoinedSection({ api }: { api: InvitesApi }): ReactNode {
  const joined = useLoad(() => api.joined(), [api]);
  const state = loadState(joined, 'joined accounts');
  if (state) return state;
  const rows = joined.data!;
  if (rows.length === 0) return <Empty>Nobody has joined through an invite yet.</Empty>;
  return (
    <ul className="space-y-2">
      {rows.map((j) => (
        <li
          key={`${j.source}-${j.email}-${j.joined_at}`}
          aria-label={`Joined ${j.email}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
        >
          <span>{j.email}</span>
          <span className="text-sm text-muted-foreground">
            {j.source === 'invite'
              ? 'Email invite'
              : j.code_kind === 'member'
                ? `Member invite ${codeName(j.code_hint ?? '')}`
                : `Code ${j.code_label ?? ''} ${codeName(j.code_hint ?? '')}`.replace('  ', ' ')}
            {' · '}
            {formatDate(j.joined_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
