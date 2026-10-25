// Wire types of the SystemForge invite API (signupapi). JSON is snake_case,
// as on every SystemAuth API.

/** Who created a code. */
export type CodeKind = 'operator' | 'member';

/** Whether a code can still be used. */
export type CodeStatus = 'active' | 'used_up' | 'expired' | 'revoked';

/** An invite code as listed. The code itself is never listed. */
export interface InviteCode {
  id: string;
  kind: CodeKind;
  /** The code's last four characters, to tell codes apart. */
  hint: string;
  label?: string;
  note?: string;
  created_by_principal_id?: string;
  created_by_label?: string;
  max_uses: number;
  use_count: number;
  status: CodeStatus;
  created_at: string;
  expires_at?: string;
  revoked_at?: string;
}

/** A new code, returned once: copy it or its link now. */
export interface CreatedCode {
  code: InviteCode;
  /** The code, formatted XXXX-XXXX-XXXX-XXXX. */
  invite_code: string;
  /** The invite link, when the deployment knows its sign-up page. */
  link?: string;
}

/** Whether an email invite can still be used. */
export type InviteStatus = 'pending' | 'redeemed' | 'expired';

/** An email invite. */
export interface EmailInvite {
  email: string;
  note?: string;
  invited_by?: string;
  invited_by_principal_id?: string;
  status: InviteStatus;
  created_at: string;
  expires_at?: string;
  redeemed_at?: string;
  redeemed_by?: string;
}

/** An address waiting to be told that sign-up is open. */
export interface WaitlistEntry {
  email: string;
  consent_version: string;
  joined_at: string;
  last_submitted_at: string;
  invited_at?: string;
}

/** A member's invite allowance. */
export interface Allowance {
  principal_id: string;
  email: string;
  /** The allowance an operator set; null means the deployment's default. */
  granted: number | null;
  effective: number;
  held: number;
  note?: string;
  updated_at: string;
}

/** An account an invite admitted. */
export interface JoinedAccount {
  source: 'code' | 'invite';
  principal_id?: string;
  email: string;
  joined_at: string;
  code_id?: string;
  code_kind?: CodeKind;
  code_label?: string;
  code_hint?: string;
  invited_by_principal_id?: string;
  invited_by_label?: string;
}

/** The deployment's invite settings, as the signed-in person sees them. */
export interface InviteSettings {
  default_allowance: number;
  member_code_ttl_seconds: number;
  signup_url: string;
  is_admin: boolean;
}

/** What a member sees of their own invites. */
export interface MyInvites {
  allowance: number;
  held: number;
  remaining: number;
  member_code_ttl_seconds: number;
  codes: InviteCode[];
}

/** Options for new email invites, also used to invite from the waitlist. */
export interface InviteOptions {
  note?: string;
  /** 0 or absent: the invites do not expire. */
  expires_in_days?: number;
}

/** A new operator code. */
export interface CodeOptions {
  label?: string;
  note?: string;
  max_uses: number;
  /** 0 or absent: the code does not expire. */
  expires_in_days?: number;
}
