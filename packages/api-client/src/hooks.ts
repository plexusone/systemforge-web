import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  type QueryKey,
  type InfiniteData,
} from '@tanstack/react-query';
import { useApiClient } from './ApiProvider';
import type { ApiError, PaginatedResponse, PaginationParams, RequestOptions } from './types';

/**
 * Hook for GET requests with React Query
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: string }) {
 *   const { data, isLoading } = useApiQuery<User>(
 *     ['users', userId],
 *     `/users/${encodeURIComponent(userId)}`
 *   );
 *
 *   if (isLoading) return <Spinner />;
 *   return <div>{data?.name}</div>;
 * }
 * ```
 */
export function useApiQuery<T>(
  queryKey: QueryKey,
  path: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchOnMount?: boolean;
    retry?: boolean | number;
    requestOptions?: RequestOptions;
  }
) {
  const { client } = useApiClient();
  const { requestOptions, ...queryOptions } = options || {};

  return useQuery<T, ApiError>({
    queryKey,
    queryFn: () => client.get<T>(path, requestOptions),
    ...queryOptions,
  });
}

/**
 * Hook for paginated GET requests
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const { data, isLoading } = usePaginatedQuery<User>(
 *     ['users'],
 *     '/users',
 *     { page: 1, per_page: 20 }
 *   );
 *
 *   return (
 *     <div>
 *       {data?.data.map(user => <UserRow key={user.id} user={user} />)}
 *       <Pagination total={data?.pagination.total_pages} />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaginatedQuery<T>(
  queryKey: QueryKey,
  path: string,
  pagination?: PaginationParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    requestOptions?: RequestOptions;
  }
) {
  const { client } = useApiClient();
  const { requestOptions, ...queryOptions } = options || {};

  return useQuery<PaginatedResponse<T>, ApiError>({
    queryKey: [...(Array.isArray(queryKey) ? queryKey : [queryKey]), pagination],
    queryFn: () => client.getPaginated<T>(path, pagination, requestOptions),
    ...queryOptions,
  });
}

/**
 * Hook for infinite scrolling queries
 *
 * @example
 * ```tsx
 * function InfiniteUserList() {
 *   const {
 *     data,
 *     fetchNextPage,
 *     hasNextPage,
 *     isFetchingNextPage,
 *   } = useInfiniteApiQuery<User>(
 *     ['users'],
 *     '/users',
 *     { per_page: 20 }
 *   );
 *
 *   return (
 *     <div>
 *       {data?.pages.flatMap(page => page.data).map(user => (
 *         <UserRow key={user.id} user={user} />
 *       ))}
 *       {hasNextPage && (
 *         <button onClick={() => fetchNextPage()}>
 *           {isFetchingNextPage ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useInfiniteApiQuery<T>(
  queryKey: QueryKey,
  path: string,
  pagination?: Omit<PaginationParams, 'page'>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    requestOptions?: RequestOptions;
  }
) {
  const { client } = useApiClient();
  const { requestOptions, ...queryOptions } = options || {};

  return useInfiniteQuery<
    PaginatedResponse<T>,
    ApiError,
    InfiniteData<PaginatedResponse<T>>,
    QueryKey,
    number
  >({
    queryKey,
    queryFn: ({ pageParam }) =>
      client.getPaginated<T>(path, { ...pagination, page: pageParam }, requestOptions),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination;
      return page < total_pages ? page + 1 : undefined;
    },
    ...queryOptions,
  });
}

/**
 * Hook for POST mutations
 *
 * @example
 * ```tsx
 * function CreateUserForm() {
 *   const { mutate, isPending } = useApiMutation<User, CreateUserInput>(
 *     '/users',
 *     {
 *       onSuccess: (user) => {
 *         toast.success(`Created ${user.name}`);
 *       },
 *     }
 *   );
 *
 *   const handleSubmit = (data: CreateUserInput) => {
 *     mutate(data);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useApiMutation<TData, TVariables = unknown>(
  path: string,
  options?: {
    method?: 'POST' | 'PUT' | 'PATCH';
    requestOptions?: RequestOptions;
    invalidateQueries?: QueryKey[];
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
  }
) {
  const { client } = useApiClient();
  const queryClient = useQueryClient();
  const { method = 'POST', requestOptions, invalidateQueries, onSuccess, onError } = options || {};

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: (variables) => {
      switch (method) {
        case 'PUT':
          return client.put<TData>(path, variables, requestOptions);
        case 'PATCH':
          return client.patch<TData>(path, variables, requestOptions);
        default:
          return client.post<TData>(path, variables, requestOptions);
      }
    },
    onSuccess: (data) => {
      // Invalidate specified queries on success
      if (invalidateQueries) {
        invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook for DELETE mutations
 *
 * @example
 * ```tsx
 * function DeleteUserButton({ userId }: { userId: string }) {
 *   const { mutate, isPending } = useApiDelete<void>(
 *     `/users/${encodeURIComponent(userId)}`,
 *     {
 *       invalidateQueries: [['users']],
 *       onSuccess: () => {
 *         toast.success('User deleted');
 *       },
 *     }
 *   );
 *
 *   return (
 *     <button onClick={() => mutate()} disabled={isPending}>
 *       Delete
 *     </button>
 *   );
 * }
 * ```
 */
export function useApiDelete<TData = void>(
  path: string,
  options?: {
    requestOptions?: RequestOptions;
    invalidateQueries?: QueryKey[];
    onSuccess?: (data: TData) => void;
    onError?: (error: ApiError) => void;
  }
) {
  const { client } = useApiClient();
  const queryClient = useQueryClient();
  const { requestOptions, invalidateQueries, onSuccess, onError } = options || {};

  return useMutation<TData, ApiError, void>({
    mutationFn: () => client.delete<TData>(path, requestOptions),
    onSuccess: (data) => {
      // Invalidate specified queries on success
      if (invalidateQueries) {
        invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] });
        });
      }
      onSuccess?.(data);
    },
    onError,
  });
}

/**
 * Hook to invalidate queries programmatically
 *
 * @example
 * ```tsx
 * function RefreshButton() {
 *   const invalidate = useInvalidateQueries();
 *
 *   return (
 *     <button onClick={() => invalidate(['users'])}>
 *       Refresh Users
 *     </button>
 *   );
 * }
 * ```
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return (queryKey: QueryKey) => {
    queryClient.invalidateQueries({ queryKey: Array.isArray(queryKey) ? queryKey : [queryKey] });
  };
}

/**
 * Hook to prefetch data
 *
 * @example
 * ```tsx
 * function UserLink({ userId }: { userId: string }) {
 *   const prefetch = usePrefetch();
 *
 *   return (
 *     <Link
 *       to={`/users/${encodeURIComponent(userId)}`}
 *       onMouseEnter={() => prefetch(['users', userId], `/users/${encodeURIComponent(userId)}`)}
 *     >
 *       View User
 *     </Link>
 *   );
 * }
 * ```
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const { client } = useApiClient();

  return <T>(queryKey: QueryKey, path: string, options?: RequestOptions) => {
    void queryClient.prefetchQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      queryFn: () => client.get<T>(path, options),
    });
  };
}
