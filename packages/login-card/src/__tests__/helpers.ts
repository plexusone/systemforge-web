import { QUIET_ZONE } from '../code';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** A random code in SystemAuth's shape; never a real one. */
export function fakeCode(): string {
  let s = 'SFLT';
  for (let i = 0; i < 52; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

/** The QR matrix as an RGBA image, with the quiet zone, scale pixels per module. */
export function toImage(
  matrix: boolean[][],
  scale = 4
): { data: Uint8ClampedArray; width: number; height: number } {
  const n = (matrix.length + 2 * QUIET_ZONE) * scale;
  const data = new Uint8ClampedArray(n * n * 4).fill(255);
  matrix.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (!dark) return;
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const i = (((r + QUIET_ZONE) * scale + y) * n + (c + QUIET_ZONE) * scale + x) * 4;
          data[i] = data[i + 1] = data[i + 2] = 0;
        }
      }
    })
  );
  return { data, width: n, height: n };
}
