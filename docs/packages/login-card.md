# @plexusone/login-card

Printable login cards and a camera scanner for SystemAuth's login codes:
the code a manager issues for a managed principal, such as a child,
becomes a card with a QR code, and the camera on the device that person
uses reads the card and signs them in. Frames are decoded on the device
and never sent.

```bash
pnpm add @plexusone/login-card
```

| Entry                                 | For                                                         | React |
| ------------------------------------- | ----------------------------------------------------------- | ----- |
| `@plexusone/login-card`               | `cardSvg`, `loginCodeSvg`, `downloadCard` and `isLoginCode` | No    |
| `@plexusone/login-card/react`         | `LoginCodeQR`, `LoginCard` and `CardSheet`                  | Yes   |
| `@plexusone/login-card/scanner`       | `startLoginCodeScanner`, for any page, a game included      | No    |
| `@plexusone/login-card/scanner/react` | `LoginCodeScanner` and `useLoginCodeScanner`                | Yes   |

## The Code

SystemAuth's login codes are `SFLT` and 52 characters of `A`–`Z` and
`2`–`7`. `isLoginCode` checks that shape, and every function here takes an
`isLoginCode` option for codes of another shape. A value that is not a
code throws `NotALoginCodeError`, which never repeats the value, so a URL
cannot be printed as a card by mistake. The QR code holds the code alone,
in alphanumeric mode at error correction M: no address, no name.

## Issue, Show and Print

Issue the code on your server with SystemForge (`mpclient.IssueLoginToken`,
or `ReplaceLoginTokens` to retire every earlier card in the same step). Its
value is returned once: show it, print it or download it, and do not store
it.

```tsx
import { downloadCard } from '@plexusone/login-card';
import { CardSheet } from '@plexusone/login-card/react';

const card = {
  code,                               // from the issue call
  name: 'Robin',                      // the name its holder recognizes
  instructions: 'Go to example.com, choose I am a student, then Scan my card.',
  expiresAt: new Date(issued.expires_at),
};

<CardSheet cards={[card]} layout="wallet" />   // or "letter" / "a4": several per page
<button onClick={() => window.print()}>Print</button>
<button onClick={() => downloadCard(card, { format: 'png', filename: 'robin-card' })}>Download</button>
```

- **One drawing.** `cardSvg` draws the card, 85.6 × 54 mm, black on white;
  `LoginCard` shows it, the print sheet prints it at that size, and
  `downloadCard` saves it as SVG, or as a 300 dpi PNG drawn on a canvas.
  Nothing is uploaded.
- **Printing.** While a `CardSheet` is on the page, the browser prints only
  the sheet: `wallet` puts one card on each card-sized page; `letter` and
  `a4` put two across with a gap to cut along.
- **A picture,** such as an avatar, must be a data URL: the card is shown
  and saved as an image, which loads no other URL.
- **Only what you pass** is printed: the package adds no identifier.

## Scan

In React:

```tsx
import { LoginCodeScanner } from '@plexusone/login-card/scanner/react';

<LoginCodeScanner onCode={(code) => signIn(code)} onTypeInstead={() => setTyping(true)} />;
```

Anywhere else, with a `<video>` element:

```ts
import { startLoginCodeScanner } from '@plexusone/login-card/scanner';

const scanner = await startLoginCodeScanner(video, {
  onCode: (code) => signIn(code), // post it as you post a typed code
  onUnavailable: (reason) => showTyping(reason),
  onIdle: () => showTryAgain(),
});
// scanner.stop() when the view closes
```

- **Camera.** The rear camera where there is one; laptops use their own.
  Browsers offer cameras only on https pages and `localhost`.
- **Decoding.** `BarcodeDetector` where the browser has it; elsewhere jsQR,
  loaded only when scanning starts.
- **Only codes.** A QR code that is not a login code, such as a web
  address, is ignored, and nothing is requested for it.
- **Stopping.** The camera stops on a code, on `stop()`, when the component
  unmounts, and after `idleMs` without a code (60 seconds by default). To
  cancel a scanner before `startLoginCodeScanner` has returned, pass a
  `signal`: a camera granted after it is aborted is turned off and never
  shown, so it cannot replace a newer scanner's on the same video.
- **No camera.** `onUnavailable` says why: `insecure-context`, `no-camera`,
  `denied` or `error`, which also covers a decoder that cannot load. The
  component says so in plain words, which `messages` translates, offers
  typing when you pass `onTypeInstead`, and offers Try again after `idle`,
  `error` or `denied`, for a person who has just allowed the camera.

Post the code to SystemAuth's `POST /login-token` as a form, with your
client ID and where to return, exactly as a typed code is posted.
