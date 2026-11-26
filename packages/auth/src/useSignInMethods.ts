import { useEffect, useMemo, useState } from 'react';
import { BFFClient } from './bff-client';
import type { SignInMethodInfo } from './types';

/** What {@link useSignInMethods} returns. */
export interface SignInMethodsState {
  /** The methods the deployment offers, in order; empty until loaded, and when none are published. */
  methods: SignInMethodInfo[];
  isLoading: boolean;
  /** Why the list could not be loaded, if it could not; `methods` is then empty. */
  error: Error | null;
}

const NONE: SignInMethodInfo[] = [];

interface Answer {
  client: BFFClient;
  methods: SignInMethodInfo[];
  error: Error | null;
}

/**
 * The sign-in methods the deployment offers, from the BFF's
 * `GET /bff/auth/methods`, so an application builds its buttons from the
 * deployment and a method turned on in SystemAuth shows up without a change to
 * the application.
 *
 * @param bffBaseUrl The BFF's base URL; empty for the same origin.
 * @param enabled Pass `false` to make no request (a page that lists its own
 *   methods).
 *
 * @example
 * ```tsx
 * const { methods } = useSignInMethods();
 * methods.map((m) => <button onClick={() => loginWithOAuth(m.id)}>{m.name}</button>);
 * ```
 */
export function useSignInMethods(
  bffBaseUrl: string = '',
  enabled: boolean = true
): SignInMethodsState {
  const client = useMemo(() => new BFFClient(bffBaseUrl), [bffBaseUrl]);
  // The answer is kept with the client that was asked, so an answer for
  // another BFF reads as still loading.
  const [answer, setAnswer] = useState<Answer | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    client
      .getSignInMethods()
      .then((methods) => {
        if (!cancelled) setAnswer({ client, methods, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const error =
            err instanceof Error ? err : new Error('could not load the sign-in methods');
          setAnswer({ client, methods: NONE, error });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, enabled]);

  return useMemo(() => {
    if (!enabled) return { methods: NONE, isLoading: false, error: null };
    if (answer?.client !== client) return { methods: NONE, isLoading: true, error: null };
    return { methods: answer.methods, isLoading: false, error: answer.error };
  }, [client, enabled, answer]);
}
