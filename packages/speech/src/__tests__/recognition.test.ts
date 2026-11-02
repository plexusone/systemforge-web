import { describe, expect, it } from 'vitest';
import { isRecognitionSupported, listen } from '../index';
import type { ListenResult } from '../index';
import { FakeRecognition } from './fakes';

function setup(options: Parameters<typeof listen>[0] = {}) {
  const rec = new FakeRecognition();
  const results: ListenResult[] = [];
  const l = listen({ ...options, recognition: () => rec, onResult: (r) => results.push(r) });
  return { rec, results, l };
}

describe('listen', () => {
  it('configures the recognizer and starts it', () => {
    const { rec, l } = setup({ lang: 'fr-FR' });
    expect(rec.lang).toBe('fr-FR');
    expect(rec.continuous).toBe(true);
    expect(rec.interimResults).toBe(true);
    expect(rec.starts).toBe(1);
    expect(l.listening).toBe(true);
  });

  it('reports final and interim text', () => {
    const { rec, results } = setup();
    rec.say('hello', false);
    rec.say('hello world', true);
    rec.say('how', false);
    expect(results.at(-1)).toEqual({
      text: 'hello world how',
      final: 'hello world',
      interim: 'how',
    });
  });

  it('restarts when the browser ends a session, keeping the text', async () => {
    const { rec, results, l } = setup();
    rec.say('one', true);
    rec.endSession();
    expect(rec.starts).toBe(2);
    rec.say('two', true);
    expect(results.at(-1)?.final).toBe('one two');
    l.stop();
    await expect(l.done).resolves.toBe('one two');
  });

  it('ends after several silences in a row', async () => {
    const { rec, l } = setup({ maxSilences: 2 });
    rec.error('no-speech');
    rec.endSession();
    expect(rec.starts).toBe(2);
    rec.error('no-speech');
    rec.endSession();
    expect(rec.starts).toBe(2);
    await expect(l.done).resolves.toBe('');
    expect(l.listening).toBe(false);
  });

  it('rejects on a fatal error', async () => {
    const { rec, l } = setup();
    rec.error('not-allowed');
    await expect(l.done).rejects.toMatchObject({ code: 'not-allowed' });
    expect(l.listening).toBe(false);
  });

  it('abort drops the interim text', async () => {
    const { rec, l } = setup();
    rec.say('kept', true);
    rec.say('dropped', false);
    l.abort();
    await expect(l.done).resolves.toBe('kept');
  });

  it('ends after one session when not continuous', async () => {
    const { rec, l } = setup({ continuous: false });
    rec.say('once', true);
    rec.endSession();
    expect(rec.starts).toBe(1);
    await expect(l.done).resolves.toBe('once');
  });

  it('rejects as unsupported without speech recognition', async () => {
    const l = listen();
    await expect(l.done).rejects.toMatchObject({ code: 'unsupported' });
    expect(isRecognitionSupported()).toBe(false);
  });
});
