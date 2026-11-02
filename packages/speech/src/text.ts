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
  return chunkText(text, maxChars).map((c) => c.text);
}

/** A chunk of text to speak, and where each of its characters came from. */
export interface TextChunk {
  text: string;
  /** For each character of `text`, its index in the original text. */
  source: number[];
}

/**
 * Splits text like splitText, keeping for each chunk the position of every
 * character in the original text, so a position the browser reports in a
 * chunk can be mapped back to the text the caller passed.
 */
export function chunkText(text: string, maxChars: number = DEFAULT_MAX_CHUNK_CHARS): TextChunk[] {
  const { t, source } = collapse(text);
  if (!t) return [];
  // Each chunk is a run of t: its parts are adjacent in t and were joined
  // with the single space that separated them there.
  let from = 0;
  return split(t, maxChars).map((chunk) => {
    const at = t.indexOf(chunk, from);
    from = at + chunk.length;
    return { text: chunk, source: source.slice(at, at + chunk.length) };
  });
}

// Collapses runs of whitespace to one space and trims, recording the
// original index of every character kept.
function collapse(text: string): { t: string; source: number[] } {
  let t = '';
  const source: number[] = [];
  let space = false;
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) {
      space = t.length > 0;
      continue;
    }
    if (space) {
      t += ' ';
      source.push(i - 1);
      space = false;
    }
    t += text[i];
    source.push(i);
  }
  return { t, source };
}

function split(t: string, maxChars: number): string[] {
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
