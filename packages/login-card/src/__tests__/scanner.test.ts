import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startLoginCodeScanner, type FrameDecoder } from '../scanner';
import { fakeCode } from './helpers';

function camera(getUserMedia: () => Promise<unknown>) {
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia: vi.fn(getUserMedia) },
    configurable: true,
  });
}

function videoEl(): HTMLVideoElement {
  const v = document.createElement('video');
  Object.defineProperty(v, 'readyState', { value: 4 });
  v.play = vi.fn(() => Promise.resolve());
  return v;
}

function stream() {
  const track = { stop: vi.fn() };
  return { track, stream: { getTracks: () => [track] } };
}

describe('startLoginCodeScanner', () => {
  const fetchSpy = vi.fn();
  beforeEach(() => vi.stubGlobal('fetch', fetchSpy));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    fetchSpy.mockReset();
  });

  it('reads the first login code, ignores other codes, and stops the camera', async () => {
    const s = stream();
    camera(() => Promise.resolve(s.stream));
    const code = fakeCode();
    const frames = [['https://example.com/'], [], ['not-a-code', code]];
    const decoder: FrameDecoder = async () => frames.shift() ?? [];
    const onCode = vi.fn();
    await startLoginCodeScanner(videoEl(), { onCode, decoder, intervalMs: 1 });
    await vi.waitFor(() => expect(onCode).toHaveBeenCalledTimes(1));
    expect(onCode).toHaveBeenCalledWith(code);
    expect(s.track.stop).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('asks for the rear camera, without audio', async () => {
    camera(() => Promise.resolve(stream().stream));
    const h = await startLoginCodeScanner(videoEl(), { onCode: vi.fn(), decoder: async () => [] });
    h.stop();
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    });
  });

  it.each([
    [{ name: 'NotAllowedError' }, 'denied'],
    [{ name: 'NotFoundError' }, 'no-camera'],
    [{ name: 'NotReadableError' }, 'error'],
  ])('reports %o as %s', async (err, reason) => {
    camera(() => Promise.reject(Object.assign(new Error('x'), err)));
    const onUnavailable = vi.fn();
    await startLoginCodeScanner(videoEl(), { onCode: vi.fn(), onUnavailable });
    expect(onUnavailable).toHaveBeenCalledWith(reason);
  });

  it('needs a secure page', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    const onUnavailable = vi.fn();
    await startLoginCodeScanner(videoEl(), { onCode: vi.fn(), onUnavailable });
    expect(onUnavailable).toHaveBeenCalledWith('insecure-context');
  });

  it('turns the camera off when idle', async () => {
    vi.useFakeTimers();
    const s = stream();
    camera(() => Promise.resolve(s.stream));
    const onIdle = vi.fn();
    await startLoginCodeScanner(videoEl(), {
      onCode: vi.fn(),
      onIdle,
      idleMs: 1000,
      decoder: async () => [],
    });
    await vi.advanceTimersByTimeAsync(1001);
    expect(onIdle).toHaveBeenCalled();
    expect(s.track.stop).toHaveBeenCalled();
  });

  it('stops when asked', async () => {
    const s = stream();
    camera(() => Promise.resolve(s.stream));
    const onCode = vi.fn();
    const h = await startLoginCodeScanner(videoEl(), {
      onCode,
      decoder: async () => [fakeCode()],
      intervalMs: 1000,
    });
    h.stop();
    h.stop();
    expect(s.track.stop).toHaveBeenCalledTimes(1);
  });
});
