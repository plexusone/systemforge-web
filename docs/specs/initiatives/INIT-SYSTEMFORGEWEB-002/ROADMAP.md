# ROADMAP — Login Cards and Camera Sign-In

**Initiative:** `INIT-SYSTEMFORGEWEB-002`
**Repository:** `github.com/plexusone/systemforge-web`

A printable and downloadable login card with the token as a QR code, and a
camera scanner that reads it on the device. Commits implementing an item
carry `Refs: RMI-SYSTEMFORGEWEB-<NNN>`.

## Phase 1 — Card

**Theme:** A token becomes a card a manager can print or save

- [x] `RMI-SYSTEMFORGEWEB-024` `LoginCodeQR`: the token alone as an SVG QR code in alphanumeric mode, refusing anything that is not a token
- [x] `RMI-SYSTEMFORGEWEB-025` `LoginCard` and `CardSheet`: name, picture, instructions, expiry and the grouped token, in wallet, Letter and A4 print layouts
  - Depends on: `RMI-SYSTEMFORGEWEB-024`
- [x] `RMI-SYSTEMFORGEWEB-026` `downloadCard`: the card as PNG and SVG, drawn in the browser
  - Depends on: `RMI-SYSTEMFORGEWEB-025`

## Phase 2 — Scanner

**Theme:** Hold up the card and be signed in, with frames kept on the device

- [x] `RMI-SYSTEMFORGEWEB-027` `LoginCodeScanner`: camera, `BarcodeDetector` with a lazily loaded fallback decoder, tokens only, idle stop and plain-language fallback to typing
  - Depends on: `RMI-SYSTEMFORGEWEB-024`

## Phase 3 — Release

**Theme:** Applications adopt it with one dependency

- [x] `RMI-SYSTEMFORGEWEB-028` Publish `@plexusone/login-card` with a guide to issuing, printing and scanning
  - Depends on: `RMI-SYSTEMFORGEWEB-026`
  - Depends on: `RMI-SYSTEMFORGEWEB-027`
