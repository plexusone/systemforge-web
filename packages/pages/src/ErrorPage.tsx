import { type ReactNode } from 'react';
import { navigateTo } from '@plexusone/auth';
import type { ErrorPageProps, NotFoundPageProps, ServerErrorPageProps } from './types';

/**
 * ErrorPage - Generic error page component
 *
 * @example
 * ```tsx
 * <ErrorPage
 *   code={404}
 *   title="Page not found"
 *   message="The page you're looking for doesn't exist."
 * />
 * ```
 */
export function ErrorPage({
  code,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again later.',
  showHomeButton = true,
  showBackButton = true,
  actions,
  onNavigate,
  homeUrl = '/',
}: ErrorPageProps): ReactNode {
  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      navigateTo(href);
    }
  };

  const handleGoBack = () => {
    window.history.back();
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
          textAlign: 'center',
          maxWidth: '480px',
        }}
      >
        {/* Error code */}
        {code && (
          <div
            style={{
              fontSize: '96px',
              fontWeight: 700,
              color: 'var(--cf-color-fg-tertiary, #a1a1aa)',
              lineHeight: 1,
              marginBottom: '16px',
            }}
          >
            {code}
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: 'var(--cf-color-fg-primary, #18181b)',
            margin: '0 0 12px 0',
          }}
        >
          {title}
        </h1>

        {/* Message */}
        <p
          style={{
            fontSize: '16px',
            color: 'var(--cf-color-fg-secondary, #52525b)',
            margin: '0 0 32px 0',
            lineHeight: 1.6,
          }}
        >
          {message}
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {showHomeButton && (
            <button
              type="button"
              onClick={() => handleNavigate(homeUrl)}
              style={{
                padding: '12px 24px',
                backgroundColor: 'var(--cf-color-brand-primary, #2563eb)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Go to homepage
            </button>
          )}

          {showBackButton && (
            <button
              type="button"
              onClick={handleGoBack}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: 'var(--cf-color-fg-primary, #18181b)',
                border: '1px solid var(--cf-color-border-default, #e4e4e7)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Go back
            </button>
          )}

          {actions}
        </div>
      </div>
    </div>
  );
}

/**
 * NotFoundPage - 404 error page
 *
 * @example
 * ```tsx
 * <NotFoundPage />
 * ```
 */
export function NotFoundPage({
  title = 'Page not found',
  message = "The page you're looking for doesn't exist or has been moved.",
  ...props
}: NotFoundPageProps): ReactNode {
  return <ErrorPage code={404} title={title} message={message} {...props} />;
}

/**
 * ServerErrorPage - 500 error page
 *
 * @example
 * ```tsx
 * <ServerErrorPage />
 * ```
 */
export function ServerErrorPage({
  title = 'Server error',
  message = 'An unexpected error occurred on the server. Please try again later.',
  ...props
}: ServerErrorPageProps): ReactNode {
  return <ErrorPage code={500} title={title} message={message} {...props} />;
}
