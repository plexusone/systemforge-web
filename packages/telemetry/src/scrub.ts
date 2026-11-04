/**
 * Redaction for values sent to a telemetry endpoint. Query strings and
 * fragments often carry tokens (invites, password resets, signed URLs), and
 * error messages often embed URLs, emails or response bodies.
 */

const REDACTED = '[redacted]';

// A JWT, or a run of 24 or more token characters with at least one digit,
// such as an API key, session ID or signature. Plain words do not match.
const JWT = /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g;
const LONG_TOKEN = /\b(?=[\w-]*\d)[\w-]{24,}\b/g;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const URL_QUERY = /(\b[a-z][a-z\d+.-]*:\/\/[^\s?#"'<>]*|(?:^|\s)\/[^\s?#"'<>]*)[?#][^\s"'<>]*/gi;

/**
 * scrubUrl removes the query string and fragment from a URL or path, and
 * replaces token-like path segments with "[redacted]".
 */
export function scrubUrl(url: string): string {
  const cut = url.search(/[?#]/);
  const base = cut === -1 ? url : url.slice(0, cut);
  return base.replace(JWT, REDACTED).replace(LONG_TOKEN, REDACTED);
}

/**
 * scrubOrigin reduces a URL to its origin, or returns undefined for an empty
 * or unparseable value.
 */
export function scrubOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const { origin } = new URL(url);
    return origin === 'null' ? undefined : origin;
  } catch {
    return undefined;
  }
}

/**
 * scrubText redacts query strings in URLs, emails, JWTs and long token-like
 * strings, and truncates the result to `max` characters.
 */
export function scrubText(text: string, max = 1000): string {
  const out = text
    .replace(URL_QUERY, (_match, keep: string) => `${keep}?${REDACTED}`)
    .replace(JWT, REDACTED)
    .replace(EMAIL, REDACTED)
    .replace(LONG_TOKEN, REDACTED);
  return out.length > max ? `${out.slice(0, max)}…` : out;
}
