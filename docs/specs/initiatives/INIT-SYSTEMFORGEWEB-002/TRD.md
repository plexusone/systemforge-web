# TRD — Login Cards and Camera Sign-In

**Initiative:** `INIT-SYSTEMFORGEWEB-002`

## Package

`@plexusone/login-card`, a new package, with the scanner on its own subpath
so applications that only print never load a camera or a decoder:

```text
@plexusone/login-card            LoginCodeQR, LoginCard, CardSheet, downloadCard, groupCode
@plexusone/login-card/scanner    LoginCodeScanner, useLoginCodeScanner
```

Peers: `react`, `@plexusone/ui`. No dependency on `@plexusone/auth`: the
card and scanner work with values the application passes in.

## The Token

SystemAuth's login tokens are `SFLT` followed by base32, uppercase letters
and digits, about 56 characters. The package treats the token as an opaque
string checked by a predicate the application passes (`isLoginCode`), with
a default that matches SystemAuth's shape. It never parses, logs or stores
it.

## LoginCodeQR

- **Content is the token alone,** encoded in the QR alphanumeric mode, which
  SystemAuth's alphabet fits, at error correction M, with the standard
  four-module quiet zone.
- **Drawn as SVG** in the browser, from a QR encoding library added at a
  verified current version, with crisp edges at any print size.
- A value the predicate refuses throws, so a URL or other string cannot be
  drawn as a card by mistake.

## LoginCard

A card with slots the application fills:

| Slot           | Holds                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `name`         | The name the managed principal recognizes                                                                               |
| `picture`      | An optional image or element, such as an avatar                                                                         |
| `instructions` | Where to use the card, in the application's words, such as "Go to example.com, choose I'm a student, then Scan my card" |
| `expiresAt`    | Printed as "Works until …" when set                                                                                     |
| `code`         | The token, as the QR and in groups of four for typing                                                                   |

**Layouts.** `CardSheet` lays out one or more cards for print with a print
stylesheet: `wallet` (85.6 × 54 mm, one per page or cut marks on a sheet),
`letter` and `a4` (several per page). Screen styles come from design tokens;
print styles use black on white.

## Download

`downloadCard(card, { format: "png" | "svg" })` renders the card in the
browser and saves it with a name the application gives. PNG is drawn
from the SVG on a canvas at 300 dpi for the wallet size. Nothing is
uploaded.

## Scanner

`LoginCodeScanner` (component) and `useLoginCodeScanner` (hook):

- **Camera:** `getUserMedia`, preferring the rear camera where there is one
  and the front camera on laptops.
- **Decoding:** `BarcodeDetector` where the browser has it (Chrome and
  ChromeOS), otherwise a JavaScript or WebAssembly QR decoder loaded only
  when scanning starts.
- **Only tokens:** a decoded value the predicate refuses is ignored without
  a request, so a scanned URL or product code does nothing.
- **Frames stay on the device:** nothing is sent; the component calls
  `onCode(token)` and the application posts it to SystemAuth's login-token
  endpoint as it does a typed one.
- **The camera stops** on a code, when the component unmounts, and after a
  configurable idle time (default 60 seconds).
- **No camera** (denied, missing, or not a secure context): `onUnavailable`
  is called with the reason, and the default view says so in plain words
  and points to typing.

## Privacy and Security

- No token in a URL, a log, `localStorage`, telemetry or an error message.
  The package's telemetry hooks are not called with it.
- The card shows only what the application passes; the package adds no
  identifier.
- Camera frames are never drawn to a canvas that is read back except for
  decoding, and never leave the page.

## Testing

- QR: decoding the rendered SVG returns the exact token; a URL is refused.
- Card and sheets: snapshot tests of each layout; print media queries.
- Download: PNG and SVG produced without a network request.
- Scanner: decoding from photographs of printed cards, ignoring other QR
  codes, the idle stop, and each unavailable reason; a network intercept
  shows no request during scanning.
