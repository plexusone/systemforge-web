import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigateTo, returnPath, safeHref, sameOriginURL } from '../url';

const origin = () => window.location.origin;

describe('safeHref', () => {
  it('passes relative and http(s) URLs unchanged', () => {
    for (const url of [
      '/settings',
      'settings',
      '?tab=2',
      '#top',
      'https://docs.example.com/x',
      'http://localhost:3000/',
    ]) {
      expect(safeHref(url)).toBe(url);
    }
  });

  it('refuses other schemes', () => {
    for (const url of [
      'javascript:alert(1)',
      ' javascript:alert(1)',
      'JavaScript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'vbscript:msgbox(1)',
      'mailto:a@example.com',
    ]) {
      expect(safeHref(url)).toBeUndefined();
    }
  });

  it('refuses control characters and backslashes', () => {
    for (const url of ['java\nscript:alert(1)', 'java\tscript:alert(1)', '/\\evil.example']) {
      expect(safeHref(url)).toBeUndefined();
    }
  });

  it('refuses empty and non-string values', () => {
    expect(safeHref('')).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(42 as unknown as string)).toBeUndefined();
  });
});

describe('sameOriginURL', () => {
  it('passes paths and absolute URLs on this origin', () => {
    expect(sameOriginURL('/dashboard?x=1')).toBe('/dashboard?x=1');
    expect(sameOriginURL(`${origin()}/a`)).toBe(`${origin()}/a`);
  });

  it('refuses other origins', () => {
    for (const url of [
      'https://evil.example/',
      '//evil.example/x',
      '/\\evil.example',
      'javascript:alert(1)',
    ]) {
      expect(sameOriginURL(url)).toBeUndefined();
    }
  });

  it('refuses paths that resolve to a protocol-relative path', () => {
    for (const url of [
      '/.//evil.example/x',
      '/a/..//evil.example',
      '/%2e//evil.example',
      '//evil.example',
    ]) {
      expect(sameOriginURL(url)).toBeUndefined();
    }
  });
});

describe('navigateTo', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('assigns a safe URL and refuses an unsafe one', () => {
    const assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      assign,
    } as Location);

    expect(navigateTo('/next')).toBe(true);
    expect(assign).toHaveBeenCalledWith('/next');

    expect(navigateTo('javascript:alert(1)')).toBe(false);
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

describe('returnPath', () => {
  it('passes paths on this site', () => {
    for (const url of ['/', '/orgs/a?tab=2', '/x#y']) expect(returnPath(url)).toBe(url);
  });

  it('refuses anything else', () => {
    for (const url of [
      '',
      'orgs/a',
      'https://app.example.com/',
      '//evil.example',
      '/\\evil.example',
      '/.//evil.example',
      '/%2e//evil.example',
      '/a\nb',
    ]) {
      expect(returnPath(url)).toBeUndefined();
    }
    expect(returnPath(undefined)).toBeUndefined();
  });
});
