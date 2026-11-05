import { SpeechError } from './errors';
import { chunkText, DEFAULT_MAX_CHUNK_CHARS } from './text';

/** A piece of text to speak, and the silence after it. */
export interface SpeakSegment {
  text: string;
  /** Silence after the text, in milliseconds. */
  pauseMs?: number;
}

/** Plain text, or segments with pauses between them. */
export type SpeakInput = string | readonly SpeakSegment[];

/** The parts of the browser's SpeechSynthesis this package uses. */
export interface SynthesisLike {
  readonly speaking: boolean;
  readonly pending: boolean;
  readonly paused: boolean;
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
  removeEventListener?(type: 'voiceschanged', listener: () => void): void;
}

/** Constructs an utterance; the browser's SpeechSynthesisUtterance. */
export type UtteranceConstructor = new (text: string) => SpeechSynthesisUtterance;

/** Where to speak; defaults to the browser's own. Set in tests. */
export interface SynthesisEnv {
  synthesis?: SynthesisLike;
  Utterance?: UtteranceConstructor;
}

/**
 * A word being spoken: `start` and `end` are UTF-16 offsets into the text of
 * segment `segment`, as passed to speak, so `text.slice(start, end)` is the
 * word.
 */
export interface SpeakWord {
  segment: number;
  start: number;
  end: number;
}

export interface SpeakOptions extends SynthesisEnv {
  /** BCP 47 language, such as `en-US`. Picks a voice when `voice` is not set. */
  lang?: string;
  /** A voice, or a voice's `voiceURI` or `name`. */
  voice?: SpeechSynthesisVoice | string;
  /** 0.1 to 10; 1 is normal speed. */
  rate?: number;
  /** 0 to 2; 1 is normal. */
  pitch?: number;
  /** 0 to 1. */
  volume?: number;
  /** Longest text per utterance. See DEFAULT_MAX_CHUNK_CHARS. */
  maxChunkChars?: number;
  /** Stops the speech when aborted. */
  signal?: AbortSignal;
  /**
   * How long an utterance may take to start before it is retried once, then
   * reported as a `start-timeout` error. Default 3000.
   */
  startTimeoutMs?: number;
  /** Called as each segment starts, including one that is only a pause. */
  onSegment?: (index: number, segment: SpeakSegment) => void;
  /**
   * Called as each word is spoken, for highlighting. Only some voices report
   * words; with others this is never called, and speech is the same.
   */
  onWord?: (word: SpeakWord) => void;
}

export type SpeechState = 'speaking' | 'paused' | 'ended' | 'stopped' | 'error';

/** How speech finished: it reached the end, or it was stopped. */
export interface SpeakResult {
  status: 'ended' | 'stopped';
}

/** Speech in progress. */
export interface Speaking {
  /** Resolves when the speech ends or is stopped; rejects with a SpeechError. */
  readonly done: Promise<SpeakResult>;
  readonly state: SpeechState;
  stop(): void;
  /** Pauses. Resuming repeats the utterance that was interrupted, at most one sentence. */
  pause(): void;
  resume(): void;
  /**
   * Changes the speed, and speech carries on at the new speed. A browser
   * can't change an utterance that has started, so the one being spoken
   * starts again from the last word reported to `onWord`, or from its
   * beginning when no `onWord` was given.
   */
  setRate(rate: number): void;
  /** Changes the voice, as `setRate` changes the speed. */
  setVoice(voice: SpeechSynthesisVoice | string): void;
}

/** How long an utterance may take to start. See SpeakOptions.startTimeoutMs. */
export const DEFAULT_START_TIMEOUT_MS = 3000;

type Step =
  | { kind: 'say'; text: string; source: number[]; segment: number; first: boolean }
  | { kind: 'wait'; ms: number; segment: number; first: boolean };

// The browser speaks one thing at a time, so starting new speech stops the
// current one.
let current: { stop(): void } | undefined;

// Speech left running or paused when a page goes away can stall the next
// page's speech in Chrome, so stop it as the page is hidden for good.
let pageHideBound = false;
function stopOnPageHide() {
  if (pageHideBound) return;
  const g = globalThis as { addEventListener?: (type: string, l: () => void) => void };
  if (typeof g.addEventListener !== 'function') return;
  g.addEventListener('pagehide', () => current?.stop());
  pageHideBound = true;
}

function browserSynthesis(): SynthesisLike | undefined {
  const g = globalThis as { speechSynthesis?: SynthesisLike };
  return g.speechSynthesis;
}

function browserUtterance(): UtteranceConstructor | undefined {
  const g = globalThis as { SpeechSynthesisUtterance?: UtteranceConstructor };
  return g.SpeechSynthesisUtterance;
}

/** Reports whether the browser can speak text. */
export function isSynthesisSupported(env: SynthesisEnv = {}): boolean {
  return Boolean((env.synthesis ?? browserSynthesis()) && (env.Utterance ?? browserUtterance()));
}

function toSegments(input: SpeakInput): readonly SpeakSegment[] {
  return typeof input === 'string' ? [{ text: input }] : input;
}

function plan(segments: readonly SpeakSegment[], maxChars: number): Step[] {
  const steps: Step[] = [];
  segments.forEach((seg, segment) => {
    let first = true;
    for (const { text, source } of chunkText(seg.text ?? '', maxChars)) {
      steps.push({ kind: 'say', text, source, segment, first });
      first = false;
    }
    const ms = Math.max(0, seg.pauseMs ?? 0);
    if (ms > 0) {
      steps.push({ kind: 'wait', ms, segment, first });
    }
  });
  return steps;
}

/**
 * Speaks text or segments, with each segment's pause after it. Long text is
 * split into several utterances (see `maxChunkChars`). Starting new speech
 * stops speech already in progress.
 */
export function speak(input: SpeakInput, options: SpeakOptions = {}): Speaking {
  const synth = options.synthesis ?? browserSynthesis();
  const Utterance = options.Utterance ?? browserUtterance();

  let state: SpeechState = 'speaking';
  let resolve!: (r: SpeakResult) => void;
  let reject!: (e: SpeechError) => void;
  const done = new Promise<SpeakResult>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const handle: Speaking = {
    done,
    get state() {
      return state;
    },
    stop,
    pause,
    resume,
    setRate,
    setVoice,
  };

  if (!synth || !Utterance) {
    state = 'error';
    reject(new SpeechError('unsupported', 'this browser cannot speak text'));
    return handle;
  }

  const segments = toSegments(input);
  const steps = plan(segments, options.maxChunkChars ?? DEFAULT_MAX_CHUNK_CHARS);
  let voice = resolveVoice(synth, options);
  let rate = options.rate;
  let next = 0;
  // The utterance being spoken. Holding it also keeps it from being
  // garbage-collected before its end event, which loses the event in Chrome.
  let utterance: SpeechSynthesisUtterance | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let waitLeft = 0;
  let waitStarted = 0;
  // Watches that the current utterance starts; see startTimeoutMs.
  let startTimer: ReturnType<typeof setTimeout> | undefined;
  // Set while paused mid-utterance: resuming repeats that utterance.
  let repeat = false;
  // The step being spoken, and where in its text the last word started, so
  // a change of speed or voice can carry on from there.
  let saying: Extract<Step, { kind: 'say' }> | undefined;
  let spokenAt = 0;
  const startTimeoutMs = options.startTimeoutMs ?? DEFAULT_START_TIMEOUT_MS;

  current?.stop();
  const self = { stop };
  current = self;
  stopOnPageHide();
  // Always clear the queue first. When speech was paused and abandoned, here
  // or in another tab, Chrome reports nothing speaking or pending, yet holds
  // new speech without starting it or reporting an error. A cancel clears it.
  synth.cancel();
  if (synth.paused) synth.resume();

  options.signal?.addEventListener('abort', stop, { once: true });
  if (options.signal?.aborted) {
    stop();
    return handle;
  }

  function finish(result: SpeakResult | SpeechError) {
    if (current === self) current = undefined;
    utterance = undefined;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    clearStartTimer();
    options.signal?.removeEventListener('abort', stop);
    if (result instanceof SpeechError) {
      state = 'error';
      reject(result);
    } else {
      state = result.status;
      resolve(result);
    }
  }

  function live() {
    return state === 'speaking' || state === 'paused';
  }

  function clearStartTimer() {
    if (startTimer !== undefined) clearTimeout(startTimer);
    startTimer = undefined;
  }

  function step() {
    if (state !== 'speaking') return;
    if (next >= steps.length) {
      finish({ status: 'ended' });
      return;
    }
    const s = steps[next++];
    if (s.first) options.onSegment?.(s.segment, segments[s.segment]);
    if (s.kind === 'wait') {
      waitLeft = s.ms;
      startWait();
      return;
    }
    say(s, false);
  }

  // Speaks one utterance. A retry is the second try after it failed to start.
  function say(s: Extract<Step, { kind: 'say' }>, retry: boolean) {
    const { text } = s;
    const u = new Utterance!(text);
    if (voice) u.voice = voice;
    const lang = options.lang ?? voice?.lang;
    if (lang) u.lang = lang;
    if (rate !== undefined) u.rate = rate;
    if (options.pitch !== undefined) u.pitch = options.pitch;
    if (options.volume !== undefined) u.volume = options.volume;
    u.onstart = () => {
      if (utterance === u) clearStartTimer();
    };
    const onWord = options.onWord;
    if (onWord) {
      u.onboundary = (e: SpeechSynthesisEvent) => {
        if (utterance !== u || e.name === 'sentence') return;
        const word = locateWord(s, e.charIndex, e.charLength);
        if (!word) return;
        spokenAt = e.charIndex;
        onWord(word);
      };
    }
    u.onend = () => {
      if (utterance !== u) return;
      clearStartTimer();
      utterance = undefined;
      step();
    };
    u.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (utterance !== u) return;
      // This package lets go of the utterance before it cancels one, so a
      // cancel that still finds it came from elsewhere: another library or
      // tab calling speechSynthesis.cancel(). The speech has been stopped.
      if (e.error === 'interrupted' || e.error === 'canceled') {
        finish({ status: 'stopped' });
        return;
      }
      finish(new SpeechError(e.error ?? 'synthesis-failed'));
    };
    utterance = u;
    saying = s;
    spokenAt = 0;
    synth!.speak(u);
    if (startTimeoutMs > 0 && utterance === u) {
      clearStartTimer();
      startTimer = setTimeout(() => {
        startTimer = undefined;
        if (utterance !== u || state !== 'speaking') return;
        // Accepted but never started: the stall above, set off after this
        // speech began. Clear the queue and try once more.
        utterance = undefined;
        synth!.cancel();
        if (synth!.paused) synth!.resume();
        if (retry) {
          finish(
            new SpeechError('start-timeout', 'the browser accepted the speech but never started it')
          );
          return;
        }
        say(s, true);
      }, startTimeoutMs);
    }
  }

  function startWait() {
    waitStarted = Date.now();
    timer = setTimeout(() => {
      timer = undefined;
      waitLeft = 0;
      step();
    }, waitLeft);
  }

  function stop() {
    if (!live()) return;
    const speaking = utterance !== undefined;
    finish({ status: 'stopped' });
    if (speaking) synth!.cancel();
  }

  // Pausing never uses the browser's pause: speech paused and then abandoned
  // stalls Chrome's speech for every page until it is cancelled. Instead the
  // utterance is cancelled, and resuming speaks it again.
  function pause() {
    if (state !== 'speaking') return;
    state = 'paused';
    if (timer !== undefined) {
      clearTimeout(timer);
      timer = undefined;
      waitLeft = Math.max(0, waitLeft - (Date.now() - waitStarted));
    } else if (utterance) {
      clearStartTimer();
      utterance = undefined;
      repeat = true;
      synth!.cancel();
    }
  }

  function setRate(value: number) {
    rate = value;
    restart();
  }

  function setVoice(value: SpeechSynthesisVoice | string) {
    if (!synth) return;
    voice = resolveVoice(synth, { ...options, voice: value });
    restart();
  }

  // Speaks the rest of the current utterance again with the new settings.
  // Between utterances, or while paused, the next one picks them up.
  function restart() {
    if (state !== 'speaking' || !utterance || !saying) return;
    const s = saying;
    const at = spokenAt;
    clearStartTimer();
    utterance = undefined; // let go first, so its cancel isn't taken as a stop
    synth!.cancel();
    say(at > 0 ? { ...s, text: s.text.slice(at), source: s.source.slice(at) } : s, false);
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'speaking';
    if (repeat) {
      repeat = false;
      const s = steps[next - 1];
      if (s.kind === 'say') say(s, false);
    } else if (waitLeft > 0) startWait();
    else step();
  }

  step();
  return handle;
}

// Characters that end a word when the browser gives no word length: spaces
// and dashes between words. Punctuation inside a word, as in "don't" or
// "3.5", is kept, and punctuation at its end is trimmed below.
const WORD_END = /[\s–—]/;
// Punctuation trimmed from either end of a word, so every browser marks the
// same span: Chrome includes it in the word's length, Safari gives no length.
// An apostrophe is kept at the end, as in "users'".
const LEADING = /[([{"'“‘¿¡–—-]/;
const TRAILING = /[.,;:!?…)\]}"”–—-]/;
// A word has at least one letter or digit; anything else, such as a dash
// or an ellipsis spoken as a pause, is not reported.
const WORDLIKE = /[\p{L}\p{N}]/u;

// Maps a word the browser reports in an utterance back to the segment's
// text, without surrounding punctuation. A piece with no letter or digit,
// as some voices report, is no word.
function locateWord(
  s: { text: string; source: number[]; segment: number },
  charIndex: number,
  charLength: number | undefined
): SpeakWord | undefined {
  const { text } = s;
  if (!(charIndex >= 0 && charIndex < text.length)) return undefined;
  let start = charIndex;
  let end = charLength && charLength > 0 ? Math.min(charIndex + charLength, text.length) : 0;
  while (start < text.length && text[start] === ' ') start++;
  if (!end || end <= start) {
    end = start + 1;
    while (end < text.length && !WORD_END.test(text[end])) end++;
  }
  while (start < end && LEADING.test(text[start])) start++;
  while (end > start && TRAILING.test(text[end - 1])) end--;
  if (start >= end || !WORDLIKE.test(text.slice(start, end))) return undefined;
  return { segment: s.segment, start: s.source[start], end: s.source[end - 1] + 1 };
}

/** Stops any speech this package started. */
export function stopSpeaking(): void {
  current?.stop();
}

function resolveVoice(
  synth: SynthesisLike,
  options: SpeakOptions
): SpeechSynthesisVoice | undefined {
  const { voice, lang } = options;
  if (voice && typeof voice !== 'string') return voice;
  const voices = synth.getVoices();
  if (typeof voice === 'string') {
    const found = voices.find((v) => v.voiceURI === voice) ?? voices.find((v) => v.name === voice);
    if (found) return found;
  }
  return lang ? pickVoice(voices, lang) : undefined;
}

function normalizeLang(lang: string): string {
  return lang.replace(/_/g, '-').toLowerCase();
}

/**
 * Reports whether a voice language suits a requested language: the same
 * language and region, or the same language when either has no region
 * (`en` matches `en-GB`). `en-US` does not match `en-GB`.
 */
export function langMatches(voiceLang: string, lang: string): boolean {
  const a = normalizeLang(voiceLang);
  const b = normalizeLang(lang);
  if (a === b) return true;
  const [pa, ra] = a.split('-');
  const [pb, rb] = b.split('-');
  return pa === pb && (!ra || !rb);
}

/**
 * Picks the best voice for a language: an exact language and region match
 * before a language-only match, and within each the browser's default, then
 * a voice on the device (which needs no network), then the first.
 */
export function pickVoice(
  voices: readonly SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | undefined {
  const want = normalizeLang(lang);
  const exact = voices.filter((v) => normalizeLang(v.lang) === want);
  const primary = want.split('-')[0];
  const sameLanguage = voices.filter((v) => normalizeLang(v.lang).split('-')[0] === primary);
  for (const group of [exact, sameLanguage]) {
    const v = group.find((x) => x.default) ?? group.find((x) => x.localService) ?? group[0];
    if (v) return v;
  }
  return undefined;
}

export interface GetVoicesOptions extends SynthesisEnv {
  /** Only voices for this language (see langMatches). */
  lang?: string;
  /** How long to wait for the browser to load its voices. Default 2000. */
  timeoutMs?: number;
}

/**
 * Lists the browser's voices. Browsers load voices after the page, so this
 * waits for them, up to `timeoutMs`. Resolves to an empty list when the
 * browser cannot speak or has no voices.
 */
export function getVoices(options: GetVoicesOptions = {}): Promise<SpeechSynthesisVoice[]> {
  const synth = options.synthesis ?? browserSynthesis();
  const filter = (vs: SpeechSynthesisVoice[]) =>
    options.lang ? vs.filter((v) => langMatches(v.lang, options.lang!)) : vs;
  if (!synth) return Promise.resolve([]);
  const now = synth.getVoices();
  if (now.length > 0 || !synth.addEventListener) return Promise.resolve(filter(now));

  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', finish);
      resolve(filter(synth.getVoices()));
    };
    const timer = setTimeout(finish, options.timeoutMs ?? 2000);
    synth.addEventListener!('voiceschanged', finish);
  });
}
