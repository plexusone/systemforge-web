'use client';

import { useChat } from '@ai-sdk/react';
import { useChatContext } from '../components/ChatProvider';
import type { SendMessageOptions } from '../types';

export interface UseAgentChatOptions {
  /** Conversation ID to associate messages with */
  conversationId?: string;
  /** Callback when a message is sent */
  onMessageSent?: (content: string) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseAgentChatReturn {
  /** Current messages in the chat */
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
  /** Whether a response is being generated */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | undefined;
  /** Send a message */
  sendMessage: (content: string, options?: SendMessageOptions) => void;
  /** Stop the current generation */
  stop: () => void;
  /** Clear all messages */
  clear: () => void;
  /** Reload the last message */
  reload: () => void;
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const { config } = useChatContext();
  const { conversationId, onMessageSent, onError } = options;

  const { messages, isLoading, error, append, stop, setMessages, reload } = useChat({
    api: `${config.apiBaseUrl}/v1/chat/completions`,
    headers: {
      ...config.headers,
      ...(conversationId && { 'X-Conversation-ID': conversationId }),
    },
    body: {
      model: config.modelId ?? 'default',
    },
    onError: (err) => {
      onError?.(err);
    },
  });

  const sendMessage = (content: string, _msgOptions?: SendMessageOptions) => {
    append({
      role: 'user',
      content,
    });
    onMessageSent?.(content);
  };

  const clear = () => {
    setMessages([]);
  };

  return {
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    isLoading,
    error,
    sendMessage,
    stop,
    clear,
    reload,
  };
}
