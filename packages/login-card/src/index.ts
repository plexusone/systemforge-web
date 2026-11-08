// The React components are on @plexusone/login-card/react, so a page
// without React can draw and download cards from this entry.
export {
  CARD_HEIGHT_MM,
  CARD_WIDTH_MM,
  LOGIN_CODE_PREFIX,
  NotALoginCodeError,
  QUIET_ZONE,
  cardSvg,
  groupCode,
  isLoginCode,
  loginCodeMatrix,
  loginCodeSvg,
  qrPath,
} from './code';
export type {
  CardContent,
  CardOptions,
  LoginCodePredicate,
  LoginCodeSvgOptions,
  QROptions,
} from './code';
export { downloadCard, svgToPng } from './download';
export type { DownloadOptions } from './download';
