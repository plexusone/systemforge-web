import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechError } from './errors';
import { isRecognitionSupported, listen } from './recognition';
import type { ListenOptions, Listening } from './recognition';
import { getVoices, isSynthesisSupported, speak } from './synthesis';
import type {
  SpeakInput,
  SpeakOptions,
  SpeakResult,
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

export interface UseSpeechResult {
  /** Speaks, stopping anything already speaking. Options add to the hook's. */
  speak: (input: SpeakInput, options?: SpeakOptions) => Promise<SpeakResult>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  /** `idle` before the first speech. */
  state: SpeechState | 'idle';
  /** The segment being spoken, or -1. */
  segment: number;
  error: SpeechError | undefined;
  supported: boolean;
}

/** Text-to-speech in a component. Speech stops when the component unmounts. */
export function useSpeech(defaults: SpeakOptions = {}): UseSpeechResult {
  const [state, setState] = useState<SpeechState | 'idle'>('idle');
  const [segment, setSegment] = useState(-1);
  const [error, setError] = useState<SpeechError>();
  const handle = useRef<Speaking | undefined>(undefined);
  // Identifies the latest speech, so callbacks from earlier speech are ignored.
  const seq = useRef(0);
  const defaultsRef = useRef(defaults);
  useEffect(() => {
    defaultsRef.current = defaults;
  });

  useEffect(() => () => handle.current?.stop(), []);

  const run = useCallback((input: SpeakInput, options: SpeakOptions = {}) => {
    const merged = { ...defaultsRef.current, ...options };
    const id = ++seq.current;
    const latest = () => seq.current === id;
    setError(undefined);
    setSegment(-1);
    const h = speak(input, {
      ...merged,
      onSegment: (i, seg) => {
        if (latest()) setSegment(i);
        merged.onSegment?.(i, seg);
      },
    });
    handle.current = h;
    setState(h.state);
    return h.done.then(
      (r) => {
        if (latest()) {
          setState(r.status);
          setSegment(-1);
        }
        return r;
      },
      (e: SpeechError) => {
        if (latest()) {
          setState('error');
          setSegment(-1);
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

  return {
    speak: run,
    stop,
    pause,
    resume,
    state,
    segment,
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
