/**
 * Default longest chunk passed to one utterance. Some browser voices stop
 * partway through long utterances (Chrome's network voices after about 15
 * seconds), so long text is spoken as several shorter ones.
 */
export const DEFAULT_MAX_CHUNK_CHARS = 180;

/**
 * Splits text into chunks of at most `maxChars` characters, breaking at
 * sentence ends first, then at clause punctuation, then between words. Short
 * sentences are joined, so speech is not broken up more than needed. A single
 * word longer than `maxChars` is kept whole. Whitespace is collapsed.
 */
export function splitText(text: string, maxChars: number = DEFAULT_MAX_CHUNK_CHARS): string[] {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return [];
  if (maxChars <= 0 || t.length <= maxChars) return [t];

  const parts: string[] = [];
  for (const sentence of pieces(t, '.!?…')) {
    if (sentence.length <= maxChars) {
      parts.push(sentence);
      continue;
    }
    for (const clause of pieces(sentence, ',;:')) {
      if (clause.length <= maxChars) parts.push(clause);
      else parts.push(...pack(clause.split(' '), maxChars));
    }
  }
  return pack(parts, maxChars);
}

// Splits after any character in `ends` that is followed by whitespace or the
// end of the text, keeping the punctuation. No lookbehind, which older
// Safari versions cannot parse.
function pieces(text: string, ends: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (ends.includes(text[i]) && (i + 1 === text.length || text[i + 1] === ' ')) {
      out.push(text.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  const rest = text.slice(start).trim();
  if (rest) out.push(rest);
  return out.filter(Boolean);
}

// Joins parts with spaces into chunks no longer than max.
function pack(parts: string[], max: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if (!p) continue;
    if (!cur) cur = p;
    else if (cur.length + 1 + p.length <= max) cur += ' ' + p;
    else {
      out.push(cur);
      cur = p;
    }
  }
  if (cur) out.push(cur);
  return out;
}
