import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getVoices,
  isSynthesisSupported,
  langMatches,
  pickVoice,
  speak,
  SpeechError,
} from '../index';
import { FakeSynthesis, Utterance, voice } from './fakes';

let synthesis: FakeSynthesis;
const env = () => ({ synthesis, Utterance });

beforeEach(() => {
  vi.useFakeTimers();
  synthesis = new FakeSynthesis();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('speak', () => {
  it('speaks segments in order with their pauses', async () => {
    const started: number[] = [];
    const s = speak(
      [{ text: 'First.', pauseMs: 500 }, { text: '', pauseMs: 300 }, { text: 'Third.' }],
      { ...env(), onSegment: (i) => started.push(i) }
    );

    expect(synthesis.texts()).toEqual(['First.']);
    synthesis.end();
    expect(synthesis.current).toBeUndefined();
    vi.advanceTimersByTime(499);
    expect(started).toEqual([0]);
    vi.advanceTimersByTime(1);
    expect(started).toEqual([0, 1]);
    vi.advanceTimersByTime(299);
    expect(synthesis.texts()).toEqual(['First.']);
    vi.advanceTimersByTime(1);
    expect(synthesis.texts()).toEqual(['First.', 'Third.']);
    expect(started).toEqual([0, 1, 2]);
    synthesis.end();

    await expect(s.done).resolves.toEqual({ status: 'ended' });
    expect(s.state).toBe('ended');
  });

  it('reports speech cancelled from elsewhere as stopped', async () => {
    const s = speak(
      ['One.', 'Two.'].map((text) => ({ text })),
      env()
    );
    synthesis.start();
    synthesis.fail('interrupted'); // another script called speechSynthesis.cancel()
    await expect(s.done).resolves.toEqual({ status: 'stopped' });
    expect(s.state).toBe('stopped');
    expect(synthesis.texts()).toEqual(['One.']);
  });

  it('reports words as offsets into the text passed, across chunks', () => {
    const words: string[] = [];
    const text = 'One  two. Three four.';
    speak([{ text: 'Intro.' }, { text }], {
      ...env(),
      maxChunkChars: 10,
      onWord: (w) => words.push(`${w.segment}:${text.slice(w.start, w.end)}`),
    });
    synthesis.end(); // Intro.
    expect(synthesis.current?.text).toBe('One two.');
    synthesis.boundary(4, 3); // "two" in the collapsed chunk
    synthesis.boundary(0, 8, 'sentence'); // sentence boundaries are not words
    synthesis.end();
    expect(synthesis.current?.text).toBe('Three');
    synthesis.end();
    synthesis.boundary(0, 4); // "four"
    expect(words).toEqual(['1:two', '1:four']);
  });

  it('finds the word end when the browser reports no length', () => {
    const words: Array<[number, number]> = [];
    speak('Hello, wide world.', { ...env(), onWord: (w) => words.push([w.start, w.end]) });
    synthesis.boundary(0);
    synthesis.boundary(6); // the space before "wide"
    synthesis.boundary(12, 0);
    synthesis.boundary(99);
    expect(words).toEqual([
      [0, 5],
      [7, 11],
      [12, 17],
    ]);
  });

  it('leaves punctuation out of words', () => {
    const text = 'Promote, (twice!). It grew 3.5%, "users\' guess."';
    const words: string[] = [];
    speak(text, { ...env(), onWord: (w) => words.push(text.slice(w.start, w.end)) });
    synthesis.boundary(0, 8); // "Promote," as Chrome reports it
    synthesis.boundary(9, 9); // "(twice!)."
    synthesis.boundary(27, 5); // "3.5%,"
    synthesis.boundary(33, 7); // the quote and "users'"
    synthesis.boundary(41, 7); // "guess." and the quote
    synthesis.boundary(17, 1); // "." alone, as some voices report it
    expect(words).toEqual(['Promote', 'twice', '3.5%', "users'", 'guess']);
  });

  it('does not report dashes, ellipses or symbols as words', () => {
    const text = 'Plan: 3.5% — fine – well… & so-called';
    const words: string[] = [];
    speak(text, { ...env(), onWord: (w) => words.push(text.slice(w.start, w.end)) });
    for (const w of ['3.5%', '—', 'fine', '–', 'well…', '&', 'so-called']) {
      synthesis.boundary(text.indexOf(w), w.length);
    }
    expect(words).toEqual(['3.5%', 'fine', 'well', 'so-called']);
  });

  it('ignores words from an utterance that is no longer spoken', () => {
    const words: number[] = [];
    const s = speak('One. Two.', {
      ...env(),
      maxChunkChars: 4,
      onWord: (w) => words.push(w.start),
    });
    const first = synthesis.current!;
    s.stop();
    first.onboundary?.({ name: 'word', charIndex: 0, charLength: 3 });
    expect(words).toEqual([]);
  });

  it('listens for words only when asked', () => {
    speak('One.', env());
    expect(synthesis.current?.onboundary).toBeNull();
  });

  it('splits long text into several utterances', async () => {
    const s = speak('One two. Three four. Five six seven.', { ...env(), maxChunkChars: 20 });
    synthesis.end();
    synthesis.end();
    await s.done;
    expect(synthesis.texts()).toEqual(['One two. Three four.', 'Five six seven.']);
  });

  it('sets the voice, language and rate on each utterance', () => {
    const en = voice('Samantha', 'en-US');
    synthesis.voices = [voice('Thomas', 'fr-FR'), en];
    speak('Hi.', { ...env(), voice: 'Samantha', rate: 1.2 });
    const u = synthesis.spoken[0];
    expect(u.voice).toBe(en);
    expect(u.lang).toBe('en-US');
    expect(u.rate).toBe(1.2);
  });

  it('picks a voice for the language when none is named', () => {
    const fr = voice('Thomas', 'fr-FR');
    synthesis.voices = [voice('Samantha', 'en-US'), fr];
    speak('Bonjour.', { ...env(), lang: 'fr-FR' });
    expect(synthesis.spoken[0].voice).toBe(fr);
  });

  it('stops, cancelling the browser speech', async () => {
    const s = speak('Hello.', env());
    s.stop();
    await expect(s.done).resolves.toEqual({ status: 'stopped' });
    expect(synthesis.calls).toContain('cancel');
    expect(s.state).toBe('stopped');
  });

  it('stops during a pause without speaking the rest', async () => {
    const s = speak([{ text: 'A.', pauseMs: 1000 }, { text: 'B.' }], env());
    synthesis.end();
    s.stop();
    vi.advanceTimersByTime(2000);
    await s.done;
    expect(synthesis.texts()).toEqual(['A.']);
  });

  it('stops earlier speech when new speech starts', async () => {
    const first = speak('First.', env());
    const second = speak('Second.', env());
    await expect(first.done).resolves.toEqual({ status: 'stopped' });
    expect(second.state).toBe('speaking');
    expect(synthesis.texts()).toEqual(['First.', 'Second.']);
  });

  it('pauses by cancelling, never with the browser pause, and repeats the utterance on resume', async () => {
    const s = speak([{ text: 'A.', pauseMs: 1000 }, { text: 'B.' }], env());
    synthesis.start();
    s.pause();
    expect(s.state).toBe('paused');
    expect(synthesis.current).toBeUndefined();
    expect(synthesis.calls).not.toContain('pause');
    vi.advanceTimersByTime(10000);
    s.resume();
    expect(synthesis.texts()).toEqual(['A.', 'A.']);
    synthesis.start();
    synthesis.end();

    vi.advanceTimersByTime(400);
    s.pause();
    vi.advanceTimersByTime(5000);
    expect(synthesis.texts()).toEqual(['A.', 'A.']);
    s.resume();
    vi.advanceTimersByTime(599);
    expect(synthesis.texts()).toEqual(['A.', 'A.']);
    vi.advanceTimersByTime(1);
    expect(synthesis.texts()).toEqual(['A.', 'A.', 'B.']);
    synthesis.start();
    synthesis.end();
    await expect(s.done).resolves.toEqual({ status: 'ended' });
    expect(synthesis.calls).not.toContain('pause');
  });

  it('reports a segment once when an utterance is repeated after a pause', () => {
    const started: number[] = [];
    const s = speak([{ text: 'A.' }], { ...env(), onSegment: (i) => started.push(i) });
    s.pause();
    s.resume();
    expect(started).toEqual([0]);
  });

  it('clears the queue before speaking, even when the browser reports it idle', () => {
    synthesis.paused = true;
    speak('Hello.', env());
    expect(synthesis.calls.slice(0, 3)).toEqual(['cancel', 'resume', 'speak']);
  });

  it('retries an utterance that never starts, then rejects with start-timeout', async () => {
    const s = speak('Hello.', env());
    vi.advanceTimersByTime(2999);
    expect(synthesis.texts()).toEqual(['Hello.']);
    vi.advanceTimersByTime(1);
    expect(synthesis.texts()).toEqual(['Hello.', 'Hello.']);
    expect(synthesis.calls.slice(-2)).toEqual(['cancel', 'speak']);
    vi.advanceTimersByTime(3000);
    const err = await s.done.catch((e: unknown) => e);
    expect((err as SpeechError).code).toBe('start-timeout');
    expect(s.state).toBe('error');
  });

  it('carries on after a retry starts', async () => {
    const s = speak('Hello.', { ...env(), startTimeoutMs: 500 });
    vi.advanceTimersByTime(500);
    synthesis.start();
    vi.advanceTimersByTime(5000);
    synthesis.end();
    await expect(s.done).resolves.toEqual({ status: 'ended' });
    expect(synthesis.texts()).toEqual(['Hello.', 'Hello.']);
  });

  it('does not watch an utterance that started, or when startTimeoutMs is 0', async () => {
    const started = speak('One.', env());
    synthesis.start();
    vi.advanceTimersByTime(10000);
    expect(synthesis.texts()).toEqual(['One.']);
    synthesis.end();
    await started.done;

    const unwatched = speak('Two.', { ...env(), startTimeoutMs: 0 });
    vi.advanceTimersByTime(10000);
    expect(unwatched.state).toBe('speaking');
    expect(synthesis.texts()).toEqual(['One.', 'Two.']);
  });

  it('stops when the page is hidden', async () => {
    const s = speak('Hello.', env());
    window.dispatchEvent(new Event('pagehide'));
    await expect(s.done).resolves.toEqual({ status: 'stopped' });
  });

  it('rejects with the browser error code', async () => {
    const s = speak('Hello.', env());
    synthesis.fail('not-allowed');
    const err = await s.done.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SpeechError);
    expect((err as SpeechError).code).toBe('not-allowed');
    expect(s.state).toBe('error');
  });

  it('stops when the signal aborts', async () => {
    const ac = new AbortController();
    const s = speak('Hello.', { ...env(), signal: ac.signal });
    ac.abort();
    await expect(s.done).resolves.toEqual({ status: 'stopped' });
  });

  it('rejects as unsupported without speech synthesis', async () => {
    const s = speak('Hello.', { synthesis: undefined, Utterance: undefined });
    await expect(s.done).rejects.toMatchObject({ code: 'unsupported' });
    expect(isSynthesisSupported()).toBe(false);
    expect(isSynthesisSupported(env())).toBe(true);
  });
});

describe('voices', () => {
  it('matches languages with and without a region', () => {
    expect(langMatches('en-US', 'en-us')).toBe(true);
    expect(langMatches('en_GB', 'en')).toBe(true);
    expect(langMatches('en', 'en-GB')).toBe(true);
    expect(langMatches('en-US', 'en-GB')).toBe(false);
    expect(langMatches('fr-FR', 'en')).toBe(false);
  });

  it('prefers an exact match, then the default, then a voice on the device', () => {
    const remote = voice('Remote', 'en-US');
    const local = voice('Local', 'en-US', { localService: true });
    const preferred = voice('Default', 'en-US', { default: true });
    const gb = voice('GB', 'en-GB', { default: true });
    expect(pickVoice([gb, remote, local, preferred], 'en-US')).toBe(preferred);
    expect(pickVoice([gb, remote, local], 'en-US')).toBe(local);
    expect(pickVoice([gb, remote], 'en-AU')).toBe(gb);
    expect(pickVoice([gb], 'de-DE')).toBeUndefined();
  });

  it('waits for the browser to load its voices', async () => {
    const pending = getVoices({ synthesis, lang: 'fr' });
    synthesis.loadVoices([voice('Samantha', 'en-US'), voice('Thomas', 'fr-FR')]);
    expect((await pending).map((v) => v.name)).toEqual(['Thomas']);
  });

  it('gives up waiting after the timeout', async () => {
    const pending = getVoices({ synthesis, timeoutMs: 100 });
    vi.advanceTimersByTime(100);
    await expect(pending).resolves.toEqual([]);
  });
});
