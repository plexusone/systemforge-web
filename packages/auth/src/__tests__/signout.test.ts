import { afterEach, describe, expect, it, vi } from 'vitest';
import { endLoginSession, readSignOut } from '../signout';

const target = { url: 'https://auth.example.com/logout', returnTo: 'https://app.example.com/' };

describe('readSignOut', () => {
  it('reads the sign-out target', () => {
    expect(readSignOut({ signOut: target })).toEqual(target);
  });

  it('ignores a body that is not one', () => {
    for (const body of [
      undefined,
      null,
      'x',
      {},
      { signOut: null },
      { signOut: { url: target.url } },
    ]) {
      expect(readSignOut(body)).toBeUndefined();
    }
  });

  it('refuses a URL that is not http or https', () => {
    expect(
      readSignOut({ signOut: { url: 'javascript:alert(1)', returnTo: target.returnTo } })
    ).toBeUndefined();
    expect(readSignOut({ signOut: { url: target.url, returnTo: '/relative' } })).toBeUndefined();
  });
});

describe('endLoginSession', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('posts a form with return_to to the sign-out page', () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    endLoginSession(target);
    const form = document.querySelector('form');
    expect(form?.method).toBe('post');
    expect(form?.action).toBe(target.url);
    const field = form?.querySelector<HTMLInputElement>('input[name="return_to"]');
    expect(field?.type).toBe('hidden');
    expect(field?.value).toBe(target.returnTo);
    expect(submit).toHaveBeenCalledOnce();
  });
});
