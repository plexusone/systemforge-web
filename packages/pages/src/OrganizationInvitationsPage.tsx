import { useState, type ReactNode, type FormEvent } from 'react';
import type { OrganizationInvitationsPageProps, OrgInvitation, MemberRole } from './types';

/**
 * Status badge colors
 */
const statusBadgeStyles: Record<string, { bg: string; text: string }> = {
  pending: {
    bg: 'var(--cf-color-warning-100, #fef3c7)',
    text: 'var(--cf-color-warning-700, #b45309)',
  },
  accepted: {
    bg: 'var(--cf-color-success-100, #dcfce7)',
    text: 'var(--cf-color-success-700, #15803d)',
  },
  expired: {
    bg: 'var(--cf-color-neutral-100, #f4f4f5)',
    text: 'var(--cf-color-neutral-500, #71717a)',
  },
  revoked: {
    bg: 'var(--cf-color-status-error-bg, #fef2f2)',
    text: 'var(--cf-color-status-error, #dc2626)',
  },
};

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: string }): ReactNode {
  const style = statusBadgeStyles[status] || statusBadgeStyles.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.text,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}

/**
 * Create invitation modal
 */
function CreateInvitationModal({
  onSubmit,
  onClose,
}: {
  onSubmit: (email: string, role: MemberRole) => Promise<void>;
  onClose: () => void;
}): ReactNode {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(email, role);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '8px',
            color: 'var(--cf-color-fg-primary, #18181b)',
          }}
        >
          Invite Member
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--cf-color-fg-secondary, #52525b)',
            marginBottom: '24px',
          }}
        >
          Send an invitation to join this organization.
        </p>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              backgroundColor: 'var(--cf-color-status-error-bg, #fef2f2)',
              color: 'var(--cf-color-status-error, #dc2626)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
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
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="role"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--cf-color-fg-primary, #18181b)',
              }}
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="admin">Admin</option>
              <option value="member">Member</option>
            </select>
            <p
              style={{
                marginTop: '4px',
                fontSize: '12px',
                color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
              }}
            >
              Admins can invite members and manage settings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
}

/**
 * OrganizationInvitationsPage - Manage organization invitations
 *
 * @example
 * ```tsx
 * <OrganizationInvitationsPage
 *   orgSlug="my-org"
 *   currentUserRole="admin"
 *   apiBaseUrl="/api"
 * />
 * ```
 */
export function OrganizationInvitationsPage({
  orgSlug,
  currentUserRole = 'member',
  apiBaseUrl = '/api',
  onInvitationCreated,
  onInvitationRevoked,
}: OrganizationInvitationsPageProps): ReactNode {
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageInvitations = currentUserRole === 'owner' || currentUserRole === 'admin';

  // Fetch invitations on mount
  useState(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}/invitations`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch invitations');
        const data = await response.json();
        setInvitations(data.invitations || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvitations();
  });

  const handleCreateInvitation = async (email: string, role: MemberRole) => {
    const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, role }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to create invitation');
    }

    const newInvitation = await response.json();
    setInvitations((prev) => [newInvitation, ...prev]);
    setMessage({ type: 'success', text: `Invitation sent to ${email}` });
    onInvitationCreated?.();
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/organizations/${orgSlug}/invitations/${invitationId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to revoke invitation');

      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? { ...inv, status: 'revoked' } : inv))
      );
      setMessage({ type: 'success', text: 'Invitation revoked' });
      onInvitationRevoked?.();
    } catch {
      setMessage({ type: 'error', text: 'Failed to revoke invitation' });
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const otherInvitations = invitations.filter((inv) => inv.status !== 'pending');

  if (isLoading) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--cf-color-fg-secondary, #52525b)',
        }}
      >
        Loading invitations...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--cf-color-status-error, #dc2626)',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--cf-color-fg-primary, #18181b)',
              marginBottom: '4px',
            }}
          >
            Invitations
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--cf-color-fg-secondary, #52525b)' }}>
            {pendingInvitations.length} pending invitation
            {pendingInvitations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {canManageInvitations && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Invite Member
          </button>
        )}
      </div>

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

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cf-color-fg-primary, #18181b)',
              marginBottom: '12px',
            }}
          >
            Pending
          </h2>
          <div
            style={{
              backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {pendingInvitations.map((invitation, index) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom:
                    index < pendingInvitations.length - 1
                      ? '1px solid var(--cf-color-border-default, #e4e4e7)'
                      : 'none',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--cf-color-fg-primary, #18181b)' }}>
                      {invitation.email || 'Link invitation'}
                    </span>
                    <StatusBadge status={invitation.status} />
                    <span
                      style={{
                        fontSize: '12px',
                        padding: '2px 6px',
                        backgroundColor: 'var(--cf-color-neutral-100, #f4f4f5)',
                        borderRadius: '4px',
                        color: 'var(--cf-color-neutral-600, #52525b)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {invitation.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--cf-color-fg-tertiary, #a1a1aa)' }}>
                    {invitation.expires_at && (
                      <span>Expires {formatRelativeTime(invitation.expires_at)}</span>
                    )}
                    {invitation.inviter_name && (
                      <span> &middot; Invited by {invitation.inviter_name}</span>
                    )}
                  </div>
                </div>

                {canManageInvitations && (
                  <button
                    type="button"
                    onClick={() => handleRevokeInvitation(invitation.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--cf-color-status-error, #dc2626)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      color: 'var(--cf-color-status-error, #dc2626)',
                    }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Invitations */}
      {otherInvitations.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--cf-color-fg-primary, #18181b)',
              marginBottom: '12px',
            }}
          >
            History
          </h2>
          <div
            style={{
              backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
              border: '1px solid var(--cf-color-border-default, #e4e4e7)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {otherInvitations.map((invitation, index) => (
              <div
                key={invitation.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderBottom:
                    index < otherInvitations.length - 1
                      ? '1px solid var(--cf-color-border-default, #e4e4e7)'
                      : 'none',
                  opacity: 0.7,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontWeight: 500, color: 'var(--cf-color-fg-primary, #18181b)' }}>
                      {invitation.email || 'Link invitation'}
                    </span>
                    <StatusBadge status={invitation.status} />
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--cf-color-fg-tertiary, #a1a1aa)' }}>
                    Created {new Date(invitation.created_at).toLocaleDateString()}
                    {invitation.inviter_name && ` by ${invitation.inviter_name}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'var(--cf-color-bg-secondary, #fafafa)',
            borderRadius: '12px',
            border: '1px dashed var(--cf-color-border-default, #e4e4e7)',
          }}
        >
          <p
            style={{
              fontSize: '16px',
              color: 'var(--cf-color-fg-secondary, #52525b)',
              marginBottom: '16px',
            }}
          >
            No invitations yet
          </p>
          {canManageInvitations && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Invite your first member
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateInvitationModal
          onSubmit={handleCreateInvitation}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
