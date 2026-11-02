# @plexusone/speech

Text-to-speech and speech-to-text with the browser's own speech (the Web
Speech API). Nothing to run and no key to manage: useful for previews,
read-aloud and voice input. The browser decides where speech is processed:
some voices and Chrome's speech recognition use an online service (see
[Listening](#listening)).

The main entry point has no dependencies and works without React. React
hooks are in `@plexusone/speech/react`. A standalone build,
`@plexusone/speech/browser`, is one file for pages without a build step.

## Installation

```bash
pnpm add @plexusone/speech
```

React is needed only for `@plexusone/speech/react`.

## Speaking

`speak` takes text, or segments with a pause after each, and returns the
speech in progress:

```ts
import { speak } from '@plexusone/speech';

const speech = speak(
  [{ text: 'Welcome to the course.', pauseMs: 600 }, { text: 'Let us start with the funnel.' }],
  { lang: 'en-US', rate: 1.1, onSegment: (i) => highlight(i) }
);

await speech.done; // { status: 'ended' } or { status: 'stopped' }
```

| Option                    | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `lang`                    | BCP 47 language. Picks a voice when `voice` is not set            |
| `voice`                   | A voice, or a voice's `voiceURI` or `name`                        |
| `rate`, `pitch`, `volume` | As on `SpeechSynthesisUtterance`                                  |
| `onSegment`               | Called as each segment starts, including one that is only a pause |
| `onWord`                  | Called as each word is spoken (see Highlighting words)            |
| `signal`                  | An `AbortSignal` that stops the speech                            |
| `maxChunkChars`           | Longest text per utterance (default 180)                          |
| `startTimeoutMs`          | How long an utterance may take to start (default 3000; 0 is off)  |

The returned object has `stop()`, `pause()`, `resume()` and `state`
(`speaking`, `paused`, `ended`, `stopped` or `error`). `done` rejects with a
`SpeechError` whose `code` is the browser's error, `unsupported`, or
`start-timeout` when the browser never started the speech. On
`start-timeout`, offer another way to hear the text, such as a recording, or
show it to read.

The browser speaks one thing at a time, so `speak` stops speech already in
progress. `stopSpeaking()` stops it from anywhere.

### What it handles

- **Long text.** Some voices stop partway through a long utterance (Chrome's
  online voices after about 15 seconds). Text is split at sentence ends,
  then clauses, then words, into utterances of at most `maxChunkChars`.
- **Lost end events.** Chrome can drop an utterance's end event when the
  utterance is garbage-collected; the one being spoken is kept referenced.
- **Stalled speech.** In Chrome, speech that was paused and then abandoned,
  by leaving the page or in another tab, stalls speech in every page: the
  browser reports nothing speaking, accepts new speech and never starts it,
  with no error. Only cancelling clears it, so `speak` always clears the
  queue first. If an utterance still hasn't started after `startTimeoutMs`,
  it is cancelled and tried once more, then `done` rejects with
  `start-timeout`.
- **Pausing without the browser's pause.** Because a paused, abandoned
  utterance causes that stall, `pause()` cancels the current utterance and
  `resume()` speaks it again from its start: at most one sentence, or
  `maxChunkChars`, is repeated. A segment's `pauseMs` is a timer, which
  `pause()` and `resume()` stop and continue.
- **Cancelled from elsewhere.** Another script or library calling
  `speechSynthesis.cancel()` ends this speech too; `done` then resolves
  with `stopped` rather than waiting for an end that never comes.
- **Leaving the page.** Speech is stopped when the page is hidden for good
  (`pagehide`), so it can't stall the next page.
- **User gestures.** Browsers may refuse speech that is not started from a
  click or key press; `done` then rejects with code `not-allowed`.

### Highlighting words

Pass `onWord` to hear about each word as it is spoken. `start` and `end`
are offsets into the text of segment `segment`, exactly as passed to
`speak`, even when the text was split into several utterances or had its
whitespace collapsed:

```ts
const text = 'Welcome to the course.';
speak(text, {
  onWord: ({ start, end }) => mark(text.slice(start, end)),
});
```

A word is marked without the punctuation around it ("promote," marks
"promote"), and a piece with no letter or digit, such as a dash, is not
reported. Numbers and contractions such as "3.5%" and "didn't" are usually
one word.

Only some voices report words. Chrome's online voices often do not, so
`onWord` may never be called; speech is the same either way. When the
browser reports where a word starts but not its length, as Safari does,
the word runs to the next space or punctuation. Voices differ in what they
call a word: some report pieces of a word, join two short words, or skip a
word they spell out, so the mark can lag for a word without drifting.

## Voices

Browsers load voices after the page. `getVoices` waits for them:

```ts
import { getVoices, pickVoice } from '@plexusone/speech';

const voices = await getVoices({ lang: 'fr' }); // fr-FR, fr-CA, ...
const best = pickVoice(voices, 'fr-FR');
```

`pickVoice` prefers the exact language and region, then the same language;
within each, the browser's default voice, then a voice on the device (which
needs no network). `langMatches('en', 'en-GB')` is true;
`langMatches('en-US', 'en-GB')` is not.

## Listening

`listen` reports text as it is recognized:

```ts
import { listen } from '@plexusone/speech';

const listening = listen({
  lang: 'en-US',
  onResult: ({ text, final, interim }) => (input.value = text),
});

// later
listening.stop();
const text = await listening.done;
```

In continuous mode (the default) the browser ends recognition by itself
from time to time; `listen` restarts it until `stop()`, a fatal error (no
permission, no microphone, no service), or `maxSilences` silences in a row
(default 3). `abort()` stops at once and drops text still being recognized.
Speech recognition is available in Chrome, Edge and Safari; check
`isRecognitionSupported()`. Where the audio goes depends on the browser:
Chrome sends it to Google's speech service, so say so near the control if
your users would want to know, and do not promise that dictation stays on
the device.

## React

```tsx
import { useListen, useSpeech, useVoices } from '@plexusone/speech/react';

function ReadAloud({ text }: { text: string }) {
  const { speak, stop, state, supported } = useSpeech({ lang: 'en-US' });
  if (!supported) return null;
  return state === 'speaking' ? (
    <button onClick={stop}>Stop</button>
  ) : (
    <button onClick={() => speak(text)}>Read aloud</button>
  );
}
```

| Hook                 | Returns                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `useSpeech(options)` | `speak`, `stop`, `pause`, `resume`, `state`, `segment`, `word`, `error`, `supported`    |
| `useListen(options)` | `start`, `stop`, `abort`, `listening`, `text`, `final`, `interim`, `error`, `supported` |
| `useVoices(lang)`    | The voices, empty until loaded                                                          |

With `trackWords: true`, `useSpeech` keeps the word being spoken in
`word` (`{ segment, start, end }`), for highlighting; it is undefined
between segments and after speech. It is off by default because it
re-renders the component on every word; `onWord` alone does not:

```tsx
function Highlighted({ text }: { text: string }) {
  const { speak, word } = useSpeech({ trackWords: true });
  return (
    <>
      <button onClick={() => speak(text)}>Read aloud</button>
      <p>
        {word ? (
          <>
            {text.slice(0, word.start)}
            <mark>{text.slice(word.start, word.end)}</mark>
            {text.slice(word.end)}
          </>
        ) : (
          text
        )}
      </p>
    </>
  );
}
```

Speech and listening stop when the component unmounts. The promises from
`speak` and `start` reject on errors, which the hooks also report as
`error`.

## Pages without a build step

`dist/speech.global.js` (the `@plexusone/speech/browser` export) defines
`window.PlexusSpeech` with the same functions as the main entry point:

```html
<script src="https://cdn.jsdelivr.net/npm/@plexusone/speech@0.1.0/dist/speech.global.js"></script>
<script>
  PlexusSpeech.speak('Hello.', { lang: 'en-US' });
</script>
```

A program that serves its own pages, such as a Go binary that embeds them,
can copy the file in at a pinned version instead of loading it from a CDN.

## Testing

Every function takes the browser objects as options (`synthesis` and
`Utterance` for speaking, `recognition` for listening), so tests can pass
fakes where jsdom has no speech.
