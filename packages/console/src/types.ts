/**
 * The connections API's shapes, as SystemAuth's console serves them. A
 * provider's manifest describes how to connect it; a connection never
 * carries its credential.
 */

/** An input a connection method needs. */
export interface Field {
  name: string;
  label: string;
  secret: boolean;
  required: boolean;
  help?: string;
}

/** A permission the credential should hold. */
export interface Scope {
  name: string;
  /** What the permission is used for. */
  description?: string;
  required?: boolean;
}

/** One step of creating the credential at the service. */
export interface SetupStep {
  title: string;
  detail?: string;
  /** Opens the page at the service where the step is done. */
  url?: string;
  /** The rotation modes the step applies to; absent means every mode. */
  rotation?: string[];
}

/** A way the credential is replaced over its life. */
export interface RotationMode {
  /** `manual` or `automatic`; others are not offered. */
  key: string;
  label: string;
  description?: string;
  /** Permissions this mode needs beyond the method's. */
  scopes?: Scope[];
  /** What those permissions also allow. */
  risks?: string[];
  /** The lifetime to give the credential when creating it. */
  expiryDays?: number;
  recommended?: boolean;
}

/** One way to connect to a provider. */
export interface AuthMethod {
  key: string;
  fields: Field[];
  scopes?: Scope[];
  accountSelection?: string;
  helpUrl?: string;
  setup?: SetupStep[];
  rotation?: RotationMode[];
}

/** A service an organization can connect. */
export interface Manifest {
  key: string;
  displayName: string;
  baseUrls: string[];
  authMethods: AuthMethod[];
  helpUrl?: string;
}

/** What was last observed about a connection. */
export interface Health {
  lastValidatedAt?: string;
  lastValidation?: 'ok' | 'failed' | 'unknown';
  lastError?: string;
  consecutiveFails?: number;
  /** When the current credential stops working, if the service says. */
  credentialExpiresAt?: string;
}

/** A connection's lifecycle state. */
export type ConnectionState =
  'pending' | 'connected' | 'needs_attention' | 'disconnected' | 'revoked';

/** An organization's connection to an account at a service. */
export interface Connection {
  id: string;
  provider: string;
  authMethod: string;
  displayName: string;
  externalAccountId?: string;
  externalLabel?: string;
  scopes?: string[];
  state: ConnectionState;
  health: Health;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

/** The rotation modes the console offers. */
export const OFFERED_ROTATION = ['manual', 'automatic'];

/** A price of a plan, in the smallest unit of the spec's currency. */
export interface Price {
  interval: 'month' | 'year';
  amountCents: number;
}

/** A plan as the pricing view lists it, in order. */
export interface PlanColumn {
  id: string;
  name: string;
  tier: string;
  tierName: string;
  tierRank: number;
  selfServe: boolean;
  free: boolean;
  default: boolean;
  trialDays?: number;
  prices?: Price[];
}

/** A feature across the plans, one cell per plan in the plans' order. */
export interface FeatureRow {
  id: string;
  name: string;
  description?: string;
  levels?: string[];
  cells: { plan: string; included: boolean; level?: string }[];
}

/** A limit across the plans, one cell per plan in the plans' order. */
export interface LimitRow {
  id: string;
  name: string;
  unit?: string;
  period: 'none' | 'day' | 'month' | 'year';
  description?: string;
  cells: { plan: string; max: number; unlimited?: boolean; fairUse?: boolean }[];
}

/** The pricing spec arranged for a page to render. */
export interface PricingView {
  app: string;
  currency: string;
  plans: PlanColumn[];
  features: FeatureRow[];
  limits: LimitRow[];
}

/** An organization's stored subscription. */
export interface Subscription {
  plan: string;
  /** active, trialing, past_due, canceled, unpaid, incomplete or incomplete_expired. */
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  /** Whether a payment provider subscription stands behind it, managed in the billing portal. */
  paid: boolean;
}

/** An organization's billing, as the console's billing API serves it. */
export interface BillingStatus {
  /** False when the deployment takes no payments: every organization is on the default plan. */
  configured: boolean;
  /** The payment provider's mode, `test` or `live`. */
  mode?: 'test' | 'live';
  /** The plan the organization is on. */
  plan: string;
  subscription?: Subscription;
  /** Whether the person may choose a plan and open the billing portal. */
  canManage: boolean;
  pricing: PricingView;
}
