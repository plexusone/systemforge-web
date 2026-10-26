import { useCallback, useEffect, useState } from 'react';

/** The state of a load: data, an error, or neither while loading. */
export interface Load<T> {
  data?: T;
  error?: Error;
  reload: () => void;
}

/** useLoad runs fn when deps change and on reload, keeping the latest result. */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]): Load<T> {
  const [state, setState] = useState<{ data?: T; error?: Error }>({});
  const [n, setN] = useState(0);
  const reload = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    let live = true;
    fn().then(
      (data) => live && setState({ data }),
      (error: unknown) =>
        live && setState({ error: error instanceof Error ? error : new Error(String(error)) })
    );
    return () => {
      live = false;
    };
    // fn is recreated each render; deps and n decide when to load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...state, reload };
}
