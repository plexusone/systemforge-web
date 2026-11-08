import {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  QUIET_ZONE,
  cardSvg,
  loginCodeMatrix,
  qrPath,
  type CardContent,
  type CardOptions,
  type QROptions,
} from './code';

/** Props of {@link LoginCodeQR}. */
export interface LoginCodeQRProps extends QROptions {
  /** The login code; anything else throws. */
  code: string;
  /** An accessible name; default "Login code". Never the code itself. */
  title?: string;
  className?: string;
}

/** A login code as a QR code, drawn as SVG that scales to its box. */
export function LoginCodeQR({
  code,
  title = 'Login code',
  className,
  isLoginCode,
}: LoginCodeQRProps) {
  const matrix = loginCodeMatrix(code, { isLoginCode });
  const full = matrix.length + 2 * QUIET_ZONE;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${full} ${full}`}
      shapeRendering="crispEdges"
      role="img"
    >
      <title>{title}</title>
      <rect width={full} height={full} fill="#fff" />
      <path fill="#000" d={qrPath(matrix)} />
    </svg>
  );
}

/** Props of {@link LoginCard}. */
export interface LoginCardProps extends CardOptions {
  card: CardContent;
  className?: string;
}

/**
 * A login card, 85.6 by 54 mm when printed: the QR code, the name, when it
 * stops working, the instructions and the code in groups of four. It is the
 * card's SVG shown as an image, so the screen, the printout and a download
 * are the same. A picture must be a data URL to show in it.
 */
export function LoginCard({ card, className, ...opts }: LoginCardProps) {
  // A data URL stays in the page: nothing is fetched or sent.
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg(card, opts))}`;
  return (
    <div className={['plx-login-card', className].filter(Boolean).join(' ')}>
      <img
        src={src}
        alt={`Login card for ${card.name}`}
        width={CARD_WIDTH_PX}
        height={CARD_HEIGHT_PX}
      />
    </div>
  );
}

// The card at 96 CSS pixels per inch.
const CARD_WIDTH_PX = Math.round((CARD_WIDTH_MM / 25.4) * 96);
const CARD_HEIGHT_PX = Math.round((CARD_HEIGHT_MM / 25.4) * 96);

/** How a sheet of cards is printed. */
export type CardLayout = 'wallet' | 'letter' | 'a4';

/** Props of {@link CardSheet}. */
export interface CardSheetProps extends CardOptions {
  cards: CardContent[];
  /** wallet prints one card per page at card size; letter and a4 print several per page. Default letter. */
  layout?: CardLayout;
  className?: string;
}

const SHEET_CSS = `
.plx-card-sheet{display:grid;gap:4mm;justify-content:start}
.plx-card-sheet[data-layout=wallet]{grid-template-columns:85.6mm}
.plx-card-sheet[data-layout=letter],.plx-card-sheet[data-layout=a4]{grid-template-columns:repeat(2,85.6mm)}
.plx-card-sheet .plx-login-card{width:85.6mm;height:54mm;line-height:0}
.plx-card-sheet .plx-login-card img{width:100%;height:100%}
@page plx-wallet{size:85.6mm 54mm;margin:0}
@page plx-letter{size:letter;margin:12mm}
@page plx-a4{size:A4;margin:12mm}
@media print{
body *{visibility:hidden}
.plx-card-sheet,.plx-card-sheet *{visibility:visible}
.plx-card-sheet{position:absolute;left:0;top:0;gap:4mm}
.plx-card-sheet[data-layout=wallet]{page:plx-wallet;gap:0}
.plx-card-sheet[data-layout=wallet] .plx-login-card{break-after:page}
.plx-card-sheet[data-layout=letter]{page:plx-letter}
.plx-card-sheet[data-layout=a4]{page:plx-a4}
.plx-card-sheet .plx-login-card{break-inside:avoid}
}`;

/**
 * Cards laid out for printing. While a sheet is on the page, the browser's
 * print prints only the sheet, in black on white: call window.print().
 */
export function CardSheet({ cards, layout = 'letter', className, ...opts }: CardSheetProps) {
  return (
    <div className={['plx-card-sheet', className].filter(Boolean).join(' ')} data-layout={layout}>
      <style>{SHEET_CSS}</style>
      {cards.map((card) => (
        <LoginCard key={card.code} card={card} {...opts} />
      ))}
    </div>
  );
}
