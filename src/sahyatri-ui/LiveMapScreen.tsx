/**
 * Full-screen live map. Recreates original/src/screens/RideMapScreen.tsx:
 * map edge to edge, a glass close button and Live pill on top, and the white
 * bottom sheet with the driver row, the rider list and the privacy line.
 *
 * Copy follows the app: driver row "Arjun is driving" + "1 aboard · 2 to pick up
 * · <car>", and rider lines from rideMap.ts › riderStatusLine ("1.1 km from the
 * car", "Waiting at the pickup point", "In the car"…). Pass `driverTitle` /
 * `driverLine` to change them (e.g. "Arjun is 1.1 km away").
 */
import React from 'react';
import { Icon } from './icons';
import MapCanvas, { MapCanvasProps } from './MapCanvas';
import { Avatar, fadeIn, HomeIndicator, IconButton, Phone, PulseDot, StatusBar, Text } from './primitives';
import { colors, device, fontFamily, fontWeight, hairline, radius, shadow, space, type } from './tokens';

export type RiderMapState = 'aboard' | 'ready' | 'live' | 'stale' | 'none';

export interface LiveMapRider {
  id: string;
  name: string;
  color?: string;
  isMe?: boolean;
  state: RiderMapState;
  /** Status line, e.g. "1.1 km from the car". See formatDistance() below. */
  line: string;
}

export interface LiveMapScreenProps {
  driverName: string;
  vehicleName?: string;
  /** Default `${driverName} is driving` (the app uses the full name). */
  driverTitle?: string;
  /** Default `${aboard} aboard · ${toPickUp} to pick up`. */
  driverLine?: string;
  riders: LiveMapRider[];
  role?: 'DRIVER' | 'PASSENGER';
  connection?: 'live' | 'connecting' | 'offline';
  map: Omit<MapCanvasProps, 'width' | 'height'>;
  /** Sheet slide-in: the app uses <FadeIn from={40}>. */
  timeMs?: number;
  showStatusBar?: boolean;
}

/** rideMap.ts › formatDistance */
export function formatDistance(metres: number) {
  if (metres < 50) return 'Right by the car';
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m from the car`;
  return `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)} km from the car`;
}

export default function LiveMapScreen({
  driverName, vehicleName, driverTitle, driverLine, riders, role = 'PASSENGER', connection = 'live', map, timeMs, showStatusBar = true,
}: LiveMapScreenProps) {
  const aboard = riders.filter((r) => r.state === 'aboard').length;
  const toPickUp = riders.length - aboard;
  const title = driverTitle ?? `${driverName} is driving`;
  const line = driverLine ?? `${aboard} aboard · ${toPickUp} to pick up`;
  const live = connection === 'live';

  return (
    <Phone background={colors.surfaceMuted}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapCanvas width={device.width} height={device.height} timeMs={timeMs} {...map} />
      </div>
      {showStatusBar ? <StatusBar /> : null}

      {/* Top controls */}
      <div style={{ position: 'absolute', top: device.safeTop + 8, left: space.md, right: space.md, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
        <IconButton icon="chevron-down" tone="glass" size={44} withShadow={shadow.card} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: colors.surface, padding: '0 14px 0 6px', height: 38, borderRadius: radius.pill, boxShadow: shadow.card }}>
          {live ? <PulseDot tone={colors.success} size={7} timeMs={timeMs} /> : <div style={{ width: 8, height: 8, borderRadius: 4, margin: '0 6px', background: colors.danger }} />}
          <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 13, color: colors.text }}>{live ? 'Live' : connection === 'connecting' ? 'Connecting…' : 'Offline'}</span>
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 20, ...fadeIn(timeMs, 0, 40) }}>
        <div
          style={{
            background: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: `${space.sm}px ${space.lg}px ${device.safeBottom + space.md}px`,
            boxShadow: shadow.lift,
          }}
        >
          <div style={{ margin: `0 auto ${space.sm}px`, width: 40, height: 5, borderRadius: 3, background: colors.borderStrong }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: space.sm, padding: `${space.xs}px 0` }}>
            <div
              style={{
                width: 44, height: 44, borderRadius: 22, background: colors.mapDriver, border: `3px solid ${colors.mapDriverRing}`, boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <Icon name="car-sport" size={22} color={colors.textInverse} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={type.title}>{title}</Text>
              <Text numberOfLines={1} style={type.small}>{line}{vehicleName ? ` · ${vehicleName}` : ''}</Text>
            </div>
          </div>

          {riders.length ? <div style={{ height: hairline, background: colors.borderStrong, margin: `${space.xs}px 0` }} /> : null}

          <div style={{ maxHeight: 230, overflow: 'hidden' }}>
            {riders.map((r) => {
              const muted = r.state === 'aboard' || r.state === 'none' || r.state === 'stale';
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: space.sm, padding: `${space.xs}px 0` }}>
                  <div style={{ opacity: muted && r.state !== 'aboard' ? 0.5 : 1 }}>
                    <Avatar name={r.name} color={r.color} size={38} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={type.bodyStrong}>{r.isMe ? `${r.name} (you)` : r.name}</Text>
                    <Text numberOfLines={1} style={type.small}>{r.line}</Text>
                  </div>
                  {r.state === 'aboard' ? (
                    <Icon name="checkmark-circle" size={22} color={colors.accent} />
                  ) : r.state === 'ready' ? (
                    <Icon name="flag" size={18} color={colors.brand} />
                  ) : r.state === 'live' ? (
                    <PulseDot tone={colors.accent} size={7} timeMs={timeMs} />
                  ) : null}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: space.sm }}>
            <Icon name="shield-checkmark" size={14} color={colors.textMuted} />
            <Text style={{ ...type.small, flex: 1 }}>
              {role === 'DRIVER' ? 'Riders see the car until everyone is picked up.' : 'Only this ride sees your location, and only until you are picked up.'}
            </Text>
          </div>
        </div>
      </div>
      <HomeIndicator />
    </Phone>
  );
}
