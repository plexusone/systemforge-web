import { useState, type ReactNode, type FormEvent } from 'react';
import type { OrganizationMembersPageProps, OrgMember, MemberRole } from './types';

/**
 * Role badge colors
 */
const roleBadgeStyles: Record<MemberRole, { bg: string; text: string }> = {
  owner: {
    bg: 'var(--cf-color-warning-100, #fef3c7)',
    text: 'var(--cf-color-warning-700, #b45309)',
  },
  admin: {
    bg: 'var(--cf-color-primary-100, #dbeafe)',
    text: 'var(--cf-color-primary-700, #1d4ed8)',
  },
  member: {
    bg: 'var(--cf-color-neutral-100, #f4f4f5)',
    text: 'var(--cf-color-neutral-700, #3f3f46)',
  },
};

/**
 * Role badge component
 */
function RoleBadge({ role }: { role: MemberRole }): ReactNode {
  const style = roleBadgeStyles[role];
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
      {role}
    </span>
  );
}

/**
 * Avatar component
 */
function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl?: string;
  size?: number;
}): ReactNode {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '9999px',
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        backgroundColor: 'var(--cf-color-primary-100, #dbeafe)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        color: 'var(--cf-color-primary-700, #1d4ed8)',
      }}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/**
 * Transfer ownership modal
 */
function TransferOwnershipModal({
  members,
  currentUserId,
  onTransfer,
  onClose,
}: {
  members: OrgMember[];
  currentUserId?: string;
  onTransfer: (newOwnerId: string) => Promise<void>;
  onClose: () => void;
}): ReactNode {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const eligibleMembers = members.filter(
    (m) => m.principal_id !== currentUserId && m.role !== 'owner'
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || confirmText !== 'TRANSFER') return;

    setIsTransferring(true);
    try {
      await onTransfer(selectedMemberId);
      onClose();
    } finally {
      setIsTransferring(false);
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
          Transfer Ownership
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--cf-color-fg-secondary, #52525b)',
            marginBottom: '24px',
          }}
        >
          This will transfer ownership to another member. You will be demoted to admin.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="new-owner"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--cf-color-fg-primary, #18181b)',
              }}
            >
              New Owner
            </label>
            <select
              id="new-owner"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="">Select a member</option>
              {eligibleMembers.map((member) => (
                <option key={member.id} value={member.principal_id}>
                  {member.user?.name || member.user?.email || member.principal_id}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="confirm"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                marginBottom: '6px',
                color: 'var(--cf-color-fg-primary, #18181b)',
              }}
            >
              Type TRANSFER to confirm
            </label>
            <input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="TRANSFER"
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
              disabled={isTransferring || confirmText !== 'TRANSFER' || !selectedMemberId}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--cf-color-status-error, #dc2626)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isTransferring || confirmText !== 'TRANSFER' ? 'not-allowed' : 'pointer',
                opacity: isTransferring || confirmText !== 'TRANSFER' ? 0.6 : 1,
              }}
            >
              {isTransferring ? 'Transferring...' : 'Transfer Ownership'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * OrganizationMembersPage - Manage organization members
 *
 * @example
 * ```tsx
 * <OrganizationMembersPage
 *   orgSlug="my-org"
 *   currentUserId="user-123"
 *   currentUserRole="owner"
 *   apiBaseUrl="/api"
 * />
 * ```
 */
export function OrganizationMembersPage({
  orgSlug,
  currentUserId,
  currentUserRole = 'member',
  apiBaseUrl = '/api',
  onMemberUpdate,
  onOwnershipTransferred,
}: OrganizationMembersPageProps): ReactNode {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  // Fetch members on mount
  useState(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}/members`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMembers();
  });

  const handleUpdateRole = async (memberId: string, newRole: MemberRole) => {
    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const response = await fetch(
        `${apiBaseUrl}/organizations/${orgSlug}/members/${member.principal_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) throw new Error('Failed to update member');

      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      setEditingMemberId(null);
      setMessage({ type: 'success', text: 'Member role updated' });
      onMemberUpdate?.();
    } catch {
      setMessage({ type: 'error', text: 'Failed to update member role' });
    }
  };

  const handleRemoveMember = async (memberId: string, principalId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(
        `${apiBaseUrl}/organizations/${orgSlug}/members/${principalId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to remove member');

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMessage({ type: 'success', text: 'Member removed' });
      onMemberUpdate?.();
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove member' });
    }
  };

  const handleTransferOwnership = async (newOwnerId: string) => {
    const response = await fetch(`${apiBaseUrl}/organizations/${orgSlug}/transfer-ownership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ new_owner_principal_id: newOwnerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to transfer ownership');
    }

    setMessage({ type: 'success', text: 'Ownership transferred successfully' });
    onOwnershipTransferred?.();

    // Refresh members list
    const refreshResponse = await fetch(`${apiBaseUrl}/organizations/${orgSlug}/members`, {
      credentials: 'include',
    });
    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      setMembers(data.members || []);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: 'var(--cf-color-fg-secondary, #52525b)',
        }}
      >
        Loading members...
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
            Members
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--cf-color-fg-secondary, #52525b)' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isOwner && members.length > 1 && (
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
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
            Transfer Ownership
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

      <div
        style={{
          backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
          border: '1px solid var(--cf-color-border-default, #e4e4e7)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {members.map((member, index) => {
          const isCurrentUser = member.principal_id === currentUserId;
          const canEdit = canManageMembers && !isCurrentUser && member.role !== 'owner';
          const canRemove = canManageMembers && !isCurrentUser && member.role !== 'owner';

          return (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom:
                  index < members.length - 1
                    ? '1px solid var(--cf-color-border-default, #e4e4e7)'
                    : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar name={member.user?.name || ''} avatarUrl={member.user?.avatar_url} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--cf-color-fg-primary, #18181b)' }}>
                      {member.user?.name || 'Unknown'}
                    </span>
                    <RoleBadge role={member.role} />
                    {isCurrentUser && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
                        }}
                      >
                        (you)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--cf-color-fg-secondary, #52525b)' }}>
                    {member.user?.email || member.principal_id}
                  </div>
                </div>
              </div>

              {(canEdit || canRemove) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {editingMemberId === member.id ? (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value as MemberRole)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setEditingMemberId(null)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(member.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                            borderRadius: '6px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: 'var(--cf-color-fg-primary, #18181b)',
                          }}
                        >
                          Edit Role
                        </button>
                      )}
                      {canRemove && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id, member.principal_id)}
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
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showTransferModal && (
        <TransferOwnershipModal
          members={members}
          currentUserId={currentUserId}
          onTransfer={handleTransferOwnership}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  );
}
