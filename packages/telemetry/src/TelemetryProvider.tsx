import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';
import { TelemetryClient } from './telemetry';
import type { TelemetryConfig, TelemetryContextValue, TelemetryUser, TelemetryOrg } from './types';

/**
 * Telemetry context
 */
export const TelemetryContext = createContext<TelemetryContextValue | null>(null);

/**
 * Props for TelemetryProvider
 */
export interface TelemetryProviderProps {
  children: ReactNode;
  config: TelemetryConfig;
}

/**
 * TelemetryProvider - Provides telemetry tracking to the component tree
 *
 * @example
 * ```tsx
 * import { TelemetryProvider } from '@plexusone/telemetry';
 *
 * function App() {
 *   return (
 *     <TelemetryProvider
 *       config={{
 *         appName: 'my-app',
 *         appVersion: '1.0.0',
 *         environment: process.env.NODE_ENV,
 *         endpoint: '/api/telemetry',
 *         debug: process.env.NODE_ENV === 'development',
 *       }}
 *     >
 *       <MyApp />
 *     </TelemetryProvider>
 *   );
 * }
 * ```
 */
export function TelemetryProvider({ children, config }: TelemetryProviderProps) {
  // Create telemetry client
  const client = useMemo(() => new TelemetryClient(config), [config]);

  // Flush events on unmount
  useEffect(() => {
    return () => {
      client.flush();
    };
  }, [client]);

  // Flush events before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      client.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [client]);

  const value = useMemo<TelemetryContextValue>(
    () => ({
      trackPageView: (path: string, properties?: Record<string, unknown>) => {
        client.trackPageView(path, properties);
      },
      trackAction: (category: string, action: string, properties?: Record<string, unknown>) => {
        client.trackAction(category, action, properties);
      },
      trackError: (error: Error, context?: Record<string, unknown>) => {
        client.trackError(error, context);
      },
      trackPerformance: (
        metric: string,
        value: number,
        unit?: string,
        properties?: Record<string, unknown>
      ) => {
        client.trackPerformance(metric, value, unit, properties);
      },
      trackEvent: (name: string, properties?: Record<string, unknown>) => {
        client.trackEvent(name, properties);
      },
      identify: (user: TelemetryUser) => {
        client.identify(user);
      },
      setOrg: (org: TelemetryOrg) => {
        client.setOrg(org);
      },
      reset: () => {
        client.reset();
      },
      isEnabled: client.isEnabled,
    }),
    [client]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

/**
 * Hook to access telemetry functions
 *
 * @throws Error if used outside TelemetryProvider
 *
 * @example
 * ```tsx
 * function Button() {
 *   const { trackAction } = useTelemetry();
 *
 *   return (
 *     <button
 *       onClick={() => {
 *         trackAction('button', 'click', { buttonId: 'submit' });
 *         handleSubmit();
 *       }}
 *     >
 *       Submit
 *     </button>
 *   );
 * }
 * ```
 */
export function useTelemetry(): TelemetryContextValue {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}

/**
 * Get telemetry context without throwing (returns null if not in provider)
 */
export function useTelemetryOptional(): TelemetryContextValue | null {
  return useContext(TelemetryContext);
}
