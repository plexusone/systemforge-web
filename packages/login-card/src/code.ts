import qrcode from 'qrcode-generator';

/**
 * Decides whether a string is a login code. Applications pass their own when
 * their codes differ from SystemAuth's; the default is {@link isLoginCode}.
 */
export type LoginCodePredicate = (value: string) => boolean;

/** SystemAuth's login code prefix. */
export const LOGIN_CODE_PREFIX = 'SFLT';

// SFLT followed by 32 random bytes in base32 without padding: 52 characters
// of A to Z and 2 to 7, all in QR alphanumeric mode's alphabet.
const SYSTEMAUTH_CODE = /^SFLT[A-Z2-7]{52}$/;

/** Reports whether value has the shape of a SystemAuth login code. */
export function isLoginCode(value: string): boolean {
  return SYSTEMAUTH_CODE.test(value);
}

/** Thrown for a value that is not a login code, without the value. */
export class NotALoginCodeError extends Error {
  constructor() {
    super('login-card: the value is not a login code');
    this.name = 'NotALoginCodeError';
  }
}

function check(code: string, accept: LoginCodePredicate = isLoginCode): void {
  if (!accept(code)) {
    throw new NotALoginCodeError();
  }
}

/** The code in groups of four, for reading aloud or typing: "SFLT ABCD …". */
export function groupCode(code: string): string {
  return code.match(/.{1,4}/g)?.join(' ') ?? '';
}

/** Options for drawing a code as a QR code. */
export interface QROptions {
  /** Accepts only login codes; default {@link isLoginCode}. */
  isLoginCode?: LoginCodePredicate;
}

/**
 * The QR code's modules for a login code, row by row, true for dark. The
 * code alone is encoded, in alphanumeric mode at error correction M, without
 * the quiet zone. A value that is not a login code throws.
 */
export function loginCodeMatrix(code: string, opts: QROptions = {}): boolean[][] {
  check(code, opts.isLoginCode);
  const qr = qrcode(0, 'M');
  qr.addData(code, 'Alphanumeric');
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
}

/** The standard quiet zone around a QR code, in modules. */
export const QUIET_ZONE = 4;

/**
 * The dark modules as one SVG path in module units, offset by the quiet
 * zone, so the QR stays crisp at any size.
 */
export function qrPath(matrix: boolean[][]): string {
  const parts: string[] = [];
  matrix.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      if (!row[c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < row.length && row[c]) c++;
      parts.push(`M${start + QUIET_ZONE} ${r + QUIET_ZONE}h${c - start}v1h${start - c}z`);
    }
  });
  return parts.join('');
}

/** Options for {@link loginCodeSvg}. */
export interface LoginCodeSvgOptions extends QROptions {
  /** The SVG's width and height, such as "40mm" or "240"; default 100%. */
  size?: string;
  /** An accessible name; default "Login code". Never the code itself. */
  title?: string;
}

/** A login code as a standalone, black-on-white SVG QR code. */
export function loginCodeSvg(code: string, opts: LoginCodeSvgOptions = {}): string {
  const matrix = loginCodeMatrix(code, opts);
  const full = matrix.length + 2 * QUIET_ZONE;
  const size = escapeXml(opts.size ?? '100%');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${full} ${full}" width="${size}" height="${size}" ` +
    `shape-rendering="crispEdges" role="img"><title>${escapeXml(opts.title ?? 'Login code')}</title>` +
    `<rect width="${full}" height="${full}" fill="#fff"/><path fill="#000" d="${qrPath(matrix)}"/></svg>`
  );
}

/** What a login card shows. Only what the application passes is printed. */
export interface CardContent {
  /** The login code, drawn as the QR code and printed in groups of four. */
  code: string;
  /** The name the card's holder recognizes, such as a first name. */
  name: string;
  /** Where and how to use the card, in the application's words. */
  instructions?: string;
  /** When the code stops working, printed as "Works until …". */
  expiresAt?: Date;
  /**
   * A picture beside the name, such as an avatar: a data URL, or a
   * same-origin URL. A cross-origin image cannot be drawn into a PNG.
   */
  picture?: string;
}

/** Options for {@link cardSvg}. */
export interface CardOptions extends QROptions {
  /** Formats the expiry; default the date in the browser's locale. */
  formatDate?: (d: Date) => string;
  /** The label before the expiry; default "Works until". */
  worksUntilLabel?: string;
}

/** The card's size: a credit card, 85.6 by 54 mm. */
export const CARD_WIDTH_MM = 85.6;
export const CARD_HEIGHT_MM = 54;

// The card is drawn in tenths of a millimetre.
const W = 856;
const H = 540;
const PAD = 30;
const QR = 400;
const TEXT_X = PAD + QR + 30;
const TEXT_W = W - TEXT_X - PAD;
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, 'Courier New', monospace";

/**
 * A whole login card as one SVG, 85.6 by 54 mm when printed: the QR code on
 * the left; the name, expiry, instructions and the grouped code on the
 * right. The same SVG is shown, printed and downloaded.
 */
export function cardSvg(card: CardContent, opts: CardOptions = {}): string {
  const matrix = loginCodeMatrix(card.code, opts);
  const modules = matrix.length + 2 * QUIET_ZONE;
  const scale = QR / modules;
  const qrY = (H - QR) / 2;
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
      `viewBox="0 0 ${W} ${H}" width="${CARD_WIDTH_MM}mm" height="${CARD_HEIGHT_MM}mm" role="img">`,
    `<title>${escapeXml(`Login card for ${card.name}`)}</title>`,
    `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="30" fill="#fff" stroke="#000" stroke-width="2"/>`,
    `<g transform="translate(${PAD} ${qrY}) scale(${round(scale)})" shape-rendering="crispEdges">` +
      `<path fill="#000" d="${qrPath(matrix)}"/></g>`,
  ];

  let y = PAD + 50;
  let nameX = TEXT_X;
  if (card.picture) {
    out.push(
      `<image href="${escapeXml(card.picture)}" xlink:href="${escapeXml(card.picture)}" x="${TEXT_X}" y="${PAD}" ` +
        `width="70" height="70" preserveAspectRatio="xMidYMid slice"/>`
    );
    nameX = TEXT_X + 85;
  }
  const nameLines = wrap(card.name, card.picture ? 13 : 17).slice(0, 2);
  nameLines.forEach((line, i) => {
    out.push(text(nameX, y + i * 52, line, 48, 'bold'));
  });
  y += (nameLines.length - 1) * 52 + 44;

  if (card.expiresAt) {
    const fmt = opts.formatDate ?? ((d: Date) => d.toLocaleDateString());
    out.push(
      text(TEXT_X, y, `${opts.worksUntilLabel ?? 'Works until'} ${fmt(card.expiresAt)}`, 24)
    );
    y += 40;
  }

  const codeLines = chunk(groupCode(card.code).split(' '), 5).map((g) => g.join(' '));
  const codeTop = H - PAD - (codeLines.length - 1) * 30 - 6;
  if (card.instructions) {
    const maxLines = Math.max(0, Math.floor((codeTop - 34 - y) / 30));
    wrap(card.instructions, 26)
      .slice(0, maxLines)
      .forEach((line, i) => out.push(text(TEXT_X, y + 6 + i * 30, line, 24)));
  }
  codeLines.forEach((line, i) =>
    out.push(text(TEXT_X, codeTop + i * 30, line, 22, 'normal', MONO))
  );
  out.push('</svg>');
  return out.join('');
}

// A line whose estimated width would overflow the text column is squeezed
// to fit, whatever font the printer or viewer substitutes.
function text(
  x: number,
  y: number,
  s: string,
  size: number,
  weight = 'normal',
  family = FONT
): string {
  const fit =
    s.length * size * 0.6 > TEXT_W ? ` textLength="${TEXT_W}" lengthAdjust="spacingAndGlyphs"` : '';
  return (
    `<text x="${x}" y="${y}" font-family="${escapeXml(family)}" font-size="${size}" font-weight="${weight}" ` +
    `fill="#000"${fit}>${escapeXml(s)}</text>`
  );
}

/** Splits s into lines of at most width characters, breaking at spaces. */
export function wrap(s: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of s.split(/\s+/).filter(Boolean)) {
    if (!line) {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line += ` ${word}`;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Escapes text for XML content and attributes. */
export function escapeXml(s: string): string {
  return s.replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!
  );
}
