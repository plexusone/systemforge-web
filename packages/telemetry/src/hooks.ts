import { useEffect, useRef, useCallback } from 'react';
import { useTelemetryOptional } from './TelemetryProvider';
import type { PerformanceTiming } from './types';
import { scrubText } from './scrub';

/**
 * Hook to track page views automatically
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageView('/dashboard');
 *
 *   return <Dashboard />;
 * }
 * ```
 *
 * @example With properties
 * ```tsx
 * function ProductPage({ productId }: { productId: string }) {
 *   usePageView('/product', { productId });
 *
 *   return <Product id={productId} />;
 * }
 * ```
 */
export function usePageView(path: string, properties?: Record<string, unknown>): void {
  const telemetry = useTelemetryOptional();

  useEffect(() => {
    telemetry?.trackPageView(path, properties);
  }, [path, properties, telemetry]);
}

/**
 * Hook to track component mount/unmount
 *
 * @example
 * ```tsx
 * function FeatureComponent() {
 *   useComponentTrack('FeatureComponent');
 *
 *   return <div>Feature content</div>;
 * }
 * ```
 */
export function useComponentTrack(
  componentName: string,
  properties?: Record<string, unknown>
): void {
  const telemetry = useTelemetryOptional();

  useEffect(() => {
    telemetry?.trackAction('component', 'mount', {
      component: componentName,
      ...properties,
    });

    return () => {
      telemetry?.trackAction('component', 'unmount', {
        component: componentName,
        ...properties,
      });
    };
  }, [componentName, properties, telemetry]);
}

/**
 * Hook for tracking user actions with automatic batching
 *
 * @example
 * ```tsx
 * function ActionButtons() {
 *   const track = useActionTracker('dashboard');
 *
 *   return (
 *     <div>
 *       <button onClick={() => track('click', 'refresh')}>Refresh</button>
 *       <button onClick={() => track('click', 'export')}>Export</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useActionTracker(category: string) {
  const telemetry = useTelemetryOptional();

  return useCallback(
    (action: string, label?: string, properties?: Record<string, unknown>) => {
      telemetry?.trackAction(category, action, { label, ...properties });
    },
    [category, telemetry]
  );
}

/**
 * Hook for measuring performance timings
 *
 * @example
 * ```tsx
 * function DataLoader() {
 *   const { start, end } = usePerformanceTracker();
 *
 *   useEffect(() => {
 *     const timing = start('data-load');
 *
 *     fetchData().then(() => {
 *       end(timing);
 *     });
 *   }, []);
 *
 *   return <DataDisplay />;
 * }
 * ```
 */
export function usePerformanceTracker() {
  const telemetry = useTelemetryOptional();
  const timings = useRef<Map<string, PerformanceTiming>>(new Map());

  const start = useCallback((name: string): PerformanceTiming => {
    const timing: PerformanceTiming = {
      name,
      startTime: performance.now(),
    };
    timings.current.set(name, timing);
    return timing;
  }, []);

  const end = useCallback(
    (timing: PerformanceTiming, properties?: Record<string, unknown>) => {
      const duration = performance.now() - timing.startTime;
      timing.duration = duration;

      telemetry?.trackPerformance(timing.name, duration, 'ms', properties);

      timings.current.delete(timing.name);
      return duration;
    },
    [telemetry]
  );

  const mark = useCallback(
    (name: string, value: number, unit?: string) => {
      telemetry?.trackPerformance(name, value, unit);
    },
    [telemetry]
  );

  return { start, end, mark };
}

/**
 * Hook to track form submissions
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const trackForm = useFormTracker('login');
 *
 *   const handleSubmit = async (data: FormData) => {
 *     trackForm.start();
 *     try {
 *       await login(data);
 *       trackForm.success();
 *     } catch (error) {
 *       trackForm.error(error as Error);
 *     }
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useFormTracker(formName: string) {
  const telemetry = useTelemetryOptional();
  const startTime = useRef<number | null>(null);

  const start = useCallback(() => {
    startTime.current = performance.now();
    telemetry?.trackAction('form', 'start', { form: formName });
  }, [formName, telemetry]);

  const success = useCallback(
    (properties?: Record<string, unknown>) => {
      const duration = startTime.current ? performance.now() - startTime.current : undefined;

      telemetry?.trackAction('form', 'success', {
        form: formName,
        duration,
        ...properties,
      });

      startTime.current = null;
    },
    [formName, telemetry]
  );

  const error = useCallback(
    (err: Error, properties?: Record<string, unknown>) => {
      const duration = startTime.current ? performance.now() - startTime.current : undefined;

      telemetry?.trackAction('form', 'error', {
        form: formName,
        duration,
        error: scrubText(err.message ?? ''),
        ...properties,
      });

      telemetry?.trackError(err, { form: formName });

      startTime.current = null;
    },
    [formName, telemetry]
  );

  const abandon = useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      telemetry?.trackAction('form', 'abandon', {
        form: formName,
        duration,
      });
      startTime.current = null;
    }
  }, [formName, telemetry]);

  return { start, success, error, abandon };
}

/**
 * Hook to identify user when auth state changes
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user } = useAuth();
 *
 *   useIdentify(user ? { id: user.id, email: user.email } : null);
 *
 *   return <MainContent />;
 * }
 * ```
 */
export function useIdentify(user: { id: string; email?: string; name?: string } | null): void {
  const telemetry = useTelemetryOptional();

  useEffect(() => {
    if (user) {
      telemetry?.identify(user);
    } else {
      telemetry?.reset();
    }
  }, [user, telemetry]);
}

/**
 * Hook to set organization context
 *
 * @example
 * ```tsx
 * function OrgLayout() {
 *   const { currentOrg } = useTenant();
 *
 *   useOrgContext(currentOrg ? { id: currentOrg.id, name: currentOrg.name } : null);
 *
 *   return <OrgContent />;
 * }
 * ```
 */
export function useOrgContext(org: { id: string; name?: string; type?: string } | null): void {
  const telemetry = useTelemetryOptional();

  useEffect(() => {
    if (org) {
      telemetry?.setOrg(org);
    }
  }, [org, telemetry]);
}

/**
 * Hook to track feature usage
 *
 * @example
 * ```tsx
 * function AdvancedFeature() {
 *   const trackFeature = useFeatureTracker('advanced-search');
 *
 *   const handleUse = () => {
 *     trackFeature.use({ filters: 5 });
 *   };
 *
 *   return <SearchBox onSearch={handleUse} />;
 * }
 * ```
 */
export function useFeatureTracker(featureName: string) {
  const telemetry = useTelemetryOptional();

  const view = useCallback(
    (properties?: Record<string, unknown>) => {
      telemetry?.trackAction('feature', 'view', {
        feature: featureName,
        ...properties,
      });
    },
    [featureName, telemetry]
  );

  const use = useCallback(
    (properties?: Record<string, unknown>) => {
      telemetry?.trackAction('feature', 'use', {
        feature: featureName,
        ...properties,
      });
    },
    [featureName, telemetry]
  );

  const complete = useCallback(
    (properties?: Record<string, unknown>) => {
      telemetry?.trackAction('feature', 'complete', {
        feature: featureName,
        ...properties,
      });
    },
    [featureName, telemetry]
  );

  return { view, use, complete };
}

/**
 * Hook to track Web Vitals
 *
 * @example
 * ```tsx
 * function App() {
 *   useWebVitals();
 *
 *   return <MainApp />;
 * }
 * ```
 */
export function useWebVitals(): void {
  const { mark } = usePerformanceTracker();

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Track navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Time to First Byte
      mark('ttfb', navigation.responseStart - navigation.requestStart, 'ms');

      // DOM Content Loaded
      mark('dcl', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');

      // Load time
      mark('load', navigation.loadEventEnd - navigation.fetchStart, 'ms');
    }

    // Observe Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      mark('lcp', lastEntry.startTime, 'ms');
    });

    try {
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }

    // Observe First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as unknown as
        | { processingStart: number; startTime: number }
        | undefined;
      if (firstEntry) {
        mark('fid', firstEntry.processingStart - firstEntry.startTime, 'ms');
      }
    });

    try {
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }

    // Observe Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
          clsValue += (entry as unknown as { value: number }).value;
        }
      }
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }

    // Report CLS on page hide
    const reportCLS = () => {
      mark('cls', clsValue, 'score');
    };

    window.addEventListener('pagehide', reportCLS);

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      window.removeEventListener('pagehide', reportCLS);
    };
  }, [mark]);
}
