import { safeHref } from './url';

/**
 * SystemAuth's sign-out, which the BFF names when it ends the app's session:
 * the browser posts a form to `url` with a `return_to` field of `returnTo`,
 * and SystemAuth ends its login session and redirects there. Without it, the
 * next sign-in would resume the login session, and a person who signed out
 * would be signed straight back in.
 */
export interface SystemAuthSignOut {
  /** SystemAuth's sign-out page, such as `https://auth.example.com/logout`. */
  url: string;
  /** Where SystemAuth sends the browser afterwards. */
  returnTo: string;
}

/**
 * Reads the sign-out target from the body of `POST /bff/auth/logout`, or
 * returns undefined when the BFF named none or the body is not one.
 */
export function readSignOut(body: unknown): SystemAuthSignOut | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const signOut = (body as { signOut?: unknown }).signOut;
  if (typeof signOut !== 'object' || signOut === null) return undefined;
  const { url, returnTo } = signOut as { url?: unknown; returnTo?: unknown };
  if (typeof url !== 'string' || typeof returnTo !== 'string') return undefined;
  if (!isHTTPURL(url) || !isHTTPURL(returnTo)) return undefined;
  return { url, returnTo };
}

function isHTTPURL(s: string): boolean {
  // Absolute only: a relative value is not a sign-out target.
  return /^https?:\/\//i.test(s) && safeHref(s) !== undefined;
}

/**
 * Sends the browser to SystemAuth's sign-out with a form POST, which
 * SystemAuth accepts from the app's origin. The page navigates away.
 */
export function endLoginSession(target: SystemAuthSignOut, doc: Document = document): void {
  const form = doc.createElement('form');
  form.method = 'POST';
  form.action = target.url;
  form.style.display = 'none';
  const field = doc.createElement('input');
  field.type = 'hidden';
  field.name = 'return_to';
  field.value = target.returnTo;
  form.appendChild(field);
  doc.body.appendChild(form);
  form.submit();
}
