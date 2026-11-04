/**
 * URL checks for navigation. A link or redirect target that reaches
 * `window.location` or an anchor's `href` outside React must pass one of
 * these first: `location.assign('javascript:…')` runs script, and React's
 * guard on `href` does not cover it.
 */

// Browsers strip tabs and newlines from URLs and read a backslash as a
// slash, so "/\evil.example" or "java\nscript:" would not mean what it looks
// like. Neither has a place in a navigation target.
function hasUnsafeChar(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x20 || c === 0x7f || c === 0x5c) return true;
  }
  return false;
}

function currentHref(): string | undefined {
  return typeof window === 'undefined' ? undefined : window.location.href;
}

function parse(url: string, base: string): URL | undefined {
  try {
    return new URL(url, base);
  } catch {
    return undefined;
  }
}

/**
 * safeHref returns `url` when it is a relative URL or an absolute http(s)
 * URL, and undefined otherwise: `javascript:`, `data:` and other schemes,
 * control characters and backslashes are refused. Cross-origin URLs pass;
 * use {@link sameOriginURL} for redirects that must stay on this site.
 */
export function safeHref(url: string | null | undefined): string | undefined {
  if (typeof url !== 'string' || url === '' || hasUnsafeChar(url)) return undefined;
  const u = parse(url, currentHref() ?? 'http://localhost/');
  if (!u || (u.protocol !== 'http:' && u.protocol !== 'https:')) return undefined;
  return url;
}

/**
 * sameOriginURL returns `url` when it passes {@link safeHref} and resolves to
 * this page's origin, and undefined otherwise. A URL whose resolved path
 * starts with "//", such as "/.//evil.example", is refused too: rebuilding
 * it from its path would make it protocol-relative and leave the site.
 * Outside a browser it returns undefined.
 */
export function sameOriginURL(url: string | null | undefined): string | undefined {
  const href = safeHref(url);
  const base = currentHref();
  if (href === undefined || base === undefined) return undefined;
  const u = parse(href, base);
  if (!u || u.origin !== window.location.origin || u.pathname.startsWith('//')) return undefined;
  return href;
}

/**
 * navigateTo sends the browser to `url` when it passes {@link safeHref}, and
 * returns whether it did. Use it in place of `window.location.assign` for
 * any URL that came from props, the server or the address bar.
 */
export function navigateTo(url: string | null | undefined): boolean {
  const href = safeHref(url);
  if (href === undefined || typeof window === 'undefined') return false;
  window.location.assign(href);
  return true;
}

/**
 * returnPath returns `url` when it is a path on this site, such as
 * "/orgs/a?tab=2", and undefined otherwise: absolute URLs, "//host",
 * backslashes, control characters and paths that resolve to "//…" are
 * refused. Use it for `return_to` values sent to sign-in.
 */
export function returnPath(url: string | null | undefined): string | undefined {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//')) return undefined;
  if (hasUnsafeChar(url)) return undefined;
  const base = 'http://return.invalid';
  const u = parse(url, base);
  if (!u || u.origin !== base || u.pathname.startsWith('//')) return undefined;
  return url;
}

/**
 * currentPath is this page's path, query and fragment, with any run of
 * leading slashes collapsed to one, or undefined outside a browser.
 */
export function currentPath(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const { pathname, search, hash } = window.location;
  return `${pathname.replace(/^\/+/, '/')}${search}${hash}`;
}
