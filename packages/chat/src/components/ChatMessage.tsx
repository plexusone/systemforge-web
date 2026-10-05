'use client';

import { cn } from '../utils';
import type { Message } from '../types';

export interface ChatMessageProps {
  /** The message to display */
  message: Message;
  /** Additional class names */
  className?: string;
  /** Whether this is the current user's message */
  isOwnMessage?: boolean;
}

export function ChatMessage({ message, className, isOwnMessage }: ChatMessageProps) {
  const isUser = message.role === 'user' || isOwnMessage;

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser && 'justify-end', className)}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-gray-600">AI</span>
        </div>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2',
          isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div className={cn('text-xs mt-1', isUser ? 'text-blue-200' : 'text-gray-400')}>
          {formatTime(message.createdAt)}
        </div>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-white">You</span>
        </div>
      )}
    </div>
  );
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
