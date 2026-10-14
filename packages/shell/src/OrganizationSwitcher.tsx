import { type ReactNode } from 'react';
import { organizationLabel, useSessionOptional, type SessionMembership } from '@plexusone/auth';
import {
  BuildingIcon,
  CheckIcon,
  ChevronDownIcon,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn,
} from '@plexusone/ui';

/** Props for {@link OrganizationSwitcher}. */
export interface OrganizationSwitcherProps {
  /** The current organization's ID. */
  value?: string;
  /** Called with the chosen organization's ID. The application decides where it goes, normally the URL. */
  onChange: (organizationId: string) => void;
  /** The memberships to list. Default: the session's. */
  memberships?: SessionMembership[];
  /** Show the switcher with a single membership. Default false. */
  alwaysShow?: boolean;
  className?: string;
}

/**
 * OrganizationSwitcher is a controlled organization picker keyed by
 * organization ID. Unlike {@link OrgSwitcher}, it keeps no state: the
 * application owns the current organization and is told when it changes.
 *
 * @example
 * ```tsx
 * <OrganizationSwitcher value={orgId} onChange={(id) => navigate(`/orgs/${id}`)} />
 * ```
 */
export function OrganizationSwitcher({
  value,
  onChange,
  memberships,
  alwaysShow = false,
  className,
}: OrganizationSwitcherProps): ReactNode {
  const ctx = useSessionOptional();
  const list = memberships ?? ctx?.session.user?.memberships ?? [];
  if (list.length === 0 || (list.length === 1 && !alwaysShow)) {
    return null;
  }
  const current = list.find((m) => m.organizationId === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch organization"
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 min-w-[160px] bg-secondary border border-border rounded-md text-left text-sm',
            className
          )}
        >
          <BuildingIcon className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate font-medium text-foreground">
            {current ? organizationLabel(current) : 'Choose organization'}
          </span>
          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]">
        {list.map((m) => {
          const selected = m.organizationId === value;
          return (
            <DropdownMenuItem
              key={m.organizationId}
              onSelect={() => {
                if (!selected) onChange(m.organizationId);
              }}
              aria-current={selected ? 'true' : undefined}
              className={cn('cursor-pointer', selected && 'bg-accent')}
            >
              <span className="flex-1 truncate text-sm">{organizationLabel(m)}</span>
              {selected && <CheckIcon className="h-4 w-4 ml-2 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
