import type {
  RecognitionErrorEventLike,
  RecognitionLike,
  RecognitionResultEventLike,
  SynthesisLike,
  UtteranceConstructor,
} from '../index';

/** Stands in for SpeechSynthesisUtterance. */
export class FakeUtterance {
  text: string;
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

export const Utterance = FakeUtterance as unknown as UtteranceConstructor;

export function voice(name: string, lang: string, extra: Partial<SpeechSynthesisVoice> = {}) {
  return {
    name,
    lang,
    voiceURI: `uri:${name}`,
    default: false,
    localService: false,
    ...extra,
  } as SpeechSynthesisVoice;
}

/**
 * Stands in for speechSynthesis. The test starts each utterance with start()
 * and ends it with end(); one never started stands for Chrome's stalled queue.
 */
export class FakeSynthesis implements SynthesisLike {
  spoken: FakeUtterance[] = [];
  current: FakeUtterance | undefined;
  paused = false;
  voices: SpeechSynthesisVoice[] = [];
  calls: string[] = [];
  private listeners: Array<() => void> = [];

  get speaking() {
    return this.current !== undefined;
  }
  get pending() {
    return false;
  }

  speak(u: SpeechSynthesisUtterance) {
    const f = u as unknown as FakeUtterance;
    this.calls.push('speak');
    this.spoken.push(f);
    this.current = f;
  }
  /** Starts the current utterance. */
  start() {
    this.current?.onstart?.();
  }
  /** Finishes the current utterance. */
  end() {
    const u = this.current;
    this.current = undefined;
    u?.onend?.();
  }
  fail(error: string) {
    const u = this.current;
    this.current = undefined;
    u?.onerror?.({ error });
  }
  cancel() {
    this.calls.push('cancel');
    const u = this.current;
    this.current = undefined;
    u?.onerror?.({ error: 'interrupted' });
  }
  pause() {
    this.calls.push('pause');
    this.paused = true;
  }
  resume() {
    this.calls.push('resume');
    this.paused = false;
  }
  getVoices() {
    return this.voices;
  }
  addEventListener(_type: 'voiceschanged', l: () => void) {
    this.listeners.push(l);
  }
  removeEventListener(_type: 'voiceschanged', l: () => void) {
    this.listeners = this.listeners.filter((x) => x !== l);
  }
  loadVoices(vs: SpeechSynthesisVoice[]) {
    this.voices = vs;
    for (const l of [...this.listeners]) l();
  }
  texts() {
    return this.spoken.map((u) => u.text);
  }
}

/** Stands in for SpeechRecognition. */
export class FakeRecognition implements RecognitionLike {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((e: RecognitionResultEventLike) => void) | null = null;
  onerror: ((e: RecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  starts = 0;
  running = false;
  private results: Array<{ isFinal: boolean; length: number; 0: { transcript: string } }> = [];

  start() {
    if (this.running) throw new Error('already started');
    this.starts++;
    this.running = true;
  }
  stop() {
    this.endSession();
  }
  abort() {
    this.onerror?.({ error: 'aborted' });
    this.endSession();
  }
  /** Reports a result, replacing the interim one when there is one. */
  say(transcript: string, isFinal: boolean) {
    const last = this.results[this.results.length - 1];
    const index = last && !last.isFinal ? this.results.length - 1 : this.results.length;
    this.results[index] = { isFinal, length: 1, 0: { transcript } };
    this.onresult?.({ resultIndex: index, results: this.results });
  }
  error(error: string) {
    this.onerror?.({ error });
  }
  /** The browser ends a session; results start over in the next one. */
  endSession() {
    this.running = false;
    this.results = [];
    this.onend?.();
  }
}
