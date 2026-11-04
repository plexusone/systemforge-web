import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PRINCIPAL_CHANGE_EVENT, usePrincipalChange } from '../principal';

describe('usePrincipalChange', () => {
  const seen = vi.fn();
  const listen = (e: Event) => seen((e as CustomEvent).detail);

  afterEach(() => {
    window.removeEventListener(PRINCIPAL_CHANGE_EVENT, listen);
    seen.mockReset();
  });

  it('fires when a signed-in principal signs out or is replaced, not on first sign-in', () => {
    window.addEventListener(PRINCIPAL_CHANGE_EVENT, listen);
    const { rerender } = renderHook(({ id }) => usePrincipalChange(id), {
      initialProps: { id: undefined as string | undefined },
    });
    rerender({ id: 'a' });
    rerender({ id: 'a' });
    expect(seen).not.toHaveBeenCalled();

    rerender({ id: 'b' });
    expect(seen).toHaveBeenLastCalledWith({ previous: 'a', current: 'b' });

    rerender({ id: undefined });
    expect(seen).toHaveBeenLastCalledWith({ previous: 'b', current: undefined });
    expect(seen).toHaveBeenCalledTimes(2);
  });
});
