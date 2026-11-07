/**
 * Roster. Recreates original/src/screens/RosterScreen.tsx under the
 * native-stack header titled "Roster".
 */
import React from 'react';
import { Icon } from './icons';
import { Card, fadeIn, floatOffset, HomeIndicator, initialsOf, NavHeader, Phone, Scroll, StatusBar, Text } from './primitives';
import { colors, device, fontFamily, fontWeight, type } from './tokens';

export interface RosterDay {
  /** ISO date, "2026-11-09" */
  date: string;
  type: 'COMMUTE_DAY' | 'HOLIDAY';
  driverName?: string | null;
  /** True for future days the rotation has projected but not confirmed. */
  projected?: boolean;
  isMe?: boolean;
  holidayName?: string | null;
}

export interface RosterWeek {
  /** "This week" | "Next week" | "Later" */
  label: string;
  days: RosterDay[];
}

export interface RosterScreenProps {
  weeks: RosterWeek[];
  commuteDays: number;
  /** Omit to hide the "your turns" badge (app hides it when you're not a member). */
  myTurns?: number;
  /** calendar-roster.webp. Pass staticFile('calendar-roster.webp') in Remotion. */
  illustrationSrc?: string;
  isAdmin?: boolean;
  scrollY?: number;
  timeMs?: number;
  showStatusBar?: boolean;
}

/** RosterScreen's own avatar colours (not the kit's avatarTone). */
const AVATAR_COLORS = [colors.special, colors.info, colors.warning, colors.danger, colors.success, colors.special];
export function rosterAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function parseLocal(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const s = {
  weekLabel: { fontSize: 11, fontFamily, fontWeight: fontWeight.bold, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  rowSub: { fontFamily, fontWeight: fontWeight.medium, fontSize: 11, color: colors.textFaint, marginTop: 1 },
  legendText: { fontSize: 12, color: colors.textMuted, fontFamily, fontWeight: fontWeight.medium },
} satisfies Record<string, React.CSSProperties>;

export default function RosterScreen({ weeks, commuteDays, myTurns, illustrationSrc, isAdmin = false, scrollY = 0, timeMs, showStatusBar = true }: RosterScreenProps) {
  return (
    <Phone>
      {showStatusBar ? <StatusBar /> : null}
      <NavHeader title="Roster" />
      <Scroll top={device.safeTop + device.headerHeight} scrollY={scrollY} style={{ padding: '16px 16px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12, ...fadeIn(timeMs, 0) }}>
          {illustrationSrc ? (
            <img src={illustrationSrc} alt="" style={{ width: 140, height: 140, objectFit: 'contain', transform: `translateY(${floatOffset(timeMs)}px)` }} />
          ) : (
            <div style={{ width: 140, height: 140 }} />
          )}
          <Text style={{ ...type.h2, textAlign: 'center', marginTop: 8 }}>Who drives when</Text>
          <Text style={{ ...type.small, textAlign: 'center', marginTop: 4, padding: '0 12px' }}>The next two weeks, worked out fairly for everyone.</Text>
        </div>

        {/* Summary */}
        <Card style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily, fontWeight: fontWeight.bold, color: colors.text }}>Driving roster</Text>
              <Text style={{ fontFamily, fontWeight: fontWeight.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{commuteDays} commute days in the next 30</Text>
            </div>
            {myTurns !== undefined ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: colors.specialTint, borderRadius: 12, padding: '8px 14px' }}>
                <Text style={{ fontSize: 20, fontFamily, fontWeight: fontWeight.heavy, color: colors.special, lineHeight: '27px' }}>{myTurns}</Text>
                <Text style={{ fontSize: 10, fontFamily, fontWeight: fontWeight.semibold, color: colors.special, textTransform: 'uppercase' }}>your turns</Text>
              </div>
            ) : null}
          </div>
          <div style={{ display: 'flex', gap: 16, paddingTop: 12, borderTop: `1px solid ${colors.surfaceMuted}` }}>
            {[
              { c: colors.success, t: 'Confirmed' },
              { c: colors.warning, t: 'Projected' },
              { c: colors.special, t: 'Holiday' },
            ].map((l) => (
              <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: 3.5, background: l.c }} />
                <Text style={s.legendText}>{l.t}</Text>
              </div>
            ))}
          </div>
        </Card>

        {isAdmin ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: colors.specialTint, borderRadius: 10, marginTop: 8, marginBottom: 4, border: `1px solid ${colors.specialTint}` }}>
            <Icon name="calendar" size={16} color={colors.special} />
            <Text style={{ color: colors.special, fontFamily, fontWeight: fontWeight.bold, fontSize: 13 }}>Add public holiday</Text>
          </div>
        ) : null}

        {weeks.map((week) => (
          <div key={week.label}>
            <Text style={s.weekLabel}>{week.label}</Text>
            <Card style={{ padding: '4px 12px' }}>
              {week.days.map((day, i) => {
                const d = parseLocal(day.date);
                const isHoliday = day.type === 'HOLIDAY';
                const last = i === week.days.length - 1;
                return (
                  <div
                    key={day.date}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                      borderBottom: last ? undefined : `1px solid ${colors.surfaceMuted}`,
                      ...(day.isMe ? { background: colors.specialTint, borderRadius: 10, margin: '0 -8px', padding: '10px 8px' } : null),
                    }}
                  >
                    <div
                      style={{
                        width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 0', borderRadius: 9, boxSizing: 'border-box',
                        background: isHoliday ? colors.specialTint : colors.background, border: `1px solid ${isHoliday ? colors.specialTint : colors.border}`,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontFamily, fontWeight: fontWeight.bold, color: isHoliday ? colors.special : colors.textFaint, lineHeight: '12px' }}>
                        {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                      </Text>
                      <Text style={{ fontSize: 15, fontFamily, fontWeight: fontWeight.heavy, color: isHoliday ? colors.special : colors.text, lineHeight: '20px' }}>{d.getDate()}</Text>
                    </div>

                    {isHoliday ? (
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, color: colors.special, fontFamily, fontWeight: fontWeight.semibold }}>{day.holidayName || 'Public holiday'}</Text>
                        <Text style={s.rowSub}>No carpool</Text>
                      </div>
                    ) : day.driverName ? (
                      <>
                        <div style={{ width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', background: rosterAvatarColor(day.driverName), flexShrink: 0 }}>
                          <span style={{ color: colors.textInverse, fontSize: 11, fontFamily, fontWeight: fontWeight.bold }}>{initialsOf(day.driverName)}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, color: colors.text, fontFamily, fontWeight: fontWeight.semibold }}>
                            {day.driverName}
                            {day.isMe ? '  ·  You' : ''}
                          </Text>
                          <Text style={s.rowSub}>Driving</Text>
                        </div>
                        {day.projected ? (
                          <div style={{ background: colors.warningTint, border: `1px solid ${colors.accentTint}`, borderRadius: 999, padding: '3px 8px' }}>
                            <Text style={{ fontSize: 10, fontFamily, fontWeight: fontWeight.bold, color: colors.warning }}>Projected</Text>
                          </div>
                        ) : (
                          <Icon name="checkmark-circle" size={18} color={colors.success} />
                        )}
                      </>
                    ) : (
                      <div style={{ flex: 1 }}>
                        <Text style={{ fontFamily, fontWeight: fontWeight.medium, fontSize: 13, color: colors.textFaint, fontStyle: 'italic' }}>No driver available</Text>
                        <Text style={s.rowSub}>Mark your availability to help</Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
      </Scroll>
      <HomeIndicator />
    </Phone>
  );
}
