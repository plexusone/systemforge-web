import { useState, type ReactNode, type FormEvent } from 'react';
import type { OrganizationSettingsPageProps, OrgSettingsTab } from './types';

/**
 * Tab configuration
 */
const tabConfig: Record<OrgSettingsTab, { label: string; icon: ReactNode }> = {
  general: {
    label: 'General',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  members: {
    label: 'Members',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  invitations: {
    label: 'Invitations',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  danger: {
    label: 'Danger Zone',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

/**
 * General Settings Tab
 */
function GeneralTab({ orgSlug, apiBaseUrl }: { orgSlug: string; apiBaseUrl: string }): ReactNode {
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization details on mount
  useState(() => {
    const fetchOrg = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch organization');
        const org = await response.json();
        setName(org.name || '');
        setLogoUrl(org.logo_url || '');
      } catch {
        setMessage({ type: 'error', text: 'Failed to load organization details' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrg();
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, logo_url: logoUrl || null }),
      });

      if (!response.ok) throw new Error('Failed to update organization');
      setMessage({ type: 'success', text: 'Organization updated successfully' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update organization' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', color: 'var(--cf-color-fg-secondary, #52525b)' }}>
        Loading...
      </div>
    );
  }

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
        General Settings
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
            htmlFor="org-name"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Organization Name
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            htmlFor="org-slug"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Organization Slug
          </label>
          <input
            id="org-slug"
            type="text"
            value={orgSlug}
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
            Slug cannot be changed
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            htmlFor="logo-url"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              marginBottom: '6px',
              color: 'var(--cf-color-fg-primary, #18181b)',
            }}
          >
            Logo URL
          </label>
          <input
            id="logo-url"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
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
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

/**
 * Danger Zone Tab
 */
function DangerTab({
  orgSlug,
  apiBaseUrl,
  currentUserRole,
  onNavigate,
}: {
  orgSlug: string;
  apiBaseUrl: string;
  currentUserRole?: string;
  onNavigate?: (href: string) => void;
}): ReactNode {
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserRole === 'owner';

  const handleDelete = async () => {
    if (deleteConfirm !== orgSlug) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete organization');

      // Navigate to home or organizations list
      onNavigate?.('/');
    } catch {
      alert('Failed to delete organization');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '24px',
          color: 'var(--cf-color-status-error, #dc2626)',
        }}
      >
        Danger Zone
      </h2>

      <div
        style={{
          border: '1px solid var(--cf-color-status-error, #dc2626)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--cf-color-fg-primary, #18181b)',
          }}
        >
          Delete Organization
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--cf-color-fg-secondary, #52525b)',
            marginBottom: '16px',
          }}
        >
          Once you delete an organization, there is no going back. This will permanently delete all
          conversations, members, and data associated with this organization.
        </p>

        {!isOwner ? (
          <p
            style={{
              fontSize: '14px',
              color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
              fontStyle: 'italic',
            }}
          >
            Only the organization owner can delete this organization.
          </p>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="delete-confirm"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginBottom: '6px',
                  color: 'var(--cf-color-fg-primary, #18181b)',
                }}
              >
                Type <strong>{orgSlug}</strong> to confirm
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder={orgSlug}
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  padding: '10px 12px',
                  border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteConfirm !== orgSlug || isDeleting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--cf-color-status-error, #dc2626)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: deleteConfirm !== orgSlug || isDeleting ? 'not-allowed' : 'pointer',
                opacity: deleteConfirm !== orgSlug || isDeleting ? 0.6 : 1,
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete this organization'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder for embedded pages
 */
function MembersTabPlaceholder(): ReactNode {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--cf-color-fg-secondary, #52525b)',
      }}
    >
      <p>Use OrganizationMembersPage component for full functionality.</p>
    </div>
  );
}

function InvitationsTabPlaceholder(): ReactNode {
  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--cf-color-fg-secondary, #52525b)',
      }}
    >
      <p>Use OrganizationInvitationsPage component for full functionality.</p>
    </div>
  );
}

/**
 * OrganizationSettingsPage - Organization settings with tabbed navigation
 *
 * @example
 * ```tsx
 * <OrganizationSettingsPage
 *   orgSlug="my-org"
 *   activeTab="general"
 *   currentUserRole="owner"
 *   onTabChange={(tab) => navigate(`/org/settings/${tab}`)}
 * />
 * ```
 */
export function OrganizationSettingsPage({
  orgSlug,
  activeTab = 'general',
  tabs = ['general', 'members', 'invitations', 'danger'],
  currentUserRole = 'member',
  apiBaseUrl = '/api',
  onTabChange,
  onNavigate,
}: OrganizationSettingsPageProps): ReactNode {
  const [currentTab, setCurrentTab] = useState<OrgSettingsTab>(activeTab);

  const handleTabChange = (tab: OrgSettingsTab) => {
    setCurrentTab(tab);
    onTabChange?.(tab);
  };

  // Filter out danger zone for non-owners
  const availableTabs = tabs.filter((tab) => {
    if (tab === 'danger' && currentUserRole !== 'owner') return false;
    return true;
  });

  return (
    <div
      style={{
        maxWidth: '900px',
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
        Organization Settings
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
          {availableTabs.map((tab) => (
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
                  tab === 'danger'
                    ? 'var(--cf-color-status-error, #dc2626)'
                    : currentTab === tab
                      ? 'var(--cf-color-brand-primary, #2563eb)'
                      : 'var(--cf-color-fg-secondary, #52525b)',
              }}
            >
              <span
                style={{
                  color:
                    tab === 'danger'
                      ? 'var(--cf-color-status-error, #dc2626)'
                      : currentTab === tab
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
          {currentTab === 'general' && <GeneralTab orgSlug={orgSlug} apiBaseUrl={apiBaseUrl} />}
          {currentTab === 'members' && <MembersTabPlaceholder />}
          {currentTab === 'invitations' && <InvitationsTabPlaceholder />}
          {currentTab === 'danger' && (
            <DangerTab
              orgSlug={orgSlug}
              apiBaseUrl={apiBaseUrl}
              currentUserRole={currentUserRole}
              onNavigate={onNavigate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
