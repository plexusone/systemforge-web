/**
 * The camera scanner, without a framework: point it at a video element and
 * it calls onCode with the first login code it reads. Frames are decoded on
 * the device and never sent anywhere.
 */
import { isLoginCode, type LoginCodePredicate } from './code';

export { isLoginCode, type LoginCodePredicate } from './code';

/** Why the scanner cannot run. */
export type ScannerUnavailableReason =
  /** Not https or localhost: browsers offer no camera there. */
  | 'insecure-context'
  /** The browser or device has no camera, or no camera API. */
  | 'no-camera'
  /** The person or a policy refused the camera. */
  | 'denied'
  /** The camera is in use elsewhere or failed to start, or no decoder loaded. */
  | 'error';

/** Reads the QR codes in the video's current frame. */
export type FrameDecoder = (video: HTMLVideoElement) => Promise<string[]>;

/** Options for {@link startLoginCodeScanner}. */
export interface ScannerOptions {
  /** Called once, with the first login code read; the camera has stopped. */
  onCode: (code: string) => void;
  /** Called when the camera cannot start, or no QR decoder can be loaded. */
  onUnavailable?: (reason: ScannerUnavailableReason) => void;
  /** Called when the camera stopped after idleMs without a code. */
  onIdle?: () => void;
  /** Accepts only login codes; other QR codes are ignored. Default {@link isLoginCode}. */
  isLoginCode?: LoginCodePredicate;
  /** Stops the camera after this long without a code; default 60 s, 0 never. */
  idleMs?: number;
  /** Time between decoding attempts; default 150 ms. */
  intervalMs?: number;
  /** Which camera to prefer; default the rear camera, where there is one. */
  facingMode?: 'environment' | 'user';
  /** The decoder; default BarcodeDetector, or a JavaScript decoder loaded when scanning starts. */
  decoder?: FrameDecoder;
  /**
   * Stops the scanner when aborted, even while the camera is still
   * starting: a camera granted after that is turned off and never shown,
   * so it cannot replace a newer scanner's on the same video.
   */
  signal?: AbortSignal;
}

/** A running scanner. */
export interface ScannerHandle {
  /** Stops the camera; it is safe to call more than once. */
  stop(): void;
}

/** Reports whether this page could use a camera at all. */
export function cameraSupported(): ScannerUnavailableReason | null {
  if (typeof window === 'undefined' || !window.isSecureContext) return 'insecure-context';
  if (!navigator.mediaDevices?.getUserMedia) return 'no-camera';
  return null;
}

/**
 * Starts the camera in video and reads QR codes until it finds a login code,
 * idleMs passes, or stop is called. Values that are not login codes, such
 * as a web address, are ignored without any request.
 */
export async function startLoginCodeScanner(
  video: HTMLVideoElement,
  opts: ScannerOptions
): Promise<ScannerHandle> {
  let stopped = false;
  let stream: MediaStream | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    clearTimeout(idle);
    stream?.getTracks().forEach((t) => t.stop());
    // A newer scanner may have attached its own stream to the same video.
    if (stream && video.srcObject === stream) video.srcObject = null;
  };
  const handle: ScannerHandle = { stop };
  if (opts.signal?.aborted) {
    stopped = true;
    return handle;
  }
  opts.signal?.addEventListener('abort', stop, { once: true });

  const unsupported = cameraSupported();
  if (unsupported) {
    stopped = true;
    opts.onUnavailable?.(unsupported);
    return handle;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: opts.facingMode ?? 'environment' } },
    });
  } catch (err) {
    if (stopped) return handle;
    stopped = true;
    opts.onUnavailable?.(reasonOf(err));
    return handle;
  }
  if (stopped) {
    // Stopped while the camera was starting: turn it off without showing it.
    stream.getTracks().forEach((t) => t.stop());
    return handle;
  }
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.srcObject = stream;
  try {
    await video.play();
  } catch {
    if (stopped) return handle;
    stop();
    opts.onUnavailable?.('error');
    return handle;
  }
  if (stopped) return handle;

  const accept = opts.isLoginCode ?? isLoginCode;
  const idleMs = opts.idleMs ?? 60_000;
  if (idleMs > 0) {
    idle = setTimeout(() => {
      stop();
      opts.onIdle?.();
    }, idleMs);
  }
  let decode = opts.decoder;
  const tick = async () => {
    if (stopped) return;
    if (!decode) {
      try {
        decode = await defaultDecoder();
      } catch {
        // No decoder can be loaded, so no frame could ever be read.
        stop();
        opts.onUnavailable?.('error');
        return;
      }
      if (stopped) return;
    }
    let code: string | undefined;
    if (video.readyState >= 2) {
      try {
        code = (await decode(video)).map((v) => v.trim()).find(accept);
      } catch {
        // A frame that cannot be decoded is skipped; the next one is tried.
      }
    }
    if (stopped) return;
    if (code) {
      stop();
      opts.onCode(code);
      return;
    }
    timer = setTimeout(tick, opts.intervalMs ?? 150);
  };
  void tick();
  return handle;
}

function reasonOf(err: unknown): ScannerUnavailableReason {
  const name =
    err instanceof Error || (typeof err === 'object' && err !== null)
      ? (err as { name?: string }).name
      : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera';
    default:
      return 'error';
  }
}

interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorClass {
  new (opts: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats(): Promise<string[]>;
}

/**
 * BarcodeDetector where the browser has it with QR support; otherwise jsQR,
 * loaded only now, reading a downscaled copy of the frame on a canvas that
 * never leaves the page.
 */
export async function defaultDecoder(): Promise<FrameDecoder> {
  const BD = (globalThis as { BarcodeDetector?: BarcodeDetectorClass }).BarcodeDetector;
  if (BD) {
    try {
      if ((await BD.getSupportedFormats()).includes('qr_code')) {
        const detector = new BD({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video)).map((b) => b.rawValue);
      }
    } catch {
      // Fall through to jsQR.
    }
  }
  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('login-card: no 2D canvas for decoding');
  return async (video) => {
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight, 1));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    if (!canvas.width || !canvas.height) return [];
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const found = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'dontInvert' });
    return found ? [found.data] : [];
  };
}
