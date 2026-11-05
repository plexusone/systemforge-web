# PRD — Login Cards and Camera Sign-In

**Initiative:** `INIT-SYSTEMFORGEWEB-002`
**Repository:** `github.com/plexusone/systemforge-web`
**Related:** `INIT-SYSTEMFORGE-007` (managed principals and login tokens)

## Summary

SystemAuth issues **login tokens** for managed principals, such as children
without an email: a manager issues one, and the managed principal signs in
with it. The token is a long string meant to be carried as a QR code, but
nothing in systemforge-web draws one, prints it, or reads it back. This
initiative adds a package, `@plexusone/login-card`, that does all three: a
card with the token as a QR code, printed or downloaded by the manager, and
a camera scanner that reads it on the sign-in page.

## Problem

- **Every application would build the same thing.** A learning application
  for families and a classroom one both need a printable card and a
  scanner, and each would choose its own QR library and print layout.
- **The details are easy to get wrong.** A QR code that holds a sign-in URL
  puts the token in browser history and lets any phone camera sign in on
  that phone. A scanner that uploads frames sends images of a child's room
  to a server. A card that is reprintable means the token is stored where
  it can leak.
- **Young users cannot type the token.** It is about 56 characters.

## Goals

1. **A card a manager can print or save.** The managed principal's name,
   an optional picture, the QR code, the token in groups of four, where to
   use it, and when it expires, in wallet, US Letter and A4 layouts, and as
   a PNG or SVG download.
2. **The QR holds the token only.** Never a URL, so only the application's
   own scanner can use it, and the card's printed text says where to go.
3. **A camera scanner that keeps frames on the device.** It reads a card
   held up to a laptop's or tablet's camera, sends nothing but the decoded
   token, and falls back to typing.
4. **Safe defaults.** The component never logs, stores or sends a token,
   and asks the application to supply the token at issue time.

## Non-Goals

- Issuing, listing, revoking or replacing tokens: those are SystemAuth's
  managed-principal endpoints, which the application calls.
- Adult sign-in. An adult's account is not signed in with a printed card;
  cross-device sign-in for adults is a passkey matter for SystemAuth.
- Class sets, rosters or bulk printing workflows: an application lays out
  many cards with the same components.
- Reprinting an existing card. Tokens are stored hashed; a lost card is
  replaced.

## Users

| User | Needs |
|---|---|
| Manager (parent, teacher) | Print or save a card right after issuing a token, with its expiry, and know what the card does |
| Managed principal (child) | Hold the card up to the camera and be signed in, or have an adult type the code |
| Application developer | Drop in a card and a scanner without choosing libraries or writing print CSS |

## Success Measures

- A card printed on an office printer at the wallet size scans on a school
  Chromebook's front camera and an iPad within five seconds.
- A scanner session sends no request but the decoded token, verified in
  tests by intercepting the network.
- An application integrates the card and scanner in under a day.
