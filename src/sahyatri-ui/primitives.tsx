/**
 * Web ports of the app's UI kit (original/src/components/ui.tsx, TabBar.tsx)
 * plus the iOS chrome (status bar, native-stack header) the screens sit in.
 * Plain React + inline styles. No state, no effects: every animation is a pure
 * function of `timeMs`, so it renders deterministically frame by frame in Remotion.
 */
import React from 'react';
import { Icon, IconName } from './icons';
import {
  avatarTone, colors, device, fontFamily, fontWeight, hairline, layout, motion, radius, scrim, space, statusTone, type,
} from './tokens';

type Style = React.CSSProperties;

// ---------------------------------------------------------------------------
// Motion (pure functions of time)
// ---------------------------------------------------------------------------

/** CSS-style cubic-bezier easing, same curve as RN Easing.bezier. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      const d = dx(t);
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}

const fadeEase = cubicBezier(...motion.fadeIn.easing);

/**
 * The app's <FadeIn>: opacity 0→1 and translateY `from`→0 over 480 ms with
 * bezier(0.2, 0.8, 0.2, 1) after `delay`. With `timeMs` undefined the element
 * is fully shown (static screenshot).
 */
export function fadeIn(timeMs: number | undefined, delay = 0, from: number = motion.fadeIn.from, duration: number = motion.fadeIn.duration): Style {
  if (timeMs === undefined) return {};
  const p = fadeEase(Math.min(1, Math.max(0, (timeMs - delay) / duration)));
  return { opacity: p, transform: `translateY(${from * (1 - p)}px)` };
}

/** Illustration float: 0 → −6 px and back, 2600 ms each way, ease-in-out sine. */
export function floatOffset(timeMs: number | undefined) {
  if (timeMs === undefined) return 0;
  const d = motion.illustrationFloat.duration;
  const phase = (timeMs % (2 * d)) / d; // 0..2
  const t = phase <= 1 ? phase : 2 - phase;
  return motion.illustrationFloat.distance * (-(Math.cos(Math.PI * t) - 1) / 2);
}

// ---------------------------------------------------------------------------
// Device chrome
// ---------------------------------------------------------------------------

/** 390 × 844 phone viewport. Everything inside is clipped to it. */
export function Phone({ children, background = colors.background, style }: { children: React.ReactNode; background?: string; style?: Style }) {
  return (
    <div
      style={{
        position: 'relative', width: device.width, height: device.height, overflow: 'hidden', background,
        fontFamily, color: colors.text, WebkitFontSmoothing: 'antialiased', boxSizing: 'border-box', ...style,
      }}
    >
      {children}
    </div>
  );
}

/** iOS status bar (dark content, as the app sets <StatusBar style="dark" />). */
export function StatusBar({ time = '9:41', color = colors.text }: { time?: string; color?: string }) {
  return (
    <div
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: device.safeTop, zIndex: 50, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 26px 0 40px', boxSizing: 'border-box',
      }}
    >
      <span style={{ fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif', fontWeight: 600, fontSize: 17, letterSpacing: -0.4, color }}>{time}</span>
      <svg width="78" height="13" viewBox="0 0 78 13" aria-hidden>
        <g fill={color}>
          <rect x="0" y="8" width="3.2" height="4.5" rx="1" />
          <rect x="4.8" y="5.8" width="3.2" height="6.7" rx="1" />
          <rect x="9.6" y="3.4" width="3.2" height="9.1" rx="1" />
          <rect x="14.4" y="0.8" width="3.2" height="11.7" rx="1" />
          <path d="M30.5 2.6c2.2 0 4.3.9 5.8 2.4l1.1-1.1A9.8 9.8 0 0 0 30.5 1a9.8 9.8 0 0 0-6.9 2.9l1.1 1.1a8.2 8.2 0 0 1 5.8-2.4Zm0 3.3c1.3 0 2.5.5 3.5 1.4l1.1-1.1a6.5 6.5 0 0 0-9.2 0l1.1 1.1c.9-.9 2.2-1.4 3.5-1.4Zm0 3.3c.4 0 .8.2 1.1.5l-1.1 1.1-1.1-1.1c.3-.3.7-.5 1.1-.5Z" />
          <rect x="49.5" y="0.5" width="24" height="12" rx="3.6" fill="none" stroke={color} strokeOpacity="0.4" />
          <rect x="51.5" y="2.5" width="20" height="8" rx="2" />
          <path d="M75 4.3v4.4c.9-.3 1.5-1.2 1.5-2.2s-.6-1.9-1.5-2.2Z" fillOpacity="0.45" />
        </g>
      </svg>
    </div>
  );
}

/** iOS home indicator. */
export function HomeIndicator({ color = colors.text }: { color?: string }) {
  return (
    <div style={{ position: 'absolute', bottom: 8, left: '50%', width: 134, height: 5, borderRadius: 3, background: color, transform: 'translateX(-50%)', zIndex: 60 }} />
  );
}

/**
 * Native-stack header (RootNavigator stackOptions): white, no shadow, black
 * tint, title Manrope Bold 17, back button "minimal" (chevron only).
 */
export function NavHeader({ title, back = true }: { title: string; back?: boolean }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: device.safeTop + device.headerHeight, background: colors.background, zIndex: 40 }}>
      <div style={{ position: 'absolute', top: device.safeTop, left: 0, right: 0, height: device.headerHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {back ? (
          <svg width="13" height="21" viewBox="0 0 13 21" style={{ position: 'absolute', left: 16 }} aria-hidden>
            <path d="M11 2 2.5 10.5 11 19" fill="none" stroke={colors.text} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 17, color: colors.text }}>{title}</span>
      </div>
    </div>
  );
}

export type TabKey = 'HomeTab' | 'PoolsTab' | 'ActivityTab' | 'ProfileTab';
const TABS: { key: TabKey; label: string; on: IconName; off: IconName }[] = [
  { key: 'HomeTab', label: 'Home', on: 'home', off: 'home-outline' },
  { key: 'PoolsTab', label: 'Pools', on: 'people', off: 'people-outline' },
  { key: 'ActivityTab', label: 'Activity', on: 'receipt', off: 'receipt-outline' },
  { key: 'ProfileTab', label: 'Account', on: 'person', off: 'person-outline' },
];

/** components/TabBar.tsx: filled glyph + black when active, outline + grey otherwise. */
export function TabBar({ active = 'HomeTab', activityBadge = false }: { active?: TabKey; activityBadge?: boolean }) {
  return (
    <div
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', background: colors.surface,
        borderTop: `${hairline}px solid ${colors.borderStrong}`, paddingTop: space.xs, paddingBottom: device.safeBottom, zIndex: 30,
      }}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        const tint = isActive ? colors.text : colors.textFaint;
        return (
          <div key={t.key} style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 }}>
            {isActive ? <div style={{ position: 'absolute', top: -space.xs, width: 28, height: 3, borderRadius: 2, background: colors.accent }} /> : null}
            <Icon name={isActive ? t.on : t.off} size={24} color={tint} />
            <span style={{ fontFamily, fontWeight: fontWeight.semibold, fontSize: 11, color: tint }}>{t.label}</span>
            {t.key === 'ActivityTab' && activityBadge ? (
              <div style={{ position: 'absolute', top: 2, right: '32%', width: 8, height: 8, borderRadius: 4, background: colors.danger }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kit
// ---------------------------------------------------------------------------

export function Text({ style, children, numberOfLines }: { style?: Style; children: React.ReactNode; numberOfLines?: 1 }) {
  const clamp: Style = numberOfLines ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } : {};
  return <div style={{ margin: 0, ...clamp, ...style }}>{children}</div>;
}

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
}

export function Avatar({ name, size = 40, seed, color, ring }: { name: string; size?: number; seed?: string; color?: string; ring?: string }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size / 2, background: color ?? avatarTone(seed ?? name), flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
        border: ring ? `2.5px solid ${ring}` : undefined,
      }}
    >
      <span style={{ color: colors.textInverse, fontFamily, fontWeight: fontWeight.heavy, fontSize: size * 0.38, letterSpacing: -0.3, lineHeight: 1 }}>{initialsOf(name)}</span>
    </div>
  );
}

export function Badge({ status, label, small }: { status: string; label?: string; small?: boolean }) {
  const t = statusTone[status] ?? { fg: colors.textMuted, bg: colors.surfaceMuted };
  return (
    <div
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, alignSelf: 'flex-start', flexShrink: 0, background: t.bg, borderRadius: radius.pill,
        padding: small ? '2px 7px' : `${space.xxs}px 9px`,
      }}
    >
      {status === 'STARTED' ? <div style={{ width: 6, height: 6, borderRadius: 3, background: t.fg }} /> : null}
      <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: small ? 10 : 11, letterSpacing: 0.2, color: t.fg, lineHeight: small ? '13px' : '14px' }}>
        {label ?? t.label ?? status.replace(/_/g, ' ').toLowerCase()}
      </span>
    </div>
  );
}

/** ui.tsx › PulseDot: halo 2.4× size, loops 1400 ms ease-out quad. */
export function PulseDot({ tone = colors.accent, size = 8, timeMs }: { tone?: string; size?: number; timeMs?: number }) {
  const halo = size * 2.4;
  const raw = timeMs === undefined ? 0.35 : (timeMs % motion.pulseDot.duration) / motion.pulseDot.duration;
  const v = 1 - (1 - raw) * (1 - raw); // Easing.out(Easing.quad)
  return (
    <div style={{ position: 'relative', width: halo, height: halo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div
        style={{
          position: 'absolute', width: halo, height: halo, borderRadius: halo / 2, background: tone,
          opacity: 0.35 * (1 - v), transform: `scale(${0.4 + 0.6 * v})`,
        }}
      />
      <div style={{ width: size, height: size, borderRadius: size / 2, background: tone }} />
    </div>
  );
}

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'inverse';
const BUTTON: Record<ButtonVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.primary, fg: colors.onPrimary },
  accent: { bg: colors.accent, fg: colors.onAccent },
  secondary: { bg: colors.surfaceMuted, fg: colors.text },
  ghost: { bg: colors.surface, fg: colors.text },
  danger: { bg: colors.dangerTint, fg: colors.danger },
  inverse: { bg: colors.surface, fg: colors.text },
};

/** ui.tsx › Button. `pressed` (0..1) mimics PressableScale's 0.97 press-in. */
export function Button({ label, variant = 'primary', icon, size = 'lg', style, pressed = 0 }: { label: string; variant?: ButtonVariant; icon?: IconName; size?: 'md' | 'lg'; style?: Style; pressed?: number }) {
  const v = BUTTON[variant];
  const md = size === 'md';
  return (
    <div
      style={{
        height: md ? layout.buttonHeightSm : layout.buttonHeight, borderRadius: radius.sm, padding: `0 ${md ? space.md : space.lg}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.xs, background: v.bg, boxSizing: 'border-box',
        border: variant === 'ghost' ? `${hairline}px solid ${colors.borderStrong}` : undefined,
        transform: pressed ? `scale(${1 - 0.03 * pressed})` : undefined, ...style,
      }}
    >
      {icon ? <Icon name={icon} size={md ? 17 : 19} color={v.fg} /> : null}
      <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: md ? 15 : 17, letterSpacing: -0.2, color: v.fg, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

export function IconButton({ icon, tone = 'muted', size = layout.tapTarget, withShadow }: { icon: IconName; tone?: 'muted' | 'brand' | 'glass'; size?: number; withShadow?: string }) {
  const bg = tone === 'brand' ? colors.brand : tone === 'glass' ? scrim.glass : colors.surfaceMuted;
  const fg = tone === 'brand' ? colors.textInverse : colors.text;
  return (
    <div style={{ width: size, height: size, borderRadius: size / 2, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: withShadow }}>
      <Icon name={icon} size={size * 0.48} color={fg} />
    </div>
  );
}

/** ui.tsx › Card (surface tone): radius 14, padding 16, hairline border, 12 below. */
export function Card({ children, style }: { children: React.ReactNode; style?: Style }) {
  return (
    <div
      style={{
        borderRadius: radius.md, padding: space.md, marginBottom: space.sm, background: colors.surface,
        border: `${hairline}px solid ${colors.borderStrong}`, boxSizing: 'border-box', ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm }}>
      <Text style={type.h3}>{title}</Text>
      {action ? <Text style={{ ...type.smallStrong, color: colors.text, textDecoration: 'underline' }}>{action}</Text> : null}
    </div>
  );
}

export function Notice({ tone = 'info', icon, title, children, style }: { tone?: 'info' | 'success' | 'warning' | 'error'; icon?: IconName; title?: string; children?: React.ReactNode; style?: Style }) {
  const t = {
    info: { fg: colors.info, bg: colors.infoTint, icon: 'information-circle' as IconName },
    success: { fg: colors.success, bg: colors.successTint, icon: 'checkmark-circle' as IconName },
    warning: { fg: colors.warning, bg: colors.warningTint, icon: 'alert-circle' as IconName },
    error: { fg: colors.danger, bg: colors.dangerTint, icon: 'close-circle' as IconName },
  }[tone];
  return (
    <div style={{ display: 'flex', gap: 10, padding: space.sm, borderRadius: radius.sm, marginTop: space.sm, background: t.bg, ...style }}>
      <Icon name={icon ?? t.icon} size={18} color={t.fg} style={{ marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {title ? <Text style={{ ...type.smallStrong, color: t.fg }}>{title}</Text> : null}
        {children ? <Text style={{ ...type.small, color: colors.textSecondary }}>{children}</Text> : null}
      </div>
    </div>
  );
}

/** Scrollable content area: shifts content up by `scrollY` px (for animated scrolls). */
export function Scroll({ top, bottom = 0, scrollY = 0, style, children }: { top: number; bottom?: number; scrollY?: number; style?: Style; children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', top, left: 0, right: 0, bottom, overflow: 'hidden' }}>
      <div style={{ transform: `translateY(${-scrollY}px)`, ...style }}>{children}</div>
    </div>
  );
}
