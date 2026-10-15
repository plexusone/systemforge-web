# @plexusone/chat

Chat components for an AI assistant or support chat, as a floating widget
or embedded in a page.

## Installation

```bash
pnpm add @plexusone/chat
```

## Usage

`ChatProvider` points the components at a chat API. It sends messages to
`{apiBaseUrl}/v1/chat/completions`, the OpenAI-compatible chat completions
route.

### Floating widget

```tsx
import { ChatProvider, ChatWidget } from '@plexusone/chat';

function App() {
  return (
    <ChatProvider config={{ apiBaseUrl: '/api' }}>
      <YourApp />
      <ChatWidget position="bottom-right" title="Support" />
    </ChatProvider>
  );
}
```

### Embedded

```tsx
import { ChatProvider, ChatEmbed } from '@plexusone/chat';

function AssistantPage() {
  return (
    <ChatProvider config={{ apiBaseUrl: '/api' }}>
      <ChatEmbed showHeader title="Assistant" className="h-[600px]" />
    </ChatProvider>
  );
}
```

## API

| Export                                                        | Purpose                             |
| ------------------------------------------------------------- | ----------------------------------- |
| `ChatProvider`, `useChatContext`                              | The chat configuration and state    |
| `ChatWidget`, `ChatEmbed`, `ChatEmbedMinimal`                 | Ready-made chat surfaces            |
| `ChatThread`, `ChatComposer`, `ChatMessage`, `ChatSidebar`    | Building blocks for a custom layout |
| `useAgentChat`, `useConversations`                            | Hooks for a custom implementation   |
| `ChatThemeProvider`, `createTheme`, `lightTheme`, `darkTheme` | Theming                             |
