import { type ReactNode } from 'react';
import { membershipFor, organizationLabel, useSessionOptional } from '@plexusone/auth';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@plexusone/ui';
import type { UserAction } from './types';

/** Props for {@link ProfileMenu}. */
export interface ProfileMenuProps {
  /** This application's ID, to show the role held in it. */
  appId?: string;
  /** The current organization's ID. */
  organizationId?: string;
  /** The application's own entries, shown above sign-out. Default: none. */
  items?: UserAction[];
  /** Navigation for entries with an href, for SPA routing. */
  onNavigate?: (href: string) => void;
  /** Called when signing out fails. Default: logged to the console. */
  onSignOutError?: (err: unknown) => void;
}

/** One or two initials from a name or email, for an avatar without an image. */
export function initials(nameOrEmail: string | undefined): string {
  const s = (nameOrEmail ?? '').trim();
  if (!s) return '?';
  const words = s.split(/[\s@._-]+/).filter(Boolean);
  const letters = words.length > 1 ? words[0][0] + words[1][0] : s[0];
  return letters.toUpperCase();
}

/**
 * ProfileMenu shows who is signed in, the current organization and the role
 * held in this application, the application's own entries, and sign out. It
 * reads the session from SessionProvider and renders nothing without a
 * signed-in session.
 *
 * @example
 * ```tsx
 * <ProfileMenu appId="reports" organizationId={orgId} items={[{ id: 'keys', label: 'API keys', href: '/keys' }]} />
 * ```
 */
export function ProfileMenu({
  appId,
  organizationId,
  items = [],
  onNavigate,
  onSignOutError = (err) => console.error('signing out failed', err),
}: ProfileMenuProps): ReactNode {
  const ctx = useSessionOptional();
  const user = ctx?.session.user;
  if (!ctx || ctx.status !== 'authenticated' || !user) {
    return null;
  }

  const who = user.name || user.email || 'Signed in';
  const membership = membershipFor(ctx.session, organizationId);
  const role = membership
    ? (appId && membership.applications[appId]) || membership.role
    : undefined;

  const run = (item: UserAction) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      if (onNavigate) onNavigate(item.href);
      else window.location.assign(item.href);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account: ${who}`}
          title={`Signed in as ${who}`}
          className="flex items-center p-1 bg-transparent border-none rounded-full cursor-pointer hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {initials(user.name || user.email)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{who}</p>
            {user.email && user.email !== who && (
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>

        {membership && (
          <>
            <DropdownMenuSeparator />
            <dl className="px-2 py-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Organization</dt>
              <dd className="truncate">{organizationLabel(membership)}</dd>
              {role && (
                <>
                  <dt className="text-muted-foreground">Role</dt>
                  <dd>{role}</dd>
                </>
              )}
            </dl>
          </>
        )}

        <DropdownMenuSeparator />
        {items.length > 0 && (
          <>
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onSelect={() => run(item)}
                  className={cn(
                    'cursor-pointer',
                    item.destructive && 'text-destructive focus:text-destructive'
                  )}
                >
                  {item.icon && <span className="mr-2 text-muted-foreground">{item.icon}</span>}
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onSelect={() => {
            ctx.signOut().catch(onSignOutError);
          }}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
