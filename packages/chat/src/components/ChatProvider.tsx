'use client';

import * as React from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunResult,
} from '@assistant-ui/react';
import type {
  ChatConfig,
  ChatProviderProps,
  Conversation,
  Message,
  ChatEventCallbacks,
} from '../types';

interface ChatContextValue {
  config: ChatConfig;
  currentConversation: Conversation | null;
  setCurrentConversation: (conversation: Conversation | null) => void;
  events: ChatEventCallbacks;
  /** Notify that a user message was sent */
  notifyMessageSent: (content: string) => void;
  /** Notify that an assistant message was received */
  notifyMessageReceived: (content: string) => void;
  /** Notify that an error occurred */
  notifyError: (error: Error) => void;
}

const ChatContext = React.createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

/**
 * Get chat context without throwing (returns null if not in provider)
 */
export function useChatContextOptional() {
  return React.useContext(ChatContext);
}

function createChatAdapter(
  config: ChatConfig,
  callbacks: {
    onStreamStart?: () => void;
    onStreamEnd?: () => void;
    onError?: (error: Error) => void;
  }
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      callbacks.onStreamStart?.();

      try {
        const response = await fetch(`${config.apiBaseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          credentials: 'include',
          body: JSON.stringify({
            model: config.modelId ?? 'default',
            messages: messages.map((m) => ({
              role: m.role,
              content:
                m.content
                  ?.filter((c) => c.type === 'text')
                  .map((c) => c.text)
                  .join('') ?? '',
            })),
            stream: config.streaming !== false,
          }),
          signal: abortSignal,
        });

        if (!response.ok) {
          const error = new Error(`API error: ${response.status}`);
          callbacks.onError?.(error);
          throw error;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          const error = new Error('No response body');
          callbacks.onError?.(error);
          throw error;
        }

        const decoder = new TextDecoder();
        let content = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  callbacks.onStreamEnd?.();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) {
                    content += delta;
                    yield {
                      content: [{ type: 'text' as const, text: content }],
                    } satisfies ChatModelRunResult;
                  }
                } catch {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        callbacks.onStreamEnd?.();
      } catch (error) {
        callbacks.onStreamEnd?.();
        if (error instanceof Error) {
          callbacks.onError?.(error);
        }
        throw error;
      }
    },
  };
}

/**
 * ChatProvider - Provides chat functionality and configuration to child components.
 *
 * @example
 * ```tsx
 * <ChatProvider
 *   config={{
 *     apiBaseUrl: 'https://api.example.com',
 *     modelId: 'gpt-4',
 *   }}
 *   events={{
 *     onMessageSent: (msg) => analytics.track('message_sent'),
 *     onError: (err) => errorReporter.report(err),
 *   }}
 * >
 *   <ChatWidget />
 * </ChatProvider>
 * ```
 */
export function ChatProvider({
  config,
  initialConversation,
  events = {},
  children,
}: ChatProviderProps) {
  const [currentConversation, setCurrentConversationState] = React.useState<Conversation | null>(
    initialConversation ?? null
  );

  // Wrap setCurrentConversation to trigger callback
  const setCurrentConversation = React.useCallback(
    (conversation: Conversation | null) => {
      setCurrentConversationState(conversation);
      events.onConversationChange?.(conversation);
    },
    [events]
  );

  // Create message ID counter
  const messageIdRef = React.useRef(0);

  const notifyMessageSent = React.useCallback(
    (content: string) => {
      const message: Message = {
        id: `user-${++messageIdRef.current}`,
        role: 'user',
        content,
        createdAt: new Date(),
      };
      events.onMessageSent?.(message);
    },
    [events]
  );

  const notifyMessageReceived = React.useCallback(
    (content: string) => {
      const message: Message = {
        id: `assistant-${++messageIdRef.current}`,
        role: 'assistant',
        content,
        createdAt: new Date(),
      };
      events.onMessageReceived?.(message);
    },
    [events]
  );

  const notifyError = React.useCallback(
    (error: Error) => {
      events.onError?.(error);
    },
    [events]
  );

  const adapter = React.useMemo(
    () =>
      createChatAdapter(config, {
        onStreamStart: events.onStreamStart,
        onStreamEnd: events.onStreamEnd,
        onError: events.onError,
      }),
    [config, events.onStreamStart, events.onStreamEnd, events.onError]
  );

  const runtime = useLocalRuntime(adapter);

  const contextValue = React.useMemo(
    () => ({
      config,
      currentConversation,
      setCurrentConversation,
      events,
      notifyMessageSent,
      notifyMessageReceived,
      notifyError,
    }),
    [
      config,
      currentConversation,
      setCurrentConversation,
      events,
      notifyMessageSent,
      notifyMessageReceived,
      notifyError,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
    </ChatContext.Provider>
  );
}
