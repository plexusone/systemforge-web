import { useState, type ReactNode, type FormEvent } from 'react';
import { useAuth, useLinkedAccounts, type OAuthProvider } from '@plexusone/auth';
import type { UserSettingsPageProps, SettingsTab } from './types';

/**
 * Tab configuration
 */
const tabConfig: Record<SettingsTab, { label: string; icon: ReactNode }> = {
  profile: {
    label: 'Profile',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  security: {
    label: 'Security',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  accounts: {
    label: 'Linked Accounts',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
};

/**
 * Provider icons for linked accounts
 */
const providerIcons: Record<OAuthProvider, ReactNode> = {
  github: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  google: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
  microsoft: (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  ),
};

/**
 * Profile Tab Content
 */
function ProfileTab({
  onSaveProfile,
  onChangeAvatar,
}: Pick<UserSettingsPageProps, 'onSaveProfile' | 'onChangeAvatar'>): ReactNode {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (!onSaveProfile) return;
      await onSaveProfile({ name });
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '24px',
          color: 'var(--cf-color-fg-primary, #18181b)',
        }}
      >
        Profile Settings
      </h2>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor:
              message.type === 'success'
                ? 'var(--cf-color-success-50, #f0fdf4)'
                : 'var(--cf-color-status-error-bg, #fef2f2)',
            color:
              message.type === 'success'
                ? 'var(--cf-color-success-700, #15803d)'
                : 'var(--cf-color-status-error, #dc2626)',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Avatar */}
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Avatar
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '9999px',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--cf-color-primary-100, #dbeafe)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 600,
                  color: 'var(--cf-color-primary-700, #1d4ed8)',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            {onChangeAvatar && (
              <button
                type="button"
                onClick={onChangeAvatar}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--cf-color-fg-primary, #18181b)',
                }}
              >
                Change avatar
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="name"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={!onSaveProfile}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: 'var(--cf-color-bg-secondary, #f4f4f5)',
              color: 'var(--cf-color-fg-secondary, #52525b)',
            }}
          />
          <p
            style={{
              marginTop: '4px',
              fontSize: '12px',
              color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
            }}
          >
            Email cannot be changed
          </p>
        </div>

        {onSaveProfile && (
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        )}
      </form>
    </div>
  );
}

/**
 * Security Tab Content
 */
function SecurityTab(): ReactNode {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setIsSaving(true);

    try {
      await changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({
        type: 'error',
        text: 'Failed to change password. Check your current password.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '24px',
          color: 'var(--cf-color-fg-primary, #18181b)',
        }}
      >
        Security Settings
      </h2>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor:
              message.type === 'success'
                ? 'var(--cf-color-success-50, #f0fdf4)'
                : 'var(--cf-color-status-error-bg, #fef2f2)',
            color:
              message.type === 'success'
                ? 'var(--cf-color-success-700, #15803d)'
                : 'var(--cf-color-status-error, #dc2626)',
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="current-password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Current Password
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="new-password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
          <p
            style={{
              marginTop: '4px',
              fontSize: '12px',
              color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
            }}
          >
            Must be at least 8 characters
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="confirm-password"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            padding: '10px 20px',
            backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Changing password...' : 'Change password'}
        </button>
      </form>
    </div>
  );
}

/**
 * Linked Accounts Tab Content
 */
function AccountsTab({
  bffBaseUrl,
  oauthProviders,
}: {
  bffBaseUrl?: string;
  oauthProviders?: OAuthProvider[];
}): ReactNode {
  const { linkedAccounts, linkAccount, unlinkAccount, isLinking } = useLinkedAccounts(bffBaseUrl);
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null);

  const availableProviders: OAuthProvider[] = oauthProviders || ['github', 'google', 'microsoft'];
  const linkedProviders = linkedAccounts.map((a) => a.provider);
  const unlinkedProviders = availableProviders.filter((p) => !linkedProviders.includes(p));

  const handleUnlink = async (accountId: string) => {
    if (linkedAccounts.length <= 1) {
      return; // Cannot unlink last account
    }
    setUnlinkingId(accountId);
    try {
      await unlinkAccount(accountId);
    } finally {
      setUnlinkingId(null);
    }
  };

  const providerNames: Record<OAuthProvider, string> = {
    github: 'GitHub',
    google: 'Google',
    microsoft: 'Microsoft',
  };

  return (
    <div>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '8px',
          color: 'var(--cf-color-fg-primary, #18181b)',
        }}
      >
        Linked Accounts
      </h2>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--cf-color-fg-secondary, #52525b)',
          marginBottom: '24px',
        }}
      >
        Manage your connected accounts for signing in
      </p>

      {/* Linked accounts */}
      {linkedAccounts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          {linkedAccounts.map((account) => (
            <div
              key={account.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: 'var(--cf-color-fg-primary, #18181b)' }}>
                  {providerIcons[account.provider]}
                </div>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--cf-color-fg-primary, #18181b)' }}>
                    {providerNames[account.provider]}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--cf-color-fg-secondary, #52525b)' }}>
                    {account.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(account.id)}
                disabled={unlinkingId === account.id || linkedAccounts.length <= 1}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: linkedAccounts.length <= 1 ? 'not-allowed' : 'pointer',
                  color: 'var(--cf-color-status-error, #dc2626)',
                  opacity: linkedAccounts.length <= 1 ? 0.5 : 1,
                }}
                title={linkedAccounts.length <= 1 ? 'Cannot disconnect last account' : ''}
              >
                {unlinkingId === account.id ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connect new accounts */}
      {unlinkedProviders.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '12px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Connect another account
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {unlinkedProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => linkAccount(provider)}
                disabled={isLinking}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
                  border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: isLinking ? 'not-allowed' : 'pointer',
                  color: 'var(--cf-color-fg-primary, #18181b)',
                }}
              >
                {providerIcons[provider]}
                Connect {providerNames[provider]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * UserSettingsPage - User settings with tabbed navigation
 *
 * @example
 * ```tsx
 * <UserSettingsPage
 *   activeTab="profile"
 *   onTabChange={(tab) => navigate(`/settings/${tab}`)}
 * />
 * ```
 */
export function UserSettingsPage({
  activeTab = 'profile',
  tabs = ['profile', 'security', 'accounts'],
  onTabChange,
  bffBaseUrl,
  oauthProviders,
  onSaveProfile,
  onChangeAvatar,
}: UserSettingsPageProps): ReactNode {
  const [currentTab, setCurrentTab] = useState<SettingsTab>(activeTab);

  const handleTabChange = (tab: SettingsTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '32px 24px',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: 600,
          marginBottom: '24px',
          color: 'var(--cf-color-fg-primary, #18181b)',
        }}
      >
        Settings
      </h1>

      <div
        style={{
          display: 'flex',
          gap: '32px',
        }}
      >
        {/* Tab navigation */}
        <nav
          style={{
            width: '200px',
            flexShrink: 0,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                marginBottom: '4px',
                backgroundColor:
                  currentTab === tab ? 'var(--cf-color-primary-50, #eff6ff)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: currentTab === tab ? 500 : 400,
                color:
                  currentTab === tab
                    ? 'var(--cf-color-brand-primary, #2563eb)'
                    : 'var(--cf-color-fg-secondary, #52525b)',
              }}
            >
              <span
                style={{
                  color:
                    currentTab === tab
                      ? 'var(--cf-color-brand-primary, #2563eb)'
                      : 'var(--cf-color-fg-tertiary, #a1a1aa)',
                }}
              >
                {tabConfig[tab].icon}
              </span>
              {tabConfig[tab].label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
            border: '1px solid var(--cf-color-border-default, #e4e4e7)',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          {currentTab === 'profile' && (
            <ProfileTab onSaveProfile={onSaveProfile} onChangeAvatar={onChangeAvatar} />
          )}
          {currentTab === 'security' && <SecurityTab />}
          {currentTab === 'accounts' && (
            <AccountsTab bffBaseUrl={bffBaseUrl} oauthProviders={oauthProviders} />
          )}
        </div>
      </div>
    </div>
  );
}
