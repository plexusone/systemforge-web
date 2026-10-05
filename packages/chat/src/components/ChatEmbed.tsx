'use client';

import * as React from 'react';
import { ChatThread } from './ChatThread';
import { ChatComposer } from './ChatComposer';
import { cn } from '../utils';

export interface ChatEmbedProps {
  /** Additional class name for the container */
  className?: string;
  /** Custom welcome message */
  welcomeMessage?: string;
  /** Whether to show a header */
  showHeader?: boolean;
  /** Header title */
  title?: string;
  /** Header subtitle */
  subtitle?: string;
  /** Whether to show the border */
  bordered?: boolean;
  /** Border radius style */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Minimum height */
  minHeight?: string | number;
  /** Maximum height */
  maxHeight?: string | number;
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

/**
 * ChatEmbed - An inline chat component for embedding in page layouts.
 *
 * @example
 * ```tsx
 * // Full-page chat
 * <ChatProvider config={{ apiBaseUrl: '/api' }}>
 *   <ChatEmbed className="h-screen" />
 * </ChatProvider>
 *
 * // Side panel chat
 * <div className="grid grid-cols-2 h-screen">
 *   <DocumentViewer />
 *   <ChatProvider config={{ apiBaseUrl: '/api' }}>
 *     <ChatEmbed
 *       showHeader
 *       title="AI Assistant"
 *       subtitle="Ask questions about this document"
 *       bordered
 *       rounded="lg"
 *     />
 *   </ChatProvider>
 * </div>
 * ```
 */
export function ChatEmbed({
  className,
  welcomeMessage,
  showHeader = false,
  title = 'Chat',
  subtitle,
  bordered = false,
  rounded = 'none',
  minHeight,
  maxHeight,
}: ChatEmbedProps) {
  const style: React.CSSProperties = {};
  if (minHeight) style.minHeight = typeof minHeight === 'number' ? `${minHeight}px` : minHeight;
  if (maxHeight) style.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;

  return (
    <div
      className={cn(
        'flex flex-col bg-white overflow-hidden',
        bordered && 'border border-gray-200',
        roundedClasses[rounded],
        className
      )}
      style={style}
    >
      {/* Optional Header */}
      {showHeader && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Chat Thread */}
      <div className="flex-1 overflow-hidden min-h-0">
        <ChatThread className="h-full" welcomeMessage={welcomeMessage} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 border-t border-gray-200">
        <ChatComposer />
      </div>
    </div>
  );
}

/**
 * ChatEmbedMinimal - A minimal version without header, ideal for tight spaces.
 */
export function ChatEmbedMinimal({
  className,
  welcomeMessage,
}: Pick<ChatEmbedProps, 'className' | 'welcomeMessage'>) {
  return (
    <ChatEmbed
      className={className}
      welcomeMessage={welcomeMessage}
      showHeader={false}
      bordered={false}
      rounded="none"
    />
  );
}
