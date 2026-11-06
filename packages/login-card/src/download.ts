import { CARD_HEIGHT_MM, CARD_WIDTH_MM, cardSvg, type CardContent, type CardOptions } from './code';

/** Options for {@link downloadCard}. */
export interface DownloadOptions extends CardOptions {
  /** png (300 dpi) or svg; default png. */
  format?: 'png' | 'svg';
  /** The file's name without its extension; default "login-card". */
  filename?: string;
  /** Pixels per inch for PNG; default 300. */
  dpi?: number;
}

/**
 * Saves a login card as a file, drawn in the browser: nothing is uploaded.
 * A PNG is the card's SVG drawn on a canvas at the given resolution.
 */
export async function downloadCard(card: CardContent, opts: DownloadOptions = {}): Promise<void> {
  const svg = cardSvg(card, opts);
  const name = opts.filename ?? 'login-card';
  if (opts.format === 'svg') {
    save(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
    return;
  }
  save(await svgToPng(svg, opts.dpi ?? 300), `${name}.png`);
}

/** Draws a card's SVG on a canvas and returns it as a PNG. */
export async function svgToPng(svg: string, dpi = 300): Promise<Blob> {
  const width = Math.round((CARD_WIDTH_MM / 25.4) * dpi);
  const height = Math.round((CARD_HEIGHT_MM / 25.4) * dpi);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image(width, height);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('login-card: the card could not be drawn'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('login-card: no 2D canvas');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('login-card: the PNG could not be made'))),
        'image/png'
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function save(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  // Revoke after the click has started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
