import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechError } from './errors';
import { isRecognitionSupported, listen } from './recognition';
import type { ListenOptions, Listening } from './recognition';
import { getVoices, isSynthesisSupported, speak } from './synthesis';
import type {
  SpeakInput,
  SpeakOptions,
  SpeakResult,
  SpeakWord,
  Speaking,
  SpeechState,
  SynthesisEnv,
} from './synthesis';

/** The browser's voices, optionally for one language; empty until loaded. */
export function useVoices(lang?: string, env: SynthesisEnv = {}): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { synthesis } = env;
  useEffect(() => {
    let live = true;
    getVoices({ lang, synthesis }).then((vs) => {
      if (live) setVoices(vs);
    });
    return () => {
      live = false;
    };
  }, [lang, synthesis]);
  return voices;
}

export interface UseSpeechOptions extends SpeakOptions {
  /**
   * Track the word being spoken in `word`, for highlighting. Off by default:
   * it re-renders the component on every word.
   */
  trackWords?: boolean;
}

export interface UseSpeechResult {
  /** Speaks, stopping anything already speaking. Options add to the hook's. */
  speak: (input: SpeakInput, options?: UseSpeechOptions) => Promise<SpeakResult>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  /** Changes the speed of the speech in progress; it carries on at the new speed. */
  setRate: (rate: number) => void;
  /** Changes the voice of the speech in progress. */
  setVoice: (voice: SpeechSynthesisVoice | string) => void;
  /** `idle` before the first speech. */
  state: SpeechState | 'idle';
  /** The segment being spoken, or -1. */
  segment: number;
  /**
   * The word being spoken, with `trackWords`; undefined between segments,
   * after speech, and with voices that do not report words.
   */
  word: SpeakWord | undefined;
  error: SpeechError | undefined;
  supported: boolean;
}

/** Text-to-speech in a component. Speech stops when the component unmounts. */
export function useSpeech(defaults: UseSpeechOptions = {}): UseSpeechResult {
  const [state, setState] = useState<SpeechState | 'idle'>('idle');
  const [segment, setSegment] = useState(-1);
  const [word, setWord] = useState<SpeakWord>();
  const [error, setError] = useState<SpeechError>();
  const handle = useRef<Speaking | undefined>(undefined);
  // Identifies the latest speech, so callbacks from earlier speech are ignored.
  const seq = useRef(0);
  const defaultsRef = useRef(defaults);
  useEffect(() => {
    defaultsRef.current = defaults;
  });

  useEffect(() => () => handle.current?.stop(), []);

  const run = useCallback((input: SpeakInput, options: UseSpeechOptions = {}) => {
    const { trackWords, ...merged } = { ...defaultsRef.current, ...options };
    const id = ++seq.current;
    const latest = () => seq.current === id;
    setError(undefined);
    setSegment(-1);
    setWord(undefined);
    const h = speak(input, {
      ...merged,
      onSegment: (i, seg) => {
        if (latest()) {
          setSegment(i);
          setWord(undefined);
        }
        merged.onSegment?.(i, seg);
      },
      onWord: trackWords
        ? (w) => {
            if (latest()) setWord(w);
            merged.onWord?.(w);
          }
        : merged.onWord,
    });
    handle.current = h;
    setState(h.state);
    return h.done.then(
      (r) => {
        if (latest()) {
          setState(r.status);
          setSegment(-1);
          setWord(undefined);
        }
        return r;
      },
      (e: SpeechError) => {
        if (latest()) {
          setState('error');
          setSegment(-1);
          setWord(undefined);
          setError(e);
        }
        throw e;
      }
    );
  }, []);

  const stop = useCallback(() => handle.current?.stop(), []);
  const pause = useCallback(() => {
    handle.current?.pause();
    if (handle.current) setState(handle.current.state);
  }, []);
  const resume = useCallback(() => {
    handle.current?.resume();
    if (handle.current) setState(handle.current.state);
  }, []);
  const setRate = useCallback((rate: number) => handle.current?.setRate(rate), []);
  const setVoice = useCallback(
    (voice: SpeechSynthesisVoice | string) => handle.current?.setVoice(voice),
    []
  );

  return {
    speak: run,
    stop,
    pause,
    resume,
    setRate,
    setVoice,
    state,
    segment,
    word,
    error,
    supported: isSynthesisSupported(defaults),
  };
}

export interface UseListenResult {
  start: (options?: ListenOptions) => Promise<string>;
  stop: () => void;
  abort: () => void;
  listening: boolean;
  /** Final and interim text together. */
  text: string;
  final: string;
  interim: string;
  error: SpeechError | undefined;
  supported: boolean;
}

/** Speech-to-text in a component. Listening stops when the component unmounts. */
export function useListen(defaults: ListenOptions = {}): UseListenResult {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState('');
  const [final, setFinal] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<SpeechError>();
  const handle = useRef<Listening | undefined>(undefined);
  const seq = useRef(0);
  const defaultsRef = useRef(defaults);
  useEffect(() => {
    defaultsRef.current = defaults;
  });

  useEffect(() => () => handle.current?.abort(), []);

  const start = useCallback((options: ListenOptions = {}) => {
    handle.current?.abort();
    const merged = { ...defaultsRef.current, ...options };
    const id = ++seq.current;
    const latest = () => seq.current === id;
    setError(undefined);
    setText('');
    setFinal('');
    setInterim('');
    const h = listen({
      ...merged,
      onResult: (r) => {
        if (latest()) {
          setText(r.text);
          setFinal(r.final);
          setInterim(r.interim);
        }
        merged.onResult?.(r);
      },
    });
    handle.current = h;
    setListening(h.listening);
    return h.done.then(
      (t) => {
        if (latest()) {
          setListening(false);
          setInterim('');
        }
        return t;
      },
      (e: SpeechError) => {
        if (latest()) {
          setListening(false);
          setError(e);
        }
        throw e;
      }
    );
  }, []);

  const stop = useCallback(() => handle.current?.stop(), []);
  const abort = useCallback(() => handle.current?.abort(), []);

  return {
    start,
    stop,
    abort,
    listening,
    text,
    final,
    interim,
    error,
    supported: isRecognitionSupported(defaults),
  };
}
