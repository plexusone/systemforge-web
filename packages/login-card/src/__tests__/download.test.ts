import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadCard } from '../download';
import { fakeCode } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('downloadCard', () => {
  it('saves the SVG in the browser, sending nothing', async () => {
    const blobs: Blob[] = [];
    URL.createObjectURL = vi.fn((b: Blob | MediaSource) => {
      blobs.push(b as Blob);
      return 'blob:card';
    });
    URL.revokeObjectURL = vi.fn();
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    let saved = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      saved = this.download;
    });

    await downloadCard(
      { code: fakeCode(), name: 'Robin' },
      { format: 'svg', filename: 'robin-card' }
    );

    expect(saved).toBe('robin-card.svg');
    expect(blobs[0]?.type).toBe('image/svg+xml');
    expect(await blobs[0]?.text()).toContain('Login card for Robin');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
