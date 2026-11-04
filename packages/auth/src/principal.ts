import { useEffect, useRef } from 'react';

/**
 * Dispatched on `window` when the signed-in principal changes: on sign-out,
 * when the session ends, or when another account takes its place. Data a
 * page cached for the previous principal must not be shown to the next one;
 * `@plexusone/api-client` clears its query cache on this event.
 */
export const PRINCIPAL_CHANGE_EVENT = 'systemforge:principal-change';

/** The `detail` of a {@link PRINCIPAL_CHANGE_EVENT}. */
export interface PrincipalChangeDetail {
  /** The principal that was signed in. */
  previous: string;
  /** The principal signed in now, if any. */
  current?: string;
}

/**
 * usePrincipalChange dispatches {@link PRINCIPAL_CHANGE_EVENT} when `id`
 * moves away from a principal that was signed in. Becoming signed in from
 * signed out is not a change: nothing was cached for anyone else.
 */
export function usePrincipalChange(id: string | undefined | null): void {
  const previous = useRef<string | undefined>(undefined);
  useEffect(() => {
    const current = id ?? undefined;
    const before = previous.current;
    previous.current = current;
    if (before === undefined || before === current || typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent<PrincipalChangeDetail>(PRINCIPAL_CHANGE_EVENT, {
        detail: { previous: before, current },
      })
    );
  }, [id]);
}
