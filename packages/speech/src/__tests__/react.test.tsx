import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useListen, useSpeech, useVoices } from '../react';
import { FakeRecognition, FakeSynthesis, Utterance, voice } from './fakes';

describe('useSpeech', () => {
  it('reports state and the segment being spoken', async () => {
    const synthesis = new FakeSynthesis();
    const { result } = renderHook(() => useSpeech({ synthesis, Utterance }));
    expect(result.current.state).toBe('idle');
    expect(result.current.supported).toBe(true);

    let done!: Promise<unknown>;
    act(() => {
      done = result.current.speak([{ text: 'A.' }, { text: 'B.' }]);
    });
    expect(result.current.state).toBe('speaking');
    expect(result.current.segment).toBe(0);

    act(() => synthesis.end());
    expect(result.current.segment).toBe(1);

    await act(async () => {
      synthesis.end();
      await done;
    });
    expect(result.current.state).toBe('ended');
    expect(result.current.segment).toBe(-1);
  });

  it('tracks the word being spoken with trackWords', async () => {
    const synthesis = new FakeSynthesis();
    const { result } = renderHook(() => useSpeech({ synthesis, Utterance, trackWords: true }));
    let done!: Promise<unknown>;
    act(() => {
      done = result.current.speak([{ text: 'Hello there.' }, { text: 'Bye.' }]);
    });
    expect(result.current.word).toBeUndefined();
    act(() => synthesis.boundary(6, 5));
    expect(result.current.word).toEqual({ segment: 0, start: 6, end: 11 });

    act(() => synthesis.end());
    expect(result.current.segment).toBe(1);
    expect(result.current.word).toBeUndefined();
    act(() => synthesis.boundary(0, 3));
    expect(result.current.word).toEqual({ segment: 1, start: 0, end: 3 });

    await act(async () => {
      synthesis.end();
      await done;
    });
    expect(result.current.word).toBeUndefined();
  });

  it('leaves word unset without trackWords, but still calls onWord', () => {
    const synthesis = new FakeSynthesis();
    const seen: number[] = [];
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useSpeech({ synthesis, Utterance, onWord: (w) => seen.push(w.start) });
    });
    act(() => {
      void result.current.speak('Hello there.');
    });
    const before = renders;
    act(() => synthesis.boundary(6, 5));
    expect(seen).toEqual([6]);
    expect(result.current.word).toBeUndefined();
    expect(renders).toBe(before);
  });

  it('reports an error', async () => {
    const synthesis = new FakeSynthesis();
    const { result } = renderHook(() => useSpeech({ synthesis, Utterance }));
    await act(async () => {
      const p = result.current.speak('A.').catch(() => undefined);
      synthesis.fail('synthesis-failed');
      await p;
    });
    expect(result.current.state).toBe('error');
    expect(result.current.error?.code).toBe('synthesis-failed');
  });

  it('stops speaking on unmount', () => {
    const synthesis = new FakeSynthesis();
    const { result, unmount } = renderHook(() => useSpeech({ synthesis, Utterance }));
    act(() => {
      void result.current.speak('A long sentence.');
    });
    unmount();
    expect(synthesis.calls).toContain('cancel');
  });
});

describe('useVoices', () => {
  it('lists voices for a language once loaded', async () => {
    const synthesis = new FakeSynthesis();
    const { result } = renderHook(() => useVoices('en', { synthesis }));
    expect(result.current).toEqual([]);
    act(() => synthesis.loadVoices([voice('Samantha', 'en-US'), voice('Thomas', 'fr-FR')]));
    await waitFor(() => expect(result.current.map((v) => v.name)).toEqual(['Samantha']));
  });
});

describe('useListen', () => {
  it('reports recognized text and stops', async () => {
    const rec = new FakeRecognition();
    const { result } = renderHook(() => useListen({ recognition: () => rec }));
    let done!: Promise<string>;
    act(() => {
      done = result.current.start();
    });
    expect(result.current.listening).toBe(true);

    act(() => rec.say('hello there', false));
    expect(result.current.text).toBe('hello there');
    expect(result.current.interim).toBe('hello there');

    act(() => rec.say('hello there', true));
    await act(async () => {
      result.current.stop();
      await done;
    });
    expect(result.current.listening).toBe(false);
    expect(result.current.final).toBe('hello there');
  });
});
