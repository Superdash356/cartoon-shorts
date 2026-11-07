/**
 * One row of the Activity feed. Recreates the notification row in
 * original/src/screens/NotificationsScreen.tsx (icon circle, title, body, time,
 * green unread dot; unread rows get a 1.5 px black outline).
 *
 * The app has no OS push banners and no "I'm ready" notification: a rider
 * marking themselves ready only updates the ride live. The types below are the
 * ones the app styles. `PROMO_READY` is an addition for the video, drawn in the
 * same style; it is not in the app.
 */
import React from 'react';
import { Icon, IconName } from './icons';
import { Text } from './primitives';
import { colors, hairline, radius, space, type } from './tokens';

export type NotificationType =
  | 'RIDE_STARTED' | 'RIDE_DELAYED' | 'DRIVER_CHANGED' | 'DRIVER_REALLOTTED'
  | 'DRIVER_REMINDER_12H' | 'DRIVER_REMINDER_2H' | 'HOLIDAY_ADDED' | 'CHAT_REPORTED'
  | 'PROMO_READY' | string;

const ICON: Record<string, { icon: IconName; bg: string; fg: string }> = {
  RIDE_STARTED: { icon: 'navigate', bg: colors.accent, fg: colors.onAccent },
  RIDE_DELAYED: { icon: 'time', bg: colors.highlight, fg: colors.onHighlight },
  DRIVER_CHANGED: { icon: 'swap-horizontal', bg: colors.special, fg: colors.textInverse },
  DRIVER_REALLOTTED: { icon: 'car-sport', bg: colors.highlight, fg: colors.onHighlight },
  DRIVER_REMINDER_12H: { icon: 'car-sport', bg: colors.brand, fg: colors.textInverse },
  DRIVER_REMINDER_2H: { icon: 'alarm', bg: colors.highlight, fg: colors.onHighlight },
  HOLIDAY_ADDED: { icon: 'calendar', bg: colors.accent, fg: colors.onAccent },
  CHAT_REPORTED: { icon: 'flag', bg: colors.danger, fg: colors.textInverse },
  PROMO_READY: { icon: 'location', bg: colors.accent, fg: colors.onAccent },
};
const DEFAULT_ICON = { icon: 'notifications' as IconName, bg: colors.surfaceMuted, fg: colors.text };

export interface NotificationCardProps {
  type: NotificationType;
  title: string;
  body?: string;
  /** "Just now", "5 min ago", "2 h ago", "7 Nov" */
  when: string;
  unread?: boolean;
  /** Width of the card; the app's Activity list is the screen width minus 2 × 20. */
  width?: number;
  style?: React.CSSProperties;
}

export default function NotificationCard({ type: kind, title, body, when, unread = false, width = 350, style }: NotificationCardProps) {
  const meta = ICON[kind] ?? DEFAULT_ICON;
  return (
    <div
      style={{
        display: 'flex', gap: space.sm, padding: space.md, borderRadius: radius.lg, marginBottom: space.xs, width, boxSizing: 'border-box',
        background: colors.surface, border: unread ? `1.5px solid ${colors.outline}` : `${hairline}px solid ${colors.borderStrong}`, ...style,
      }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 19, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={meta.icon} size={18} color={meta.fg} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text style={type.bodyStrong}>{title}</Text>
        {body ? <Text style={{ ...type.small, color: colors.textSecondary, marginTop: 2 }}>{body}</Text> : null}
        <Text style={{ ...type.small, color: colors.textFaint, marginTop: 4 }}>{when}</Text>
      </div>
      {unread ? <div style={{ width: 10, height: 10, borderRadius: 5, background: colors.accent, marginTop: 6, flexShrink: 0 }} /> : null}
    </div>
  );
}
