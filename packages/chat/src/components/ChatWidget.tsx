'use client';

import * as React from 'react';
import { ChatThread } from './ChatThread';
import { ChatComposer } from './ChatComposer';
import { cn } from '../utils';

export type WidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export interface ChatWidgetProps {
  /** Position of the widget on the screen */
  position?: WidgetPosition;
  /** Whether the widget is initially open */
  defaultOpen?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Custom welcome message */
  welcomeMessage?: string;
  /** Widget title shown in header */
  title?: string;
  /** Subtitle shown in header */
  subtitle?: string;
  /** Custom trigger button content */
  triggerContent?: React.ReactNode;
  /** Additional class name for the widget container */
  className?: string;
  /** Z-index for the widget */
  zIndex?: number;
}

const positionClasses: Record<WidgetPosition, string> = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
};

const panelPositionClasses: Record<WidgetPosition, string> = {
  'bottom-right': 'bottom-16 right-0 origin-bottom-right',
  'bottom-left': 'bottom-16 left-0 origin-bottom-left',
  'top-right': 'top-16 right-0 origin-top-right',
  'top-left': 'top-16 left-0 origin-top-left',
};

/**
 * ChatWidget - A floating chat widget that can be embedded in any page.
 *
 * @example
 * ```tsx
 * <ChatProvider config={{ apiBaseUrl: '/api' }}>
 *   <ChatWidget
 *     position="bottom-right"
 *     title="Support"
 *     subtitle="We typically reply within minutes"
 *   />
 * </ChatProvider>
 * ```
 */
export function ChatWidget({
  position = 'bottom-right',
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  welcomeMessage,
  title = 'Chat',
  subtitle,
  triggerContent,
  className,
  zIndex = 9999,
}: ChatWidgetProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const newOpen = !isOpen;
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleClose = () => {
    setInternalOpen(false);
    onOpenChange?.(false);
  };

  return (
    <div className={cn('fixed', positionClasses[position], className)} style={{ zIndex }}>
      {/* Chat Panel */}
      <div
        className={cn(
          'absolute w-[380px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden',
          'flex flex-col',
          'transition-all duration-300 ease-out',
          panelPositionClasses[position],
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            {subtitle && <p className="text-sm text-blue-100">{subtitle}</p>}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatThread className="h-full" welcomeMessage={welcomeMessage} />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-200">
          <ChatComposer />
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg flex items-center justify-center',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'transition-all duration-300 ease-out',
          'hover:scale-105 active:scale-95',
          isOpen && 'rotate-0'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {triggerContent || (
          <span
            className={cn('transition-transform duration-300', isOpen ? 'rotate-90' : 'rotate-0')}
          >
            {isOpen ? <XIcon className="w-6 h-6" /> : <ChatIcon className="w-6 h-6" />}
          </span>
        )}
      </button>
    </div>
  );
}

// Simple icon components to avoid external dependencies
function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
