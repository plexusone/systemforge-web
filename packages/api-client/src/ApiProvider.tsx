import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient } from './client';
import type { ApiClientConfig, ApiClientContextValue, ApiClientInterface } from './types';

/**
 * API client context
 */
const ApiClientContext = createContext<ApiClientContextValue | null>(null);

/**
 * Props for ApiProvider
 */
export interface ApiProviderProps {
  children: ReactNode;
  /**
   * API client configuration
   */
  config: ApiClientConfig;
  /**
   * Optional existing QueryClient instance
   */
  queryClient?: QueryClient;
  /**
   * Follow the organization `@plexusone/tenant` selects, sending its ID as
   * `X-Organization-ID`. Tenant only selects organizations the person is a
   * member of. Default true.
   */
  followTenant?: boolean;
}

// Window events from @plexusone/auth and @plexusone/tenant. The names are
// repeated here so this package needs neither.
const PRINCIPAL_CHANGE_EVENT = 'systemforge:principal-change';
const ORG_CHANGE_EVENT = 'systemforge:org-change';

/**
 * Default query client with sensible defaults
 */
function createDefaultQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error && typeof error === 'object' && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) {
              return false;
            }
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * ApiProvider - Provides API client and React Query to the component tree
 *
 * @example
 * ```tsx
 * import { ApiProvider } from '@plexusone/api-client';
 *
 * function App() {
 *   return (
 *     <ApiProvider
 *       config={{
 *         baseUrl: '/api',
 *         onUnauthorized: () => router.push('/login'),
 *       }}
 *     >
 *       <MyApp />
 *     </ApiProvider>
 *   );
 * }
 * ```
 */
export function ApiProvider({
  children,
  config,
  queryClient: providedQueryClient,
  followTenant = true,
}: ApiProviderProps) {
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(config.currentOrgId || null);

  // Create or use provided QueryClient
  const queryClient = useMemo(
    () => providedQueryClient || createDefaultQueryClient(),
    [providedQueryClient]
  );

  // Create API client
  const client = useMemo<ApiClientInterface>(() => {
    const apiClient = new ApiClient({
      ...config,
      currentOrgId: currentOrgId || undefined,
    });
    return apiClient;
  }, [config, currentOrgId]);

  // Cached data belongs to one principal in one organization. Resetting
  // cancels requests in flight, drops every query's data and refetches the
  // ones on screen. Invalidating would keep the data, and an inactive query
  // would show it when it next mounts.
  const resetCache = useCallback(() => {
    void queryClient.resetQueries();
    queryClient.getMutationCache().clear();
  }, [queryClient]);

  const orgRef = useRef(currentOrgId);
  const setCurrentOrgId = useCallback(
    (orgId: string | null) => {
      client.setOrgId(orgId);
      if (orgRef.current === orgId) return;
      orgRef.current = orgId;
      setCurrentOrgIdState(orgId);
      resetCache();
    },
    [client, resetCache]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener(PRINCIPAL_CHANGE_EVENT, resetCache);
    return () => window.removeEventListener(PRINCIPAL_CHANGE_EVENT, resetCache);
  }, [resetCache]);

  useEffect(() => {
    if (!followTenant || typeof window === 'undefined') return undefined;
    const onOrgChange = (e: Event) => {
      const id = (e as CustomEvent<{ org?: { id?: unknown } }>).detail?.org?.id;
      if (typeof id === 'string' && id !== '') setCurrentOrgId(id);
    };
    window.addEventListener(ORG_CHANGE_EVENT, onOrgChange);
    return () => window.removeEventListener(ORG_CHANGE_EVENT, onOrgChange);
  }, [followTenant, setCurrentOrgId]);

  const value = useMemo<ApiClientContextValue>(
    () => ({
      client,
      currentOrgId,
      setCurrentOrgId,
    }),
    [client, currentOrgId, setCurrentOrgId]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientContext.Provider value={value}>{children}</ApiClientContext.Provider>
    </QueryClientProvider>
  );
}

/**
 * Hook to access the API client
 *
 * @throws Error if used outside ApiProvider
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { client } = useApiClient();
 *
 *   const fetchUsers = async () => {
 *     const users = await client.get<User[]>('/users');
 *     return users;
 *   };
 *
 *   // ...
 * }
 * ```
 */
export function useApiClient(): ApiClientContextValue {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return context;
}

/**
 * Get API client without throwing (returns null if not in provider)
 */
export function useApiClientOptional(): ApiClientContextValue | null {
  return useContext(ApiClientContext);
}
