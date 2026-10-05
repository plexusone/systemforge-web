/**
 * ProductGraph-specific hooks for @plexusone/telemetry
 *
 * These hooks provide enhanced telemetry features for ProductGraph integration:
 * - State change tracking
 * - Component path tracking
 * - Journey step tracking
 * - Scroll position tracking
 * - Snapshot coordination
 */

import { useEffect, useRef, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTelemetryOptional } from '../TelemetryProvider';

// =============================================================================
// Component Path Context
// =============================================================================

/**
 * Context for tracking component hierarchy
 */
const ComponentPathContext = createContext<string[]>([]);

interface ComponentPathProviderProps {
  name: string;
  children: ReactNode;
}

/**
 * Provider that adds a component to the path hierarchy
 *
 * @example
 * ```tsx
 * function ProductPage() {
 *   return (
 *     <ComponentPathProvider name="ProductPage">
 *       <ProductDetails />
 *     </ComponentPathProvider>
 *   );
 * }
 *
 * function ProductDetails() {
 *   return (
 *     <ComponentPathProvider name="ProductDetails">
 *       <AddToCartButton />
 *     </ComponentPathProvider>
 *   );
 * }
 *
 * function AddToCartButton() {
 *   const path = useComponentPath();
 *   // path = ["ProductPage", "ProductDetails", "AddToCartButton"]
 *
 *   return <button>Add to Cart</button>;
 * }
 * ```
 */
export function ComponentPathProvider({ name, children }: ComponentPathProviderProps) {
  const parentPath = useContext(ComponentPathContext);
  const currentPath = [...parentPath, name];

  return (
    <ComponentPathContext.Provider value={currentPath}>{children}</ComponentPathContext.Provider>
  );
}

/**
 * Hook to get the current component path
 *
 * @returns Array of component names from root to current component
 */
export function useComponentPath(): string[] {
  return useContext(ComponentPathContext);
}

/**
 * Hook to get the component path as a string
 *
 * @returns Component path joined with "/"
 */
export function useComponentPathString(): string {
  const path = useComponentPath();
  return path.join('/');
}

// =============================================================================
// State Tracking
// =============================================================================

interface StateChange<T> {
  key: string;
  before: T;
  after: T;
  timestamp: number;
}

/**
 * Hook to track state changes and emit telemetry events
 *
 * @param key - The name of the state variable (e.g., "cart", "filters")
 * @param value - The current state value
 * @param options - Additional options
 *
 * @example
 * ```tsx
 * function ShoppingCart() {
 *   const [cart, setCart] = useState<CartItem[]>([]);
 *
 *   // Track all changes to cart state
 *   useStateTracker('cart', cart);
 *
 *   return <CartDisplay items={cart} />;
 * }
 * ```
 *
 * @example With nested key
 * ```tsx
 * function ProductFilters() {
 *   const [filters, setFilters] = useState({ category: '', price: [0, 100] });
 *
 *   useStateTracker('filters.category', filters.category);
 *   useStateTracker('filters.price', filters.price);
 *
 *   return <FilterUI filters={filters} onChange={setFilters} />;
 * }
 * ```
 */
export function useStateTracker<T>(
  key: string,
  value: T,
  options?: {
    /**
     * Component that owns this state (auto-detected if using ComponentPathProvider)
     */
    component?: string;
    /**
     * Debounce state changes (useful for frequently-changing values)
     * @default 0
     */
    debounceMs?: number;
    /**
     * Comparison function to determine if state changed
     */
    isEqual?: (a: T, b: T) => boolean;
  }
): void {
  const telemetry = useTelemetryOptional();
  const componentPath = useComponentPathString();
  const previousValue = useRef<T>(value);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChange = useRef<StateChange<T> | null>(null);

  const { component, debounceMs = 0, isEqual = Object.is } = options || {};

  useEffect(() => {
    if (isEqual(previousValue.current, value)) {
      return;
    }

    const change: StateChange<T> = {
      key,
      before: previousValue.current,
      after: value,
      timestamp: Date.now(),
    };

    previousValue.current = value;

    const emitChange = () => {
      telemetry?.trackEvent('state_change', {
        state_key: change.key,
        state_before: change.before,
        state_after: change.after,
        component: component || componentPath || undefined,
        component_path: componentPath || undefined,
      });
      pendingChange.current = null;
    };

    if (debounceMs > 0) {
      pendingChange.current = change;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(emitChange, debounceMs);
    } else {
      emitChange();
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [key, value, component, componentPath, debounceMs, isEqual, telemetry]);
}

// =============================================================================
// Journey Step Tracking
// =============================================================================

interface JourneyContext {
  journeyId: string;
  currentStepId: string | null;
  stepHistory: string[];
}

const JourneyContext = createContext<JourneyContext | null>(null);

interface JourneyProviderProps {
  journeyId: string;
  children: ReactNode;
}

/**
 * Provider for journey tracking context
 *
 * @example
 * ```tsx
 * function CheckoutFlow() {
 *   return (
 *     <JourneyProvider journeyId="checkout-flow">
 *       <CheckoutSteps />
 *     </JourneyProvider>
 *   );
 * }
 * ```
 */
export function JourneyProvider({ journeyId, children }: JourneyProviderProps) {
  const context: JourneyContext = {
    journeyId,
    currentStepId: null,
    stepHistory: [],
  };

  return <JourneyContext.Provider value={context}>{children}</JourneyContext.Provider>;
}

/**
 * Hook to track journey step progression
 *
 * @example
 * ```tsx
 * function ShippingForm() {
 *   const { enterStep, completeStep, abandonStep } = useJourneyStep('shipping');
 *
 *   useEffect(() => {
 *     enterStep();
 *     return () => abandonStep();
 *   }, []);
 *
 *   const handleSubmit = () => {
 *     completeStep({ method: 'standard' });
 *     navigate('/checkout/payment');
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useJourneyStep(stepId: string, stepName?: string) {
  const telemetry = useTelemetryOptional();
  const journeyContext = useContext(JourneyContext);
  const enteredAt = useRef<number | null>(null);

  const enterStep = useCallback(
    (properties?: Record<string, unknown>) => {
      enteredAt.current = Date.now();

      telemetry?.trackEvent('journey_step_enter', {
        journey_id: journeyContext?.journeyId,
        journey_step_id: stepId,
        journey_step_name: stepName || stepId,
        ...properties,
      });
    },
    [journeyContext?.journeyId, stepId, stepName, telemetry]
  );

  const completeStep = useCallback(
    (properties?: Record<string, unknown>) => {
      const duration = enteredAt.current ? Date.now() - enteredAt.current : undefined;

      telemetry?.trackEvent('journey_step_complete', {
        journey_id: journeyContext?.journeyId,
        journey_step_id: stepId,
        journey_step_name: stepName || stepId,
        duration,
        ...properties,
      });

      enteredAt.current = null;
    },
    [journeyContext?.journeyId, stepId, stepName, telemetry]
  );

  const abandonStep = useCallback(
    (reason?: string, properties?: Record<string, unknown>) => {
      if (!enteredAt.current) return;

      const duration = Date.now() - enteredAt.current;

      telemetry?.trackEvent('journey_step_abandon', {
        journey_id: journeyContext?.journeyId,
        journey_step_id: stepId,
        journey_step_name: stepName || stepId,
        duration,
        abandon_reason: reason,
        ...properties,
      });

      enteredAt.current = null;
    },
    [journeyContext?.journeyId, stepId, stepName, telemetry]
  );

  return { enterStep, completeStep, abandonStep };
}

/**
 * Hook to mark journey conversion
 *
 * @example
 * ```tsx
 * function OrderConfirmation() {
 *   const trackConversion = useJourneyConversion();
 *
 *   useEffect(() => {
 *     trackConversion('checkout-flow', { order_value: 99.99 });
 *   }, []);
 *
 *   return <div>Thank you for your order!</div>;
 * }
 * ```
 */
export function useJourneyConversion() {
  const telemetry = useTelemetryOptional();

  return useCallback(
    (journeyId: string, properties?: Record<string, unknown>) => {
      telemetry?.trackEvent('journey_conversion', {
        journey_id: journeyId,
        conversion_status: 'converted',
        ...properties,
      });
    },
    [telemetry]
  );
}

// =============================================================================
// Scroll Tracking
// =============================================================================

interface ScrollTrackingOptions {
  /**
   * Throttle scroll events (ms)
   * @default 100
   */
  throttleMs?: number;
  /**
   * Report at these percentage thresholds (0-100)
   * @default [25, 50, 75, 90, 100]
   */
  thresholds?: number[];
  /**
   * Element to track (default: window)
   */
  element?: HTMLElement | null;
}

/**
 * Hook to track scroll depth/position
 *
 * @example
 * ```tsx
 * function ArticlePage() {
 *   useScrollTracker({ thresholds: [25, 50, 75, 100] });
 *
 *   return <article>Long content...</article>;
 * }
 * ```
 *
 * @example With custom element
 * ```tsx
 * function ScrollablePanel() {
 *   const panelRef = useRef<HTMLDivElement>(null);
 *   useScrollTracker({ element: panelRef.current });
 *
 *   return <div ref={panelRef} style={{ overflow: 'auto' }}>Content...</div>;
 * }
 * ```
 */
export function useScrollTracker(options?: ScrollTrackingOptions): void {
  const telemetry = useTelemetryOptional();
  const { throttleMs = 100, thresholds = [25, 50, 75, 90, 100], element } = options || {};
  const reportedThresholds = useRef<Set<number>>(new Set());
  const lastReportTime = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const target = element || window;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastReportTime.current < throttleMs) return;
      lastReportTime.current = now;

      let scrollPosition: number;
      let scrollHeight: number;
      let clientHeight: number;

      if (element) {
        scrollPosition = element.scrollTop;
        scrollHeight = element.scrollHeight;
        clientHeight = element.clientHeight;
      } else {
        scrollPosition = window.scrollY;
        scrollHeight = document.documentElement.scrollHeight;
        clientHeight = window.innerHeight;
      }

      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? (scrollPosition / maxScroll) * 100 : 100;

      // Check for threshold crossings
      for (const threshold of thresholds) {
        if (percentage >= threshold && !reportedThresholds.current.has(threshold)) {
          reportedThresholds.current.add(threshold);

          telemetry?.trackAction('scroll', 'threshold', {
            scroll_position: percentage / 100,
            threshold_reached: threshold,
          });
        }
      }
    };

    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
    };
  }, [element, throttleMs, thresholds, telemetry]);

  // Reset thresholds on page change
  useEffect(() => {
    reportedThresholds.current.clear();
  }, []);
}

// =============================================================================
// Click Tracking with Context
// =============================================================================

/**
 * Hook to create a click tracker with automatic context
 *
 * @example
 * ```tsx
 * function ProductCard({ product }: { product: Product }) {
 *   const trackClick = useClickTracker();
 *
 *   return (
 *     <div>
 *       <button onClick={(e) => trackClick(e, { product_id: product.id })}>
 *         Add to Cart
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useClickTracker() {
  const telemetry = useTelemetryOptional();
  const componentPath = useComponentPathString();

  return useCallback(
    (event: React.MouseEvent<HTMLElement>, properties?: Record<string, unknown>) => {
      const target = event.currentTarget;
      const elementText =
        target.textContent?.slice(0, 100) || target.getAttribute('aria-label') || undefined;
      const elementType = target.tagName.toLowerCase();

      telemetry?.trackAction('ui', 'click', {
        component_path: componentPath || undefined,
        element: elementType,
        element_text: elementText,
        ...properties,
      });
    },
    [componentPath, telemetry]
  );
}

// =============================================================================
// API Call Tracking
// =============================================================================

interface APICallOptions {
  /**
   * HTTP method
   */
  method: string;
  /**
   * API endpoint path
   */
  path: string;
}

/**
 * Hook to track API calls
 *
 * @example
 * ```tsx
 * function useProducts() {
 *   const trackAPI = useAPITracker();
 *
 *   const fetchProducts = async () => {
 *     const tracker = trackAPI.start({ method: 'GET', path: '/api/products' });
 *
 *     try {
 *       const response = await fetch('/api/products');
 *       const data = await response.json();
 *       tracker.success(response.status, { count: data.length });
 *       return data;
 *     } catch (error) {
 *       tracker.error(error as Error);
 *       throw error;
 *     }
 *   };
 *
 *   return { fetchProducts };
 * }
 * ```
 */
export function useAPITracker() {
  const telemetry = useTelemetryOptional();

  const start = useCallback(
    (options: APICallOptions) => {
      const startTime = performance.now();

      telemetry?.trackEvent('api_request', {
        method: options.method,
        api_path: options.path,
      });

      return {
        success: (statusCode: number, properties?: Record<string, unknown>) => {
          const duration = performance.now() - startTime;

          telemetry?.trackEvent('api_response', {
            method: options.method,
            api_path: options.path,
            status_code: statusCode,
            api_duration: duration,
            ...properties,
          });
        },
        error: (error: Error, statusCode?: number) => {
          const duration = performance.now() - startTime;

          telemetry?.trackEvent('api_response', {
            method: options.method,
            api_path: options.path,
            status_code: statusCode || 0,
            api_duration: duration,
            error_type: error.name,
            error_message: error.message,
          });
        },
      };
    },
    [telemetry]
  );

  return { start };
}

// =============================================================================
// Page Leave Tracking
// =============================================================================

/**
 * Hook to track page leave events
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   usePageLeaveTracker('/my-page');
 *
 *   return <div>Page content...</div>;
 * }
 * ```
 */
export function usePageLeaveTracker(path: string): void {
  const telemetry = useTelemetryOptional();
  const enteredAt = useRef<number | null>(null);

  useEffect(() => {
    enteredAt.current = Date.now();

    return () => {
      const duration = enteredAt.current ? Date.now() - enteredAt.current : 0;

      telemetry?.trackEvent('page_leave', {
        path,
        duration,
      });
    };
  }, [path, telemetry]);
}
