import { type ReactNode } from 'react';
import { useTenant } from '@plexusone/tenant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
  BuildingIcon,
  ChevronDownIcon,
  CheckIcon,
  cn,
} from '@plexusone/ui';
import type { OrgSwitcherProps } from './types';

/**
 * OrgSwitcher - Dropdown for switching between organizations
 *
 * @example
 * ```tsx
 * <OrgSwitcher />
 * ```
 */
export function OrgSwitcher({ compact = false }: OrgSwitcherProps): ReactNode {
  const { currentOrg, organizations, setCurrentOrg, isLoading } = useTenant();

  if (isLoading) {
    return <div className="px-3 py-2 bg-secondary rounded-md opacity-50 text-sm">Loading...</div>;
  }

  if (!currentOrg) {
    return null;
  }

  const handleSelect = (orgId: string) => {
    setCurrentOrg(orgId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 bg-secondary border border-border rounded-md cursor-pointer text-left',
            compact ? 'p-2' : 'px-3 py-2 min-w-[180px]'
          )}
        >
          <Avatar className="h-5 w-5 rounded">
            {currentOrg.logo_url ? <AvatarImage src={currentOrg.logo_url} alt="" /> : null}
            <AvatarFallback className="rounded bg-transparent">
              <BuildingIcon className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {!compact && (
            <>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-foreground">
                {currentOrg.name}
              </span>
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[200px]">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelect(org.id)}
            className={cn('cursor-pointer', org.id === currentOrg.id && 'bg-accent')}
          >
            <Avatar className="h-5 w-5 mr-2 rounded">
              {org.logo_url ? <AvatarImage src={org.logo_url} alt="" /> : null}
              <AvatarFallback className="rounded bg-transparent">
                <BuildingIcon className="h-4 w-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>

            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm">
              {org.name}
            </span>

            {org.id === currentOrg.id && <CheckIcon className="h-4 w-4 text-primary ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
