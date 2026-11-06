# PLAN — Login Cards and Camera Sign-In

**Initiative:** `INIT-SYSTEMFORGEWEB-002`

## Approach

1. Draw the QR first, with a test that decodes it, so every later piece
   rests on a code that is known to scan.
2. Build the card and its print layouts before downloads, which render the
   same card.
3. Keep the scanner on its own subpath, so printing never loads a camera.
4. Release with a guide written against a learning application's sign-in,
   the first consumer.

## Order

| Phase       | Items         | Exit                                                                                                                  |
| ----------- | ------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1 — Card    | 024, 025, 026 | A token prints as a wallet card and an A4 sheet and downloads as PNG and SVG, and the printed QR decodes to the token |
| 2 — Scanner | 027           | A printed card scans on a Chromebook and an iPad; other QR codes are ignored; no network request is made              |
| 3 — Release | 028           | `@plexusone/login-card` published, with a guide                                                                       |

## Dependencies

- SystemAuth's login tokens (`INIT-SYSTEMFORGE-007`), already released.
- Replacing tokens in one call (`RMI-SYSTEMFORGE-222`) is used by
  applications, not by this package.
