'use client';

import { cn } from '../utils';
import type { Conversation } from '../types';

export interface ChatSidebarProps {
  /** List of conversations */
  conversations: Conversation[];
  /** Currently selected conversation ID */
  selectedId?: string;
  /** Callback when a conversation is selected */
  onSelect?: (conversation: Conversation) => void;
  /** Callback when new chat is clicked */
  onNewChat?: () => void;
  /** Additional class names */
  className?: string;
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  className,
}: ChatSidebarProps) {
  return (
    <div className={cn('flex flex-col h-full bg-gray-50 border-r border-gray-200', className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No conversations yet</div>
        ) : (
          <ul className="py-2">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  onClick={() => onSelect?.(conversation)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors',
                    selectedId === conversation.id && 'bg-gray-200'
                  )}
                >
                  <div className="font-medium text-gray-900 truncate">
                    {conversation.title || 'New Conversation'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {formatDate(conversation.updatedAt)}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}
