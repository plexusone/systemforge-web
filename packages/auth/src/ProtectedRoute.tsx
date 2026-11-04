import { type ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import type { Membership, Role, ProtectedRouteProps } from './types';
import { ROLE_LEVELS } from './types';

/**
 * Default loading component
 */
function DefaultLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
      }}
    >
      <div>Loading...</div>
    </div>
  );
}

/**
 * Default unauthorized component
 */
function DefaultUnauthorized() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h1>Access Denied</h1>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}

/**
 * hasRoleIn reports whether the person holds one of `requiredRoles`, or a
 * higher one, in the organization `orgId`. Without `orgId` it checks the
 * person's only membership, and refuses a person with several: a role in
 * one organization says nothing about another. Platform admins pass.
 */
export function hasRoleIn(
  memberships: Membership[],
  requiredRoles: Role[],
  orgId?: string
): boolean {
  if (memberships.some((m) => m.role === 'platform_admin')) return true;
  if (requiredRoles.length === 0) return false;
  const membership =
    orgId !== undefined
      ? memberships.find((m) => m.organization_id === orgId)
      : memberships.length === 1
        ? memberships[0]
        : undefined;
  if (!membership) return false;
  const minRequiredLevel = Math.min(...requiredRoles.map((r) => ROLE_LEVELS[r]));
  return ROLE_LEVELS[membership.role] >= minRequiredLevel;
}

/**
 * ProtectedRoute - Protects routes requiring authentication and optionally specific roles
 *
 * @example Basic authentication check
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 *
 * @example With role requirement in an organization
 * ```tsx
 * <ProtectedRoute roles={['admin', 'owner']} orgId={currentOrgId}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 *
 * This gate decides only what the page shows. The server must authorize
 * every request itself.
 *
 * @example With custom fallback
 * ```tsx
 * <ProtectedRoute
 *   roles={['owner']}
 *   fallback={<UpgradePrompt />}
 * >
 *   <BillingPage />
 * </ProtectedRoute>
 * ```
 */
export function ProtectedRoute({
  children,
  roles,
  orgId,
  fallback,
  loadingComponent,
}: ProtectedRouteProps): ReactNode {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return loadingComponent ?? <DefaultLoading />;
  }

  // Not authenticated - redirect to login will be handled by app
  if (!isAuthenticated || !user) {
    return fallback ?? <DefaultUnauthorized />;
  }

  // No role requirement - just needs to be authenticated
  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  if (hasRoleIn(user.memberships, roles, orgId)) {
    return <>{children}</>;
  }

  // User doesn't have required role
  return fallback ?? <DefaultUnauthorized />;
}

/**
 * Hook to check if current user has specific roles
 *
 * @example
 * ```tsx
 * function EditButton() {
 *   const { hasRole } = usePermissions();
 *
 *   if (!hasRole(['admin', 'owner'], currentOrgId)) {
 *     return null;
 *   }
 *
 *   return <button>Edit</button>;
 * }
 * ```
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  /**
   * Check if user has any of the specified roles in the organization
   * `orgId`, or in their only membership when no organization is given
   */
  const hasRole = (requiredRoles: Role[], orgId?: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return hasRoleIn(user.memberships, requiredRoles, orgId);
  };

  /**
   * Check if user has a specific role in a specific organization
   */
  const hasRoleInOrg = (orgId: string, requiredRoles: Role[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return hasRoleIn(user.memberships, requiredRoles, orgId);
  };

  /**
   * Check if user is platform admin
   */
  const checkIsPlatformAdmin = (): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return user.memberships.some((m) => m.role === 'platform_admin');
  };

  return {
    hasRole,
    hasRoleInOrg,
    isPlatformAdmin: checkIsPlatformAdmin,
  };
}
