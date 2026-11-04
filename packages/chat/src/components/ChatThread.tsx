'use client';

import { Thread } from '@assistant-ui/react';
import { cn } from '../utils';

export interface ChatThreadProps {
  /** Additional class names */
  className?: string;
  /** Custom welcome message */
  welcomeMessage?: string;
  /**
   * Render the thread's own composer. Default true; pass false when a
   * ChatComposer is rendered next to the thread, so there is only one.
   */
  composer?: boolean;
}

const NoComposer = () => null;

export function ChatThread({
  className,
  welcomeMessage = 'How can I help you today?',
  composer = true,
}: ChatThreadProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Thread
        welcome={{
          message: welcomeMessage,
        }}
        components={composer ? undefined : { Composer: NoComposer }}
      />
    </div>
  );
}
