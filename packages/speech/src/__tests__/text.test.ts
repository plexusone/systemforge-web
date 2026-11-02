import { describe, expect, it } from 'vitest';
import { splitText } from '../index';

describe('splitText', () => {
  it('keeps short text whole and collapses whitespace', () => {
    expect(splitText('  Hello\n  there.  ')).toEqual(['Hello there.']);
  });

  it('returns nothing for empty text', () => {
    expect(splitText('   ')).toEqual([]);
  });

  it('breaks at sentence ends and joins short sentences', () => {
    expect(splitText('One two. Three four. Five six seven.', 20)).toEqual([
      'One two. Three four.',
      'Five six seven.',
    ]);
  });

  it('does not break inside a number', () => {
    expect(splitText('It grew 3.5 times. Then it stopped.', 20)).toEqual([
      'It grew 3.5 times.',
      'Then it stopped.',
    ]);
  });

  it('breaks a long sentence at clauses, then between words', () => {
    expect(splitText('alpha beta, gamma delta epsilon zeta eta theta', 16)).toEqual([
      'alpha beta,',
      'gamma delta',
      'epsilon zeta eta',
      'theta',
    ]);
  });

  it('keeps a word longer than the limit whole', () => {
    expect(splitText('a supercalifragilistic b', 5)).toEqual(['a', 'supercalifragilistic', 'b']);
  });

  it('does not split when the limit is zero', () => {
    const long = 'word '.repeat(100).trim();
    expect(splitText(long, 0)).toEqual([long]);
  });
});
