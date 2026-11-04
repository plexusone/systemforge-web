import type { ReactNode } from 'react';
import type { OAuthProvider } from '@plexusone/auth';

/**
 * Login page props
 */
export interface LoginPageProps {
  /**
   * Application name
   */
  appName?: string;

  /**
   * Application logo
   */
  logo?: ReactNode;

  /**
   * Available OAuth providers
   */
  oauthProviders?: OAuthProvider[];

  /**
   * Show email/password form
   */
  showEmailForm?: boolean;

  /**
   * Show registration link
   */
  showRegisterLink?: boolean;

  /**
   * URL to go to after login. Only a URL on this site is followed; any other
   * value, such as an absolute URL to another host, goes to "/" instead.
   */
  redirectUrl?: string;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Registration page URL
   */
  registerUrl?: string;

  /**
   * Forgot password page URL
   */
  forgotPasswordUrl?: string;
}

/**
 * Register page props
 */
export interface RegisterPageProps {
  /**
   * Application name
   */
  appName?: string;

  /**
   * Application logo
   */
  logo?: ReactNode;

  /**
   * Available OAuth providers
   */
  oauthProviders?: OAuthProvider[];

  /**
   * URL to redirect after registration
   */
  redirectUrl?: string;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Login page URL
   */
  loginUrl?: string;
}

/**
 * Forgot password page props
 */
export interface ForgotPasswordPageProps {
  /**
   * Application name
   */
  appName?: string;

  /**
   * Application logo
   */
  logo?: ReactNode;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Login page URL
   */
  loginUrl?: string;
}

/**
 * Reset password page props
 */
export interface ResetPasswordPageProps {
  /**
   * Reset token from URL
   */
  token: string;

  /**
   * Application name
   */
  appName?: string;

  /**
   * Application logo
   */
  logo?: ReactNode;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Login page URL
   */
  loginUrl?: string;
}

/**
 * Error page props
 */
export interface ErrorPageProps {
  /**
   * Error code (404, 500, etc.)
   */
  code?: number | string;

  /**
   * Error title
   */
  title?: string;

  /**
   * Error message
   */
  message?: string;

  /**
   * Show "Go home" button
   */
  showHomeButton?: boolean;

  /**
   * Show "Go back" button
   */
  showBackButton?: boolean;

  /**
   * Custom action buttons
   */
  actions?: ReactNode;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Home page URL
   */
  homeUrl?: string;
}

/**
 * Not found (404) page props
 */
export interface NotFoundPageProps extends Omit<ErrorPageProps, 'code' | 'title' | 'message'> {
  title?: string;
  message?: string;
}

/**
 * Server error (500) page props
 */
export interface ServerErrorPageProps extends Omit<ErrorPageProps, 'code' | 'title' | 'message'> {
  title?: string;
  message?: string;
}

/**
 * Maintenance page props
 */
export interface MaintenancePageProps {
  /**
   * Application name
   */
  appName?: string;

  /**
   * Application logo
   */
  logo?: ReactNode;

  /**
   * Custom title
   */
  title?: string;

  /**
   * Custom message
   */
  message?: string;

  /**
   * Expected return time
   */
  returnTime?: string;
}

/**
 * Loading page props
 */
export interface LoadingPageProps {
  /**
   * Loading message
   */
  message?: string;
}

/**
 * Settings tab
 */
export type SettingsTab = 'profile' | 'security' | 'accounts';

/**
 * User settings page props
 */
export interface UserSettingsPageProps {
  /**
   * Currently active tab
   */
  activeTab?: SettingsTab;

  /**
   * Available tabs (default: all)
   */
  tabs?: SettingsTab[];

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;

  /**
   * Callback when tab changes
   */
  onTabChange?: (tab: SettingsTab) => void;

  /**
   * BFF base URL
   */
  bffBaseUrl?: string;

  /**
   * Available OAuth providers for linking
   */
  oauthProviders?: OAuthProvider[];

  /**
   * Saves the profile. Without it, the profile tab is read-only.
   */
  onSaveProfile?: (profile: { name: string }) => Promise<void>;

  /**
   * Starts an avatar change. Without it, no Change avatar button is shown.
   */
  onChangeAvatar?: () => void;
}

/**
 * Organization settings tab
 */
export type OrgSettingsTab = 'general' | 'members' | 'invitations' | 'danger';

/**
 * Role type
 */
export type MemberRole = 'owner' | 'admin' | 'member';

/**
 * Member in an organization
 */
export interface OrgMember {
  id: string;
  principal_id: string;
  organization_id: string;
  role: MemberRole;
  permissions: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
  };
}

/**
 * Invitation to join organization
 */
export interface OrgInvitation {
  id: string;
  organization_id: string;
  email?: string;
  invite_code?: string;
  role: MemberRole;
  max_uses?: number;
  use_count: number;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  inviter_name?: string;
  expires_at?: string;
  created_at: string;
}

/**
 * Organization members page props
 */
export interface OrganizationMembersPageProps {
  /**
   * Organization slug
   */
  orgSlug: string;

  /**
   * Current user's principal ID
   */
  currentUserId?: string;

  /**
   * Current user's role in the organization
   */
  currentUserRole?: MemberRole;

  /**
   * API base URL
   */
  apiBaseUrl?: string;

  /**
   * Callback when member is updated
   */
  onMemberUpdate?: () => void;

  /**
   * Callback when ownership is transferred
   */
  onOwnershipTransferred?: () => void;
}

/**
 * Organization invitations page props
 */
export interface OrganizationInvitationsPageProps {
  /**
   * Organization slug
   */
  orgSlug: string;

  /**
   * Current user's role in the organization
   */
  currentUserRole?: MemberRole;

  /**
   * API base URL
   */
  apiBaseUrl?: string;

  /**
   * Callback when invitation is created
   */
  onInvitationCreated?: () => void;

  /**
   * Callback when invitation is revoked
   */
  onInvitationRevoked?: () => void;
}

/**
 * Organization settings page props
 */
export interface OrganizationSettingsPageProps {
  /**
   * Organization slug
   */
  orgSlug: string;

  /**
   * Currently active tab
   */
  activeTab?: OrgSettingsTab;

  /**
   * Available tabs (default: all)
   */
  tabs?: OrgSettingsTab[];

  /**
   * Current user's principal ID
   */
  currentUserId?: string;

  /**
   * Current user's role in the organization
   */
  currentUserRole?: MemberRole;

  /**
   * API base URL
   */
  apiBaseUrl?: string;

  /**
   * Callback when tab changes
   */
  onTabChange?: (tab: OrgSettingsTab) => void;

  /**
   * Custom navigation handler
   */
  onNavigate?: (href: string) => void;
}
