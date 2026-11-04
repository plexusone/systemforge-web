import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { useAuth, type Membership, type Role } from '@plexusone/auth';
import type {
  Organization,
  OrganizationMembership,
  TenantConfig,
  TenantContextValue,
} from './types';

/**
 * Tenant context
 */
const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Organization change event name
 */
export const ORG_CHANGE_EVENT = 'systemforge:org-change';

/**
 * Props for TenantProvider
 */
export interface TenantProviderProps extends TenantConfig {
  children: ReactNode;
}

/**
 * Convert user membership to organization
 */
function membershipToOrg(membership: Membership): Organization {
  return {
    id: membership.organization_id,
    name: membership.organization_name,
    slug: membership.organization_slug,
    type: 'team', // Default type, actual type would come from full org fetch
    owner_id: '', // Not available in membership
    created_at: membership.joined_at,
  };
}

/**
 * Convert membership to OrganizationMembership
 */
function toOrgMembership(membership: Membership, org: Organization): OrganizationMembership {
  return {
    id: membership.id,
    organization: org,
    role: membership.role as Role,
    joined_at: membership.joined_at,
  };
}

/**
 * TenantProvider component - Manages organization context
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <TenantProvider
 *     storageKey="myapp:org"
 *     onOrgChange={(org) => console.log('Switched to:', org.name)}
 *   >
 *     <App />
 *   </TenantProvider>
 * </AuthProvider>
 * ```
 */
export function TenantProvider({
  children,
  storageKey = 'systemforge:current_org',
  defaultOrgId,
  onOrgChange,
}: TenantProviderProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    // Restore the last selection; it is used only if it is still a membership.
    () => readStored(storageKey) || defaultOrgId || null
  );

  /**
   * Build organizations list from user memberships
   */
  const memberships = user?.memberships;
  const organizations = useMemo((): Organization[] => {
    if (!memberships) {
      return [];
    }
    return memberships.map(membershipToOrg);
  }, [memberships]);

  /**
   * Derive the effective org ID - handles auto-select and logout clearing
   * Note: This is computed before currentOrg to determine which org to use.
   * For logout, we clear localStorage but the state naturally becomes stale when user is null.
   */
  const effectiveOrgId = useMemo(() => {
    // If user logged out, no org
    if (!user) {
      return null;
    }
    // If current org is valid, use it
    if (currentOrgId && organizations.find((org) => org.id === currentOrgId)) {
      return currentOrgId;
    }
    // Fall back to first org
    return organizations.length > 0 ? organizations[0].id : null;
  }, [user, currentOrgId, organizations]);

  /**
   * Current organization
   */
  const currentOrg = useMemo((): Organization | null => {
    if (!effectiveOrgId || organizations.length === 0) {
      return null;
    }
    return organizations.find((org) => org.id === effectiveOrgId) ?? null;
  }, [organizations, effectiveOrgId]);

  /**
   * Current membership
   */
  const membership = useMemo((): OrganizationMembership | null => {
    if (!memberships || !currentOrg) {
      return null;
    }

    const userMembership = memberships.find((m) => m.organization_id === currentOrg.id);

    if (!userMembership) {
      return null;
    }

    return toOrgMembership(userMembership, currentOrg);
  }, [memberships, currentOrg]);

  /**
   * Check if user is platform admin
   */
  const isPlatformAdmin = useMemo((): boolean => {
    return memberships?.some((m) => m.role === 'platform_admin') ?? false;
  }, [memberships]);

  /**
   * Set current organization
   */
  const setCurrentOrg = useCallback(
    (orgId: string) => {
      const org = organizations.find((o) => o.id === orgId);
      if (!org) {
        console.warn(`Organization ${orgId} not found in user's memberships`);
        return;
      }

      setCurrentOrgId(orgId);

      writeStored(storageKey, orgId);

      // Callback
      onOrgChange?.(org);
    },
    [organizations, storageKey, onOrgChange]
  );

  /**
   * Forget the stored organization when the signed-in person signs out or
   * changes. Not while auth is loading: there is no user yet, and clearing
   * then would forget the selection on every page load.
   */
  const signedInAs = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (authLoading) return;
    const id = user?.id;
    if (signedInAs.current !== undefined && signedInAs.current !== id) {
      removeStored(storageKey);
    }
    signedInAs.current = id;
  }, [authLoading, user, storageKey]);

  /**
   * Announce the organization in use whenever it changes, including the one
   * restored or chosen first, so @plexusone/api-client sends it.
   */
  useEffect(() => {
    if (!currentOrg || typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(ORG_CHANGE_EVENT, { detail: { org: currentOrg } }));
  }, [currentOrg]);

  const isLoading = authLoading;

  const value = useMemo<TenantContextValue>(
    () => ({
      currentOrg,
      setCurrentOrg,
      organizations,
      membership,
      isPlatformAdmin,
      isLoading,
    }),
    [currentOrg, setCurrentOrg, organizations, membership, isPlatformAdmin, isLoading]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

/**
 * Hook to access tenant context
 *
 * @throws Error if used outside TenantProvider
 *
 * @example
 * ```tsx
 * function OrgHeader() {
 *   const { currentOrg } = useTenant();
 *   return <h1>{currentOrg?.name}</h1>;
 * }
 * ```
 */
export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

/**
 * Get tenant context without throwing (returns null if not in provider)
 */
export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}

// localStorage throws in some privacy modes and sandboxed frames; the
// selection is then not remembered, and nothing else changes.
function readStored(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered.
  }
}

function removeStored(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to remove.
  }
}
