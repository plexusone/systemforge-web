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

## Building blocks

`ChatThread` renders its own composer unless you pass `composer={false}`;
do that when you place a `ChatComposer` beside it, so the page has one input.
`ChatComposer` takes focus only with `autoFocus`. `ChatWidget` mounts its
thread and composer only while it is open, so nothing typed elsewhere on the
page can reach a hidden input.

## The chat endpoint

`ChatProvider` posts the whole conversation to
`{apiBaseUrl}/v1/chat/completions` on each turn, in the OpenAI chat format,
and reads a server-sent event stream (or one JSON reply with
`streaming: false`). An `{"error": …}` object in the stream is shown as an
error.

Everything in that request comes from the browser, so the endpoint must not
trust it:

- Apply the server's own system prompt, and drop `system` messages the client
  sends.
- Treat earlier `assistant` messages as the client's claim, not as what the
  model said; keep history on the server if it matters.
- Allow only the models the deployment offers, whatever `model` says.
- Authorize the session cookie and limit rates per person.
