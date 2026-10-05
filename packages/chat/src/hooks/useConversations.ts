'use client';

import * as React from 'react';
import { useChatContext } from '../components/ChatProvider';
import type { Conversation } from '../types';

export interface UseConversationsOptions {
  /** Initial conversations to load */
  initialConversations?: Conversation[];
}

export interface UseConversationsReturn {
  /** List of conversations */
  conversations: Conversation[];
  /** Currently selected conversation */
  currentConversation: Conversation | null;
  /** Whether conversations are loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Create a new conversation */
  createConversation: () => Promise<Conversation>;
  /** Select a conversation */
  selectConversation: (id: string) => void;
  /** Delete a conversation */
  deleteConversation: (id: string) => Promise<void>;
  /** Refresh the conversation list */
  refresh: () => Promise<void>;
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const { config, currentConversation, setCurrentConversation } = useChatContext();
  const [conversations, setConversations] = React.useState<Conversation[]>(
    options.initialConversations ?? []
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${config.apiBaseUrl}/v1/conversations`, {
        headers: config.headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(
        data.conversations.map((c: any) => ({
          id: c.id,
          title: c.title,
          messages: c.messages ?? [],
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [config.apiBaseUrl, config.headers]);

  const createConversation = React.useCallback(async (): Promise<Conversation> => {
    const response = await fetch(`${config.apiBaseUrl}/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const data = await response.json();
    const conversation: Conversation = {
      id: data.id,
      title: data.title,
      messages: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };

    setConversations((prev) => [conversation, ...prev]);
    setCurrentConversation(conversation);

    return conversation;
  }, [config.apiBaseUrl, config.headers, setCurrentConversation]);

  const selectConversation = React.useCallback(
    (id: string) => {
      const conversation = conversations.find((c) => c.id === id);
      if (conversation) {
        setCurrentConversation(conversation);
      }
    },
    [conversations, setCurrentConversation]
  );

  const deleteConversation = React.useCallback(
    async (id: string) => {
      const response = await fetch(`${config.apiBaseUrl}/v1/conversations/${id}`, {
        method: 'DELETE',
        headers: config.headers,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    },
    [config.apiBaseUrl, config.headers, currentConversation, setCurrentConversation]
  );

  // Load conversations on mount
  React.useEffect(() => {
    if (conversations.length === 0) {
      refresh();
    }
  }, []);

  return {
    conversations,
    currentConversation,
    isLoading,
    error,
    createConversation,
    selectConversation,
    deleteConversation,
    refresh,
  };
}
