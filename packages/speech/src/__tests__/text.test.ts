import { describe, expect, it } from 'vitest';
import { splitText } from '../index';
import { chunkText } from '../text';

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

describe('chunkText', () => {
  it('maps every character of a chunk back to the original text', () => {
    const text = '  One   two.\n\nThree four. ';
    const chunks = chunkText(text, 10);
    expect(chunks.map((c) => c.text)).toEqual(['One two.', 'Three', 'four.']);
    for (const c of chunks) {
      [...c.text].forEach((ch, i) => {
        if (ch !== ' ') expect(text[c.source[i]]).toBe(ch);
      });
    }
    expect(chunks[1].source[0]).toBe(text.indexOf('Three'));
  });
});
