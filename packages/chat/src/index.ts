/**
 * @plexusone/chat
 *
 * Embeddable chat components for SystemForge applications.
 *
 * @example
 * ```tsx
 * // Floating widget (like Intercom)
 * import { ChatProvider, ChatWidget } from '@plexusone/chat';
 *
 * function App() {
 *   return (
 *     <ChatProvider config={{ apiBaseUrl: '/api' }}>
 *       <YourApp />
 *       <ChatWidget position="bottom-right" title="Support" />
 *     </ChatProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Inline embed
 * import { ChatProvider, ChatEmbed } from '@plexusone/chat';
 *
 * function SupportPage() {
 *   return (
 *     <ChatProvider config={{ apiBaseUrl: '/api' }}>
 *       <ChatEmbed
 *         showHeader
 *         title="AI Assistant"
 *         className="h-[600px]"
 *       />
 *     </ChatProvider>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main embeddable components
export { ChatWidget, type ChatWidgetProps, type WidgetPosition } from './components/ChatWidget';
export { ChatEmbed, ChatEmbedMinimal, type ChatEmbedProps } from './components/ChatEmbed';

// Provider
export { ChatProvider, useChatContext, useChatContextOptional } from './components/ChatProvider';

// Theme
export {
  ChatThemeProvider,
  useChatTheme,
  createTheme,
  lightTheme,
  darkTheme,
  type ChatTheme,
  type ChatThemeProviderProps,
} from './components/ChatThemeProvider';

// Building blocks (for custom implementations)
export { ChatThread, type ChatThreadProps } from './components/ChatThread';
export { ChatComposer, type ChatComposerProps } from './components/ChatComposer';
export { ChatMessage } from './components/ChatMessage';
export { ChatSidebar } from './components/ChatSidebar';

// Hooks
export {
  useAgentChat,
  type UseAgentChatOptions,
  type UseAgentChatReturn,
} from './hooks/useAgentChat';
export { useConversations } from './hooks/useConversations';

// Types
export type {
  ChatConfig,
  Message,
  Conversation,
  ChatProviderProps,
  ChatEventCallbacks,
  SendMessageOptions,
} from './types';

// Utils
export { cn } from './utils';
