import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSSEData } from '../sse';
import { createChatAdapter } from '../components/ChatProvider';

function stream(...chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const chunk of chunks) c.enqueue(enc.encode(chunk));
      c.close();
    },
  });
}

async function all(body: ReadableStream<Uint8Array>): Promise<string[]> {
  const out: string[] = [];
  for await (const d of readSSEData(body)) out.push(d);
  return out;
}

describe('readSSEData', () => {
  it('reassembles a line split across chunks', async () => {
    expect(await all(stream('data: {"a":', '1}\n\ndata: x\n\n'))).toEqual(['{"a":1}', 'x']);
  });

  it('accepts data without a space, CRLF and CR line ends, and multi-line data', async () => {
    expect(await all(stream('data:a\r\n\r', '\ndata: b\rdata: c\r\r'))).toEqual(['a', 'b\nc']);
  });

  it('skips comments and other fields, and ends a final event without a blank line', async () => {
    expect(await all(stream(': ping\nevent: x\nid: 1\ndata: y'))).toEqual(['y']);
  });
});

describe('createChatAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const messages = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] }];

  async function run(adapter: ReturnType<typeof createChatAdapter>) {
    const texts: string[] = [];
    const gen = adapter.run({
      messages,
      abortSignal: new AbortController().signal,
    } as unknown as Parameters<typeof adapter.run>[0]) as AsyncGenerator<{
      content: { text: string }[];
    }>;
    for await (const r of gen) texts.push(r.content[0].text);
    return texts;
  }

  it('streams deltas split across chunks and reports the exchange', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            stream(
              'data: {"choices":[{"delta":{"content":"no"}}]}\n\ndata: {"choices":[{"del',
              'ta":{"content":"t"}}]}\n\ndata: [DONE]\n\n'
            )
          )
      )
    );
    const cb = {
      onMessageSent: vi.fn(),
      onMessageReceived: vi.fn(),
      onStreamEnd: vi.fn(),
      onError: vi.fn(),
    };
    expect(await run(createChatAdapter({ apiBaseUrl: 'https://c.example' }, cb))).toEqual([
      'no',
      'not',
    ]);
    expect(cb.onMessageSent).toHaveBeenCalledWith('hi');
    expect(cb.onMessageReceived).toHaveBeenCalledWith('not');
    expect(cb.onStreamEnd).toHaveBeenCalledTimes(1);
    expect(cb.onError).not.toHaveBeenCalled();
  });

  it('surfaces an error event once', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(stream('data: {"error":{"message":"rate limited"}}\n\n')))
    );
    const onError = vi.fn();
    await expect(
      run(createChatAdapter({ apiBaseUrl: 'https://c.example' }, { onError }))
    ).rejects.toThrow('rate limited');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('reports a failed request once', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500 }))
    );
    const onError = vi.fn();
    await expect(
      run(createChatAdapter({ apiBaseUrl: 'https://c.example' }, { onError }))
    ).rejects.toThrow('API error: 500');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('reads a reply that is not streamed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ choices: [{ message: { content: 'whole reply' } }] }))
      )
    );
    expect(
      await run(createChatAdapter({ apiBaseUrl: 'https://c.example', streaming: false }, {}))
    ).toEqual(['whole reply']);
  });
});
