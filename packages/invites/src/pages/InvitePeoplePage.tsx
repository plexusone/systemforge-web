import { useState, type ReactNode } from 'react';
import { Button } from '@plexusone/ui';
import type { InvitesApi } from '../api';
import {
  Empty,
  ErrorNote,
  Loading,
  PageHeader,
  ShowOnce,
  StatusBadge,
  codeName,
  formatDate,
  useRun,
} from '../components/ui';
import type { CreatedCode, InviteCode } from '../types';
import { useLoad } from '../useLoad';

export interface InvitePeoplePageProps {
  /** The invite API, from createInvitesApi. */
  api: InvitesApi;
  /** The page heading. Default: "Invite people". */
  title?: string;
}

/**
 * InvitePeoplePage lets a signed-in member create invite links from their
 * allowance, copy a new link once, and revoke links nobody has used.
 */
export function InvitePeoplePage({
  api,
  title = 'Invite people',
}: InvitePeoplePageProps): ReactNode {
  const mine = useLoad(() => api.myInvites(), [api]);
  const [created, setCreated] = useState<CreatedCode>();
  const action = useRun();

  if (mine.error) {
    return (
      <>
        <PageHeader title={title} />
        {created && <ShowOnce created={created} onDone={() => setCreated(undefined)} />}
        <ErrorNote>Could not load your invites: {mine.error.message}</ErrorNote>
      </>
    );
  }
  if (!mine.data) {
    return (
      <>
        <PageHeader title={title} />
        <Loading what="your invites" />
      </>
    );
  }
  const { allowance, held, remaining, codes } = mine.data;
  const subtitle =
    allowance === 0
      ? "You don't have invites to give yet."
      : `You can invite ${remaining} more ${remaining === 1 ? 'person' : 'people'} (${held} of ${allowance} used or waiting).`;

  return (
    <>
      <PageHeader title={title} subtitle={subtitle}>
        <Button
          type="button"
          disabled={remaining === 0 || action.busy}
          onClick={() =>
            action.run('Create invite link', async () => {
              setCreated(await api.createMyCode());
              mine.reload();
            })
          }
        >
          Create invite link
        </Button>
      </PageHeader>
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
      {created && <ShowOnce created={created} onDone={() => setCreated(undefined)} />}
      {codes.length === 0 ? (
        allowance > 0 && <Empty>Invite links you create appear here.</Empty>
      ) : (
        <ul className="space-y-2">
          {codes.map((c) => (
            <MyCodeRow key={c.id} code={c} api={api} onChange={mine.reload} />
          ))}
        </ul>
      )}
    </>
  );
}

function MyCodeRow({
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
  const unused = c.status === 'active' && c.use_count === 0;
  return (
    <li aria-label={`Invite ${codeName(c.hint)}`} className="rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{codeName(c.hint)}</span>
          <StatusBadge status={c.status} />
        </div>
        <div className="text-xs text-muted-foreground">
          Created {formatDate(c.created_at)}
          {c.status === 'active' && c.expires_at && ` · expires ${formatDate(c.expires_at)}`}
        </div>
      </div>
      {unused && !confirm && (
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm">Nobody will be able to use this link.</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={action.busy}
            onClick={() =>
              action.run('Revoke', async () => {
                await api.revokeMyCode(c.id);
                setConfirm(false);
                onChange();
              })
            }
          >
            Revoke {codeName(c.hint)}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirm(false)}>
            Keep it
          </Button>
        </div>
      )}
      {action.error && <ErrorNote>{action.error}</ErrorNote>}
    </li>
  );
}
