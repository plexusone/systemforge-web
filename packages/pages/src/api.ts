/**
 * orgUrl builds `{apiBaseUrl}/organizations/{orgSlug}/{...segments}`, with
 * every segment percent-encoded, so a slug or ID such as "../admin" stays
 * one segment instead of naming another endpoint.
 */
export function orgUrl(apiBaseUrl: string, orgSlug: string, ...segments: string[]): string {
  const path = [orgSlug, ...segments].map((s) => encodeURIComponent(s)).join('/');
  return `${apiBaseUrl}/organizations/${path}`;
}
