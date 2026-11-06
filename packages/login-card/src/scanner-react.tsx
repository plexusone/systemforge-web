import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import {
  startLoginCodeScanner,
  type ScannerOptions,
  type ScannerUnavailableReason,
} from './scanner';

export * from './scanner';

/** Where a scanner stands. */
export type ScannerState = 'starting' | 'scanning' | 'done' | 'idle' | ScannerUnavailableReason;

/**
 * Runs the scanner in the video element while active is true, and stops the
 * camera when it turns false or the component unmounts. To scan again after
 * a code or an idle stop, mount it afresh, as LoginCodeScanner does.
 */
export function useLoginCodeScanner(
  video: RefObject<HTMLVideoElement | null>,
  opts: ScannerOptions & { active?: boolean }
): ScannerState {
  const [state, setState] = useState<ScannerState>('starting');
  const latest = useRef(opts);
  useLayoutEffect(() => {
    latest.current = opts;
  });
  const active = opts.active ?? true;

  useEffect(() => {
    const el = video.current;
    if (!active || !el) return;
    let cancelled = false;
    let stop: (() => void) | undefined;
    void startLoginCodeScanner(el, {
      ...latest.current,
      onCode: (code) => {
        setState('done');
        latest.current.onCode(code);
      },
      onUnavailable: (reason) => {
        setState(reason);
        latest.current.onUnavailable?.(reason);
      },
      onIdle: () => {
        setState('idle');
        latest.current.onIdle?.();
      },
    }).then((h) => {
      if (cancelled) {
        h.stop();
        return;
      }
      stop = h.stop;
      setState((s) => (s === 'starting' ? 'scanning' : s));
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [video, active]);

  return state;
}

/** The words a {@link LoginCodeScanner} shows, for translation. */
export interface ScannerMessages {
  scanning: string;
  idle: string;
  retry: string;
  typeInstead: string;
  unavailable: Record<ScannerUnavailableReason, string>;
}

/** The default, plain-language messages. */
export const defaultScannerMessages: ScannerMessages = {
  scanning: 'Hold your card up to the camera.',
  idle: 'The camera turned off.',
  retry: 'Try again',
  typeInstead: 'Type my code instead',
  unavailable: {
    'insecure-context': 'The camera only works on a secure page. Type your code instead.',
    'no-camera': 'This device has no camera we can use. Type your code instead.',
    denied:
      'The camera is not allowed. A grown-up can allow it in the browser, or you can type your code.',
    error:
      'The camera did not start. Close other apps that use it and try again, or type your code.',
  },
};

/** Props of {@link LoginCodeScanner}. */
export interface LoginCodeScannerProps extends Omit<ScannerOptions, 'onIdle'> {
  /** Shown as a button under the camera, for typing the code instead. */
  onTypeInstead?: () => void;
  messages?: Partial<ScannerMessages>;
  className?: string;
}

/**
 * The camera, a line saying what to do, and a way to type the code instead.
 * It stops the camera on a code, after idleMs, and when unmounted.
 */
export function LoginCodeScanner(props: LoginCodeScannerProps) {
  // Each attempt is its own instance, so retrying starts the camera afresh.
  const [attempt, setAttempt] = useState(0);
  return <ScannerAttempt key={attempt} {...props} onRetry={() => setAttempt((n) => n + 1)} />;
}

function ScannerAttempt({
  onTypeInstead,
  onRetry,
  messages,
  className,
  ...opts
}: LoginCodeScannerProps & { onRetry: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const m = { ...defaultScannerMessages, ...messages };
  const state = useLoginCodeScanner(video, opts);

  let line = m.scanning;
  if (state === 'idle') line = m.idle;
  else if (state in m.unavailable) line = m.unavailable[state as ScannerUnavailableReason];
  const canRetry = state === 'idle' || state === 'error';

  return (
    <div className={['plx-login-scanner', className].filter(Boolean).join(' ')} data-state={state}>
      <video
        ref={video}
        muted
        playsInline
        aria-label="Camera"
        style={{ width: '100%', borderRadius: 8, background: '#000' }}
      />
      <p role="status">{line}</p>
      {canRetry && (
        <button type="button" onClick={onRetry}>
          {m.retry}
        </button>
      )}
      {onTypeInstead && (
        <button type="button" onClick={onTypeInstead}>
          {m.typeInstead}
        </button>
      )}
    </div>
  );
}
