/**
 * readSSEData yields the data of each server-sent event in `body`, following
 * the event stream format: lines end in LF, CR or CRLF; "data:" lines, with
 * or without a space after the colon, are joined with newlines; a blank line
 * ends an event; comments and other fields are skipped. A line split across
 * network chunks is reassembled before it is read.
 */
export async function* readSSEData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];

  function* lines(final: boolean): Generator<string> {
    for (;;) {
      const m = /\r\n|\r|\n/.exec(buffer);
      // A lone CR at the end of a chunk may be the first half of CRLF.
      if (!m || (!final && m[0] === '\r' && m.index === buffer.length - 1)) break;
      const line = buffer.slice(0, m.index);
      buffer = buffer.slice(m.index + m[0].length);
      yield line;
    }
    if (final && buffer !== '') {
      const line = buffer;
      buffer = '';
      yield line;
    }
  }

  function take(line: string): string | undefined {
    if (line === '') {
      if (data.length === 0) return undefined;
      const event = data.join('\n');
      data = [];
      return event;
    }
    if (line.startsWith(':')) return undefined;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    if (field !== 'data') return undefined;
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);
    data.push(value);
    return undefined;
  }

  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      for (const line of lines(done)) {
        const event = take(line);
        if (event !== undefined) yield event;
      }
      if (done) break;
    }
    // A stream that ends without a final blank line still ends its event.
    const last = take('');
    if (last !== undefined) yield last;
  } finally {
    reader.releaseLock();
  }
}
