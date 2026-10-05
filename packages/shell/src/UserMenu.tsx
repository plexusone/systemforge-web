import { type ReactNode } from 'react';
import { useAuth } from '@plexusone/auth';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  UserIcon,
  cn,
} from '@plexusone/ui';
import type { UserMenuProps, UserAction } from './types';

/**
 * Default user actions
 */
const defaultActions: UserAction[] = [
  { id: 'profile', label: 'Profile', href: '/settings/profile' },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

/**
 * UserMenu - Dropdown menu for user actions
 *
 * @example
 * ```tsx
 * <UserMenu
 *   actions={[
 *     { id: 'profile', label: 'Profile', href: '/profile' },
 *     { id: 'logout', label: 'Logout', onClick: handleLogout, destructive: true },
 *   ]}
 * />
 * ```
 */
export function UserMenu({ actions = defaultActions, onNavigate }: UserMenuProps): ReactNode {
  const { user, logout, isLoading } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  const handleAction = (action: UserAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      if (onNavigate) {
        onNavigate(action.href);
      } else {
        window.location.assign(action.href);
      }
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // Combine custom actions with logout
  const allActions: UserAction[] = [
    ...actions,
    { id: 'logout', label: 'Sign out', onClick: handleLogout, destructive: true },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1 bg-transparent border-none rounded-full cursor-pointer hover:bg-accent"
        >
          <Avatar className="h-8 w-8">
            {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.name} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuGroup>
          {allActions.map((action, index) => {
            const isLogout = action.id === 'logout';
            const showSeparator = isLogout && index > 0;

            return (
              <div key={action.id}>
                {showSeparator && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={() => handleAction(action)}
                  className={cn(
                    'cursor-pointer',
                    action.destructive && 'text-destructive focus:text-destructive'
                  )}
                >
                  {action.icon && (
                    <span
                      className={cn(
                        'mr-2',
                        action.destructive ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {action.icon}
                    </span>
                  )}
                  {action.label}
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
