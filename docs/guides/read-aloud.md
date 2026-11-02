# Adding read-aloud and voice input

`@plexusone/speech` lets an application read text aloud and take dictation
with the browser's own speech: nothing to run and no key to manage. This guide
adds a read-aloud control with word highlighting, a voice picker and voice
input to an application. The [package page](../packages/speech.md) is the
reference for every option.

## 1. Choose an entry point

| You have                                   | Use                                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| A React application                        | `@plexusone/speech/react`: `useSpeech`, `useListen`, `useVoices` |
| Code without React                         | `@plexusone/speech`: `speak`, `listen`, `getVoices`              |
| A page with no build step, or a Go program | `@plexusone/speech/browser`: one file defining `PlexusSpeech`    |

```bash
pnpm add @plexusone/speech
```

The main entry point has no dependencies. React is needed only for the
hooks.

## 2. Read text aloud

Pass the text as segments when it has natural parts, such as the sentences
of a lesson or the paragraphs of an article. Each segment can have a pause
after it, and `segment` says which one is being read:

```tsx
import { useSpeech } from '@plexusone/speech/react';

function ReadAloud({ paragraphs }: { paragraphs: string[] }) {
  const { speak, stop, pause, resume, state, segment, error, supported } = useSpeech({
    lang: 'en-US',
  });
  if (!supported) return null;

  const segments = paragraphs.map((text) => ({ text, pauseMs: 400 }));
  return (
    <>
      {state === 'speaking' ? (
        <button onClick={pause}>Pause</button>
      ) : state === 'paused' ? (
        <button onClick={resume}>Resume</button>
      ) : (
        <button onClick={() => speak(segments).catch(() => undefined)}>Read aloud</button>
      )}
      {(state === 'speaking' || state === 'paused') && <button onClick={stop}>Stop</button>}
      {error?.code === 'start-timeout' && (
        <p>Your browser's voice isn't responding. Here is the text.</p>
      )}
      {paragraphs.map((p, i) => (
        <p key={i} className={i === segment ? 'reading' : undefined}>
          {p}
        </p>
      ))}
    </>
  );
}
```

Start speech from a click or a key press. Browsers may refuse speech that a
page starts on its own, and report `not-allowed`.

Long text is split into short utterances for you, because some voices stop
partway through a long one. Pausing repeats at most the sentence that was
interrupted when speech resumes.

## 3. Highlight the word being read

Set `trackWords` and mark `word` in the segment being read. `start` and `end`
are offsets into that segment's text exactly as you passed it:

```tsx
import type { SpeakWord } from '@plexusone/speech';

// In ReadAloud above: useSpeech({ lang: 'en-US', trackWords: true }), and
// render each paragraph with renderParagraph(p, i, segment, word).
function renderParagraph(text: string, index: number, segment: number, word?: SpeakWord) {
  if (index !== segment) return <p key={index}>{text}</p>;
  if (!word)
    return (
      <p key={index} className="reading">
        {text}
      </p>
    );
  return (
    <p key={index} className="reading">
      {text.slice(0, word.start)}
      <mark>{text.slice(word.start, word.end)}</mark>
      {text.slice(word.end)}
    </p>
  );
}
```

Pick the colours together: a light background on the segment being read
and a stronger one on the word reads well. Two things keep the segment's
mark visible:

- **No transition on the segment's background.** A short sentence is
  spoken in under half a second, so a fade can still be running when the
  next one starts.
- **Mark the word with more than a shade,** such as an underline as well as
  a background. In dark mode two backgrounds of one hue are hard to tell
  apart.

A one-word segment is covered by the word's mark, so only the word shows.

Words are marked without the punctuation around them. Not every voice
reports words: many of Chrome's online voices report none, and the word
mark never appears while the segment's still does. Some voices report
pieces of a word or join two short words, so treat the mark as a guide to
where the voice is, not an exact transcript.

`trackWords` re-renders the component on every word. To highlight without
re-rendering, for example by setting a class on a DOM node, pass `onWord`
instead and update the DOM yourself.

## 4. When speech does not start

`speak` rejects with a `SpeechError`. Show the text, or offer a recording,
rather than a silent button:

| `error.code`    | What happened                                    | What to show                                   |
| --------------- | ------------------------------------------------ | ---------------------------------------------- |
| `unsupported`   | The browser cannot speak (`supported` is false)  | Hide the control                               |
| `not-allowed`   | Speech was not started from a click or key press | Start it from a button                         |
| `start-timeout` | The browser accepted speech but never started it | The text to read, or a recording               |
| anything else   | The voice failed                                 | The text, and let the person try another voice |

`ReadAloud` above shows the `start-timeout` message from the same hook that
started the speech.

## 5. Let people choose a voice

`useVoices` lists the voices for a language once the browser has loaded
them. Store the chosen voice's `voiceURI`; `voice` accepts it as a string:

```tsx
import { useVoices } from '@plexusone/speech/react';

function VoicePicker({ value, onChange }: { value: string; onChange: (uri: string) => void }) {
  const voices = useVoices('en');
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Default voice</option>
      {voices.map((v) => (
        <option key={v.voiceURI} value={v.voiceURI}>
          {v.name} ({v.lang})
        </option>
      ))}
    </select>
  );
}

// useSpeech({ lang: 'en-US', voice: savedVoiceURI || undefined })
```

Voices differ by browser and device, so a saved voice may be missing on
another computer. Without it, `speak` picks a voice for `lang`: the
browser's default for that language, then a voice on the device.

## 6. Add voice input to a text field

`useListen` reports text as it is recognized, final and interim together:

```tsx
import { useListen } from '@plexusone/speech/react';

function Dictation({ onText }: { onText: (text: string) => void }) {
  const { start, stop, listening, text, error, supported } = useListen({ lang: 'en-US' });
  if (!supported) return null;
  return (
    <>
      <textarea value={text} readOnly />
      {listening ? (
        <button onClick={stop}>Done</button>
      ) : (
        <button onClick={() => start().then(onText, () => undefined)}>Dictate</button>
      )}
      {error?.code === 'not-allowed' && <p>Allow the microphone to dictate.</p>}
    </>
  );
}
```

The browser asks for the microphone the first time. Listening continues
across pauses and stops after three silences in a row; `stop()` waits for
the last words, `abort()` drops them. Speech recognition is available in
Chrome, Edge and Safari, and in Chrome it sends audio to Google's service.
Say so near the control if your users would want to know.

## 7. Test it

jsdom has no speech. Every function and hook takes the browser objects as
options, so a test passes fakes: `synthesis` and `Utterance` for speaking,
`recognition` for listening. A fake `speechSynthesis` that records what was
spoken, and lets the test start and end each utterance, is enough to cover
the controls above. The package's own
[test fakes](https://github.com/plexusone/systemforge-web/blob/main/packages/speech/src/__tests__/fakes.ts)
are one to copy.
