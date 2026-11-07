/**
 * "Your ride". Recreates original/src/screens/TodayRideScreen.tsx from the
 * passenger's point of view, under the native-stack header titled "Your ride".
 *
 * Two states, as in the app:
 *  - before start: white hero, counters, driver card, "I'm at the pickup point"
 *    + "Skip me today". Once ready, those buttons are replaced by the success
 *    notice ("You're at the pickup point / The driver can see you're ready.").
 *  - started (live): a 260 px map on top and the hero turns black with a Live pill.
 */
import React from 'react';
import { Icon } from './icons';
import MapCanvas, { MapCanvasProps } from './MapCanvas';
import { Avatar, Badge, Button, Card, fadeIn, HomeIndicator, NavHeader, Notice, Phone, PulseDot, Scroll, SectionHeader, StatusBar, Text } from './primitives';
import { colors, device, fontFamily, fontWeight, hairline, radius, scrim, shadow, space, type } from './tokens';

export interface RideRider {
  id: string;
  name: string;
  color?: string;
  isMe?: boolean;
  pickupName?: string | null;
  /** Participant status: GOING, READY, PICKED_UP, NOT_GOING, SKIPPED, LATE, WFH… */
  status: string;
  /** Shows the round call button (app shows it to the driver, or to anyone once started). */
  showCall?: boolean;
}

export interface RideScreenProps {
  direction: 'MORNING' | 'EVENING';
  /** Ride status for the badge: SCHEDULED, CHECKIN_OPEN, DRIVER_ASSIGNED, STARTED… */
  rideStatus: string;
  /** "08:15" */
  departureTime: string;
  /** Delay announced by the driver (shifts the big time, shows "N min late · was 08:15"). */
  delayMinutes?: number;
  counters: { atPickup: number; onTheirWay: number; riding: number };
  driver: { name: string; color?: string; vehicleName: string; phone?: boolean };
  riders: RideRider[];
  /** Your own participant status: drives the action area. */
  myStatus: string;
  /** Override the success notice copy, e.g. { title: "Arjun sees you're ready" }. Defaults are the app's. */
  readyNotice?: { title?: string; body?: string };
  /** 0..1 press on the "I'm at the pickup point" button (PressableScale 0.97). */
  readyPressed?: number;
  /** Map props when the ride is live (rideStatus STARTED). */
  map?: Omit<MapCanvasProps, 'width' | 'height'>;
  /** "Live" or "Reconnecting" in the hero pill. */
  connected?: boolean;
  scrollY?: number;
  timeMs?: number;
  showStatusBar?: boolean;
}

function addMinutes(t: string, minutes: number) {
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const total = (h * 60 + m + minutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const NOT_COMING = ['NOT_GOING', 'WFH', 'ON_LEAVE', 'CANCELLED', 'SKIPPED'];

export default function RideScreen({
  direction, rideStatus, departureTime, delayMinutes = 0, counters, driver, riders, myStatus, readyNotice, readyPressed = 0,
  map, connected = true, scrollY = 0, timeMs, showStatusBar = true,
}: RideScreenProps) {
  const started = rideStatus === 'STARTED';
  const rideActive = rideStatus !== 'COMPLETED' && rideStatus !== 'CANCELLED';
  const coming = riders.filter((r) => !NOT_COMING.includes(r.status));
  const onBrandText = started ? { color: colors.textInverse } : null;
  const onBrandMuted = started ? { color: scrim.onBrandMuted } : null;
  const tileStyle: React.CSSProperties = { flex: 1, background: started ? scrim.onBrandSubtle : colors.surfaceMuted, borderRadius: radius.md, padding: space.sm };
  const tileNum: React.CSSProperties = { fontFamily, fontWeight: fontWeight.heavy, fontSize: 24, color: started ? colors.textInverse : colors.text, fontVariantNumeric: 'tabular-nums', lineHeight: '33px' };

  return (
    <Phone>
      {showStatusBar ? <StatusBar /> : null}
      <NavHeader title="Your ride" />
      <Scroll top={device.safeTop + device.headerHeight} scrollY={scrollY} style={{ padding: `${space.lg}px ${space.lg}px ${space.xxxl}px` }}>
        {started && map ? (
          <div style={{ position: 'relative', height: 260, borderRadius: radius.md, overflow: 'hidden', marginBottom: space.sm, ...fadeIn(timeMs, 0) }}>
            <MapCanvas width={device.width - space.lg * 2} height={260} timeMs={timeMs} {...map} />
            <div
              style={{
                position: 'absolute', top: space.sm, right: space.sm, width: 40, height: 40, borderRadius: 20, background: colors.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.card,
              }}
            >
              <Icon name="expand" size={18} color={colors.text} />
            </div>
          </div>
        ) : null}

        {/* Hero */}
        <div style={fadeIn(timeMs, 0)}>
          <div
            style={{
              background: started ? colors.brand : colors.surface, borderRadius: radius.xl, padding: space.lg, overflow: 'hidden',
              border: `${hairline}px solid ${started ? colors.brand : colors.borderStrong}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ ...type.micro, ...(started ? { color: colors.accent } : null) }}>{direction === 'MORNING' ? 'Morning ride' : 'Evening ride'}</Text>
              {started ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 10px 2px 2px', borderRadius: radius.pill, background: scrim.onBrandFaint }}>
                  <PulseDot tone={colors.accent} size={7} timeMs={timeMs} />
                  <span style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 12, color: colors.accent }}>{connected ? 'Live' : 'Reconnecting'}</span>
                </div>
              ) : (
                <Badge status={rideStatus} />
              )}
            </div>
            <Text style={{ fontFamily, fontWeight: fontWeight.heavy, fontSize: 56, lineHeight: '60px', letterSpacing: -2, color: colors.text, marginTop: space.xs, fontVariantNumeric: 'tabular-nums', ...onBrandText }}>
              {delayMinutes > 0 ? addMinutes(departureTime, delayMinutes) : departureTime}
            </Text>
            {delayMinutes > 0 ? (
              <Text style={{ fontFamily, fontWeight: fontWeight.bold, fontSize: 13, color: started ? colors.accent : colors.warning }}>
                {delayMinutes} min late · was {departureTime}
              </Text>
            ) : (
              <Text style={{ ...type.small, ...onBrandMuted }}>Scheduled departure</Text>
            )}
            <div style={{ display: 'flex', gap: space.xs, marginTop: space.md }}>
              <div style={tileStyle}>
                <Text style={tileNum}>{counters.atPickup}</Text>
                <Text style={{ ...type.small, ...onBrandMuted }}>at pickup</Text>
              </div>
              <div style={tileStyle}>
                <Text style={tileNum}>{counters.onTheirWay}</Text>
                <Text style={{ ...type.small, ...onBrandMuted }}>on their way</Text>
              </div>
              <div style={tileStyle}>
                <Text style={tileNum}>{counters.riding}</Text>
                <Text style={{ ...type.small, ...onBrandMuted }}>riding</Text>
              </div>
            </div>
          </div>
        </div>

        {/* Driver */}
        <div style={fadeIn(timeMs, 80)}>
          <Card style={{ marginTop: space.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
              <Avatar name={driver.name} color={driver.color} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={type.micro}>Driver</Text>
                <Text style={type.title}>{driver.name}</Text>
                <Text style={type.small}>{driver.vehicleName}</Text>
              </div>
              {driver.phone !== false ? (
                <div style={{ width: 44, height: 44, borderRadius: 22, background: colors.brandTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="call" size={18} color={colors.brand} />
                </div>
              ) : null}
            </div>
            {rideActive ? (
              <Button label={started ? 'Track live on map' : 'Open map'} icon="navigate" variant={started ? 'primary' : 'secondary'} size="md" style={{ marginTop: space.md }} />
            ) : null}
          </Card>
        </div>

        {/* Passenger actions */}
        {rideActive ? (
          <div style={fadeIn(timeMs, 140)}>
            {myStatus === 'READY' ? (
              <Notice tone="success" title={readyNotice?.title ?? "You're at the pickup point"}>{readyNotice?.body ?? "The driver can see you're ready."}</Notice>
            ) : myStatus === 'PICKED_UP' ? (
              <Notice tone="success" title="You're aboard">Enjoy the ride.</Notice>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm, marginTop: space.sm }}>
                <Button label="I'm at the pickup point" icon="location" pressed={readyPressed} />
                {myStatus !== 'NOT_GOING' ? (
                  <Button label="Skip me today" variant="ghost" size="md" />
                ) : (
                  <Button label="I'm coming after all" variant="secondary" size="md" />
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* People */}
        <SectionHeader title={`Riding (${coming.length})`} />
        {riders.map((p, i) => (
          <div key={p.id} style={fadeIn(timeMs, 200 + i * 50)}>
            <Card style={NOT_COMING.includes(p.status) ? { opacity: 0.6 } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>
                <Avatar name={p.name} color={p.color} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text style={type.bodyStrong}>{p.name}{p.isMe ? ' (you)' : ''}</Text>
                  {p.pickupName ? (
                    <Text numberOfLines={1} style={{ ...type.small, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="location-outline" size={12} color={colors.textMuted} style={{ display: 'inline-block' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.pickupName}</span>
                    </Text>
                  ) : null}
                </div>
                {!p.isMe && (p.showCall ?? started) ? (
                  <div style={{ width: 34, height: 34, borderRadius: 17, background: colors.brandTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="call" size={15} color={colors.brand} />
                  </div>
                ) : null}
                <Badge status={p.status} small />
              </div>
            </Card>
          </div>
        ))}
      </Scroll>
      <HomeIndicator />
    </Phone>
  );
}
