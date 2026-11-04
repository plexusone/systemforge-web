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
import { readSSEData } from '../sse';

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

// IDs for the messages passed to onMessageSent and onMessageReceived.
let lastMessageId = 0;

interface AdapterCallbacks {
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: Error) => void;
  onMessageSent?: (content: string) => void;
  onMessageReceived?: (content: string) => void;
}

type WireMessage = { role: string; content: string };

function textOf(m: { content?: readonly { type: string; text?: string }[] }): string {
  return (
    m.content
      ?.filter((c) => c.type === 'text')
      .map((c) => c.text ?? '')
      .join('') ?? ''
  );
}

function errorFrom(parsed: unknown): Error | undefined {
  const err = (parsed as { error?: unknown } | null)?.error;
  if (err === undefined || err === null) return undefined;
  const message = typeof err === 'string' ? err : (err as { message?: unknown }).message;
  return new Error(typeof message === 'string' ? message : 'The chat service returned an error');
}

export function createChatAdapter(
  config: ChatConfig,
  callbacks: AdapterCallbacks
): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal }) {
      const cb = () => callbacks;
      const wire: WireMessage[] = messages.map((m) => ({ role: m.role, content: textOf(m) }));
      const streaming = config.streaming !== false;
      let content = '';

      cb().onStreamStart?.();
      const sent = [...wire].reverse().find((m) => m.role === 'user');
      if (sent) cb().onMessageSent?.(sent.content);

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
            messages: wire,
            stream: streaming,
          }),
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        if (!streaming) {
          const parsed = (await response.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const err = errorFrom(parsed);
          if (err) throw err;
          content = parsed.choices?.[0]?.message?.content ?? '';
          yield {
            content: [{ type: 'text' as const, text: content }],
          } satisfies ChatModelRunResult;
        } else {
          if (!response.body) {
            throw new Error('No response body');
          }
          for await (const data of readSSEData(response.body)) {
            if (data === '[DONE]') break;
            let parsed: unknown;
            try {
              parsed = JSON.parse(data);
            } catch {
              throw new Error('The chat service sent a malformed event');
            }
            const err = errorFrom(parsed);
            if (err) throw err;
            const delta = (parsed as { choices?: { delta?: { content?: string } }[] }).choices?.[0]
              ?.delta?.content;
            if (delta) {
              content += delta;
              yield {
                content: [{ type: 'text' as const, text: content }],
              } satisfies ChatModelRunResult;
            }
          }
        }

        cb().onMessageReceived?.(content);
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          cb().onError?.(error);
        }
        throw error;
      } finally {
        cb().onStreamEnd?.();
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

  const notifyMessageSent = React.useCallback(
    (content: string) => {
      const message: Message = {
        id: `user-${++lastMessageId}`,
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
        id: `assistant-${++lastMessageId}`,
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

  const { onStreamStart, onStreamEnd } = events;
  const adapter = React.useMemo(
    () =>
      createChatAdapter(config, {
        onStreamStart,
        onStreamEnd,
        onError: notifyError,
        onMessageSent: notifyMessageSent,
        onMessageReceived: notifyMessageReceived,
      }),
    [config, onStreamStart, onStreamEnd, notifyError, notifyMessageSent, notifyMessageReceived]
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
