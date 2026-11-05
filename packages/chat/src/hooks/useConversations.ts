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
  // The outcome of the latest load and the API base it was for. Until a load
  // for the current base settles, the list is loading and shows no error.
  const given = Boolean(options.initialConversations?.length);
  const [outcome, setOutcome] = React.useState<{ base?: string; error: Error | null }>({
    base: given ? config.apiBaseUrl : undefined,
    error: null,
  });
  const [refreshing, setRefreshing] = React.useState(0);
  const isCurrent = outcome.base === config.apiBaseUrl;
  const isLoading = refreshing > 0 || !isCurrent;
  const error = isCurrent ? outcome.error : null;

  // Each load takes a number, and only the latest may write its result, so a
  // slow load for an earlier base or an earlier refresh cannot overwrite it.
  const latest = React.useRef(0);

  // Fetches the list; callers decide what to do with it.
  const fetchConversations = React.useCallback(async (): Promise<Conversation[]> => {
    const response = await fetch(`${config.apiBaseUrl}/v1/conversations`, {
      headers: config.headers,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    const data = await response.json();
    return data.conversations.map((c: any) => ({
      id: c.id,
      title: c.title,
      messages: c.messages ?? [],
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
    }));
  }, [config.apiBaseUrl, config.headers]);

  const load = React.useCallback(
    (base: string) => {
      const id = ++latest.current;
      return fetchConversations().then(
        (list) => {
          if (id !== latest.current) return;
          setConversations(list);
          setOutcome({ base, error: null });
        },
        (err: unknown) => {
          if (id !== latest.current) return;
          setOutcome({ base, error: err instanceof Error ? err : new Error('Unknown error') });
        }
      );
    },
    [fetchConversations]
  );

  const refresh = React.useCallback(async () => {
    setRefreshing((n) => n + 1);
    setOutcome((o) => ({ ...o, error: null }));
    try {
      await load(config.apiBaseUrl);
    } finally {
      setRefreshing((n) => n - 1);
    }
  }, [load, config.apiBaseUrl]);

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
      const response = await fetch(
        `${config.apiBaseUrl}/v1/conversations/${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: config.headers,
          credentials: 'include',
        }
      );

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

  // Load on mount, unless conversations were given, and again for each new
  // API base.
  const skipFirst = React.useRef(given);
  React.useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return undefined;
    }
    void load(config.apiBaseUrl);
    return () => {
      // Results that arrive after the base changes or the list unmounts are
      // not applied.
      latest.current += 1;
    };
    // Load once per API base: headers may be a new object on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiBaseUrl]);

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
