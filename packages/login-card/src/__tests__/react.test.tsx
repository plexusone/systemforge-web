import { act, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { CardSheet, LoginCard } from '../react';
import { LoginCodeScanner, useLoginCodeScanner } from '../scanner-react';
import { fakeCode } from './helpers';

describe('LoginCard and CardSheet', () => {
  it('render each card in the chosen layout', () => {
    const { container } = render(
      <CardSheet
        layout="wallet"
        cards={[
          { code: fakeCode(), name: 'Robin' },
          { code: fakeCode(), name: 'Sam' },
        ]}
      />
    );
    expect(container.querySelector('.plx-card-sheet')?.getAttribute('data-layout')).toBe('wallet');
    expect(container.querySelectorAll('.plx-login-card img')).toHaveLength(2);
    expect(screen.getByAltText('Login card for Sam')).toBeTruthy();
  });

  it('throws for a value that is not a code', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<LoginCard card={{ code: 'https://example.com', name: 'X' }} />)).toThrow();
  });
});

describe('LoginCodeScanner', () => {
  it('says the camera is not allowed and offers typing', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: () =>
          Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })),
      },
      configurable: true,
    });
    const onTypeInstead = vi.fn();
    render(<LoginCodeScanner onCode={vi.fn()} onTypeInstead={onTypeInstead} />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/not allowed/));
    screen.getByText('Type my code instead').click();
    expect(onTypeInstead).toHaveBeenCalled();
    // Once the camera is allowed, the person can try again.
    expect(screen.getByText('Try again')).toBeDefined();
  });
});

function Probe({ active }: { active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const state = useLoginCodeScanner(video, {
    active,
    onCode: vi.fn(),
    idleMs: 20,
    decoder: async () => [],
  });
  return (
    <>
      <video ref={video} />
      <p data-testid="state">{state}</p>
    </>
  );
}

describe('useLoginCodeScanner', () => {
  it('starts afresh when turned off and on again', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => Promise.resolve({ getTracks: () => [{ stop: vi.fn() }] }) },
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
      value: 4,
      configurable: true,
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const state = () => screen.getByTestId('state').textContent;

    const { rerender } = render(<Probe active />);
    await waitFor(() => expect(state()).toBe('idle'));
    await act(async () => rerender(<Probe active={false} />));
    expect(state()).toBe('starting');
    await act(async () => rerender(<Probe active />));
    await waitFor(() => expect(state()).toBe('scanning'));
    vi.restoreAllMocks();
  });

  it("keeps the newer run's camera when an earlier run's arrives late", async () => {
    // React mounts twice in development: the first run is cancelled while
    // its camera is starting, and here its camera arrives after the second's.
    const grants: ((s: unknown) => void)[] = [];
    const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
    const streams = tracks.map((t) => ({ getTracks: () => [t] }));
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: () => new Promise((resolve) => grants.push(resolve)) },
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', {
      value: 4,
      configurable: true,
    });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    function Running() {
      const video = useRef<HTMLVideoElement>(null);
      useLoginCodeScanner(video, { onCode: vi.fn(), idleMs: 0, decoder: async () => [] });
      return <video ref={video} data-testid="video" />;
    }
    render(
      <StrictMode>
        <Running />
      </StrictMode>
    );
    await waitFor(() => expect(grants).toHaveLength(2));
    await act(async () => grants[1]!(streams[1]));
    await act(async () => grants[0]!(streams[0]));
    const video = screen.getByTestId('video') as HTMLVideoElement;
    expect(video.srcObject).toBe(streams[1]);
    expect(tracks[0]!.stop).toHaveBeenCalled();
    expect(tracks[1]!.stop).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
