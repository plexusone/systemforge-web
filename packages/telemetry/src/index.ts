/**
 * @plexusone/telemetry
 *
 * Telemetry, error tracking, and performance monitoring for SystemForge applications.
 *
 * @example Basic usage
 * ```tsx
 * import {
 *   TelemetryProvider,
 *   ErrorBoundary,
 *   useTelemetry,
 *   usePageView,
 * } from '@plexusone/telemetry';
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
 *       <ErrorBoundary>
 *         <MyApp />
 *       </ErrorBoundary>
 *     </TelemetryProvider>
 *   );
 * }
 *
 * function Dashboard() {
 *   usePageView('/dashboard');
 *   const { trackAction } = useTelemetry();
 *
 *   return (
 *     <button onClick={() => trackAction('dashboard', 'click', { button: 'export' })}>
 *       Export
 *     </button>
 *   );
 * }
 * ```
 *
 * @example ProductGraph integration
 * ```tsx
 * import { TelemetryProvider } from '@plexusone/telemetry';
 * import { ProductGraphAdapter } from '@plexusone/telemetry/adapters/productgraph';
 *
 * const productGraph = new ProductGraphAdapter({
 *   projectId: 'my-project',
 *   endpoint: 'https://api.productgraph.io/v1/events',
 *   apiKey: process.env.PRODUCTGRAPH_API_KEY,
 * });
 *
 * function App() {
 *   return (
 *     <TelemetryProvider config={{ adapters: [productGraph] }}>
 *       <MyApp />
 *     </TelemetryProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Provider
export { TelemetryProvider, useTelemetry, useTelemetryOptional } from './TelemetryProvider';
export type { TelemetryProviderProps } from './TelemetryProvider';

// Error boundary
export { ErrorBoundary, DefaultErrorFallback } from './ErrorBoundary';

// Telemetry client
export { TelemetryClient, createTelemetryClient, ConsoleAdapter, HttpAdapter } from './telemetry';

// Adapters
export { ProductGraphAdapter, createProductGraphAdapter } from './adapters/productgraph';
export type {
  ProductGraphConfig,
  ProductGraphEvent,
  ProductGraphEventType,
} from './adapters/productgraph';

// Core hooks
export {
  usePageView,
  useComponentTrack,
  useActionTracker,
  usePerformanceTracker,
  useFormTracker,
  useIdentify,
  useOrgContext,
  useFeatureTracker,
  useWebVitals,
} from './hooks';

// ProductGraph-specific hooks
export {
  // Component path tracking
  ComponentPathProvider,
  useComponentPath,
  useComponentPathString,
  // State tracking
  useStateTracker,
  // Journey tracking
  JourneyProvider,
  useJourneyStep,
  useJourneyConversion,
  // Enhanced interaction tracking
  useScrollTracker,
  useClickTracker,
  useAPITracker,
  usePageLeaveTracker,
} from './hooks/productgraph';

// Types
export type {
  TelemetryEventType,
  TelemetryEvent,
  PageViewEvent,
  ActionEvent,
  ErrorEvent,
  PerformanceEvent,
  TelemetryUser,
  TelemetryOrg,
  TelemetryAdapter,
  LogLevel,
  TelemetryConfig,
  TelemetryContextValue,
  ErrorBoundaryProps,
  PerformanceTiming,
} from './types';
