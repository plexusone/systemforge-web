import { describe, expect, it } from 'vitest';
import { DEFAULT_NAME, displayName, looksLikeAddress, safeName } from '../names';

describe('safeName', () => {
  it.each([
    ['Jane Doe', 'Jane Doe'],
    ['  Jane  ', 'Jane'],
    ['octocat', 'octocat'],
    ['jane@example.com', undefined],
    ['Jane @ Acme', undefined],
    ['', undefined],
    ['   ', undefined],
    [undefined, undefined],
    [null, undefined],
  ])('%j -> %j', (input, want) => {
    expect(safeName(input)).toBe(want);
  });
});

describe('displayName', () => {
  it('never returns an address', () => {
    expect(displayName({ name: 'jane@example.com' })).toBe(DEFAULT_NAME);
    expect(displayName(null)).toBe(DEFAULT_NAME);
    expect(displayName({}, 'Signed in')).toBe('Signed in');
    expect(displayName({ name: 'Jane' })).toBe('Jane');
  });

  it('recognizes an address', () => {
    expect(looksLikeAddress('a@b.co')).toBe(true);
    expect(looksLikeAddress('Jane')).toBe(false);
  });
});
