/**
 * @plexusone/auth
 *
 * Authentication primitives for SystemForge applications.
 *
 * @example
 * ```tsx
 * import { AuthProvider, useAuth, ProtectedRoute } from '@plexusone/auth';
 *
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Routes>
 *         <Route path="/login" element={<LoginPage />} />
 *         <Route
 *           path="/dashboard"
 *           element={
 *             <ProtectedRoute>
 *               <Dashboard />
 *             </ProtectedRoute>
 *           }
 *         />
 *       </Routes>
 *     </AuthProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Provider and main hook
export { AuthProvider, useAuth, useAuthOptional, SESSION_EXPIRED_EVENT } from './AuthProvider';
export type { AuthProviderProps } from './AuthProvider';

// Route protection
export { ProtectedRoute, usePermissions } from './ProtectedRoute';

// Linked accounts
export { useLinkedAccounts } from './useLinkedAccounts';

// Session over the relying-party BFF: memberships with per-application
// roles, and the deployment's app catalog
export * from './session';

// BFF client (for advanced use cases)
export { BFFClient, defaultBFFClient } from './bff-client';

// Types
export type {
  User,
  Membership,
  Role,
  LinkedAccount,
  OAuthProvider,
  LoginCredentials,
  RegisterData,
  SessionStatus,
  AuthError,
  AuthConfig,
  AuthContextValue,
  LinkedAccountsContextValue,
  ProtectedRouteProps,
} from './types';

export { ROLE_LEVELS } from './types';
