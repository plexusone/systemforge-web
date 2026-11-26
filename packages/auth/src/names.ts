/**
 * Names that are safe to show.
 *
 * A name is shown to other people (profiles, member lists, certificates), and an
 * email address is not the person's to publish. SystemAuth asks for a name
 * instead of making one from the address, so a new account has a real one; an
 * older account, or a host that builds a name itself, may hold an address in the
 * name field. These helpers are the one place a web app turns "a name, or
 * nothing" into something safe to show, matching SystemForge's Go
 * `identity/displayname` package.
 */

/** What a person who gave no usable name is called. It says nothing about them. */
export const DEFAULT_NAME = 'Member';

/** Whether a string is, or contains, an email address: it has an "@". */
export function looksLikeAddress(s: string): boolean {
  return s.includes('@');
}

/**
 * The name trimmed, or `undefined` when it is empty or looks like an address.
 * Use it where "no name" is a meaningful answer, such as showing initials or
 * asking for a name.
 */
export function safeName(name?: string | null): string | undefined {
  const trimmed = (name ?? '').trim();
  if (!trimmed || looksLikeAddress(trimmed)) return undefined;
  return trimmed;
}

/** The name to display for a person: a safe name, else `fallback` ({@link DEFAULT_NAME}). */
export function displayName(
  person: { name?: string | null } | null | undefined,
  fallback: string = DEFAULT_NAME
): string {
  return safeName(person?.name) ?? fallback;
}
