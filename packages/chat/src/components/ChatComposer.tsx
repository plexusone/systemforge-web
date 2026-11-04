'use client';

import { Composer } from '@assistant-ui/react';
import { cn } from '../utils';

export interface ChatComposerProps {
  /** Additional class names */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the composer is disabled */
  disabled?: boolean;
  /** Focus the input when the composer mounts. Default false. */
  autoFocus?: boolean;
}

export function ChatComposer({
  className,
  placeholder = 'Type a message...',
  disabled = false,
  autoFocus = false,
}: ChatComposerProps) {
  return (
    <Composer.Root
      className={cn(
        'flex items-end gap-2 border-t bg-white p-4',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <Composer.Input
        placeholder={placeholder}
        className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        rows={1}
        autoFocus={autoFocus}
      />
      <Composer.Send className="rounded-full bg-blue-600 p-3 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <SendIcon className="w-5 h-5" />
      </Composer.Send>
    </Composer.Root>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
  );
}
