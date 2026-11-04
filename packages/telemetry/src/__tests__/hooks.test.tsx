import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { TelemetryProvider } from '../TelemetryProvider';
import { useClickTracker, useStateTracker } from '../hooks/productgraph';
import type { TelemetryAdapter, TelemetryEvent } from '../types';

function setup() {
  const events: TelemetryEvent[] = [];
  const adapter: TelemetryAdapter = { name: 'rec', track: (e) => events.push(e) };
  return { events, config: { adapters: [adapter] } };
}

function Row() {
  const track = useClickTracker();
  return (
    <>
      <button onClick={(e) => track(e)}>Ada Lovelace, ada@example.com</button>
      <button data-track="open-row" onClick={(e) => track(e)}>
        Grace Hopper
      </button>
    </>
  );
}

function Form() {
  const [password, setPassword] = useState('');
  useStateTracker('login', { password }, { serialize: (v) => ({ filled: v.password !== '' }) });
  return (
    <input aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
  );
}

describe('useClickTracker', () => {
  it('names the element by a label the page chose, never by its text', () => {
    const { events, config } = setup();
    render(
      <TelemetryProvider config={config}>
        <Row />
      </TelemetryProvider>
    );
    fireEvent.click(screen.getByText('Ada Lovelace, ada@example.com'));
    fireEvent.click(screen.getByText('Grace Hopper'));
    const texts = events.map((e) => e.properties?.element_text);
    expect(texts).toEqual([undefined, 'open-row']);
  });
});

describe('useStateTracker', () => {
  it('sends what serialize returns instead of the value', () => {
    const { events, config } = setup();
    render(
      <TelemetryProvider config={config}>
        <Form />
      </TelemetryProvider>
    );
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'hunter2' } });
    const change = events.find((e) => e.name === 'state_change');
    expect(change?.properties).toMatchObject({
      state_before: { filled: false },
      state_after: { filled: true },
    });
    expect(JSON.stringify(events)).not.toContain('hunter2');
  });
});
