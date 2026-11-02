import { SpeechError } from './errors';

/** One recognition alternative, as the browser reports it. */
interface AlternativeLike {
  readonly transcript: string;
}

/** One recognition result: alternatives, and whether it is final. */
interface ResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: AlternativeLike;
}

/** The browser's SpeechRecognitionEvent, as far as this package reads it. */
export interface RecognitionResultEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [index: number]: ResultLike };
}

/** The browser's SpeechRecognitionErrorEvent, as far as this package reads it. */
export interface RecognitionErrorEventLike {
  readonly error: string;
}

/** The parts of the browser's SpeechRecognition this package uses. */
export interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEventLike) => void) | null;
  onerror: ((e: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

/** Creates a recognizer; set in tests. */
export type RecognitionFactory = () => RecognitionLike;

/** Recognized text so far. */
export interface ListenResult {
  /** Final and interim text together, as a user would see it typed. */
  text: string;
  /** Text the browser will not revise. */
  final: string;
  /** Text still being recognized, which may change. */
  interim: string;
}

export interface ListenOptions {
  /** BCP 47 language. Default `en-US`. */
  lang?: string;
  /** Keep listening across pauses until stopped. Default true. */
  continuous?: boolean;
  /** Report text while it is still being recognized. Default true. */
  interimResults?: boolean;
  /**
   * In continuous mode, stop after this many silences in a row (the browser
   * reports one after several seconds without speech). Default 3; 0 never
   * stops for silence.
   */
  maxSilences?: number;
  onResult?: (result: ListenResult) => void;
  onError?: (error: SpeechError) => void;
  /** Creates the recognizer; defaults to the browser's. */
  recognition?: RecognitionFactory;
}

/** Listening in progress. */
export interface Listening {
  /** Resolves with the final text; rejects with a SpeechError. */
  readonly done: Promise<string>;
  readonly listening: boolean;
  /** Stops listening and waits for the last results. */
  stop(): void;
  /** Stops listening at once, dropping text still being recognized. */
  abort(): void;
}

// Errors that end listening: no permission, no microphone, no service.
const FATAL = new Set([
  'not-allowed',
  'service-not-allowed',
  'audio-capture',
  'network',
  'language-not-supported',
  'bad-grammar',
]);

function browserRecognition(): RecognitionFactory | undefined {
  const g = globalThis as {
    SpeechRecognition?: new () => RecognitionLike;
    webkitSpeechRecognition?: new () => RecognitionLike;
  };
  const Ctor = g.SpeechRecognition ?? g.webkitSpeechRecognition;
  return Ctor ? () => new Ctor() : undefined;
}

/** Reports whether the browser can recognize speech. */
export function isRecognitionSupported(options: Pick<ListenOptions, 'recognition'> = {}): boolean {
  return Boolean(options.recognition ?? browserRecognition());
}

/**
 * Listens to the microphone and reports recognized text. In continuous mode
 * the browser ends recognition on its own from time to time; this restarts
 * it until stopped, a fatal error, or `maxSilences` silences in a row.
 */
export function listen(options: ListenOptions = {}): Listening {
  const factory = options.recognition ?? browserRecognition();
  const continuous = options.continuous ?? true;
  const maxSilences = options.maxSilences ?? 3;

  let active = true;
  let final = '';
  let interim = '';
  let silences = 0;
  let settled = false;
  const rec = factory?.();
  let resolve!: (text: string) => void;
  let reject!: (e: SpeechError) => void;
  const done = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  const handle: Listening = {
    done,
    get listening() {
      return active;
    },
    stop() {
      if (!active) return;
      active = false;
      rec?.stop();
    },
    abort() {
      if (!active) return;
      active = false;
      interim = '';
      rec?.abort();
      settle();
    },
  };

  function settle(error?: SpeechError) {
    active = false;
    if (settled) return;
    settled = true;
    if (error) {
      options.onError?.(error);
      reject(error);
    } else {
      resolve(final.trim());
    }
  }

  if (!rec) {
    settle(new SpeechError('unsupported', 'this browser cannot recognize speech'));
    return handle;
  }

  const r = rec;
  r.lang = options.lang ?? 'en-US';
  r.continuous = continuous;
  r.interimResults = options.interimResults ?? true;

  r.onspeechstart = () => {
    silences = 0;
  };
  r.onresult = (e) => {
    silences = 0;
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      const text = res.length > 0 ? res[0].transcript : '';
      if (res.isFinal) final = join(final, text);
      else interim += text;
    }
    options.onResult?.({
      text: join(final, interim).trim(),
      final: final.trim(),
      interim: interim.trim(),
    });
  };
  r.onerror = (e) => {
    if (e.error === 'aborted') return;
    if (FATAL.has(e.error)) {
      settle(new SpeechError(e.error));
      return;
    }
    if (e.error === 'no-speech') {
      silences++;
      if (maxSilences > 0 && silences >= maxSilences) active = false;
    }
  };
  r.onend = () => {
    if (active && continuous) {
      try {
        r.start();
        return;
      } catch {
        // The recognizer would not restart; finish with what was heard.
      }
    }
    settle();
  };

  try {
    r.start();
  } catch (err) {
    settle(new SpeechError('start-failed', err instanceof Error ? err.message : String(err)));
  }
  return handle;
}

function join(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return /\s$/.test(a) || /^\s/.test(b) ? a + b : `${a} ${b}`;
}
