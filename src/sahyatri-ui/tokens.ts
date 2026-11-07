/**
 * Every design value the app uses, with the original token names.
 * Source: mobile/src/theme/colors.ts and mobile/src/theme/index.ts
 * (copies in ../original/src/theme). Values are identical; React Native
 * style objects are translated to CSS where needed.
 */
import type { CSSProperties } from 'react';

/** Raw swatches (colors.ts › palette). */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',
  grey50: '#F6F6F6',
  grey100: '#EEEEEE',
  grey200: '#E2E2E2',
  grey300: '#CBCBCB',
  grey400: '#AFAFAF',
  grey500: '#757575',
  grey600: '#545454',
  grey700: '#333333',
  grey800: '#1F1F1F',
  grey900: '#141414',
  green500: '#5AAE45',
  green600: '#3A8030',
  green700: '#2C6424',
  green50: '#EEF7E9',
  yellow400: '#F2CF5B',
  yellow500: '#E3B93F',
  yellow50: '#FBF4DC',
  red500: '#E11900',
  red50: '#FDECEA',
  amber500: '#C98A00',
  amber50: '#FFF4DB',
  violet500: '#7356BF',
  violet50: '#EFEBF8',
  slate500: '#4B6178',
  slate50: '#EAEFF4',
} as const;

/** Semantic colours (colors.ts › colors). */
export const colors = {
  background: palette.white,
  surface: palette.white,
  surfaceMuted: palette.grey50,
  surfacePressed: palette.grey100,
  border: palette.grey100,
  borderStrong: palette.grey200,

  text: palette.black,
  textSecondary: palette.grey700,
  textMuted: palette.grey500,
  textFaint: palette.grey400,
  textInverse: palette.white,

  primary: palette.black,
  onPrimary: palette.white,
  brand: palette.black,
  brandSoft: palette.grey800,
  brandTint: palette.grey50,
  accent: palette.green500,
  accentStrong: palette.green600,
  accentDeep: palette.green700,
  accentTint: palette.green50,
  onAccent: palette.black,
  highlight: palette.yellow400,
  highlightStrong: palette.yellow500,
  highlightTint: palette.yellow50,
  onHighlight: palette.black,
  outline: palette.black,

  success: palette.green600,
  successTint: palette.green50,
  warning: palette.amber500,
  warningTint: palette.amber50,
  danger: palette.red500,
  dangerTint: palette.red50,
  info: palette.slate500,
  infoTint: palette.slate50,
  special: palette.violet500,
  specialTint: palette.violet50,

  mapDriver: palette.black,
  mapDriverRing: palette.yellow400,
  mapSelf: palette.slate500,
  mapRider: palette.green600,
  mapBackground: palette.grey100,

  overlay: palette.black,
  shadow: palette.black,
  splash: palette.white,
  iconBackground: palette.black,
} as const;

/** `withAlpha('#000000', 0.5)` → `'rgba(0,0,0,0.5)'` (colors.ts). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Deterministic avatar tones (colors.ts › avatarPalette). */
export const avatarPalette = [
  palette.grey800,
  palette.green600,
  palette.green700,
  palette.violet500,
  palette.slate500,
  palette.amber500,
  palette.red500,
] as const;

/** index.ts › avatarTone: same seed → same colour as in the app. */
export function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return avatarPalette[h % avatarPalette.length];
}

/**
 * Fonts. The app registers each Manrope weight as its own family
 * (`Manrope_800ExtraBold` …). On the web, load ./fonts.css and use the
 * single family 'Manrope' with the matching weight.
 */
export const fontFamily = "'Manrope', system-ui, -apple-system, sans-serif";
export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  heavy: 'Manrope_800ExtraBold',
} as const;
export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700, heavy: 800 } as const;

export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48 } as const;
export const layout = { gutter: space.md, buttonHeight: 56, buttonHeightSm: 44, tapTarget: 44 } as const;

/** React Native's StyleSheet.hairlineWidth on a 3x iPhone is 1/3 pt; 0.5px reads the same on video. */
export const hairline = 0.5;

const f = (w: keyof typeof fontWeight): CSSProperties => ({ fontFamily, fontWeight: fontWeight[w] });

/** Type scale (index.ts › type). */
export const type = {
  hero: { ...f('heavy'), fontSize: 36, lineHeight: '40px', letterSpacing: -1.2, color: colors.text },
  h1: { ...f('heavy'), fontSize: 30, lineHeight: '35px', letterSpacing: -0.9, color: colors.text },
  h2: { ...f('heavy'), fontSize: 22, lineHeight: '27px', letterSpacing: -0.5, color: colors.text },
  h3: { ...f('bold'), fontSize: 18, lineHeight: '23px', letterSpacing: -0.3, color: colors.text },
  title: { ...f('bold'), fontSize: 16, lineHeight: '21px', color: colors.text },
  body: { ...f('medium'), fontSize: 15, lineHeight: '22px', color: colors.textSecondary },
  bodyStrong: { ...f('bold'), fontSize: 15, lineHeight: '21px', color: colors.text },
  small: { ...f('medium'), fontSize: 13, lineHeight: '18px', color: colors.textMuted },
  smallStrong: { ...f('bold'), fontSize: 13, lineHeight: '18px', color: colors.textSecondary },
  micro: { ...f('bold'), fontSize: 11, lineHeight: '14px', letterSpacing: 0.6, color: colors.textMuted, textTransform: 'uppercase' },
  numeric: { ...f('heavy'), fontSize: 32, lineHeight: '36px', letterSpacing: -1, color: colors.text, fontVariantNumeric: 'tabular-nums' },
} satisfies Record<string, CSSProperties>;

/**
 * Elevation (index.ts › shadow). iOS values: shadowOpacity / shadowRadius /
 * shadowOffset, translated to box-shadow (iOS shadowRadius ≈ CSS blur).
 */
export const shadow = {
  card: `0px 4px 12px ${withAlpha(colors.shadow, 0.06)}`,
  lift: `0px 10px 24px ${withAlpha(colors.shadow, 0.14)}`,
} as const;
export const shadowNative = {
  card: { shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, androidElevation: 1 },
  lift: { shadowColor: colors.shadow, shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, androidElevation: 8 },
} as const;

/** Translucent layers (index.ts › scrim). */
export const scrim = {
  overlay: withAlpha(colors.overlay, 0.5),
  glass: withAlpha(colors.surface, 0.92),
  onBrandMuted: withAlpha(colors.textInverse, 0.72),
  onBrandFaint: withAlpha(colors.textInverse, 0.14),
  onBrandSubtle: withAlpha(colors.textInverse, 0.08),
  accentGlow: withAlpha(colors.accent, 0.18),
  backgroundFade0: withAlpha(colors.background, 0),
  backgroundFade70: withAlpha(colors.background, 0.7),
  backgroundFade90: withAlpha(colors.background, 0.9),
  imageShade: withAlpha(colors.overlay, 0.35),
  imageShadeClear: withAlpha(colors.overlay, 0),
  brandFade20: withAlpha(colors.brand, 0.2),
  brandFade95: withAlpha(colors.brand, 0.95),
} as const;

/** Status → (fg, bg, label) for badges (index.ts › statusTone). */
export const statusTone: Record<string, { fg: string; bg: string; label?: string }> = {
  GOING: { fg: colors.text, bg: colors.surfaceMuted, label: 'Going' },
  READY: { fg: colors.success, bg: colors.successTint, label: 'At pickup' },
  PICKED_UP: { fg: colors.success, bg: colors.successTint, label: 'On board' },
  LATE: { fg: colors.warning, bg: colors.warningTint, label: 'Running late' },
  WFH: { fg: colors.special, bg: colors.specialTint, label: 'WFH' },
  ON_LEAVE: { fg: colors.textMuted, bg: colors.surfaceMuted, label: 'On leave' },
  NOT_GOING: { fg: colors.textMuted, bg: colors.surfaceMuted, label: 'Not going' },
  SKIPPED: { fg: colors.textFaint, bg: colors.surfaceMuted, label: 'Skipped' },
  CANCELLED: { fg: colors.danger, bg: colors.dangerTint, label: 'Cancelled' },
  INVITED: { fg: colors.textMuted, bg: colors.surfaceMuted, label: 'Invited' },
  SCHEDULED: { fg: colors.info, bg: colors.infoTint, label: 'Scheduled' },
  CHECKIN_OPEN: { fg: colors.info, bg: colors.infoTint, label: 'Check-in open' },
  DRIVER_ASSIGNED: { fg: colors.text, bg: colors.surfaceMuted, label: 'Driver set' },
  STARTED: { fg: colors.onAccent, bg: colors.accent, label: 'On the way' },
  COMPLETED: { fg: colors.success, bg: colors.successTint, label: 'Completed' },
  ACTIVE: { fg: colors.success, bg: colors.successTint, label: 'Active' },
  PENDING: { fg: colors.warning, bg: colors.warningTint, label: 'Awaiting approval' },
  POOL_ADMIN: { fg: colors.special, bg: colors.specialTint, label: 'Admin' },
  MEMBER: { fg: colors.textSecondary, bg: colors.surfaceMuted, label: 'Member' },
};

/** Phone viewport the web screens are drawn at (iPhone 12–15, points). */
export const device = { width: 390, height: 844, safeTop: 47, safeBottom: 34, headerHeight: 44 } as const;

/**
 * Motion values from components/ui.tsx and the navigator, for mimicking in
 * Remotion. Durations in ms.
 */
export const motion = {
  fadeIn: { duration: 480, from: 12, easing: [0.2, 0.8, 0.2, 1] as const },
  pulseDot: { duration: 1400, easing: 'easeOutQuad', haloScale: [0.4, 1], haloOpacity: [0.35, 0], haloSize: 2.4 },
  pressScale: { home: 0.97, card: 0.985, spring: { speed: 40, bounciness: 6 } },
  popButton: { duration: 90, offset: 4 },
  skeleton: { duration: 750, opacity: [0.5, 1] },
  illustrationFloat: { duration: 2600, distance: -6, easing: 'easeInOutSine' },
  mapMarker: { duration: 1000, easing: 'linear' },
  mapHalo: { duration: 2000, easing: 'ease-out', scale: [0.6, 2.2], opacity: [0.5, 0] },
  segmented: { spring: { speed: 18, bounciness: 4 } },
} as const;
