/**
 * Home / Today. Recreates original/src/screens/DashboardScreen.tsx (main state:
 * user in an approved pool with rides today). Wrapped in the tab bar from
 * original/src/components/TabBar.tsx.
 */
import React from 'react';
import { Icon, IconName } from './icons';
import { Avatar, Badge, fadeIn, HomeIndicator, IconButton, Phone, PulseDot, Scroll, SectionHeader, StatusBar, TabBar, Text } from './primitives';
import { colors, device, fontFamily, fontWeight, hairline, radius, scrim, space, type } from './tokens';

export interface HomeRide {
  id: string;
  /** "Morning ride" / "Evening ride" (or the pool's slot label). */
  label: string;
  /** "08:15" */
  time: string;
  /** Ride status key from statusTone, e.g. DRIVER_ASSIGNED, CHECKIN_OPEN, STARTED. */
  status: string;
  /** Prefix "Up next · " (the app sets it on the first ride not completed/cancelled, unless live). */
  upNext?: boolean;
  driverName?: string | null;
  driverColor?: string;
  vehicleName?: string | null;
  /** Shows "You're driving" instead of the driver's name. */
  youAreDriving?: boolean;
  delayMinutes?: number;
}

export interface HomeScreenProps {
  /** "Good morning" | "Good afternoon" | "Good evening" | "Up late" */
  greeting: string;
  firstName: string;
  poolName: string;
  rides: HomeRide[];
  /** Promo banner art. Pass staticFile('hero-morning.webp') in Remotion. Omit to hide the banner. */
  promoImageSrc?: string;
  /** Morning art takes dark text; evening art takes white text over a shade. */
  promoVariant?: 'morning' | 'evening';
  /** "Heading out?" one-time tip (shown until dismissed in the real app). */
  showTip?: boolean;
  /** Content scroll offset in px. */
  scrollY?: number;
  /** Drive the app's FadeIn / PulseDot motion. Omit for a static frame. */
  timeMs?: number;
  showStatusBar?: boolean;
  activityBadge?: boolean;
}

const TILES: { tone: 'highlight' | 'brand' | 'accent' | 'info'; icon: IconName; label: string }[] = [
  { tone: 'highlight', icon: 'calendar', label: 'My days' },
  { tone: 'brand', icon: 'list', label: 'Roster' },
  { tone: 'accent', icon: 'chatbubbles', label: 'Chat' },
  { tone: 'info', icon: 'wallet', label: 'Settle' },
];
const TILE_TONE = {
  accent: { bg: colors.accent, fg: colors.onAccent },
  highlight: { bg: colors.highlight, fg: colors.onHighlight },
  brand: { bg: colors.brand, fg: colors.textInverse },
  info: { bg: colors.info, fg: colors.textInverse },
} as const;

export function RideCard({ ride, timeMs }: { ride: HomeRide; timeMs?: number }) {
  const live = ride.status === 'STARTED';
  return (
    <div
      style={{
        background: live ? colors.brand : colors.surface, borderRadius: radius.md, padding: space.md, marginBottom: space.sm,
        border: `${hairline}px solid ${live ? colors.brand : colors.borderStrong}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: space.sm }}>
        <div style={{ flex: 1 }}>
          <Text style={{ ...type.micro, ...(live ? { color: scrim.onBrandMuted } : null) }}>
            {ride.upNext && !live ? 'Up next · ' : ''}{ride.label}
          </Text>
          <Text style={{ ...type.numeric, marginTop: 2, ...(live ? { color: colors.textInverse } : null) }}>{ride.time}</Text>
          {ride.delayMinutes ? (
            <Text style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 13, color: live ? colors.accent : colors.warning, marginTop: 2 }}>
              Running {ride.delayMinutes} min late
            </Text>
          ) : null}
        </div>
        {live ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 10px 2px 2px', borderRadius: radius.pill, background: scrim.accentGlow }}>
            <PulseDot tone={colors.accent} size={7} timeMs={timeMs} />
            <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 12, color: colors.accent }}>Live</span>
          </div>
        ) : (
          <Badge status={ride.status} />
        )}
      </div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: space.sm, marginTop: space.sm, paddingTop: space.sm,
          borderTop: `${hairline}px solid ${live ? scrim.onBrandFaint : colors.border}`,
        }}
      >
        {ride.driverName ? (
          <>
            <Avatar name={ride.driverName} color={ride.driverColor} size={38} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ ...type.bodyStrong, ...(live ? { color: colors.textInverse } : null) }}>
                {ride.youAreDriving ? "You're driving" : ride.driverName}
              </Text>
              <Text style={{ ...type.small, ...(live ? { color: scrim.onBrandMuted } : null) }}>{ride.vehicleName ?? 'Car to be confirmed'}</Text>
            </div>
          </>
        ) : (
          <Text style={{ ...type.body, flex: 1 }}>Driver not assigned yet</Text>
        )}
        <Icon name="chevron-forward" size={20} color={live ? colors.textInverse : colors.textFaint} />
      </div>
    </div>
  );
}

export default function HomeScreen({
  greeting, firstName, poolName, rides, promoImageSrc, promoVariant = 'morning', showTip = false,
  scrollY = 0, timeMs, showStatusBar = true, activityBadge = false,
}: HomeScreenProps) {
  const morning = promoVariant === 'morning';
  return (
    <Phone>
      {showStatusBar ? <StatusBar /> : null}
      <Scroll top={device.safeTop} scrollY={scrollY} style={{ padding: `0 ${space.md}px ${space.xxl}px` }}>
        {/* Header: greeting + wordmark + help */}
        <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: space.md, paddingTop: space.sm }}>
          <div style={{ flex: 1 }}>
            <Text style={type.small}>{greeting}, {firstName}</Text>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
              <Text style={type.h1}>sahyatri</Text>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: colors.accent, marginBottom: 8 }} />
            </div>
          </div>
          <IconButton icon="help-circle-outline" />
        </div>

        {/* Pool switcher */}
        <div style={fadeIn(timeMs, 0)}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: space.sm, height: 56, paddingLeft: space.md, paddingRight: space.xs,
              borderRadius: radius.pill, background: colors.surfaceMuted, boxSizing: 'border-box',
            }}
          >
            <Icon name="people" size={20} color={colors.text} />
            <Text numberOfLines={1} style={{ flex: 1, fontFamily, fontWeight: fontWeight.bold, fontSize: 18, color: colors.text, letterSpacing: -0.3 }}>{poolName}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.xxs, height: 40, padding: `0 ${space.sm}px`, borderRadius: radius.pill, background: colors.surface }}>
              <Icon name="time" size={13} color={colors.text} />
              <Text style={type.smallStrong}>Today</Text>
              <Icon name="chevron-down" size={13} color={colors.text} />
            </div>
          </div>
        </div>

        {/* Shortcut tiles */}
        <div style={{ display: 'flex', gap: space.xs, marginTop: space.md, marginBottom: space.md, ...fadeIn(timeMs, 60) }}>
          {TILES.map((t) => (
            <div
              key={t.label}
              style={{
                flex: 1, height: 96, borderRadius: radius.md, background: colors.surfaceMuted, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: space.xs, padding: `0 ${space.xxs}px`,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 20, background: TILE_TONE[t.tone].bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={t.icon} size={20} color={TILE_TONE[t.tone].fg} />
              </div>
              <Text style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 13, color: colors.text }}>{t.label}</Text>
            </div>
          ))}
        </div>

        {showTip ? (
          <div style={{ display: 'flex', gap: space.sm, alignItems: 'flex-start', padding: space.md, borderRadius: radius.md, background: colors.highlightTint, marginBottom: space.sm }}>
            <div style={{ width: 32, height: 32, borderRadius: 16, background: colors.highlight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="location" size={18} color={colors.onHighlight} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={type.bodyStrong}>Heading out?</Text>
              <Text style={{ ...type.small, color: colors.textSecondary, marginTop: 2 }}>
                Open your ride and tap “I'm at the pickup point” so the driver knows you're waiting.
              </Text>
            </div>
            <Icon name="close" size={18} color={colors.textMuted} />
          </div>
        ) : null}

        <SectionHeader title="Today" action="Pool details" />

        {rides.map((ride, i) => (
          <div key={ride.id} style={fadeIn(timeMs, 100 + i * 70)}>
            <RideCard ride={ride} timeMs={timeMs} />
          </div>
        ))}

        {/* Promo banner */}
        {promoImageSrc ? (
          <div style={fadeIn(timeMs, 220)}>
            <div
              style={{
                position: 'relative', height: 150, borderRadius: radius.md, overflow: 'hidden', marginTop: space.lg,
                background: colors.surface, border: `${hairline}px solid ${colors.borderStrong}`,
              }}
            >
              <img src={promoImageSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {morning ? null : (
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to right, ${scrim.imageShade}, ${scrim.imageShadeClear})` }} />
              )}
              <div style={{ position: 'relative', height: '100%', padding: space.md, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '72%', boxSizing: 'border-box' }}>
                <Text style={{ fontFamily, fontWeight: fontWeight.heavy, fontSize: 20, letterSpacing: -0.4, color: morning ? colors.text : colors.textInverse }}>New here?</Text>
                <Text style={{ fontFamily, fontWeight: fontWeight.medium, fontSize: 13, marginTop: space.xxs, color: morning ? colors.textSecondary : colors.textInverse }}>
                  See how rides, turns and costs work in 1 minute
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: space.xxs, alignSelf: 'flex-start', marginTop: space.sm, background: colors.highlight, padding: `0 ${space.sm}px`, height: 32, borderRadius: radius.pill }}>
                  <Text style={type.smallStrong}>Take the tour</Text>
                  <Icon name="arrow-forward" size={14} color={colors.text} />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Scroll>
      <TabBar active="HomeTab" activityBadge={activityBadge} />
      <HomeIndicator />
    </Phone>
  );
}
