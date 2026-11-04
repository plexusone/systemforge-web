import { useState, type ReactNode, type FormEvent } from 'react';
import { navigateTo, sameOriginURL, useAuth, type OAuthProvider } from '@plexusone/auth';
import type { LoginPageProps } from './types';

/**
 * OAuth provider icons
 */
const providerIcons: Record<OAuthProvider, ReactNode> = {
  github: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  google: (
    <svg width="20" height="20" viewBox="0 0 24 24">
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
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  ),
};

/**
 * Provider labels
 */
const providerLabels: Record<OAuthProvider, string> = {
  github: 'GitHub',
  google: 'Google',
  microsoft: 'Microsoft',
};

/**
 * LoginPage - Standard login page component
 *
 * @example
 * ```tsx
 * <LoginPage
 *   appName="My App"
 *   oauthProviders={['github', 'google']}
 *   showEmailForm
 * />
 * ```
 */
export function LoginPage({
  appName = 'SystemForge',
  logo,
  oauthProviders = [],
  showEmailForm = true,
  showRegisterLink = true,
  redirectUrl = '/',
  onNavigate,
  registerUrl = '/register',
  forgotPasswordUrl = '/forgot-password',
}: LoginPageProps): ReactNode {
  const { login, loginWithOAuth, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login({ email, password });
      // redirectUrl often comes from the address bar (?next=…), so only a
      // URL on this site is followed.
      const target = sameOriginURL(redirectUrl) ?? '/';
      if (onNavigate) {
        onNavigate(target);
      } else {
        navigateTo(target);
      }
    } catch {
      // Error is handled by useAuth
    }
  };

  const handleOAuthLogin = (provider: OAuthProvider) => {
    loginWithOAuth(provider);
  };

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      navigateTo(href);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--cf-color-bg-secondary, #f4f4f5)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: 'var(--cf-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))',
        }}
      >
        {/* Logo */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          {logo || (
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--cf-color-fg-primary, #18181b)',
                margin: 0,
              }}
            >
              {appName}
            </h1>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: 'var(--cf-color-fg-primary, #18181b)',
            textAlign: 'center',
            margin: '0 0 24px 0',
          }}
        >
          Sign in to your account
        </h2>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--cf-color-status-error-bg, #fef2f2)',
              color: 'var(--cf-color-status-error, #dc2626)',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '16px',
            }}
          >
            {error.message}
          </div>
        )}

        {/* OAuth buttons */}
        {oauthProviders.length > 0 && (
          <div style={{ marginBottom: showEmailForm ? '24px' : 0 }}>
            {oauthProviders.map((provider) => (
              <button
                key={provider}
                type="button"
                onClick={() => handleOAuthLogin(provider)}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: 'var(--cf-color-bg-primary, #ffffff)',
                  border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--cf-color-fg-primary, #18181b)',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {providerIcons[provider]}
                Continue with {providerLabels[provider]}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {oauthProviders.length > 0 && showEmailForm && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--cf-color-border-default, #e4e4e7)',
              }}
            />
            <span
              style={{
                fontSize: '12px',
                color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
                textTransform: 'uppercase',
              }}
            >
              or
            </span>
            <div
              style={{
                flex: 1,
                height: '1px',
                backgroundColor: 'var(--cf-color-border-default, #e4e4e7)',
              }}
            />
          </div>
        )}

        {/* Email form */}
        {showEmailForm && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--cf-color-fg-primary, #18181b)',
                  marginBottom: '6px',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
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

            <div style={{ marginBottom: '8px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--cf-color-fg-primary, #18181b)',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
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

            <div
              style={{
                textAlign: 'right',
                marginBottom: '16px',
              }}
            >
              <button
                type="button"
                onClick={() => handleNavigate(forgotPasswordUrl)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--cf-color-brand-primary, #2563eb)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Register link */}
        {showRegisterLink && (
          <p
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '14px',
              color: 'var(--cf-color-fg-secondary, #52525b)',
            }}
          >
            Do not have an account?{' '}
            <button
              type="button"
              onClick={() => handleNavigate(registerUrl)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--cf-color-brand-primary, #2563eb)',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 500,
              }}
            >
              Sign up
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
