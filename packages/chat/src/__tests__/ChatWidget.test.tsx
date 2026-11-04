import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatEmbed } from '../components/ChatEmbed';
import { ChatProvider } from '../components/ChatProvider';
import { ChatWidget } from '../components/ChatWidget';

const config = { apiBaseUrl: 'https://chat.example.com' };

describe('ChatWidget', () => {
  it('mounts no input while closed, so the page keeps focus', () => {
    render(
      <ChatProvider config={config}>
        <input aria-label="Search" />
        <ChatWidget />
      </ChatProvider>
    );
    expect(screen.queryAllByRole('textbox')).toHaveLength(1);
    expect(document.activeElement).not.toBe(screen.queryByPlaceholderText('Type a message...'));
  });

  it('shows one focused composer when opened', () => {
    render(
      <ChatProvider config={config}>
        <ChatWidget />
      </ChatProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(1);
    expect(document.activeElement).toBe(inputs[0]);
  });
});

describe('ChatEmbed', () => {
  it('renders one composer that does not take focus on its own', () => {
    render(
      <ChatProvider config={config}>
        <ChatEmbed />
      </ChatProvider>
    );
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(1);
    expect(document.activeElement).not.toBe(inputs[0]);
  });
});
